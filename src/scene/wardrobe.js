import { Matrix4, Vector3 } from 'three'

/* Mesh-level wardrobe edits applied to the avatar once, at load. Geometry is
   edited in bind space, so the skinning carries every change through each
   pose exactly as it carries the original. */

const boneKey = (name) => name.replace(/^mixamorig:?/, '').replace(/_\d+$/, '')
const done = new WeakSet()

/**
 * Re-cut a fitted trouser mesh as wide-leg, oversized pants. Each vertex is
 * pushed out from its leg's hip→ankle axis to at least a target radius that
 * grows from thigh to hem, so the leg hangs almost straight and wide the way
 * heavy fabric does; the original folds survive wherever they're already
 * wider. The inner side is capped short of the midline so the legs never
 * cross, and the hem drops to break over the shoes.
 */
export function oversizePants(
  mesh,
  { thigh = 0.11, hem = 0.15, seat = 1.08, drop = 0.09 } = {},
) {
  const geo = mesh.geometry
  if (!mesh.isSkinnedMesh || done.has(geo)) return
  done.add(geo)

  const { bones, boneInverses } = mesh.skeleton
  const joint = (key) => {
    const i = bones.findIndex((b) => boneKey(b.name) === key)
    return i < 0 ? null : new Vector3().setFromMatrixPosition(boneInverses[i].clone().invert())
  }
  const legs = {
    left: { hip: joint('LeftUpLeg'), ankle: joint('LeftFoot') },
    right: { hip: joint('RightUpLeg'), ankle: joint('RightFoot') },
  }
  if (!legs.left.hip || !legs.left.ankle || !legs.right.hip || !legs.right.ankle) return

  const toBind = mesh.bindMatrix
  const fromBind = new Matrix4().copy(mesh.bindMatrix).invert()
  const mid = (legs.left.hip.x + legs.right.hip.x) / 2
  const pos = geo.attributes.position
  const v = new Vector3()
  const axis = new Vector3()
  const onAxis = new Vector3()
  const r = new Vector3()
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)
  }

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).applyMatrix4(toBind)
    const leg = v.x > mid === legs.left.hip.x > mid ? legs.left : legs.right
    axis.subVectors(leg.ankle, leg.hip)
    const len = axis.length()
    axis.divideScalar(len)
    const along = v.clone().sub(leg.hip).dot(axis) / len
    const t = Math.min(1, Math.max(0, along))
    onAxis.copy(leg.hip).addScaledVector(axis, t * len)
    r.subVectors(v, onAxis)
    const dist = Math.hypot(r.x, r.z)

    // Above the crotch (the waistband and seat) only ease out a little.
    const leggy = smooth(-0.02, 0.12, along)
    const target = thigh + (hem - thigh) * smooth(0.1, 1, t)
    let want = Math.max(dist * seat, dist + (target - dist) * leggy)
    if (dist > 1e-5) {
      // Inner side: stop short of the midline so the legs never interpenetrate.
      const inward = Math.sign(r.x) !== Math.sign(onAxis.x - mid)
      if (inward) {
        const room = Math.abs(onAxis.x - mid) * 0.92
        const reach = Math.abs(r.x / dist)
        if (reach > 0.01) want = Math.min(want, Math.max(dist, room / reach))
      }
      const k = want / dist
      r.x *= k
      r.z *= k
    }
    v.copy(onAxis).add(r)

    // Longer hem that breaks over the shoe.
    v.y -= drop * smooth(0.7, 0.95, t)

    v.applyMatrix4(fromBind)
    pos.setXYZ(i, v.x, v.y, v.z)
  }
  pos.needsUpdate = true
  geo.computeBoundingBox()
  geo.computeBoundingSphere()
}
