import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Environment, Lightformer, MeshReflectorMaterial, SpotLight, Text } from '@react-three/drei'
import { AdditiveBlending, CanvasTexture, Color, Object3D } from 'three'
import { state } from '../lib/state'
import { damp, ease, window4 } from '../lib/math'
import { meta } from '../content/site'

/* The studio: a glossy black floor that falls off into fog, a pool of warm
   light under the figure, volumetric beams, drifting dust, and a key light
   that follows the cursor like an operator panning a fixture. */

function glowTexture() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')
  const r = g.createRadialGradient(128, 128, 0, 128, 128, 128)
  r.addColorStop(0, 'rgba(255,214,168,0.32)')
  r.addColorStop(0.35, 'rgba(255,190,130,0.08)')
  r.addColorStop(1, 'rgba(0,0,0,0)')
  g.fillStyle = r
  g.fillRect(0, 0, 256, 256)
  return new CanvasTexture(c)
}

function Floor() {
  const pool = useMemo(glowTexture, [])
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[80, 80]} />
        {state.mobile ? (
          <meshStandardMaterial color="#0b0b0c" roughness={0.75} metalness={0.2} />
        ) : (
          <MeshReflectorMaterial
            color="#0a0a0b"
            roughness={0.85}
            metalness={0.4}
            mirror={0.4}
            blur={[400, 120]}
            resolution={512}
            mixBlur={1.2}
            mixStrength={2.2}
            depthScale={0.6}
            minDepthThreshold={0.4}
            maxDepthThreshold={1.3}
          />
        )}
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.003, 0]}>
        <planeGeometry args={[7, 7]} />
        <meshBasicMaterial map={pool} transparent blending={AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  )
}

/* Dust motes: a single Points draw, brighter inside the beams. */
function Dust({ count }) {
  const ref = useRef()
  const { positions, seeds } = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 12
      positions[i * 3 + 1] = Math.random() * 5.5
      positions[i * 3 + 2] = (Math.random() - 0.5) * 12
      seeds[i] = Math.random()
    }
    return { positions, seeds }
  }, [count])
  const uniforms = useMemo(
    () => ({ uTime: { value: 0 }, uEnergy: { value: 0 }, uScroll: { value: 0 }, uPixel: { value: 1 } }),
    [],
  )
  useFrame(({ clock, gl }, dt) => {
    uniforms.uTime.value = clock.elapsedTime
    uniforms.uScroll.value = state.progress
    uniforms.uPixel.value = gl.getPixelRatio()
    const social = window4(state.progress, 0.62, 0.69, 0.8, 0.86)
    uniforms.uEnergy.value = damp(uniforms.uEnergy.value, social, 3, dt)
  })
  return (
    <points ref={ref} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSeed" args={[seeds, 1]} />
      </bufferGeometry>
      <shaderMaterial
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
        uniforms={uniforms}
        vertexShader={/* glsl */ `
          uniform float uTime, uEnergy, uScroll, uPixel;
          attribute float aSeed;
          varying float vAlpha;
          void main() {
            vec3 p = position;
            float speed = 0.05 + uEnergy * 0.35;
            p.y = mod(p.y + uTime * speed * (0.4 + aSeed) + uScroll * 3.0 * aSeed, 5.5);
            p.x += sin(uTime * 0.2 + aSeed * 40.0) * 0.35 + sin(uScroll * 6.28 + aSeed * 9.0) * uEnergy * 0.6;
            p.z += cos(uTime * 0.17 + aSeed * 30.0) * 0.35;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            float beam = smoothstep(2.6, 0.2, length(p.xz));
            vAlpha = (0.15 + 0.85 * beam) * (0.35 + 0.65 * aSeed) * (1.0 + uEnergy);
            gl_PointSize = (1.4 + aSeed * 3.0) * uPixel * (7.0 / -mv.z);
          }`}
        fragmentShader={/* glsl */ `
          varying float vAlpha;
          void main() {
            float d = length(gl_PointCoord - 0.5);
            float a = smoothstep(0.5, 0.0, d) * vAlpha * 0.55;
            gl_FragColor = vec4(1.0, 0.86, 0.7, a);
          }`}
      />
    </points>
  )
}

