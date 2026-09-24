import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useTexture } from '@react-three/drei'
import {
  CanvasTexture,
  CatmullRomCurve3,
  DoubleSide,
  MathUtils,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { damp, ease, range, smooth } from '../lib/math'

/* A DSLR on a 3-axis handheld gimbal, built from primitives. The camera:
   body with a sculpted handgrip, pentaprism and hot shoe, mode dial, shutter
   button, top LCD, rear screen and eyepiece, and a zoom lens with knurled
   zoom/focus rings and a hood. The gimbal: pan, roll and tilt motors on
   machined arms, quick-release plate, and a rubberised handle with a status
   screen, joystick and trigger. The figure grips the handle two-handed;
   the handle sways with him while the motors hold the camera level.
   Units are metres, origin at the camera body; the lens points down +z. */

// Held at chest height in front of the figure, turned with his quarter-turn.
const REST = new Vector3(-0.06, 1.37, 0.29)
const FLIGHT = new CatmullRomCurve3([
  new Vector3(2.9, 3.1, -3.2),
  new Vector3(2.0, 2.3, -1.0),
  new Vector3(0.8, 1.6, 0.9),
  REST.clone(),
])
const EXIT = new CatmullRomCurve3([
  REST.clone(),
  new Vector3(0.4, 2.0, 0.6),
  new Vector3(0.3, 2.5, -1.2),
  new Vector3(0, 2.35, -2.2),
])

/* Where the hands go, in rig space. The IK places the *wrist*; the hand is
   then turned so its fingers and palm face the given directions and the
   fingers close into a fist around the gimbal handle — right hand above,
   left hand below, both thumbs up. */
const HANDLE_X = 0
const HANDLE_Z = -0.02
function fist(y, fingers, palm) {
  const f = fingers.clone().normalize()
  const n = palm.clone().normalize()
  const centre = new Vector3(HANDLE_X, y, HANDLE_Z)
  return { wrist: centre.addScaledVector(f, -0.052).addScaledVector(n, -0.026), fingers: f, palm: n }
}
export const HOLD = {
  right: fist(-0.182, new Vector3(0.55, 0, 0.83), new Vector3(0.83, 0, -0.55)),
  left: fist(-0.262, new Vector3(-0.55, 0, 0.83), new Vector3(-0.83, 0, -0.55)),
}
// Rear screen, in the stabilised head's frame (the camera sits 3 cm up and
// 10 cm forward of the roll-motor pivot the head turns about).
const HEAD_TO_CAMERA = new Vector3(0, 0.03, 0.1)
const SCREEN = new Vector3(0.0, 0.0, -0.04).add(HEAD_TO_CAMERA)

function useMaterials() {
  return useMemo(
    () => ({
      body: { color: '#18181a', metalness: 0.15, roughness: 0.62 },
      rubber: { color: '#0d0d0e', metalness: 0, roughness: 0.9 },
      trim: { color: '#2a2a2d', metalness: 0.5, roughness: 0.4 },
      metal: { color: '#9a9690', metalness: 1, roughness: 0.3 },
      glass: {
        color: '#06080f',
        metalness: 1,
        roughness: 0.12,
        clearcoat: 1,
        clearcoatRoughness: 0.12,
        iridescence: 1,
        iridescenceIOR: 1.8,
        iridescenceThicknessRange: [200, 600],
      },
      marking: { color: '#f3efe6', emissive: '#f3efe6', emissiveIntensity: 0.25 },
      gimbal: { color: '#26272b', metalness: 0.65, roughness: 0.32 },
      motor: { color: '#1b1c1f', metalness: 0.5, roughness: 0.4 },
      red: { color: '#c8102e', emissive: '#c8102e', emissiveIntensity: 0.25 },
    }),
    [],
  )
}

/** Rear screen: a still from the reel with a live-view overlay. */
function useScreenTexture() {
  const still = useTexture('/thumbnail/insta2.jpg')
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 480
    c.height = 320
    const g = c.getContext('2d')
    const img = still.image
    const scale = c.width / img.width
    g.drawImage(img, 0, (c.height - img.height * scale) / 2, c.width, img.height * scale)
    g.fillStyle = 'rgba(0,0,0,0.2)'
    g.fillRect(0, 0, c.width, c.height)
    g.strokeStyle = 'rgba(255,255,255,0.35)'
    g.lineWidth = 1.5
    for (const f of [1 / 3, 2 / 3]) {
      g.beginPath()
      g.moveTo(c.width * f, 0)
      g.lineTo(c.width * f, c.height)
      g.moveTo(0, c.height * f)
      g.lineTo(c.width, c.height * f)
      g.stroke()
    }
    g.strokeStyle = '#7cf0a0'
    g.lineWidth = 2
    g.strokeRect(c.width / 2 - 34, c.height / 2 - 26, 68, 52)
    g.fillStyle = 'rgba(0,0,0,0.55)'
    g.fillRect(0, c.height - 30, c.width, 30)
    g.font = '600 17px monospace'
    g.fillStyle = '#ff4d3a'
    g.fillText('● REC', 12, 24)
    g.fillStyle = '#e8e4da'
    g.fillText('4K 24p', c.width - 80, 24)
    g.fillText('1/50   F2.8   ISO 800   00:12:08', 12, c.height - 9)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [still])
}

