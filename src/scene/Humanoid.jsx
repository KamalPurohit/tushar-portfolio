import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveAnimationBlendMode,
  AnimationMixer,
  AnimationUtils,
  Euler,
  LoopOnce,
  MathUtils,
  Plane,
  Quaternion,
  Raycaster,
  Vector2,
  Vector3,
} from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { oversizePants } from './wardrobe'
import { damp, ease, window4 } from '../lib/math'

// Any avatar with a Mixamo-named skeleton (prefixes/suffixes are ignored).
// Current: "ZACK" by Vicky on Sketchfab, CC BY 4.0 — credited in the footer.
const AVATAR = '/models/avatar.glb'
const MOTION = '/models/xbot-anims.glb' // Mixamo clips on the X Bot skeleton
const additiveReady = new WeakSet()
// Wardrobe tweaks toward the reference sheet (black hoodie, clear frames);
// the trousers are also re-cut wide-leg in ./wardrobe.js.
// Keyed by material name; colours multiply the original textures.
const LOOK = {
  Wolf3D_Outfit_Top: (m) => ({ color: m.color.clone().setHex(0x2e2d30), roughness: 0.9 }),
  Wolf3D_Outfit_Bottom: (m) => ({ color: m.color.clone().setHex(0x38383d), roughness: 0.95 }),
  Wolf3D_Glasses: (m) => ({ color: m.color.clone().setHex(0xe9eef2), transparent: true, opacity: 0.6, roughness: 0.15 }),
}

const EYE_RANGE = 0.35 // radians the eyes may turn beyond the head

/* ---- bone helpers ------------------------------------------------------ */

const _q1 = new Quaternion()
const _q2 = new Quaternion()
const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()
const _turn = new Quaternion()
const _identity = new Quaternion()

/** Apply a world-space rotation to a bone, whatever its local axes are. */
function rotateBoneWorld(bone, worldRotation) {
  bone.getWorldQuaternion(_q1)
  bone.parent.getWorldQuaternion(_q2)
  _q1.premultiply(worldRotation)
  bone.quaternion.copy(_q2.invert().multiply(_q1))
  bone.updateMatrixWorld(true)
}

/** Rotate `bone` about its own pivot so world point `from` swings to `to`. */
function aimBone(bone, from, to) {
  bone.getWorldPosition(_v1)
  _v2.subVectors(from, _v1).normalize()
  _v3.subVectors(to, _v1).normalize()
  rotateBoneWorld(bone, new Quaternion().setFromUnitVectors(_v2, _v3))
}

const S = new Vector3()
const E = new Vector3()
const H = new Vector3()
const T = new Vector3()
const dir = new Vector3()
const pv = new Vector3()
const elbow = new Vector3()

/** Analytic two-bone IK, blended over the animated pose by `weight`. */
function reach(upper, lower, hand, target, pole, weight) {
  if (weight < 0.002) return
  upper.getWorldPosition(S)
  lower.getWorldPosition(E)
  hand.getWorldPosition(H)
  const a = S.distanceTo(E)
  const b = E.distanceTo(H)
  dir.subVectors(target, S)
  const d = MathUtils.clamp(dir.length(), Math.abs(a - b) + 1e-3, (a + b) * 0.995)
  dir.normalize()
  T.copy(S).addScaledVector(dir, d)
  const cosA = MathUtils.clamp((a * a + d * d - b * b) / (2 * a * d), -1, 1)
  const sinA = Math.sqrt(1 - cosA * cosA)
  pv.copy(pole).addScaledVector(dir, -pole.dot(dir)).normalize()
  elbow.copy(S).addScaledVector(dir, a * cosA).addScaledVector(pv, a * sinA)

  const animUpper = upper.quaternion.clone()
  aimBone(upper, E, elbow)
  upper.quaternion.copy(animUpper.slerp(upper.quaternion, weight))
  upper.updateMatrixWorld(true)

  const animLower = lower.quaternion.clone()
  hand.getWorldPosition(H)
  aimBone(lower, H, T)
  lower.quaternion.copy(animLower.slerp(lower.quaternion, weight))
  lower.updateMatrixWorld(true)
}

