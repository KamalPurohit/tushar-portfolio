import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom, DepthOfField, Noise, Vignette } from '@react-three/postprocessing'
import { BlendFunction } from 'postprocessing'
import { state } from '../lib/state'
import { anchors } from '../lib/anchors'

/* The lens: gentle bloom on practicals, shallow depth of field locked to
   whatever the camera is looking at, film grain and a soft vignette.
   Touch devices skip depth of field. */

export default function Effects() {
  const dof = useRef()
  // Rack focus every frame to wherever the camera rig is looking.
  useFrame(() => {
    if (dof.current?.target) dof.current.target.copy(anchors.focus)
  })
  if (state.mobile) {
    return (
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur intensity={0.5} luminanceThreshold={0.85} />
        <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.18} />
        <Vignette offset={0.25} darkness={0.8} />
      </EffectComposer>
    )
  }
  return (
    <EffectComposer multisampling={4}>
      <DepthOfField ref={dof} target={anchors.focus} worldFocusRange={2.4} bokehScale={3.5} height={540} />
      <Bloom mipmapBlur intensity={0.45} luminanceThreshold={0.95} luminanceSmoothing={0.15} />
      <Noise premultiply blendFunction={BlendFunction.SOFT_LIGHT} opacity={0.2} />
      <Vignette offset={0.25} darkness={0.8} />
    </EffectComposer>
  )
}
