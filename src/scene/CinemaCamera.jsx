import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, useTexture } from '@react-three/drei'
import {
  CanvasTexture,
  CatmullRomCurve3,
  MathUtils,
  Object3D,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { damp, ease, range, smooth } from '../lib/math'

/* A cinema camera package built from primitives — body, PL mount, lens with
   knurled focus/iris rings, 15mm rods, follow-focus, matte box with flags,
   top handle, side handgrip and an articulated on-board monitor.
   Units are metres; the lens points down local +z. */

const REST = new Vector3(-0.1, 1.38, 0.4)
const FLIGHT = new CatmullRomCurve3([
  new Vector3(4.2, 3.4, -4.5),
  new Vector3(2.8, 2.4, -0.6),
  new Vector3(1.1, 1.75, 1.4),
  REST.clone(),
])
const EXIT = new CatmullRomCurve3([
  REST.clone(),
  new Vector3(0.4, 2.0, 0.6),
  new Vector3(0.3, 2.5, -1.2),
  new Vector3(0, 2.35, -2.2),
])

// Local points the humanoid's hands and gaze lock onto.
const GRIP_R = new Vector3(-0.118, -0.02, 0.04)
const GRIP_L = new Vector3(0.045, -0.05, 0.19)
const MONITOR = new Vector3(0.07, 0.15, -0.06)

function useMaterials() {
  return useMemo(
    () => ({
      body: { color: '#1c1d1f', metalness: 0.55, roughness: 0.42 },
      bodyLight: { color: '#2a2b2e', metalness: 0.6, roughness: 0.35 },
      metal: { color: '#9a9690', metalness: 1, roughness: 0.28 },
      darkMetal: { color: '#3a3936', metalness: 0.9, roughness: 0.35 },
      rubber: { color: '#0e0e0f', metalness: 0, roughness: 0.85 },
      glass: {
        color: '#06080f',
        metalness: 1,
        roughness: 0.04,
        clearcoat: 1,
        iridescence: 1,
        iridescenceIOR: 1.8,
        iridescenceThicknessRange: [200, 600],
      },
      marking: { color: '#f3efe6', emissive: '#f3efe6', emissiveIntensity: 0.25 },
      accent: { color: '#ff6a2b', emissive: '#ff6a2b', emissiveIntensity: 0.4 },
    }),
    [],
  )
}

/** Monitor feed: a still from the reel with frame lines and a REC slate. */
function useMonitorTexture() {
  const still = useTexture('/thumbnail/insta2.jpg')
  return useMemo(() => {
    const c = document.createElement('canvas')
    c.width = 512
    c.height = 320
    const g = c.getContext('2d')
    const img = still.image
    // cover-fit the vertical still into the 16:10 panel
    const scale = c.width / img.width
    g.drawImage(img, 0, (c.height - img.height * scale) / 2, c.width, img.height * scale)
    g.fillStyle = 'rgba(0,0,0,0.25)'
    g.fillRect(0, 0, c.width, c.height)
    g.fillStyle = '#000'
    g.fillRect(0, 0, c.width, 34)
    g.fillRect(0, c.height - 34, c.width, 34)
    g.strokeStyle = 'rgba(255,255,255,0.55)'
    g.lineWidth = 2
    g.strokeRect(60, 50, c.width - 120, c.height - 100)
    g.beginPath()
    g.moveTo(c.width / 2 - 14, c.height / 2)
    g.lineTo(c.width / 2 + 14, c.height / 2)
    g.moveTo(c.width / 2, c.height / 2 - 14)
    g.lineTo(c.width / 2, c.height / 2 + 14)
    g.stroke()
    g.font = '600 18px monospace'
    g.fillStyle = '#ff4d3a'
    g.fillText('● REC', 14, 23)
    g.fillStyle = '#e8e4da'
    g.fillText('4K  23.976  ISO 800  5600K', 110, 23)
    g.fillText('T2.1   35mm   172.8°', 14, c.height - 11)
    g.fillText('01:04:22:17', c.width - 150, c.height - 11)
    const tex = new CanvasTexture(c)
    tex.colorSpace = SRGBColorSpace
    return tex
  }, [still])
}

function Ridges({ count, radius, length, z, width = 0.004, mat }) {
  const items = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const a = (i / count) * Math.PI * 2
        return { a, x: Math.cos(a) * radius, y: Math.sin(a) * radius }
      }),
    [count, radius],
  )
  return (
    <group position={[0, 0, z]}>
      {items.map(({ a, x, y }, i) => (
        <mesh key={i} position={[x, y, 0]} rotation={[0, 0, a]}>
          <boxGeometry args={[width, width * 0.9, length]} />
          <meshStandardMaterial {...mat} />
        </mesh>
      ))}
    </group>
  )
}

