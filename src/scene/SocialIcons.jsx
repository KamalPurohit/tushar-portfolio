import { useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { Color, ExtrudeGeometry, MathUtils, Path, Plane, Raycaster, Shape, Vector2, Vector3 } from 'three'
import { socials } from '../content/site'
import { state } from '../lib/state'
import { damp, ease, hash, window4 } from '../lib/math'

/* Six platform marks as extruded glyphs on lacquered tiles, orbiting the
   humanoid. They scatter and regroup with scroll, lean toward the cursor,
   and on hover pull forward with a preview card. */

/* ---- glyphs (drawn in a ±0.16 box) -------------------------------------- */

function roundRect(path, x, y, w, h, r) {
  path.moveTo(x + r, y)
  path.lineTo(x + w - r, y)
  path.quadraticCurveTo(x + w, y, x + w, y + r)
  path.lineTo(x + w, y + h - r)
  path.quadraticCurveTo(x + w, y + h, x + w - r, y + h)
  path.lineTo(x + r, y + h)
  path.quadraticCurveTo(x, y + h, x, y + h - r)
  path.lineTo(x, y + r)
  path.quadraticCurveTo(x, y, x + r, y)
  return path
}
const disc = (x, y, r, P = Shape) => {
  const s = new P()
  s.absarc(x, y, r, 0, Math.PI * 2, false)
  return s
}
const ring = (x, y, r0, r1) => {
  const s = disc(x, y, r1)
  s.holes.push(disc(x, y, r0, Path))
  return s
}
const rect = (x, y, w, h) => roundRect(new Shape(), x, y, w, h, Math.min(w, h) * 0.12)
const poly = (pts) => {
  const s = new Shape()
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)))
  s.closePath()
  return s
}

const GLYPHS = {
  instagram: () => {
    const frame = roundRect(new Shape(), -0.15, -0.15, 0.3, 0.3, 0.085)
    frame.holes.push(roundRect(new Path(), -0.118, -0.118, 0.236, 0.236, 0.06))
    return [frame, ring(0, 0, 0.045, 0.072), disc(0.083, 0.083, 0.018)]
  },
  youtube: () => {
    const body = roundRect(new Shape(), -0.17, -0.12, 0.34, 0.24, 0.07)
    const play = new Path()
    play.moveTo(-0.045, -0.065)
    play.lineTo(0.075, 0)
    play.lineTo(-0.045, 0.065)
    play.closePath()
    body.holes.push(play)
    return [body]
  },
  tiktok: () => {
    const stem = rect(0.005, -0.08, 0.05, 0.24)
    const note = ring(-0.045, -0.08, 0.028, 0.075)
    const flag = new Shape()
    flag.moveTo(0.03, 0.16)
    flag.quadraticCurveTo(0.05, 0.07, 0.15, 0.06)
    flag.lineTo(0.15, 0.012)
    flag.quadraticCurveTo(0.08, 0.02, 0.04, 0.07)
    flag.closePath()
    return [stem, note, flag]
  },
  facebook: () => {
    const f = new Shape()
    f.moveTo(-0.03, -0.17)
    f.lineTo(0.03, -0.17)
    f.lineTo(0.03, 0.03)
    f.lineTo(0.085, 0.03)
    f.lineTo(0.093, -0.02 + 0.07)
    f.lineTo(0.03, 0.08)
    f.lineTo(0.03, 0.1)
    f.quadraticCurveTo(0.03, 0.125, 0.06, 0.125)
    f.lineTo(0.095, 0.125)
    f.lineTo(0.095, 0.17)
    f.lineTo(0.05, 0.17)
    f.quadraticCurveTo(-0.03, 0.17, -0.03, 0.095)
    f.lineTo(-0.03, 0.08)
    f.lineTo(-0.08, 0.08)
    f.lineTo(-0.08, 0.03)
    f.lineTo(-0.03, 0.03)
    f.closePath()
    return [f]
  },
  x: () => [
    poly([[-0.14, 0.15], [-0.06, 0.15], [0.14, -0.15], [0.06, -0.15]]),
    poly([[0.1, 0.15], [0.135, 0.15], [-0.1, -0.15], [-0.135, -0.15]]),
  ],
  linkedin: () => {
    const n = new Shape()
    n.moveTo(-0.03, -0.14)
    n.lineTo(0.02, -0.14)
    n.lineTo(0.02, 0.0)
    n.quadraticCurveTo(0.02, 0.04, 0.055, 0.04)
    n.quadraticCurveTo(0.09, 0.04, 0.09, 0.0)
    n.lineTo(0.09, -0.14)
    n.lineTo(0.14, -0.14)
    n.lineTo(0.14, 0.015)
    n.quadraticCurveTo(0.14, 0.085, 0.07, 0.085)
    n.quadraticCurveTo(0.035, 0.085, 0.02, 0.06)
    n.lineTo(0.02, 0.075)
    n.lineTo(-0.03, 0.075)
    n.closePath()
    return [rect(-0.13, -0.14, 0.05, 0.215), disc(-0.105, 0.12, 0.03), n]
  },
}

