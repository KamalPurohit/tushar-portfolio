import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/* Compile every material and upload every texture in the scene up front,
   while the loader still covers the screen. Chapter objects (the camera,
   the timeline, the icons) start hidden, and three.js only prepares what's
   visible — so without this, each one's first appearance mid-scroll stalls
   on shader compiles and texture uploads. */
export default function Warmup() {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const hidden = []
    scene.traverse((o) => {
      if (!o.visible) {
        hidden.push(o)
        o.visible = true
      }
    })
    const textures = new Set()
    scene.traverse((o) => {
      const mats = Array.isArray(o.material) ? o.material : o.material ? [o.material] : []
      for (const m of mats) for (const v of Object.values(m)) if (v?.isTexture) textures.add(v)
    })
    try {
      gl.compile(scene, camera)
      for (const t of textures) gl.initTexture(t)
    } finally {
      for (const o of hidden) o.visible = false
    }
  }, [gl, scene, camera])
  return null
}
