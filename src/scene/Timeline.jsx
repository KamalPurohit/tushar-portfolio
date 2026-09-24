import { useLayoutEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { RoundedBox, Text, useTexture } from '@react-three/drei'
import {
  CanvasTexture,
  Color,
  ExtrudeGeometry,
  MathUtils,
  Object3D,
  RepeatWrapping,
  Shape,
  ShapeGeometry,
  SRGBColorSpace,
  Vector3,
} from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { ease, hash, lerp, range, smooth } from '../lib/math'

/* A floating NLE: grading wheels, program viewer, tool palette, ruler with
   markers, two video and two audio tracks, transitions and a playhead —
   worked by a scripted 3D mouse that drags, cuts, scrubs and grades on a
   14-second loop. Scroll assembles it, explodes its layers in depth, then
   scatters the clips. Panel units are metres, origin at the panel centre. */

const FONT = '/fonts/inter-tight-600.ttf'
const ORIGIN = new Vector3(0, 1.85, -2.2)
const X0 = -1.85
const X1 = 2.35

const TRACKS = {
  V2: { y: 0.1, h: 0.24, label: 'V2', layer: 'v2' },
  V1: { y: -0.2, h: 0.26, label: 'V1', layer: 'v1' },
  A1: { y: -0.56, h: 0.26, label: 'A1', layer: 'a1' },
  A2: { y: -0.88, h: 0.26, label: 'A2', layer: 'a2' },
}
const RULER_Y = 0.34

const STILLS = [1, 2, 3, 4, 5, 6, 7].map((n) => `/thumbnail/insta${n}.jpg`)

/* Video clips. `still` indexes STILLS. */
const CLIPS = [
  { key: 'c0', track: 'V1', x0: -1.85, x1: -0.96, still: 0, name: 'ILLADE NEENU' },
  { key: 'c1', track: 'V1', x0: -0.93, x1: 0.05, still: 1, name: 'KSHETRAPATHI', cut: -0.35 },
  { key: 'c2', track: 'V1', x0: 0.08, x1: 0.85, still: 3, name: 'ATHER' },
  { key: 'c3', track: 'V1', x0: 0.88, x1: 1.6, still: 4, name: 'KFC INTERVAL' },
  { key: 'c4', track: 'V1', x0: 1.63, x1: 2.33, still: 5, name: 'ADA' },
  { key: 'b0', track: 'V2', x0: -1.45, x1: -0.75, still: -1, name: 'TITLE — TUSHAR KB' },
  { key: 'b1', track: 'V2', x0: 0.2, x1: 0.9, still: 2, name: 'B-ROLL', drag: true },
]
const TRANSITIONS = [-0.945, 0.065, 0.865, 1.615]
const MARKERS = [
  { x: -1.2, color: '#ff8a3d' },
  { x: 0.42, color: '#a58bff' },
  { x: 1.3, color: '#4fd1a5' },
]
const TOOLS = [
  { x: 1.36, label: 'SELECT' },
  { x: 1.63, label: 'RAZOR' },
  { x: 1.9, label: 'SLIP' },
  { x: 2.17, label: 'HAND' },
]
const WHEELS = [
  { x: -2.12, label: 'LIFT' },
  { x: -1.72, label: 'GAMMA' },
  { x: -1.32, label: 'GAIN' },
]

/* ---- the mouse's choreography: [time, x, y, buttonDown] ---------------- */
const LOOP = 14
const PH0 = -1.5
const PH_SPEED = 0.08
const PH_GRAB = PH0 + 7.15 * PH_SPEED
const PH_DROP = 1.05
const KEYS = [
  [0, 2.7, -1.45, 0],
  [1.2, 0.55, 0.1, 0],
  [1.35, 0.55, 0.1, 1],
  [2.6, 0.9, 0.1, 1],
  [2.75, 0.9, 0.1, 0],
  [4.0, 1.63, 0.86, 0],
  [4.1, 1.63, 0.86, 1],
  [4.25, 1.63, 0.86, 0],
  [5.5, -0.35, -0.2, 0],
  [5.6, -0.35, -0.2, 1],
  [5.75, -0.35, -0.2, 0],
  [7.0, PH_GRAB, RULER_Y + 0.02, 0],
  [7.15, PH_GRAB, RULER_Y + 0.02, 1],
  [8.9, PH_DROP, RULER_Y + 0.02, 1],
  [9.05, PH_DROP, RULER_Y + 0.02, 0],
  [10.3, -1.72, 0.86, 0],
  [10.4, -1.72, 0.86, 1],
  [11.4, -1.65, 0.93, 1],
  [11.55, -1.65, 0.93, 0],
  [12.8, 2.7, -1.45, 0],
  [LOOP, 2.7, -1.45, 0],
]
const CLICKS = [1.35, 2.75, 4.1, 5.6, 7.15, 8.9, 10.4, 11.55]

function cursorAt(t, out) {
  let i = 0
  while (i < KEYS.length - 2 && KEYS[i + 1][0] <= t) i++
  const [ta, xa, ya, down] = KEYS[i]
  const [tb, xb, yb] = KEYS[i + 1]
  const k = smooth(range(t, ta, tb))
  out.x = lerp(xa, xb, k)
  out.y = lerp(ya, yb, k)
  out.down = down
  return out
}

/** Every animated value on the timeline as a pure function of loop time. */
function edit(t) {
  const reset = smooth(range(t, 12.9, 13.9))
  const drag = 0.35 * smooth(range(t, 1.35, 2.6)) * (1 - reset)
  const razor = t > 4.1 && t < 8 ? 1 : 0
  const cut = range(t, 5.6, 5.75) * (1 - reset)
  const flash = t > 5.6 ? Math.max(0, 1 - (t - 5.6) / 0.5) : 0
  let ph
  if (t < 7.15) ph = PH0 + t * PH_SPEED
  else if (t < 8.9) ph = lerp(PH_GRAB, PH_DROP, smooth(range(t, 7.15, 8.9)))
  else ph = PH_DROP + (t - 8.9) * PH_SPEED
  ph = lerp(ph, PH0, smooth(range(t, 12.9, 13.95)))
  const grade = smooth(range(t, 10.4, 11.4)) * (1 - reset)
  let ripple = -1
  for (const c of CLICKS) if (t >= c && t - c < 0.55) ripple = (t - c) / 0.55
  return { drag, razor, cut, flash, ph, grade, ripple }
}

/* ---- geometry helpers --------------------------------------------------- */

function arrowShape() {
  const s = new Shape()
  s.moveTo(0, 0)
  s.lineTo(0, -0.17)
  s.lineTo(0.042, -0.13)
  s.lineTo(0.07, -0.192)
  s.lineTo(0.094, -0.181)
  s.lineTo(0.067, -0.12)
  s.lineTo(0.122, -0.12)
  s.closePath()
  return s
}

function hueWheelTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const grad = g.createConicGradient(0, 128, 128)
  for (let i = 0; i <= 12; i++) grad.addColorStop(i / 12, `hsl(${i * 30}, 70%, 55%)`)
  g.fillStyle = grad
  g.beginPath()
  g.arc(128, 128, 128, 0, Math.PI * 2)
  g.fill()
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  r.addColorStop(0, 'rgba(40,40,40,1)')
  r.addColorStop(1, 'rgba(40,40,40,0.1)')
  g.fillStyle = r
  g.fill()
  const tex = new CanvasTexture(c)
  tex.colorSpace = SRGBColorSpace
  return tex
}