/** Knurling around a ring: one instanced draw. */
function Ridges({ count, radius, length, z, width = 0.003, mat }) {
  const ref = useRef()
  useLayoutEffect(() => {
    const o = new Object3D()
    for (let i = 0; i < count; i++) {
      const a = (i / count) * Math.PI * 2
      o.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0)
      o.rotation.set(0, 0, a)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    }
    ref.current.instanceMatrix.needsUpdate = true
  }, [count, radius])
  return (
    <instancedMesh ref={ref} args={[null, null, count]} position={[0, 0, z]}>
      <boxGeometry args={[width, width * 0.9, length]} />
      <meshStandardMaterial {...mat} />
    </instancedMesh>
  )
}

/** A cylinder whose axis runs along z. */
function Barrel({ r, r2 = r, len, z, mat, open = false, seg = 40 }) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[r2, r, len, seg, 1, open]} />
      <meshPhysicalMaterial {...mat} side={open ? DoubleSide : undefined} />
    </mesh>
  )
}

function Lens({ m }) {
  // Mount on the body's front face, slightly left of centre (away from grip).
  return (
    <group position={[0.012, -0.004, 0.035]}>
      <Barrel r={0.033} len={0.006} z={0.003} mat={m.metal} />
      <Barrel r={0.034} len={0.02} z={0.016} mat={m.body} />
      {/* zoom ring */}
      <Barrel r={0.0355} len={0.034} z={0.043} mat={m.rubber} />
      <Ridges count={64} radius={0.0358} length={0.03} z={0.043} mat={m.rubber} />
      {/* focal-length scale */}
      <Barrel r={0.034} len={0.012} z={0.066} mat={m.body} />
      {Array.from({ length: 7 }, (_, i) => {
        const a = Math.PI * 0.35 + (i / 6) * Math.PI * 0.3
        return (
          <mesh key={i} position={[Math.cos(a) * 0.0342, Math.sin(a) * 0.0342, 0.066]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.001, 0.003, i % 2 ? 0.004 : 0.007]} />
            <meshStandardMaterial {...m.marking} />
          </mesh>
        )
      })}
      {/* focus ring */}
      <Barrel r={0.035} len={0.016} z={0.08} mat={m.rubber} />
      <Ridges count={52} radius={0.0352} length={0.013} z={0.08} mat={m.trim} width={0.0025} />
      <mesh position={[0, 0, 0.09]}>
        <torusGeometry args={[0.0352, 0.0012, 8, 48]} />
        <meshStandardMaterial {...m.red} />
      </mesh>
      <Barrel r={0.037} len={0.012} z={0.096} mat={m.body} />
      <mesh position={[0, 0, 0.1025]}>
        <circleGeometry args={[0.031, 48]} />
        <meshPhysicalMaterial {...m.glass} />
      </mesh>
      {/* petal-less round hood */}
      <Barrel r={0.039} r2={0.047} len={0.04} z={0.122} mat={m.body} open />
    </group>
  )
}