/* ---- retargeting ------------------------------------------------------- */

/** Bone name without a `mixamorig` prefix or an exporter's `_123` suffix. */
const boneKey = (name) => name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '')

function findBone(root, key) {
  let found = null
  root.traverse((o) => {
    if (!found && o.isBone && boneKey(o.name) === key) found = o
  })
  return found
}

// Which child a bone "points at" when it has several (spine → neck, not arms).
const AIM_CHILD = ['Spine', 'Spine1', 'Spine2', 'Neck', 'Head', 'HeadTop_End', 'HandMiddle1']
function aimChild(bone) {
  const kids = bone.children.filter((c) => c.isBone)
  return (
    kids.find((c) => AIM_CHILD.some((k) => boneKey(c.name).endsWith(k))) ?? kids[0] ?? null
  )
}

/**
 * Drives `target` (the avatar) from `source` (the X Bot playing Mixamo clips).
 *
 * The rigs share bone names but neither bone axes nor rest pose: the X Bot
 * rests in a T-pose, most avatar exports (Ready Player Me, Avaturn…) in an
 * A-pose. So local rotations can't be copied. Instead, at setup each target
 * bone's rest orientation is first swung so the bone points the same way as
 * its source counterpart at rest ("virtually T-posing" it); then every frame
 * the source bone's world rotation relative to its rest is applied on top,
 * parents first.
 */
function createRetarget(source, target) {
  source.updateMatrixWorld(true)
  target.updateMatrixWorld(true)
  const wp = (o) => o.getWorldPosition(new Vector3())
  const pairs = []
  target.traverse((t) => {
    if (!t.isBone) return
    const key = boneKey(t.name)
    const s = findBone(source, key)
    if (!s) return
    const tRest = t.getWorldQuaternion(new Quaternion())
    const tChild = aimChild(t)
    const sChild = tChild && findBone(source, boneKey(tChild.name))
    if (tChild && sChild) {
      const tDir = wp(tChild).sub(wp(t)).normalize()
      const sDir = wp(sChild).sub(wp(s)).normalize()
      if (tDir.lengthSq() > 0 && sDir.lengthSq() > 0) {
        tRest.premultiply(new Quaternion().setFromUnitVectors(tDir, sDir))
      }
    }
    pairs.push({ s, t, sRestInv: s.getWorldQuaternion(new Quaternion()).invert(), tRest })
  })
  // traverse() is parent-first, so each parent is posed before its children.
  const hips = pairs.find((p) => boneKey(p.t.name) === 'Hips')
  const sHipRest = hips && wp(hips.s)
  const tHipRest = hips && wp(hips.t)
  const hipScale = hips ? tHipRest.y / sHipRest.y : 1
  const q = new Quaternion()
  const parentQ = new Quaternion()
  const hip = new Vector3()
  return function apply() {
    source.updateMatrixWorld(true)
    if (hips) {
      // Carry the idle's weight shift, in world space, scaled to the avatar.
      hips.s.getWorldPosition(hip).sub(sHipRest).multiplyScalar(hipScale).add(tHipRest)
      hips.t.position.copy(hips.t.parent.worldToLocal(hip))
      hips.t.updateMatrixWorld()
    }
    for (const { s, t, sRestInv, tRest } of pairs) {
      s.getWorldQuaternion(q).multiply(sRestInv).multiply(tRest)
      t.parent.getWorldQuaternion(parentQ)
      t.quaternion.copy(parentQ.invert().multiply(q))
      t.updateMatrixWorld()
    }
    target.updateMatrixWorld(true)
  }
}

/* ---- component --------------------------------------------------------- */

