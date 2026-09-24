import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { PCFSoftShadowMap } from 'three'
import CameraRig from './CameraRig'
import Stage from './Stage'
import Humanoid from './Humanoid'
import CinemaCamera from './CinemaCamera'
import Timeline from './Timeline'
import SocialIcons from './SocialIcons'
import Effects from './Effects'
import Warmup from './Warmup'

/* Resolution is fixed for the whole film. Changing it mid-scroll (adaptive
   DPR) resizes the canvas and every post-processing buffer, which shows as a
   black blink — so it's picked once, from the device. */
const DPR = [1, 1.5]

export default function Experience() {
  return (
    <Canvas
      className="scene"
      shadows={{ type: PCFSoftShadowMap }}
      dpr={DPR}
      camera={{ fov: 34, near: 0.05, far: 60, position: [0, 1.35, 5.6] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      eventSource={document.body}
      eventPrefix="client"
    >
      <CameraRig />
      <Suspense fallback={null}>
        <Stage />
        <Humanoid />
        <CinemaCamera />
        <Timeline />
        <SocialIcons />
        <Effects />
        <Warmup />
      </Suspense>
    </Canvas>
  )
}
