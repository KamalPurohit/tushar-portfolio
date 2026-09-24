import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { useState } from 'react'
import { PCFSoftShadowMap } from 'three'
import { state } from '../lib/state'
import CameraRig from './CameraRig'
import Stage from './Stage'
import Humanoid from './Humanoid'
import CinemaCamera from './CinemaCamera'
import Timeline from './Timeline'
import SocialIcons from './SocialIcons'
import Effects from './Effects'

export default function Experience() {
  const [dpr, setDpr] = useState(state.mobile ? 1.25 : 1.6)
  return (
    <Canvas
      className="scene"
      shadows={{ type: PCFSoftShadowMap }}
      dpr={dpr}
      camera={{ fov: 34, near: 0.05, far: 60, position: [0, 1.35, 5.6] }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
      eventSource={document.body}
      eventPrefix="client"
    >
      <PerformanceMonitor
        onDecline={() => setDpr((d) => Math.max(0.8, d - 0.3))}
        onIncline={() => setDpr((d) => Math.min(state.mobile ? 1.5 : 2, d + 0.2))}
      />
      <AdaptiveDpr pixelated={false} />
      <CameraRig />
      <Suspense fallback={null}>
        <Stage />
        <Humanoid />
        <CinemaCamera />
        <Timeline />
        <SocialIcons />
        <Effects />
      </Suspense>
    </Canvas>
  )
}
