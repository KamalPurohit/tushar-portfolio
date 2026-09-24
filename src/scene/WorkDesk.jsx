import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox } from '@react-three/drei'
import { Vector3 } from 'three'
import { state } from '../lib/state'
import { ease } from '../lib/math'
import { brands, pages, projects, reels } from '../content/site'
import { createWorkScreen } from './workScreen'

/* "The Work": an editing desk that slides in around the figure — office
   chair, desk, ultrawide monitor, keyboard, mouse and a warm desk lamp. The
   monitor shows his portfolio (see workScreen.js). He sits facing +z at the
   origin; the camera pushes in over his head until the screen fills frame.
   The points he sits, rests his feet and hands on are exported for the
   humanoid, in his root space. */

export const DESK = {
  hips: new Vector3(0, 0.585, -0.06),
  footL: new Vector3(0.14, 0.1, 0.36),
  footR: new Vector3(-0.14, 0.1, 0.36),
  // wrists: right on the mouse, left on the keyboard's left half
  wristR: new Vector3(-0.3, 0.772, 0.27),
  wristL: new Vector3(0.1, 0.772, 0.27),
  fingers: new Vector3(0, -0.22, 1).normalize(),
  palm: new Vector3(0, -1, 0),
  screen: new Vector3(0, 1.13, 0.87),
}

/** 0 → 1 as the setup arrives; he sits once the chair is under him. */
export const deskIn = (p) => ease(p, 0.83, 0.875)
export const seated = (p) => ease(p, 0.855, 0.9)

const TOP_Y = 0.74
const mat = {
  desk: { color: '#1d1a17', roughness: 0.55, metalness: 0.05 },
  deskEdge: { color: '#2a2521', roughness: 0.5 },
  metal: { color: '#3a3a3e', metalness: 0.85, roughness: 0.35 },
  black: { color: '#111113', roughness: 0.6, metalness: 0.2 },
  fabric: { color: '#1b1b1e', roughness: 0.95 },
  key: { color: '#26272b', roughness: 0.5 },
}

function Chair() {
  return (
    <group>
      {/* seat + back */}
      <RoundedBox args={[0.5, 0.07, 0.48]} radius={0.03} position={[0, 0.445, -0.05]} castShadow>
        <meshStandardMaterial {...mat.fabric} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.58, 0.07]} radius={0.03} position={[0, 0.82, -0.31]} rotation={[-0.12, 0, 0]} castShadow>
        <meshStandardMaterial {...mat.fabric} />
      </RoundedBox>
      <mesh position={[0, 0.55, -0.29]} rotation={[-0.12, 0, 0]}>
        <boxGeometry args={[0.05, 0.18, 0.03]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      {/* armrests */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.27, 0, -0.06]}>
          <mesh position={[0, 0.53, 0]}>
            <boxGeometry args={[0.025, 0.13, 0.03]} />
            <meshStandardMaterial {...mat.metal} />
          </mesh>
          <RoundedBox args={[0.06, 0.03, 0.26]} radius={0.012} position={[0, 0.61, 0.02]}>
            <meshStandardMaterial {...mat.black} />
          </RoundedBox>
        </group>
      ))}
      {/* gas lift + five-star base on casters */}
      <mesh position={[0, 0.26, -0.05]}>
        <cylinderGeometry args={[0.024, 0.03, 0.34, 20]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2
        return (
          <group key={i} position={[0, 0.075, -0.05]} rotation={[0, a, 0]}>
            <mesh position={[0, 0, 0.16]} rotation={[0.08, 0, 0]}>
              <boxGeometry args={[0.04, 0.03, 0.32]} />
              <meshStandardMaterial {...mat.black} />
            </mesh>
            <mesh position={[0, -0.04, 0.31]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.03, 16]} />
              <meshStandardMaterial {...mat.black} />
            </mesh>
          </group>
        )
      })}
    </group>
  )
}