/** Deterministic "speech" or "music" amplitudes for the waveform bars. */
function waveform(count, kind) {
  return Array.from({ length: count }, (_, i) => {
    const t = i / count
    if (kind === 'music') {
      const beat = Math.pow(Math.abs(Math.sin(t * Math.PI * 34)), 6)
      return 0.25 + 0.5 * beat + 0.2 * hash(i * 3.1)
    }
    const phrase = Math.max(0, Math.sin(t * Math.PI * 9 + Math.sin(t * 23)))
    return 0.08 + 0.85 * phrase * (0.45 + 0.55 * hash(i * 7.7))
  })
}

/* ---- pieces ------------------------------------------------------------- */

const TRACK_COLORS = {
  V1: '#3d4f7a',
  V2: '#6a4f9a',
  A1: '#2f6b55',
  A2: '#27606e',
}

function Waveform({ x0, x1, y, h, kind, color, layerRef }) {
  const ref = useRef()
  const count = Math.round((x1 - x0) * 70)
  const amps = useMemo(() => waveform(count, kind), [count, kind])
  useLayoutEffect(() => {
    const o = new Object3D()
    const w = (x1 - x0) / count
    amps.forEach((a, i) => {
      o.position.set(x0 + (i + 0.5) * w, y, 0.004)
      o.scale.set(w * 0.62, Math.max(0.004, a * h * 0.8), 1)
      o.updateMatrix()
      ref.current.setMatrixAt(i, o.matrix)
    })
    ref.current.instanceMatrix.needsUpdate = true
  }, [amps, count, h, x0, x1, y])
  return (
    <group ref={layerRef}>
      <mesh position={[(x0 + x1) / 2, y, 0]}>
        <planeGeometry args={[x1 - x0 - 0.01, h]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} toneMapped={false} />
      </mesh>
      <instancedMesh ref={ref} args={[null, null, count]}>
        <planeGeometry />
        <meshBasicMaterial color="#cfeee2" transparent opacity={0.8} toneMapped={false} />
      </instancedMesh>
    </group>
  )
}