/** A cylinder whose axis runs along z. */
function Barrel({ r, r2 = r, len, z, mat, seg = 40 }) {
  return (
    <mesh position={[0, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
      <cylinderGeometry args={[r2, r, len, seg]} />
      <meshPhysicalMaterial {...mat} />
    </mesh>
  )
}

function Lens({ m }) {
  return (
    <group position={[0, 0, 0.1]}>
      {/* PL mount */}
      <Barrel r={0.041} len={0.014} z={0.004} mat={m.metal} />
      <Barrel r={0.036} len={0.012} z={0.016} mat={m.darkMetal} />
      {/* barrel sections */}
      <Barrel r={0.042} len={0.05} z={0.047} mat={m.body} />
      <Barrel r={0.046} len={0.036} z={0.09} mat={m.bodyLight} />
      <Ridges count={56} radius={0.047} length={0.03} z={0.09} mat={m.rubber} />
      <Barrel r={0.044} len={0.02} z={0.12} mat={m.body} />
      <Ridges count={40} radius={0.045} length={0.014} z={0.12} mat={m.darkMetal} />
      <Barrel r={0.048} r2={0.052} len={0.05} z={0.155} mat={m.body} />
      {/* focus scale markings */}
      {Array.from({ length: 9 }, (_, i) => {
        const a = Math.PI * 0.2 + (i / 8) * Math.PI * 0.6
        return (
          <mesh key={i} position={[Math.cos(a) * 0.0465, Math.sin(a) * 0.0465, 0.074]} rotation={[0, 0, a]}>
            <boxGeometry args={[0.0012, 0.004, i % 2 ? 0.004 : 0.008]} />
            <meshStandardMaterial {...m.marking} />
          </mesh>
        )
      })}
      {/* front element */}
      <Barrel r={0.049} len={0.004} z={0.182} mat={m.darkMetal} />
      <mesh position={[0, 0, 0.183]}>
        <circleGeometry args={[0.042, 48]} />
        <meshPhysicalMaterial {...m.glass} />
      </mesh>
      <mesh position={[0, 0, 0.176]} rotation={[0, 0, 0]}>
        <torusGeometry args={[0.046, 0.0025, 8, 48]} />
        <meshStandardMaterial {...m.accent} emissiveIntensity={0.1} />
      </mesh>
    </group>
  )
}

function MatteBox({ m }) {
  const w0 = 0.14
  const h0 = 0.11
  const w1 = 0.2
  const h1 = 0.15
  const len = 0.09
  const z = 0.33
  const side = (x, y, w, h, rx, ry) => (
    <mesh position={[x, y, z]} rotation={[rx, ry, 0]} castShadow>
      <boxGeometry args={[w, h, len]} />
      <meshStandardMaterial {...m.body} />
    </mesh>
  )
  const flare = Math.atan((w1 - w0) / 2 / len)
  const flareV = Math.atan((h1 - h0) / 2 / len)
  return (
    <group>
      {side(0, (h0 + h1) / 4, (w0 + w1) / 2, 0.004, flareV, 0)}
      {side(0, -(h0 + h1) / 4, (w0 + w1) / 2, 0.004, -flareV, 0)}
      {side((w0 + w1) / 4, 0, 0.004, (h0 + h1) / 2, 0, -flare)}
      {side(-(w0 + w1) / 4, 0, 0.004, (h0 + h1) / 2, 0, flare)}
      {/* filter stage */}
      <mesh position={[0, 0, z - len / 2 - 0.012]}>
        <boxGeometry args={[w0 + 0.012, h0 + 0.012, 0.022]} />
        <meshStandardMaterial {...m.bodyLight} />
      </mesh>
      {/* french flag + side eyebrows */}
      <mesh position={[0, h1 / 2 + 0.005, z + len / 2 + 0.035]} rotation={[-0.22, 0, 0]} castShadow>
        <boxGeometry args={[w1, 0.003, 0.075]} />
        <meshStandardMaterial {...m.body} />
      </mesh>
      {[1, -1].map((s) => (
        <mesh key={s} position={[s * (w1 / 2 + 0.004), 0, z + len / 2 + 0.03]} rotation={[0, s * 0.25, 0]}>
          <boxGeometry args={[0.003, h1 * 0.9, 0.06]} />
          <meshStandardMaterial {...m.body} />
        </mesh>
      ))}
      {/* support arm down to the rods */}
      <mesh position={[0, -0.078, z - 0.05]}>
        <boxGeometry args={[0.03, 0.02, 0.02]} />
        <meshStandardMaterial {...m.darkMetal} />
      </mesh>
    </group>
  )
}

function Rods({ m }) {
  return (
    <group position={[0, -0.093, 0.12]}>
      {[-0.03, 0.03].map((x) => (
        <mesh key={x} position={[x, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.0075, 0.0075, 0.46, 16]} />
          <meshStandardMaterial {...m.metal} />
        </mesh>
      ))}
      {/* follow focus: body, gear meshing with the focus ring, knob */}
      <group position={[0.058, 0.022, 0.07]}>
        <RoundedBox args={[0.034, 0.05, 0.03]} radius={0.004}>
          <meshStandardMaterial {...m.body} />
        </RoundedBox>
        <mesh position={[-0.014, 0.036, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.012, 18]} />
          <meshStandardMaterial {...m.metal} />
        </mesh>
        <mesh position={[0.024, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.022, 0.022, 0.01, 32]} />
          <meshStandardMaterial {...m.bodyLight} />
        </mesh>
        <mesh position={[0.03, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <ringGeometry args={[0.012, 0.02, 32]} />
          <meshStandardMaterial {...m.marking} />
        </mesh>
      </group>
    </group>
  )
}

function Monitor({ m, texture }) {
  return (
    <group position={[0.05, 0.1, -0.03]}>
      {/* articulated arm */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.006, 0.006, 0.04, 12]} />
        <meshStandardMaterial {...m.metal} />
      </mesh>
      <mesh position={[0.012, 0.042, -0.01]} rotation={[0.6, 0, -0.5]}>
        <cylinderGeometry args={[0.005, 0.005, 0.035, 12]} />
        <meshStandardMaterial {...m.metal} />
      </mesh>
      <group position={[0.03, 0.065, -0.03]} rotation={[-0.25, Math.PI - 0.25, 0]}>
        <RoundedBox args={[0.15, 0.1, 0.018]} radius={0.006} castShadow>
          <meshStandardMaterial {...m.body} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0095]}>
          <planeGeometry args={[0.136, 0.085]} />
          <meshBasicMaterial map={texture} toneMapped={false} />
        </mesh>
        {/* sun hood */}
        <mesh position={[0, 0.053, 0.02]}>
          <boxGeometry args={[0.152, 0.003, 0.04]} />
          <meshStandardMaterial {...m.body} />
        </mesh>
        {[-1, 1].map((s) => (
          <mesh key={s} position={[s * 0.076, 0.01, 0.02]}>
            <boxGeometry args={[0.003, 0.085, 0.04]} />
            <meshStandardMaterial {...m.body} />
          </mesh>
        ))}
      </group>
    </group>
  )
}

function Body({ m }) {
  return (
    <group>
      <RoundedBox args={[0.13, 0.135, 0.2]} radius={0.012} smoothness={4} castShadow>
        <meshStandardMaterial {...m.body} />
      </RoundedBox>
      {/* recessed side panels & vents */}
      {[1, -1].map((s) => (
        <group key={s} position={[s * 0.066, 0, 0]}>
          <mesh>
            <boxGeometry args={[0.004, 0.1, 0.15]} />
            <meshStandardMaterial {...m.bodyLight} />
          </mesh>
          {Array.from({ length: 7 }, (_, i) => (
            <mesh key={i} position={[s * 0.002, 0.03, -0.06 + i * 0.012]}>
              <boxGeometry args={[0.002, 0.03, 0.004]} />
              <meshStandardMaterial {...m.rubber} />
            </mesh>
          ))}
        </group>
      ))}
      {/* operator-side buttons and a tiny status screen */}
      <group position={[0.069, -0.025, -0.02]}>
        <mesh position={[0.001, 0.01, 0.03]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.05, 0.028]} />
          <meshStandardMaterial color="#0a1a14" emissive="#7cf0c4" emissiveIntensity={0.35} />
        </mesh>
        {[-0.03, -0.018, -0.006, 0.006].map((z, i) => (
          <mesh key={z} position={[0.003, -0.018, z]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.004, 0.004, 0.004, 16]} />
            <meshStandardMaterial {...(i === 0 ? m.accent : m.darkMetal)} />
          </mesh>
        ))}
      </group>
      {/* rear battery plate */}
      <mesh position={[0, -0.005, -0.115]}>
        <boxGeometry args={[0.11, 0.12, 0.03]} />
        <meshStandardMaterial {...m.bodyLight} />
      </mesh>
      {/* top handle */}
      <group position={[0, 0.082, 0.01]}>
        <mesh position={[0, -0.008, 0]}>
          <boxGeometry args={[0.03, 0.012, 0.16]} />
          <meshStandardMaterial {...m.darkMetal} />
        </mesh>
        {[-0.06, 0.06].map((z) => (
          <mesh key={z} position={[0, 0.012, z]}>
            <boxGeometry args={[0.024, 0.03, 0.014]} />
            <meshStandardMaterial {...m.darkMetal} />
          </mesh>
        ))}
        <mesh position={[0, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <capsuleGeometry args={[0.009, 0.12, 6, 12]} />
          <meshStandardMaterial {...m.rubber} />
        </mesh>
      </group>
      {/* viewfinder */}
      <group position={[-0.078, 0.045, -0.02]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.1, 24]} />
          <meshStandardMaterial {...m.body} />
        </mesh>
        <mesh position={[0, 0, -0.062]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.024, 0.018, 0.03, 24]} />
          <meshStandardMaterial {...m.rubber} />
        </mesh>
      </group>
      {/* handgrip with record trigger */}
      <group position={[-0.1, -0.02, 0.04]} rotation={[0.35, 0, 0.2]}>
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.018, 0.018, 0.012, 24]} />
          <meshStandardMaterial {...m.metal} />
        </mesh>
        <mesh position={[-0.012, -0.03, 0]}>
          <capsuleGeometry args={[0.016, 0.07, 6, 16]} />
          <meshStandardMaterial {...m.rubber} />
        </mesh>
        <mesh position={[-0.012, 0.022, 0.008]}>
          <cylinderGeometry args={[0.005, 0.005, 0.006, 16]} />
          <meshStandardMaterial color="#ff2d1a" emissive="#ff2d1a" emissiveIntensity={1.2} />
        </mesh>
      </group>
      {/* baseplate */}
      <mesh position={[0, -0.078, 0.02]}>
        <boxGeometry args={[0.1, 0.018, 0.24]} />
        <meshStandardMaterial {...m.darkMetal} />
      </mesh>
      {/* tally lamp */}
      <mesh position={[0.05, 0.05, 0.101]}>
        <sphereGeometry args={[0.004, 12, 12]} />
        <meshStandardMaterial color="#ff2d1a" emissive="#ff2d1a" emissiveIntensity={3} toneMapped={false} />
      </mesh>
    </group>
  )
}