export default function Humanoid() {
  const root = useRef()
  const { scene } = useGLTF(AVATAR)
  const { scene: source, animations } = useGLTF(MOTION)
  const camera = useThree((s) => s.camera)

  const rig = useMemo(() => {
    const bone = (n) => findBone(scene, n)
    return {
      hips: bone('Hips'),
      spine: bone('Spine2'),
      neck: bone('Neck'),
      head: bone('Head'),
      eyeL: bone('LeftEye'),
      eyeR: bone('RightEye'),
      armR: [bone('RightArm'), bone('RightForeArm'), bone('RightHand')],
      armL: [bone('LeftArm'), bone('LeftForeArm'), bone('LeftHand')],
    }
  }, [scene])

  // Keep the avatar's own textures; just let it take part in the lighting.
  useEffect(() => {
    scene.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      // Self-shadowing on skinned skin/cloth shows up as acne; the floor
      // still receives the figure's shadow.
      o.receiveShadow = false
      o.frustumCulled = false
      if (!o.material) return
      o.material.envMapIntensity = 0.7
      const look = LOOK[o.material.name]
      if (look) Object.assign(o.material, look(o.material))
      if (o.material.name === 'Wolf3D_Outfit_Bottom') oversizePants(o)
    })
  }, [scene])

  const retarget = useMemo(() => createRetarget(source, scene), [source, scene])

  // Eyes: the avatar's own eye bones, aimed independently of the head.
  const eyes = useMemo(() => {
    scene.updateMatrixWorld(true)
    return [rig.eyeL, rig.eyeR].filter(Boolean).map((bone) => ({
      bone,
      restInv: bone.getWorldQuaternion(new Quaternion()).invert(),
    }))
  }, [scene, rig])

  const mixer = useMemo(() => new AnimationMixer(source), [source])
  const gestures = useRef({})
  useEffect(() => {
    const clip = (n) => animations.find((a) => a.name === n)
    const idle = mixer.clipAction(clip('idle'))
    idle.play()
    for (const name of ['agree', 'headShake']) {
      const c = clip(name)
      if (!c) continue
      if (!additiveReady.has(c)) {
        AnimationUtils.makeClipAdditive(c)
        additiveReady.add(c)
      }
      const action = mixer.clipAction(c)
      action.blendMode = AdditiveAnimationBlendMode
      action.setLoop(LoopOnce, 1)
      action.clampWhenFinished = false
      gestures.current[name] = action
    }
    // A small nod hello once the film has loaded.
    const t = setTimeout(() => play('agree', 0.8), 1600)
    return () => {
      clearTimeout(t)
      mixer.stopAllAction()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [animations, mixer])

  function play(name, weight = 1) {
    const a = gestures.current[name]
    if (!a) return
    a.reset()
    a.setEffectiveWeight(weight)
    a.fadeIn(0.3)
    a.play()
  }

  const tmp = useMemo(
    () => ({
      raycaster: new Raycaster(),
      plane: new Plane(new Vector3(0, 0, 1), -1.6),
      ndc: new Vector2(),
      cursorPt: new Vector3(),
      look: new Vector3(0, 1.55, 3),
      want: new Vector3(),
      headPos: new Vector3(),
      local: new Vector3(),
      rootQ: new Quaternion(),
      rootQi: new Quaternion(),
      qLocal: new Quaternion(),
      qWorld: new Quaternion(),
      euler: new Euler(0, 0, 0, 'YXZ'),
      poleR: new Vector3(),
      poleL: new Vector3(),
      yaw: 0,
      lastChapter: 'hero',
    }),
    [],
  )

  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    const p = state.progress
    const g = root.current
    if (!g) return

    mixer.update(dt)
    retarget()

    // Gesture cues when entering a chapter.
    const ch = p < 0.64 ? 'early' : p < 0.84 ? 'social' : 'contact'
    if (ch !== tmp.lastChapter) {
      if (ch === 'social' || ch === 'contact') play('agree', 0.9)
      tmp.lastChapter = ch
    }

    // Body orientation: a quarter-turn toward the camera rig, a full turn to
    // face the edit, and back round to meet the audience.
    const bodyYaw =
      -0.22 * ease(p, 0.2, 0.27) +
      (-Math.PI + 0.22) * ease(p, 0.41, 0.48) +
      Math.PI * ease(p, 0.6, 0.67)
    const facingFront = 1 - window4(p, 0.4, 0.46, 0.61, 0.67)
    tmp.yaw = damp(tmp.yaw, bodyYaw + state.pointer.x * 0.1 * facingFront, 4, dt)
    g.rotation.y = tmp.yaw
    g.updateMatrixWorld(true)

    // What the eyes want to look at: the cursor, the camera's monitor, or
    // the edit cursor on the timeline — cross-faded by chapter.
    tmp.ndc.set(state.pointer.x, state.pointer.y)
    tmp.raycaster.setFromCamera(tmp.ndc, camera)
    if (!tmp.raycaster.ray.intersectPlane(tmp.plane, tmp.cursorPt)) tmp.cursorPt.set(0, 1.6, 2)
    const wCam = window4(p, 0.15, 0.21, 0.39, 0.43) // watches it fly in, then works it
    const wEdit = window4(p, 0.45, 0.49, 0.6, 0.64)
    tmp.want.copy(tmp.cursorPt).lerp(anchors.monitor, wCam).lerp(anchors.editCursor, wEdit)
    const k = 1 - Math.exp(-6 * dt)
    tmp.look.lerp(tmp.want, k)

    // Head, neck and upper spine share the turn so it reads as a whole-body
    // glance rather than a swivelling head.
    rig.head.getWorldPosition(tmp.headPos)
    g.getWorldQuaternion(tmp.rootQ)
    tmp.rootQi.copy(tmp.rootQ).invert()
    tmp.local.subVectors(tmp.look, tmp.headPos).applyQuaternion(tmp.rootQi)
    const yaw = MathUtils.clamp(Math.atan2(tmp.local.x, tmp.local.z), -1.1, 1.1)
    const pitch = MathUtils.clamp(
      Math.atan2(tmp.local.y, Math.hypot(tmp.local.x, tmp.local.z)),
      -0.6,
      0.5,
    )
    for (const [bone, share] of [
      [rig.spine, 0.2],
      [rig.neck, 0.3],
      [rig.head, 0.5],
    ]) {
      tmp.euler.set(-pitch * share, yaw * share, 0)
      tmp.qLocal.setFromEuler(tmp.euler)
      tmp.qWorld.copy(tmp.rootQ).multiply(tmp.qLocal).multiply(tmp.rootQi)
      rotateBoneWorld(bone, tmp.qWorld)
    }

    // Eyes: find where each eye currently points (rest looked down +z),
    // then turn it toward the target, capped so they never roll back.
    for (const { bone, restInv } of eyes) {
      bone.getWorldQuaternion(_q1).multiply(restInv)
      _v1.set(0, 0, 1).applyQuaternion(_q1)
      bone.getWorldPosition(_v2)
      _v3.subVectors(tmp.look, _v2).normalize()
      const angle = _v1.angleTo(_v3)
      _turn.setFromUnitVectors(_v1, _v3)
      if (angle > EYE_RANGE) _turn.slerp(_identity, 1 - EYE_RANGE / angle)
      rotateBoneWorld(bone, _turn)
    }

    // Hands onto the camera rig: right on the handgrip, left on the lens.
    const hold = window4(p, 0.235, 0.29, 0.385, 0.415)
    tmp.poleR.set(-0.5, -1, -0.35).applyQuaternion(tmp.rootQ)
    tmp.poleL.set(0.6, -1, -0.2).applyQuaternion(tmp.rootQ)
    reach(...rig.armR, anchors.gripRight, tmp.poleR, hold)
    reach(...rig.armL, anchors.gripLeft, tmp.poleL, hold * 0.95)
  })

  return (
    <group ref={root}>
      <primitive object={scene} />
    </group>
  )
}

useGLTF.preload(AVATAR)
useGLTF.preload(MOTION)