function Label({ children, size = 0.045, color = '#8d8a84', ...props }) {
  return (
    <Text font={FONT} fontSize={size} color={color} letterSpacing={0.08} anchorX="left" anchorY="middle" {...props}>
      {children}
    </Text>
  )
}

/** One rectangular piece of a video clip — a razor cut makes two of these. */
function ClipPiece({ register, id, track, map, name, showName }) {
  const g = useRef()
  const thumb = useRef()
  const glow = useRef()
  const tex = useMemo(() => {
    if (!map) return null
    const t = map.clone()
    t.wrapS = RepeatWrapping
    t.needsUpdate = true
    return t
  }, [map])
  useLayoutEffect(() => {
    register(id, { group: g.current, thumb: thumb.current, glow: glow.current, tex })
  }, [id, register, tex])
  const h = TRACKS[track].h
  return (
    <group ref={g}>
      <mesh ref={glow} position={[0, 0, -0.002]}>
        <planeGeometry args={[1, h + 0.03]} />
        <meshBasicMaterial color="#ffd6a8" transparent opacity={0} toneMapped={false} />
      </mesh>
      <mesh>
        <planeGeometry args={[1, h]} />
        <meshBasicMaterial color={TRACK_COLORS[track]} toneMapped={false} />
      </mesh>
      <mesh ref={thumb} position={[0, -0.018, 0.002]}>
        <planeGeometry args={[1, h - 0.07]} />
        {tex ? (
          <meshBasicMaterial map={tex} toneMapped={false} />
        ) : (
          <meshBasicMaterial color="#8a6fd1" toneMapped={false} />
        )}
      </mesh>
      {showName && (
        <Label position={[0, h / 2 - 0.022, 0.004]} size={0.032} color="#f3efe6" anchorX="left" name="label">
          {name}
        </Label>
      )}
    </group>
  )
}

/* ---- main --------------------------------------------------------------- */