export default function CinemaCamera() {
  const group = useRef()
  const m = useMaterials()
  const screen = useMonitorTexture()
  const helper = useMemo(() => new Object3D(), [])
  const sway = useRef({ x: 0, y: 0 })

  useFrame(({ clock }, dt) => {
    const g = group.current
    if (!g) return
    const p = state.progress
    const t = clock.elapsedTime
    const enter = range(p, 0.14, 0.245)
    const exit = range(p, 0.415, 0.475)
    g.visible = enter > 0 && exit < 1
    if (!g.visible) return

    // Position: a long arcing flight in, a hand-held rest, then away into
    // the edit — its footage becomes the timeline's viewer.
    if (exit > 0) EXIT.getPoint(smooth(exit), g.position)
    else FLIGHT.getPoint(smooth(enter), g.position)

    const flying = 1 - smooth(enter)
    const held = enter >= 1 && exit <= 0
    // A gentle float while in hand; the whole rig lists toward the cursor.
    sway.current.x = damp(sway.current.x, state.pointer.y * 0.12, 3, dt)
    sway.current.y = damp(sway.current.y, state.pointer.x * 0.18, 3, dt)
    if (held) g.position.y += Math.sin(t * 1.4) * 0.004

    helper.rotation.set(
      -0.05 + sway.current.x * (1 - flying) + flying * 0.6,
      -0.22 * ease(p, 0.2, 0.27) + sway.current.y * (1 - flying) + flying * 2.6,
      flying * -0.8 + Math.sin(t * 0.9) * 0.01,
    )
    g.quaternion.slerp(helper.quaternion, 1 - Math.exp(-10 * dt))
    if (enter < 1) g.quaternion.copy(helper.quaternion)

    const s = MathUtils.lerp(1, 0.02, smooth(exit)) * MathUtils.lerp(1.7, 1, smooth(enter))
    g.scale.setScalar(s)

    g.updateMatrixWorld(true)
    anchors.gripRight.copy(GRIP_R).applyMatrix4(g.matrixWorld)
    anchors.gripLeft.copy(GRIP_L).applyMatrix4(g.matrixWorld)
    anchors.monitor.copy(MONITOR).applyMatrix4(g.matrixWorld)
  }, -2)

  return (
    <group ref={group} visible={false}>
      <Body m={m} />
      <Lens m={m} />
      <MatteBox m={m} />
      <Rods m={m} />
      <Monitor m={m} texture={screen} />
    </group>
  )
}

