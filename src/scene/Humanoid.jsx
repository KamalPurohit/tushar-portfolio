import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import {
  AdditiveAnimationBlendMode,
  AnimationMixer,
  AnimationUtils,
  Color,
  Euler,
  LoopOnce,
  Mesh,
  MathUtils,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Plane,
  Quaternion,
  Raycaster,
  SphereGeometry,
  Vector2,
  Vector3,
} from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { damp, ease, window4 } from '../lib/math'

const MODEL = '/models/xbot.glb'
const additiveReady = new WeakSet()
const EYE_FORWARD_CM = 5.6

/* ---- bone helpers ------------------------------------------------------ */

const _q1 = new Quaternion()
const _q2 = new Quaternion()
const _v1 = new Vector3()
const _v2 = new Vector3()
const _v3 = new Vector3()

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

/* ---- component --------------------------------------------------------- */

export default function Humanoid() {
  const root = useRef()
  const { scene, animations } = useGLTF(MODEL)
  const camera = useThree((s) => s.camera)

  const rig = useMemo(() => {
    const bone = (n) => scene.getObjectByName(`mixamorig${n}`)
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

  // Sculptural finish: warm ceramic shell over dark gunmetal joints.
  useEffect(() => {
    const shell = new MeshPhysicalMaterial({
      color: new Color('#bdb6ab'),
      roughness: 0.42,
      metalness: 0.05,
      clearcoat: 0.35,
      clearcoatRoughness: 0.4,
      sheen: 0.4,
      sheenColor: new Color('#ffd9b0'),
    })
    const joints = new MeshStandardMaterial({
      color: new Color('#26231f'),
      roughness: 0.3,
      metalness: 0.75,
    })
    scene.traverse((o) => {
      if (!o.isMesh) return
      o.castShadow = true
      o.receiveShadow = true
      o.frustumCulled = false
      o.material = o.name.includes('Joints') ? joints : shell
    })
    return () => {
      shell.dispose()
      joints.dispose()
    }
  }, [scene])

  // Eyes: small lacquered lenses parented to the rig's eye bones, so they
  // ride every head movement and can still be aimed on their own.
  const eyes = useMemo(() => {
    const mat = new MeshPhysicalMaterial({
      color: '#050505',
      roughness: 0.08,
      metalness: 0.2,
      clearcoat: 1,
      clearcoatRoughness: 0.02,
    })
    const geo = new SphereGeometry(1.25, 24, 16) // bone space is centimetres
    return [rig.eyeL, rig.eyeR].filter(Boolean).map((bone) => {
      const m = new Mesh(geo, mat)
      m.scale.set(1.1, 0.75, 0.45)
      m.userData.placed = false
      bone.add(m)
      return m
    })
  }, [rig])
  useEffect(
    () => () => {
      for (const m of eyes) {
        m.removeFromParent()
        m.geometry.dispose()
        m.material.dispose()
      }
    },
    [eyes],
  )

  const mixer = useMemo(() => new AnimationMixer(scene), [scene])
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
    const wCam = window4(p, 0.21, 0.26, 0.39, 0.43)
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

    for (const e of eyes) {
      // First frame: push each eye forward out of the skull, along the
      // direction the body faces, expressed in the eye bone's own space.
      if (!e.userData.placed) {
        e.parent.getWorldQuaternion(_q1)
        _v1.set(0, 0, 1).applyQuaternion(tmp.rootQ).applyQuaternion(_q1.invert())
        e.position.copy(_v1.multiplyScalar(EYE_FORWARD_CM))
        e.userData.placed = true
      }
      e.lookAt(tmp.look)
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

useGLTF.preload(MODEL)