/* The giant name the figure stands in front of. */
function HeroName() {
  const ref = useRef()
  useFrame(() => {
    const p = state.progress
    const out = ease(p, 0.06, 0.16)
    if (!ref.current) return
    ref.current.visible = out < 1
    ref.current.position.set(0, 1.62 + out * 1.2, -3 - out * 2)
    ref.current.fillOpacity = 1 - out
  })
  return (
    <Text
      ref={ref}
      font="/fonts/inter-tight-600.ttf"
      fontSize={1.55}
      letterSpacing={-0.045}
      color="#8b8378"
      anchorX="center"
      anchorY="middle"
      material-toneMapped={false}
      material-transparent
    >
      {meta.name.toUpperCase()}
    </Text>
  )
}

export default function Stage() {
  const key = useRef()
  const keyTarget = useMemo(() => new Object3D(), [])
  const rimA = useRef()
  const rimB = useRef()
  const fill = useRef()
  const beam = useRef()
  const scratch = useMemo(
    () => ({ c1: new Color('#8da8ff'), c2: new Color('#ff9f5a'), violet: new Color('#8a6cff'), rimCol: new Color(), pk: { x: 0, y: 0 } }),
    [],
  )

  useFrame(({ clock }, dt) => {
    const p = state.progress
    const t = clock.elapsedTime
    // Key light pans with the cursor.
    scratch.pk.x = damp(scratch.pk.x, state.pointer.x, 2, dt)
    scratch.pk.y = damp(scratch.pk.y, state.pointer.y, 2, dt)
    key.current.position.set(2.4 + scratch.pk.x * 1.6, 5 + scratch.pk.y * 0.8, 3.4)
    keyTarget.position.set(scratch.pk.x * 0.35, 1.1 + scratch.pk.y * 0.2, 0)
    keyTarget.updateMatrixWorld()
    const contact = ease(p, 0.84, 0.95)
    key.current.intensity = 120 * (1 - 0.55 * contact)

    // Chapter colour: violet cast over the edit, pulsing brand hues for the
    // audience, a single hard top-light for the ending.
    const edit = window4(p, 0.43, 0.49, 0.6, 0.66)
    const social = window4(p, 0.63, 0.69, 0.8, 0.86)
    fill.current.color.copy(scratch.c1).lerp(scratch.violet, edit)
    fill.current.intensity = 14 + edit * 30 + social * 10
    scratch.rimCol.setHSL((t * 0.05) % 1, 0.6, 0.55)
    rimA.current.color.copy(scratch.c2).lerp(scratch.rimCol, social * 0.8)
    rimA.current.intensity = 22 + social * 25 + Math.sin(t * 2) * 4 * social
    rimB.current.intensity = 12 + social * 18
    if (beam.current) beam.current.intensity = 60 + contact * 80
  })

  return (
    <>
      <color attach="background" args={['#050505']} />
      <fog attach="fog" args={['#050505', 9, 24]} />
      <hemisphereLight args={['#2b2a28', '#050505', 0.25]} />

      <primitive object={keyTarget} />
      <spotLight
        ref={key}
        target={keyTarget}
        color="#ffe2c2"
        angle={0.42}
        penumbra={1}
        decay={2}
        distance={20}
        castShadow
        shadow-mapSize={state.mobile ? 512 : 1024}
        shadow-bias={-0.0002}
        shadow-normalBias={0.02}
      />
      <pointLight ref={rimA} position={[-3, 2.6, -2.5]} decay={2} distance={12} color="#ff9f5a" />
      <pointLight ref={rimB} position={[3, 3, -2]} decay={2} distance={12} color="#8da8ff" />
      <pointLight ref={fill} position={[0, 3, -1.2]} decay={2} distance={9} />

      {/* volumetric top-light */}
      <SpotLight
        ref={beam}
        position={[0, 6.2, 0.2]}
        target-position={[0, 0, 0]}
        color="#ffd9ad"
        angle={0.32}
        penumbra={0.9}
        distance={9}
        attenuation={7.5}
        anglePower={4.5}
        radiusTop={0.05}
        radiusBottom={1.9}
        opacity={0.22}
        volumetric
      />
      <SpotLight
        position={[-3.5, 5.5, -3]}
        color="#b7c4ff"
        angle={0.25}
        distance={10}
        attenuation={8}
        anglePower={5}
        radiusBottom={1.6}
        opacity={0.18}
        intensity={0}
        volumetric
      />

      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.5} color="#fff1e0" position={[3, 3, 3]} scale={[4, 2, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1} color="#9fb3ff" position={[-4, 2, -2]} scale={[3, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="ring" intensity={1.5} color="#ffd2a0" position={[0, 5, 0]} scale={2} target={[0, 0, 0]} />
      </Environment>

      <Floor />
      <Dust count={state.mobile ? 450 : 1400} />
      <HeroName />
    </>
  )
}