function Body({ m, screen }) {
  return (
    <group>
      <RoundedBox args={[0.135, 0.092, 0.068]} radius={0.014} smoothness={4} castShadow>
        <meshStandardMaterial {...m.body} />
      </RoundedBox>
      {/* handgrip, rubberised, standing proud of the front face */}
      <RoundedBox args={[0.036, 0.088, 0.036]} radius={0.014} smoothness={4} position={[-0.05, -0.002, 0.03]} castShadow>
        <meshStandardMaterial {...m.rubber} />
      </RoundedBox>
      {/* pentaprism hump + hot shoe */}
      <RoundedBox args={[0.062, 0.03, 0.056]} radius={0.01} smoothness={3} position={[0.012, 0.055, -0.003]} castShadow>
        <meshStandardMaterial {...m.body} />
      </RoundedBox>
      <mesh position={[0.012, 0.0715, -0.004]}>
        <boxGeometry args={[0.022, 0.003, 0.02]} />
        <meshStandardMaterial {...m.metal} />
      </mesh>
      {/* mode dial */}
      <group position={[0.05, 0.05, -0.008]}>
        <mesh>
          <cylinderGeometry args={[0.013, 0.013, 0.009, 32]} />
          <meshStandardMaterial {...m.trim} />
        </mesh>
        <mesh position={[0, 0.0047, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.004, 0.011, 32]} />
          <meshStandardMaterial {...m.marking} emissiveIntensity={0.1} />
        </mesh>
      </group>
      {/* top LCD and shutter button on the grip */}
      <mesh position={[-0.03, 0.0465, -0.008]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.03, 0.02]} />
        <meshStandardMaterial color="#0c1512" emissive="#9fd8c0" emissiveIntensity={0.25} />
      </mesh>
      <mesh position={[-0.05, 0.047, 0.035]}>
        <cylinderGeometry args={[0.0055, 0.0055, 0.004, 24]} />
        <meshStandardMaterial {...m.metal} />
      </mesh>
      {/* rear: screen, eyepiece, buttons, record lamp */}
      <mesh position={[0.004, -0.008, -0.0345]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.078, 0.052]} />
        <meshBasicMaterial map={screen} toneMapped={false} />
      </mesh>
      <mesh position={[0.012, 0.055, -0.034]}>
        <boxGeometry args={[0.03, 0.022, 0.012]} />
        <meshStandardMaterial {...m.rubber} />
      </mesh>
      {[0.022, 0.008, -0.006].map((y) => (
        <mesh key={y} position={[-0.052, y, -0.035]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 0.003, 16]} />
          <meshStandardMaterial {...m.trim} />
        </mesh>
      ))}
      <mesh position={[-0.052, -0.03, -0.035]}>
        <sphereGeometry args={[0.0022, 10, 10]} />
        <meshStandardMaterial color="#ff2d1a" emissive="#ff2d1a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
      {/* strap lugs */}
      {[-1, 1].map((s) => (
        <mesh key={s} position={[s * 0.069, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
          <torusGeometry args={[0.005, 0.0015, 8, 16]} />
          <meshStandardMaterial {...m.metal} />
        </mesh>
      ))}
    </group>
  )
}

const _a = new Vector3()
const _b = new Vector3()
/** A rectangular bar spanning two points. */
function Strut({ from, to, w = 0.016, d = 0.012, mat }) {
  const { pos, quat, len } = useMemo(() => {
    _a.fromArray(from)
    _b.fromArray(to)
    const dir = _b.clone().sub(_a)
    const len = dir.length()
    const o = new Object3D()
    o.position.copy(_a).add(_b).multiplyScalar(0.5)
    o.quaternion.setFromUnitVectors(new Vector3(0, 1, 0), dir.normalize())
    return { pos: o.position.toArray(), quat: o.quaternion.toArray(), len }
  }, [from, to])
  return (
    <mesh position={pos} quaternion={quat} castShadow>
      <boxGeometry args={[w, len, d]} />
      <meshStandardMaterial {...mat} />
    </mesh>
  )
}