/* Resting constellation around the figure (x, y relative to chest, z). */
const LAYOUT = [
  [-1.45, 0.88, 0.0],
  [1.25, 0.58, 0.2],
  [-0.9, 0.18, 1.0],
  [1.05, -0.3, 0.8],
  [-0.42, 1.18, -0.6],
  [0.6, 1.02, -0.45],
]
const ICON_SCALE = 0.78
const CENTER = new Vector3(0, 1.25, 0)

/* The tile: a rounded square slab with a soft bevel all round. */
const TILE = (() => {
  const g = new ExtrudeGeometry(roundRect(new Shape(), -0.2, -0.2, 0.4, 0.4, 0.085), {
    depth: 0.06,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.03,
    bevelSegments: 6,
    curveSegments: 24,
  })
  g.center()
  return g
})()

function Icon({ item, index, active, setActive, aspect }) {
  const g = useRef()
  const tile = useRef()
  const glyph = useRef()
  const camera = useThree((s) => s.camera)
  const brand = useMemo(() => new Color(item.color), [item.color])
  const geo = useMemo(
    () =>
      new ExtrudeGeometry(GLYPHS[item.id](), {
        depth: 0.035,
        bevelEnabled: true,
        bevelSize: 0.006,
        bevelThickness: 0.006,
        bevelSegments: 3,
        curveSegments: 24,
      }),
    [item.id],
  )
  const side = LAYOUT[index][0] > 0 ? -1 : 1 // cards open toward the centre
  const s = useMemo(
    () => ({
      pos: new Vector3(),
      home: new Vector3(),
      // Scatter outward and away from the lens, never through it.
      scatter: new Vector3(
        LAYOUT[index][0] * (1.2 + hash(index * 3 + 1)),
        (hash(index * 3 + 2) - 0.3) * 2.2,
        -0.6 - hash(index * 3 + 3) * 1.4,
      )
        .normalize()
        .multiplyScalar(6),
      ray: new Raycaster(),
      plane: new Plane(new Vector3(0, 0, 1), 0),
      ndc: new Vector2(),
      hit: new Vector3(),
      hover: 0,
      baseTile: new Color('#131416'),
      tileCol: new Color(),
      white: new Color('#f1ece2'),
      glyphCol: new Color(),
    }),
    [index],
  )
  const isActive = active === item.id

  useFrame(({ clock }, dt) => {
    const el = g.current
    const p = state.progress
    const present = window4(p, 0.615, 0.69, 0.79, 0.86)
    el.visible = present > 0.002
    if (!el.visible) {
      if (isActive) {
        setActive(null)
        state.hovering = null
      }
      return
    }
    const t = clock.elapsedTime
    const [lx, ly, lz] = LAYOUT[index]
    // Portrait screens pull the constellation in and stretch it vertically.
    const squeeze = Math.min(1, aspect / 1.35)
    s.home.set(lx * lerpN(0.4, 1, squeeze), ly * lerpN(1.45, 1, squeeze), lz).add(CENTER)
    // Slow orbit of the whole constellation plus each icon's own bob.
    const orbit = Math.sin(t * 0.15 + index) * 0.12
    s.home.x += Math.sin(orbit) * lz
    s.home.y += Math.sin(t * 0.9 + index * 1.7) * 0.05

    const scattered = 1 - present
    s.pos.copy(s.home).addScaledVector(s.scatter, ease(scattered, 0, 1))

    // Lean toward the cursor, strongest for the hovered icon.
    s.plane.constant = -s.pos.z
    s.ndc.set(state.pointer.x, state.pointer.y)
    s.ray.setFromCamera(s.ndc, camera)
    if (s.ray.ray.intersectPlane(s.plane, s.hit)) {
      const d = s.hit.distanceTo(s.pos)
      const pull = Math.max(0, 1 - d / 1.3) * (state.mobile ? 0 : 0.22) + s.hover * 0.12
      s.pos.lerp(s.hit, Math.min(pull, 0.35))
      s.pos.z += s.hover * 0.45
    }
    el.position.x = damp(el.position.x, s.pos.x, 6, dt)
    el.position.y = damp(el.position.y, s.pos.y, 6, dt)
    el.position.z = damp(el.position.z, s.pos.z, 6, dt)

    s.hover = damp(s.hover, isActive ? 1 : 0, 8, dt)
    const spin = scattered * 6 + Math.sin(t * 0.5 + index) * 0.35
    el.rotation.y = damp(el.rotation.y, (1 - s.hover) * spin + s.hover * state.pointer.x * 0.5, 5, dt)
    el.rotation.x = damp(el.rotation.x, Math.sin(t * 0.4 + index) * 0.15 * (1 - s.hover) - s.hover * state.pointer.y * 0.4, 5, dt)
    el.rotation.z = damp(el.rotation.z, (1 - s.hover) * Math.sin(t * 0.3 + index * 2) * 0.1, 5, dt)
    el.scale.setScalar(ICON_SCALE * MathUtils.lerp(0.4, 1, ease(present, 0, 1)) * (1 + s.hover * 0.28))

    s.tileCol.copy(s.baseTile).lerp(brand, 0.18 * s.hover)
    tile.current.material.color.copy(s.tileCol)
    s.glyphCol.copy(s.white).lerp(brand, s.hover)
    glyph.current.material.emissive.copy(s.glyphCol)
    glyph.current.material.emissiveIntensity = 0.25 + s.hover * 1.4
  })

  const open = () => {
    if (state.mobile && !isActive) return setActive(item.id)
    if (item.href) window.open(item.href, '_blank', 'noopener')
  }

  return (
    <group ref={g} visible={false}>
      <mesh
        ref={tile}
        geometry={TILE}
        castShadow
        onPointerOver={(e) => {
          e.stopPropagation()
          setActive(item.id)
          state.hovering = item.id
        }}
        onPointerOut={() => {
          setActive((a) => (a === item.id ? null : a))
          state.hovering = null
        }}
        onClick={(e) => {
          e.stopPropagation()
          open()
        }}
      >
        <meshPhysicalMaterial color="#131416" roughness={0.32} metalness={0.25} clearcoat={0.8} clearcoatRoughness={0.28} envMapIntensity={0.55} />
      </mesh>
      <mesh ref={glyph} geometry={geo} position={[0, 0, 0.05]} castShadow>
        <meshStandardMaterial color="#f1ece2" roughness={0.45} metalness={0.1} emissive="#f1ece2" emissiveIntensity={0.25} envMapIntensity={0.6} />
      </mesh>
      {isActive && (
        <Html position={[side * 0.62, 0, 0.1]} center portal={htmlLayer} zIndexRange={[40, 0]} style={{ pointerEvents: 'none' }}>
          <div className="social-card" style={{ '--brand': item.color }}>
            <img
              src={item.preview}
              alt=""
              loading="lazy"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = '/thumbnail/insta2.jpg'
              }}
            />
            <div className="social-card__body">
              <span className="social-card__name">{item.name}</span>
              <span className="social-card__handle">{item.handle}</span>
              <p>{item.blurb}</p>
              {item.href && <span className="social-card__cta">{state.mobile ? 'Tap again to open ↗' : 'Click to open ↗'}</span>}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}

const lerpN = (a, b, t) => a + (b - a) * t
const htmlLayer = { get current() { return document.getElementById('html-layer') } }

export default function SocialIcons() {
  const [active, setActive] = useState(null)
  const aspect = useThree((s) => s.viewport.aspect)
  return (
    <group>
      {socials.map((item, i) => (
        <Icon key={item.id} item={item} index={i} active={active} setActive={setActive} aspect={aspect} />
      ))}
    </group>
  )
}