function Monitor({ screen }) {
  const w = 1.0
  const h = w / screen.aspect
  return (
    <group position={[0, 1.13, 0.885]}>
      <RoundedBox args={[w + 0.03, h + 0.03, 0.03]} radius={0.012} castShadow>
        <meshStandardMaterial {...mat.black} />
      </RoundedBox>
      <mesh position={[0, 0, -0.016]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={screen.texture} toneMapped={false} color="#e8e8e8" />
      </mesh>
      {/* stand */}
      <mesh position={[0, -0.26, 0.05]} rotation={[0.12, 0, 0]}>
        <boxGeometry args={[0.06, 0.34, 0.025]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      <mesh position={[0, -0.385, 0.03]}>
        <boxGeometry args={[0.26, 0.012, 0.18]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      {/* screen spill onto his face and the desk */}
      <pointLight position={[0, 0, -0.25]} color="#c9d8ff" intensity={1.6} distance={1.8} decay={2} />
    </group>
  )
}

function Desk({ screen }) {
  return (
    <group>
      <RoundedBox args={[1.6, 0.04, 0.72]} radius={0.015} position={[0, TOP_Y - 0.02, 0.56]} receiveShadow castShadow>
        <meshStandardMaterial {...mat.desk} />
      </RoundedBox>
      {[-0.74, 0.74].map((x) => (
        <group key={x} position={[x, 0, 0.56]}>
          <mesh position={[0, (TOP_Y - 0.04) / 2, 0]}>
            <boxGeometry args={[0.05, TOP_Y - 0.04, 0.6]} />
            <meshStandardMaterial {...mat.black} />
          </mesh>
        </group>
      ))}
      <Monitor screen={screen} />
      {/* keyboard + keys */}
      <group position={[0.06, TOP_Y + 0.009, 0.36]}>
        <RoundedBox args={[0.42, 0.018, 0.13]} radius={0.006} castShadow>
          <meshStandardMaterial {...mat.black} />
        </RoundedBox>
        {Array.from({ length: 5 }, (_, r) =>
          Array.from({ length: 14 }, (_, c) => (
            <mesh key={`${r}-${c}`} position={[-0.188 + c * 0.029, 0.011, -0.048 + r * 0.024]}>
              <boxGeometry args={[0.024, 0.006, 0.019]} />
              <meshStandardMaterial {...mat.key} />
            </mesh>
          )),
        )}
      </group>
      {/* mouse + pad */}
      <mesh position={[-0.3, TOP_Y + 0.002, 0.37]} receiveShadow>
        <boxGeometry args={[0.26, 0.004, 0.22]} />
        <meshStandardMaterial color="#141416" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, TOP_Y + 0.018, 0.37]} scale={[0.6, 0.35, 1]} castShadow>
        <sphereGeometry args={[0.055, 24, 16]} />
        <meshStandardMaterial {...mat.black} />
      </mesh>
      {/* the DSLR, parked on the desk */}
      <group position={[0.55, TOP_Y + 0.05, 0.42]} rotation={[0, -0.7, 0]}>
        <RoundedBox args={[0.135, 0.092, 0.068]} radius={0.014}>
          <meshStandardMaterial {...mat.black} />
        </RoundedBox>
        <mesh position={[0.012, -0.004, 0.09]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.034, 0.1, 32]} />
          <meshStandardMaterial {...mat.black} />
        </mesh>
      </group>
      {/* mug */}
      <mesh position={[-0.6, TOP_Y + 0.05, 0.5]}>
        <cylinderGeometry args={[0.04, 0.036, 0.1, 24]} />
        <meshStandardMaterial color="#d9d2c5" roughness={0.4} />
      </mesh>
      <Lamp />
    </group>
  )
}

/** An architect's lamp throwing a warm pool across the keyboard. */
function Lamp() {
  return (
    <group position={[0.62, TOP_Y, 0.78]}>
      <mesh position={[0, 0.012, 0]}>
        <cylinderGeometry args={[0.07, 0.08, 0.024, 32]} />
        <meshStandardMaterial {...mat.black} />
      </mesh>
      <mesh position={[-0.02, 0.2, -0.04]} rotation={[0.35, 0, 0.12]}>
        <cylinderGeometry args={[0.008, 0.008, 0.4, 12]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      <mesh position={[-0.1, 0.4, -0.2]} rotation={[1.15, 0, 0.5]}>
        <cylinderGeometry args={[0.008, 0.008, 0.36, 12]} />
        <meshStandardMaterial {...mat.metal} />
      </mesh>
      <group position={[-0.2, 0.46, -0.36]} rotation={[0.9, 0.4, 0]}>
        <mesh>
          <coneGeometry args={[0.07, 0.1, 32, 1, true]} />
          <meshStandardMaterial {...mat.black} side={2} />
        </mesh>
        <mesh position={[0, -0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.05, 24]} />
          <meshBasicMaterial color="#ffd9a3" toneMapped={false} />
        </mesh>
      </group>
      <pointLight position={[-0.22, 0.4, -0.4]} color="#ffc98a" intensity={2.4} distance={2.2} decay={2} castShadow={false} />
    </group>
  )
}

export default function WorkDesk() {
  const chair = useRef()
  const desk = useRef()
  const screen = useMemo(() => createWorkScreen({ brands, pages, reels, films: projects }), [])
  const clock = useRef({ t: 0, acc: 0 })

  useFrame((_, dt) => {
    const p = state.progress
    const a = deskIn(p)
    const on = a > 0.001
    chair.current.visible = desk.current.visible = on
    if (!on) return
    // Chair rolls in from behind him, desk slides in from the front.
    chair.current.position.z = -2.4 * (1 - a)
    desk.current.position.z = 2.6 * (1 - a)
    desk.current.position.y = -0.3 * (1 - a)
    // Repaint the monitor at ~30 fps while it's on.
    clock.current.t += dt
    clock.current.acc += dt
    if (clock.current.acc > 1 / 30) {
      clock.current.acc = 0
      screen.draw(clock.current.t)
    }
  })

  return (
    <group>
      <group ref={chair} visible={false}>
        <Chair />
      </group>
      <group ref={desk} visible={false}>
        <Desk screen={screen} />
      </group>
    </group>
  )
}