/** A motor: a squat drum with a red accent ring, spinning about `axis`. */
function Motor({ position, axis = 'y', r = 0.029, h = 0.03, m }) {
  const rot = axis === 'x' ? [0, 0, Math.PI / 2] : axis === 'z' ? [Math.PI / 2, 0, 0] : [0, 0, 0]
  return (
    <group position={position} rotation={rot}>
      <mesh castShadow>
        <cylinderGeometry args={[r, r, h, 36]} />
        <meshStandardMaterial {...m.motor} />
      </mesh>
      <mesh position={[0, h / 2 + 0.0005, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[r * 0.55, r * 0.72, 36]} />
        <meshStandardMaterial {...m.red} />
      </mesh>
      <mesh position={[0, -h / 2 - 0.0005, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[r * 0.9, 36]} />
        <meshStandardMaterial {...m.gimbal} />
      </mesh>
    </group>
  )
}

/** Stabilised part of the gimbal: roll and tilt motors, arms and the plate
 *  the camera sits on. */
function GimbalHead({ m }) {
  return (
    <group>
      {/* quick-release plate + L-bracket to the tilt motor */}
      <mesh position={[0, -0.052, 0.005]} castShadow>
        <boxGeometry args={[0.05, 0.012, 0.1]} />
        <meshStandardMaterial {...m.gimbal} />
      </mesh>
      <Strut from={[0.02, -0.056, 0]} to={[0.1, -0.056, 0]} w={0.014} d={0.03} mat={m.gimbal} />
      <Strut from={[0.1, -0.056, 0]} to={[0.1, -0.012, 0]} w={0.012} d={0.03} mat={m.gimbal} />
      <Motor position={[0.1, -0.012, 0]} axis="x" m={m} r={0.026} />
      {/* tilt arm back to the roll motor */}
      <Strut from={[0.115, -0.012, 0]} to={[0.115, -0.012, -0.09]} w={0.012} d={0.022} mat={m.gimbal} />
      <Strut from={[0.115, -0.012, -0.09]} to={[0.02, -0.03, -0.09]} w={0.02} d={0.014} mat={m.gimbal} />
      <Motor position={[0, -0.03, -0.1]} axis="z" m={m} />
    </group>
  )
}

/** The part that moves with the hands: pan motor, arm and handle. */
function GimbalBase({ m }) {
  return (
    <group>
      {/* roll arm down to the pan motor above the handle */}
      <Strut from={[0, -0.05, -0.1]} to={[0, -0.125, -0.07]} w={0.022} d={0.014} mat={m.gimbal} />
      <Strut from={[0, -0.125, -0.07]} to={[0, -0.125, HANDLE_Z]} w={0.022} d={0.014} mat={m.gimbal} />
      <Motor position={[0, -0.136, HANDLE_Z]} axis="y" m={m} r={0.031} h={0.028} />
      {/* handle */}
      <mesh position={[HANDLE_X, -0.232, HANDLE_Z]} castShadow>
        <cylinderGeometry args={[0.021, 0.019, 0.17, 32]} />
        <meshStandardMaterial {...m.rubber} />
      </mesh>
      <mesh position={[HANDLE_X, -0.158, HANDLE_Z]}>
        <cylinderGeometry args={[0.023, 0.022, 0.016, 32]} />
        <meshStandardMaterial {...m.gimbal} />
      </mesh>
      {/* status screen + joystick facing the operator, trigger in front */}
      <mesh position={[HANDLE_X, -0.166, HANDLE_Z - 0.0235]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[0.022, 0.012]} />
        <meshStandardMaterial color="#0b1411" emissive="#7cf0c4" emissiveIntensity={0.5} />
      </mesh>
      <mesh position={[HANDLE_X, -0.18, HANDLE_Z - 0.024]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.004, 0.005, 0.006, 16]} />
        <meshStandardMaterial {...m.metal} />
      </mesh>
      <mesh position={[HANDLE_X, -0.19, HANDLE_Z + 0.022]}>
        <boxGeometry args={[0.01, 0.022, 0.008]} />
        <meshStandardMaterial {...m.gimbal} />
      </mesh>
      {/* folded tripod foot */}
      <mesh position={[HANDLE_X, -0.325, HANDLE_Z]}>
        <cylinderGeometry args={[0.02, 0.016, 0.018, 24]} />
        <meshStandardMaterial {...m.gimbal} />
      </mesh>
    </group>
  )
}

export default function DslrCamera() {
  const group = useRef()
  const head = useRef()
  const m = useMaterials()
  const screen = useScreenTexture()
  const helper = useMemo(() => new Object3D(), [])
  const level = useMemo(() => new Object3D(), [])
  const sway = useRef({ x: 0, y: 0 })

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    const p = state.progress
    const t = clock.elapsedTime
    const enter = range(p, 0.115, 0.245)
    const exit = range(p, 0.415, 0.475)
    g.visible = enter > 0 && exit < 1
    if (!g.visible) return

    // A long arcing flight in, held at chest height, then away into the edit
    // — its footage becomes the timeline's viewer.
    if (exit > 0) EXIT.getPoint(smooth(exit), g.position)
    else FLIGHT.getPoint(smooth(enter), g.position)

    const flying = 1 - smooth(enter)
    const held = enter >= 1 && exit <= 0
    // The handle moves with him — breathing, a little hand wobble — and the
    // camera aims gently toward the cursor.
    sway.current.x = damp(sway.current.x, state.pointer.y * 0.06, 3, dt)
    sway.current.y = damp(sway.current.y, state.pointer.x * 0.12, 3, dt)
    if (held) g.position.y += Math.sin(t * 1.4) * 0.004
    const yaw = -0.22 * ease(p, 0.2, 0.27)
    const wobble = 1 - flying
    helper.rotation.set(
      (Math.sin(t * 1.1) * 0.05 + Math.sin(t * 2.3) * 0.015) * wobble + flying * 0.6,
      yaw + flying * 2.6,
      (Math.sin(t * 0.8 + 1) * 0.06) * wobble + flying * -0.8,
    )
    g.quaternion.slerp(helper.quaternion, 1 - Math.exp(-10 * dt))
    if (enter < 1) g.quaternion.copy(helper.quaternion)

    // Stabilisation: the head holds a level horizon whatever the handle does.
    level.rotation.set(-sway.current.x + 0.05, yaw + sway.current.y, 0, 'YXZ')
    level.quaternion.premultiply(g.quaternion.clone().invert())
    head.current.quaternion.identity().slerp(level.quaternion, wobble)

    const s = MathUtils.lerp(1, 0.02, smooth(exit)) * MathUtils.lerp(2.2, 1, smooth(enter))
    g.scale.setScalar(s)

    g.updateMatrixWorld(true)
    // Hands grip the handle (moves with the rig); gaze goes to the screen
    // (on the stabilised head).
    anchors.gripRight.copy(HOLD.right.wrist).applyMatrix4(g.matrixWorld)
    anchors.gripLeft.copy(HOLD.left.wrist).applyMatrix4(g.matrixWorld)
    anchors.fingersRight.copy(HOLD.right.fingers).applyQuaternion(g.quaternion)
    anchors.palmRight.copy(HOLD.right.palm).applyQuaternion(g.quaternion)
    anchors.fingersLeft.copy(HOLD.left.fingers).applyQuaternion(g.quaternion)
    anchors.palmLeft.copy(HOLD.left.palm).applyQuaternion(g.quaternion)
    anchors.monitor.copy(SCREEN).applyMatrix4(head.current.matrixWorld)
  }, -2)

  return (
    <group ref={group} visible={false}>
      <GimbalBase m={m} />
      {/* stabilised about the roll motor, just behind the camera */}
      <group position={HEAD_TO_CAMERA.clone().negate().toArray()}>
        <group ref={head}>
          <group position={HEAD_TO_CAMERA.toArray()}>
            <Body m={m} screen={screen} />
            <Lens m={m} />
            <GimbalHead m={m} />
          </group>
        </group>
      </group>
    </group>
  )
}
