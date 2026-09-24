import { useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { CatmullRomCurve3, MathUtils, Vector3 } from 'three'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'
import { damp, lerp, range, smooth } from '../lib/math'

/* The film's camera move, keyed to scroll. Each key is [progress, position,
   look-at]; positions and targets run through Catmull-Rom splines so the
   move never kinks. `hold` keys ease in and out (the camera settles);
   others pass through at speed, which is what makes the orbit sweep. */

const O = new Vector3(-0.1, 1.4, 0.3) // the orbit's centre: camera + figure
const orbit = (theta, r, h) => new Vector3(O.x + Math.sin(theta) * r, O.y + h, O.z + Math.cos(theta) * r)

const KEYS = [
  { p: 0.0, pos: [0, 1.3, 5.0], look: [0, 1.15, 0], hold: true },
  { p: 0.12, pos: [0, 1.45, 4.3], look: [0, 1.25, 0] },
  { p: 0.22, pos: [-1.7, 1.55, 3.0], look: [-0.15, 1.35, 0.25] },
  { p: 0.3, pos: orbit(-0.6, 1.95, 0.18), look: O, hold: true },
  { p: 0.345, pos: orbit(-0.05, 1.8, 0.25), look: O },
  { p: 0.38, pos: orbit(0.6, 1.75, 0.35), look: O },
  { p: 0.41, pos: orbit(1.15, 1.9, 0.5), look: O },
  { p: 0.47, pos: [1.3, 2.15, 3.4], look: [0, 1.8, -2.2], hold: true },
  { p: 0.55, pos: [0.25, 2.0, 2.3], look: [0, 1.75, -2.2] },
  { p: 0.61, pos: [-0.9, 2.3, 2.8], look: [0, 1.75, -2.2], hold: true },
  { p: 0.69, pos: [0, 1.35, 4.5], look: [0, 1.3, 0], hold: true },
  { p: 0.76, pos: [0.55, 1.1, 3.5], look: [0, 1.4, 0] },
  { p: 0.83, pos: [-0.4, 1.45, 4.3], look: [0, 1.35, 0], hold: true },
  { p: 0.92, pos: [0, 2.5, 7.4], look: [0, 1.25, 0] },
  { p: 1.0, pos: [0, 2.9, 8.4], look: [0, 1.15, 0], hold: true },
]

const v = (a) => (a instanceof Vector3 ? a.clone() : new Vector3(...a))

export default function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const rig = useMemo(() => {
    const posCurve = new CatmullRomCurve3(KEYS.map((k) => v(k.pos)), false, 'centripetal')
    const lookCurve = new CatmullRomCurve3(KEYS.map((k) => v(k.look)), false, 'centripetal')
    return {
      posCurve,
      lookCurve,
      pos: new Vector3(),
      look: new Vector3(),
      smoothLook: new Vector3(0, 1.2, 0),
      par: { x: 0, y: 0 },
    }
  }, [])

  useFrame(({ clock }, rawDt) => {
    const dt = Math.min(rawDt, 1 / 20)
    // Scroll → progress, damped so wheel ticks become a glide.
    state.progress = state.reducedMotion
      ? state.target
      : damp(state.progress, state.target, 5, dt)
    const p = state.progress

    let i = 0
    while (i < KEYS.length - 2 && KEYS[i + 1].p <= p) i++
    const a = KEYS[i]
    const b = KEYS[i + 1]
    let t = range(p, a.p, b.p)
    // Ease out of a hold and into the next one; fly straight otherwise.
    if (a.hold && b.hold) t = smooth(t)
    else if (a.hold) t = 1 - Math.cos((t * Math.PI) / 2) // ease-in
    else if (b.hold) t = Math.sin((t * Math.PI) / 2) // ease-out
    const u = (i + t) / (KEYS.length - 1)
    rig.posCurve.getPoint(u, rig.pos)
    rig.lookCurve.getPoint(u, rig.look)

    // Portrait screens: step back so the subject still fits.
    const aspect = size.width / size.height
    const back = aspect < 1 ? lerp(1.55, 1, aspect) : 1
    rig.pos.sub(rig.look).multiplyScalar(back).add(rig.look)

    // Pointer parallax and a whisper of hand-held drift.
    rig.par.x = damp(rig.par.x, state.pointer.x, 2.5, dt)
    rig.par.y = damp(rig.par.y, state.pointer.y, 2.5, dt)
    const time = clock.elapsedTime
    const hand = state.reducedMotion ? 0 : 1
    camera.position.set(
      rig.pos.x + rig.par.x * 0.22 + Math.sin(time * 0.7) * 0.012 * hand,
      rig.pos.y + rig.par.y * 0.12 + Math.sin(time * 0.9 + 1) * 0.01 * hand,
      rig.pos.z,
    )
    rig.smoothLook.lerp(rig.look, 1 - Math.exp(-8 * dt))
    camera.lookAt(rig.smoothLook)
    camera.rotateZ(rig.par.x * -0.012 + Math.sin(time * 0.5) * 0.002 * hand)

    const fov = aspect < 1 ? 48 : 34
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = MathUtils.damp(camera.fov, fov, 4, dt)
      camera.updateProjectionMatrix()
    }
    anchors.focus.copy(rig.smoothLook)
  }, -10)

  return null
}