export default function Timeline() {
  const root = useRef()
  const layers = useRef({})
  const pieces = useRef({})
  const cursor = useRef()
  const cursorShadow = useRef()
  const ripple = useRef()
  const playhead = useRef()
  const viewer = useRef()
  const cutFlash = useRef()
  const puck = useRef()
  const tools = useRef([])
  const timecode = useRef()
  const stills = useTexture(STILLS)
  const viewerMaps = useMemo(
    () =>
      stills.map((s) => {
        const t = s.clone()
        // cover-fit a 9:16 still into the 16:9 viewer
        t.repeat.set(1, 0.316)
        t.offset.set(0, 0.342)
        t.needsUpdate = true
        return t
      }),
    [stills],
  )
  const wheelTex = useMemo(hueWheelTexture, [])
  const arrow = useMemo(() => {
    const s = arrowShape()
    return {
      body: new ExtrudeGeometry(s, { depth: 0.016, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.004, bevelSegments: 2 }),
      flat: new ShapeGeometry(s),
    }
  }, [])
  const register = useMemo(
    () => (id, parts) => {
      pieces.current[id] = parts
    },
    [],
  )
  const setLayer = (name) => (el) => {
    if (el) layers.current[name] = el
  }
  const scratch = useMemo(() => ({ c: { x: 0, y: 0, down: 0 }, tint: new Color(), warm: new Color('#ffcf9e'), world: new Vector3() }), [])

  useFrame(({ clock }) => {
    const g = root.current
    if (!g) return
    const p = state.progress
    const appear = ease(p, 0.42, 0.5)
    const expand = ease(p, 0.5, 0.6)
    const leave = ease(p, 0.6, 0.67)
    g.visible = appear > 0.001 && leave < 0.999
    if (!g.visible) return
    const time = clock.elapsedTime

    // Whole-panel entrance and exit.
    g.position.set(ORIGIN.x, ORIGIN.y + 0.5 * leave - 0.3 * (1 - appear), ORIGIN.z - 1.2 * (1 - appear))
    g.rotation.set((1 - appear) * 0.5 - leave * 0.2, Math.sin(time * 0.2) * 0.03 * appear, 0)
    g.scale.setScalar(Math.max(0.001, lerp(0.55, 1, appear) * (1 + 0.1 * expand) * (1 - 0.6 * leave)))

    // Exploded depth: each layer lifts off the panel as the edit expands.
    const depth = {
      top: 0.02 + expand * 0.3,
      ruler: 0.02 + expand * 0.22,
      v2: 0.03 + expand * 0.5,
      v1: 0.02 + expand * 0.38,
      a1: 0.015 + expand * 0.18,
      a2: 0.01 + expand * 0.08,
    }
    for (const [name, el] of Object.entries(layers.current)) {
      el.position.z = depth[name] ?? depth[name.slice(0, 2)]
    }

    const t = (time % LOOP + LOOP) % LOOP
    const e = edit(t)
    const c = cursorAt(t, scratch.c)

    // Clips — drag, razor cut, hover glow; flown in on entry, scattered on exit.
    let i = 0
    for (const clip of CLIPS) {
      const tr = TRACKS[clip.track]
      const spans = clip.cut
        ? [
            [clip.x0, clip.cut - 0.012 * e.cut, `${clip.key}a`],
            [clip.cut + 0.012 * e.cut, clip.x1, `${clip.key}b`],
          ]
        : [[clip.x0 + (clip.drag ? e.drag : 0), clip.x1 + (clip.drag ? e.drag : 0), clip.key]]
      for (const [a, b, id] of spans) {
        const piece = pieces.current[id]
        if (!piece) continue
        const w = b - a
        const seed = i++
        const inT = smooth(range(appear, 0.15 + hash(seed) * 0.45, 1))
        const drift = Math.sin(time * 0.8 + seed) * 0.03 * expand
        piece.group.position.set(
          (a + b) / 2 + (1 - inT) * (hash(seed + 9) - 0.5) * 3 + leave * (hash(seed + 3) - 0.5) * 7,
          tr.y + (1 - inT) * (hash(seed + 5) - 0.5) * 2 + leave * (hash(seed + 7) - 0.3) * 3,
          (1 - inT) * 1.4 + drift + leave * (1 + hash(seed + 1) * 3),
        )
        piece.group.rotation.set(leave * (hash(seed) - 0.5) * 2, (1 - inT) * 0.8 + leave * (hash(seed + 2) - 0.5) * 2, 0)
        piece.group.scale.set(w, 1, 1)
        // Children are laid out in unit width; undo the stretch on the label.
        for (const child of piece.group.children) if (child.name === 'label') {
          child.scale.set(1 / w, 1, 1)
          child.position.x = -0.5 + 0.02 / w
        }
        if (piece.tex) {
          const frameW = (tr.h - 0.07) * (9 / 16)
          piece.tex.repeat.x = w / frameW
        }
        const hover = c.x > a && c.x < b && Math.abs(c.y - tr.y) < tr.h / 2
        piece.glow.material.opacity = MathUtils.lerp(piece.glow.material.opacity, hover ? 0.9 : 0, 0.2)
      }
    }

    // Razor flash along the cut.
    cutFlash.current.material.opacity = e.flash
    cutFlash.current.scale.y = 0.4 + e.flash * 0.9

    // Playhead + viewer: the frame under the playhead, warmed by the grade.
    playhead.current.position.x = e.ph
    const under = CLIPS.find((cl) => cl.track === 'V1' && e.ph >= cl.x0 && e.ph <= cl.x1)
    const map = viewerMaps[under ? under.still : 0]
    // Same shader either way (always a map), so no recompile on the swap.
    if (viewer.current.material.map !== map) viewer.current.material.map = map
    scratch.tint.setRGB(1, 1, 1).lerp(scratch.warm, e.grade * 0.8)
    viewer.current.material.color.copy(scratch.tint)
    puck.current.position.set(-1.72 + 0.07 * e.grade, 0.86 + 0.07 * e.grade, 0.012)

    // Tool palette: the razor lights while it's armed.
    tools.current.forEach((m, k) => {
      if (!m) return
      const on = k === 1 ? e.razor : k === 0 ? 1 - e.razor : 0
      m.material.color.set(on ? '#ff8a3d' : '#23252a')
    })

    // Timecode follows the playhead (24 fps, ~60 s across the ruler).
    const frames = Math.floor(((e.ph - X0) / (X1 - X0)) * 60 * 24)
    const tc = `01:00:${String(Math.floor(frames / 24) % 60).padStart(2, '0')}:${String(frames % 24).padStart(2, '0')}`
    if (timecode.current && timecode.current.text !== tc) {
      timecode.current.text = tc
      timecode.current.sync()
    }

    // The mouse itself — rides just above whichever layer it's over.
    const layerZ =
      c.y > 0.5 ? depth.top : c.y > 0.25 ? depth.ruler : c.y > -0.05 ? depth.v2 : c.y > -0.38 ? depth.v1 : depth.a1
    const lift = c.down ? 0.03 : 0.08
    cursor.current.position.set(c.x, c.y, layerZ + lift)
    cursor.current.scale.setScalar(c.down ? 0.88 : 1)
    cursorShadow.current.position.set(c.x + 0.012 + lift * 0.3, c.y - 0.02 - lift * 0.4, layerZ + 0.004)
    cursorShadow.current.material.opacity = 0.55 - lift * 2
    ripple.current.visible = e.ripple >= 0
    if (e.ripple >= 0) {
      ripple.current.position.set(c.x, c.y, layerZ + 0.01)
      ripple.current.scale.setScalar(0.02 + e.ripple * 0.14)
      ripple.current.material.opacity = 1 - e.ripple
    }

    cursor.current.getWorldPosition(scratch.world)
    anchors.editCursor.copy(scratch.world)
  })

  const v1 = TRACKS.V1
  return (
    <group ref={root} visible={false}>
      {/* panel */}
      <RoundedBox args={[5.05, 2.75, 0.04]} radius={0.018} smoothness={4} position={[0, 0.1, -0.03]}>
        <meshStandardMaterial color="#0b0c0e" roughness={0.7} metalness={0.2} transparent opacity={0.94} />
      </RoundedBox>
      <mesh position={[0, 1.45, 0.0]}>
        <planeGeometry args={[4.9, 0.004]} />
        <meshBasicMaterial color="#3a3a3a" toneMapped={false} />
      </mesh>
      <Label position={[-2.4, 1.36, 0.01]} size={0.04} color="#6f6c66">
        TUSHAR_KB — MASTER_EDIT_v12 · 4K DCI · 23.976
      </Label>

      {/* top row: grade / viewer / tools */}
      <group ref={setLayer('top')}>
        {WHEELS.map((w) => (
          <group key={w.label} position={[w.x, 0.86, 0]}>
            <mesh>
              <circleGeometry args={[0.15, 48]} />
              <meshBasicMaterial map={wheelTex} toneMapped={false} />
            </mesh>
            <mesh position={[0, 0, 0.004]}>
              <ringGeometry args={[0.152, 0.162, 64]} />
              <meshBasicMaterial color="#5c5a55" toneMapped={false} />
            </mesh>
            {w.label !== 'GAMMA' && (
              <mesh position={[0, 0, 0.012]}>
                <circleGeometry args={[0.016, 20]} />
                <meshBasicMaterial color="#f3efe6" toneMapped={false} />
              </mesh>
            )}
            <Label position={[0, -0.22, 0]} anchorX="center" size={0.036}>
              {w.label}
            </Label>
          </group>
        ))}
        <mesh ref={puck}>
          <circleGeometry args={[0.018, 20]} />
          <meshBasicMaterial color="#fff6e6" toneMapped={false} />
        </mesh>

        <mesh position={[0, 0.88, -0.004]}>
          <planeGeometry args={[1.24, 0.72]} />
          <meshBasicMaterial color="#000" toneMapped={false} />
        </mesh>
        <mesh ref={viewer} position={[0, 0.88, 0]}>
          <planeGeometry args={[1.2, 0.675]} />
          <meshBasicMaterial map={viewerMaps[0]} toneMapped={false} />
        </mesh>
        <Text
          ref={timecode}
          font={FONT}
          fontSize={0.05}
          color="#ff8a3d"
          anchorX="center"
          position={[0, 0.49, 0]}
          letterSpacing={0.1}
        >
          01:00:00:00
        </Text>
        <Label position={[-0.6, 1.26, 0]} size={0.034}>
          PROGRAM
        </Label>

        {TOOLS.map((tl, k) => (
          <group key={tl.label} position={[tl.x, 0.86, 0]}>
            <mesh ref={(m) => (tools.current[k] = m)}>
              <planeGeometry args={[0.22, 0.22]} />
              <meshBasicMaterial color="#23252a" toneMapped={false} />
            </mesh>
            <ToolGlyph kind={tl.label} />
            <Label position={[0, -0.16, 0]} anchorX="center" size={0.03}>
              {tl.label}
            </Label>
          </group>
        ))}
      </group>

      {/* ruler, markers, playhead head */}
      <group ref={setLayer('ruler')}>
        <mesh position={[(X0 + X1) / 2, RULER_Y - 0.06, 0]}>
          <planeGeometry args={[X1 - X0, 0.003]} />
          <meshBasicMaterial color="#4a4843" toneMapped={false} />
        </mesh>
        <RulerTicks />
        {Array.from({ length: 8 }, (_, k) => (
          <Label key={k} position={[X0 + (k / 7) * (X1 - X0) + 0.015, RULER_Y + 0.03, 0]} size={0.028} color="#6f6c66">
            {`00:${String(k * 8).padStart(2, '0')}`}
          </Label>
        ))}
        {MARKERS.map((mk) => (
          <mesh key={mk.x} position={[mk.x, RULER_Y + 0.07, 0]} rotation={[0, 0, Math.PI / 4]}>
            <planeGeometry args={[0.04, 0.04]} />
            <meshBasicMaterial color={mk.color} toneMapped={false} />
          </mesh>
        ))}
      </group>

      {/* track headers */}
      {Object.values(TRACKS).map((tr) => (
        <group key={tr.label} position={[-2.2, tr.y, 0]}>
          <mesh>
            <planeGeometry args={[0.6, tr.h]} />
            <meshBasicMaterial color="#15161a" toneMapped={false} />
          </mesh>
          <Label position={[-0.24, 0, 0.002]} size={0.045} color="#b9b5ad">
            {tr.label}
          </Label>
          <mesh position={[0.18, 0, 0.002]}>
            <planeGeometry args={[0.05, 0.05]} />
            <meshBasicMaterial color={tr.label.startsWith('A') ? '#2f6b55' : '#3d4f7a'} toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* video tracks */}
      <group ref={setLayer('v2')}>
        {CLIPS.filter((c) => c.track === 'V2').map((c) => (
          <ClipPiece key={c.key} id={c.key} register={register} track="V2" map={c.still >= 0 ? stills[c.still] : null} name={c.name} showName />
        ))}
      </group>
      <group ref={setLayer('v1')}>
        {CLIPS.filter((c) => c.track === 'V1').flatMap((c) =>
          c.cut
            ? [
                <ClipPiece key={`${c.key}a`} id={`${c.key}a`} register={register} track="V1" map={stills[c.still]} name={c.name} showName />,
                <ClipPiece key={`${c.key}b`} id={`${c.key}b`} register={register} track="V1" map={stills[c.still]} name={c.name} />,
              ]
            : [<ClipPiece key={c.key} id={c.key} register={register} track="V1" map={stills[c.still]} name={c.name} showName />],
        )}
        {TRANSITIONS.map((x) => (
          <group key={x} position={[x, v1.y + v1.h / 2 - 0.035, 0.008]}>
            <mesh rotation={[0, 0, Math.PI / 4]}>
              <planeGeometry args={[0.05, 0.05]} />
              <meshBasicMaterial color="#f3efe6" transparent opacity={0.85} toneMapped={false} />
            </mesh>
          </group>
        ))}
        <mesh ref={cutFlash} position={[-0.35, v1.y, 0.012]}>
          <planeGeometry args={[0.012, v1.h]} />
          <meshBasicMaterial color="#fff2dc" transparent opacity={0} toneMapped={false} />
        </mesh>
      </group>

      {/* audio */}
      <Waveform layerRef={setLayer('a1')} x0={X0} x1={0.6} y={TRACKS.A1.y} h={TRACKS.A1.h} kind="speech" color={TRACK_COLORS.A1} />
      <Waveform x0={0.64} x1={2.33} y={TRACKS.A1.y} h={TRACKS.A1.h} kind="speech" color={TRACK_COLORS.A1} layerRef={setLayer('a1b')} />
      <Waveform layerRef={setLayer('a2')} x0={X0} x1={2.33} y={TRACKS.A2.y} h={TRACKS.A2.h} kind="music" color={TRACK_COLORS.A2} />

      {/* playhead spans every layer */}
      <group ref={playhead} position={[PH0, 0, 0.6]}>
        <mesh position={[0, -0.28, 0]}>
          <planeGeometry args={[0.008, 1.32]} />
          <meshBasicMaterial color="#ff5a36" toneMapped={false} />
        </mesh>
        <mesh position={[0, RULER_Y + 0.0, 0]} rotation={[0, 0, Math.PI]}>
          <circleGeometry args={[0.045, 3]} />
          <meshBasicMaterial color="#ff5a36" toneMapped={false} />
        </mesh>
      </group>

      {/* the 3D mouse */}
      <group ref={cursor}>
        <mesh geometry={arrow.body} castShadow>
          <meshStandardMaterial color="#f5f1e8" roughness={0.25} metalness={0.1} emissive="#ffffff" emissiveIntensity={0.25} />
        </mesh>
        <mesh geometry={arrow.body} position={[-0.006, 0.008, -0.008]} scale={[1.14, 1.1, 1]}>
          <meshStandardMaterial color="#050505" roughness={0.4} />
        </mesh>
      </group>
      <mesh ref={cursorShadow} geometry={arrow.flat}>
        <meshBasicMaterial color="#000" transparent opacity={0.4} depthWrite={false} />
      </mesh>
      <mesh ref={ripple}>
        <ringGeometry args={[0.8, 1, 40]} />
        <meshBasicMaterial color="#ffd6a8" transparent toneMapped={false} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Ruler ticks: two instanced draws (minor and major) instead of 85 meshes. */
function RulerTicks() {
  const minor = useRef()
  const major = useRef()
  useLayoutEffect(() => {
    const o = new Object3D()
    let mi = 0
    let ma = 0
    for (let k = 0; k < 85; k++) {
      const isMajor = k % 12 === 0
      o.position.set(X0 + (k / 84) * (X1 - X0), RULER_Y - 0.06 + (isMajor ? 0.03 : 0.012), 0)
      o.scale.set(0.004, isMajor ? 0.06 : 0.024, 1)
      o.updateMatrix()
      if (isMajor) major.current.setMatrixAt(ma++, o.matrix)
      else minor.current.setMatrixAt(mi++, o.matrix)
    }
    minor.current.instanceMatrix.needsUpdate = true
    major.current.instanceMatrix.needsUpdate = true
  }, [])
  return (
    <>
      <instancedMesh ref={minor} args={[null, null, 85 - 8]}>
        <planeGeometry />
        <meshBasicMaterial color="#4a4843" toneMapped={false} />
      </instancedMesh>
      <instancedMesh ref={major} args={[null, null, 8]}>
        <planeGeometry />
        <meshBasicMaterial color="#8d8a84" toneMapped={false} />
      </instancedMesh>
    </>
  )
}

/** Tiny line-art icons for the tool palette. */
function ToolGlyph({ kind }) {
  const color = '#f3efe6'
  const bar = (x, y, w, h, r = 0) => (
    <mesh position={[x, y, 0.004]} rotation={[0, 0, r]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
  if (kind === 'SELECT')
    return (
      <group position={[-0.02, 0.05, 0]} scale={0.45}>
        <mesh position={[0, 0, 0.004]}>
          <shapeGeometry args={[arrowShape()]} />
          <meshBasicMaterial color={color} toneMapped={false} />
        </mesh>
      </group>
    )
  if (kind === 'RAZOR') return <group>{bar(0, 0.02, 0.012, 0.1, 0.6)}{bar(-0.025, -0.03, 0.04, 0.012, 0.6)}</group>
  if (kind === 'SLIP')
    return (
      <group>
        {bar(0, 0.02, 0.1, 0.01)}
        {bar(-0.045, 0.02, 0.01, 0.05)}
        {bar(0.045, 0.02, 0.01, 0.05)}
      </group>
    )
  return (
    <group>
      {bar(0, 0.01, 0.07, 0.07)}
      {bar(-0.024, 0.06, 0.014, 0.04)}
      {bar(0, 0.065, 0.014, 0.05)}
      {bar(0.024, 0.06, 0.014, 0.04)}
    </group>
  )
}
