'use client'

import { Canvas, useFrame } from '@react-three/fiber'
import { Float, Line, OrbitControls, Sparkles } from '@react-three/drei'
import { useRef } from 'react'
import * as THREE from 'three'

const COLORS = {
  signal: '#8b7cff',
  insight: '#9b7cff',
  creator: '#ffb45c',
  live: '#55d6ff',
  white: '#f7f7f5',
}

function IntelligenceCore() {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  const glow = useRef<THREE.Mesh>(null)

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    if (group.current) {
      group.current.rotation.y += delta * 0.1
      group.current.rotation.x = Math.sin(time * 0.3) * 0.07
    }

    if (inner.current) {
      const scale = 1 + Math.sin(time * 1.8) * 0.035
      inner.current.scale.setScalar(scale)
    }

    if (glow.current) {
      const scale = 1 + Math.sin(time * 1.25) * 0.06
      glow.current.scale.setScalar(scale)
    }
  })

  const nodes = [
    {
      position: [-2.4, 1.2, 0.4] as const,
      color: COLORS.insight,
    },
    {
      position: [2.3, 1.0, -0.5] as const,
      color: COLORS.creator,
    },
    {
      position: [-2.1, -1.2, -0.4] as const,
      color: COLORS.live,
    },
    {
      position: [2.2, -1.3, 0.5] as const,
      color: COLORS.signal,
    },
    {
      position: [0, 2.1, 0] as const,
      color: COLORS.white,
    },
    {
      position: [0, -2.1, 0] as const,
      color: COLORS.signal,
    },
  ]

  return (
    <group ref={group}>
      {/* Central intelligence lattice */}
      <mesh ref={inner}>
        <icosahedronGeometry args={[0.72, 3]} />
        <meshStandardMaterial
          color={COLORS.white}
          emissive={COLORS.signal}
          emissiveIntensity={0.3}
          metalness={0.85}
          roughness={0.18}
          wireframe
        />
      </mesh>

      {/* Inner intelligence field */}
      <mesh scale={0.48}>
        <icosahedronGeometry args={[1, 2]} />
        <meshStandardMaterial
          color={COLORS.signal}
          emissive={COLORS.signal}
          emissiveIntensity={1.7}
          transparent
          opacity={0.2}
          metalness={0.45}
          roughness={0.08}
        />
      </mesh>

      {/* Core energy */}
      <mesh ref={glow} scale={0.25}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color={COLORS.signal}
          transparent
          opacity={0.16}
        />
      </mesh>

      {/* Primary orbit */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.15, 0.012, 16, 128]} />
        <meshBasicMaterial
          color={COLORS.signal}
          transparent
          opacity={0.5}
        />
      </mesh>

      {/* Secondary orbit */}
      <mesh rotation={[0.4, 0.8, 0.2]}>
        <torusGeometry args={[1.45, 0.008, 12, 128]} />
        <meshBasicMaterial
          color={COLORS.white}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Signal nodes */}
      {nodes.map(({ position, color }, index) => (
        <group key={index}>
          <Float
            speed={1 + index * 0.12}
            rotationIntensity={0.35}
            floatIntensity={0.5}
          >
            <mesh position={position}>
              <sphereGeometry args={[0.065, 18, 18]} />
              <meshStandardMaterial
                color={color}
                emissive={color}
                emissiveIntensity={1.6}
                metalness={0.2}
                roughness={0.15}
              />
            </mesh>
          </Float>

          <Line
            points={[
              [0, 0, 0],
              position,
            ]}
            color={color}
            transparent
            opacity={0.16}
            lineWidth={0.8}
          />
        </group>
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      <ambientLight intensity={0.28} />

      <pointLight
        position={[0, 0, 3]}
        intensity={15}
        distance={8}
        color="#ffffff"
      />

      <pointLight
        position={[-4, 3, 2]}
        intensity={5}
        distance={10}
        color={COLORS.signal}
      />

      <pointLight
        position={[4, -2, 1]}
        intensity={3}
        distance={8}
        color={COLORS.live}
      />

      <IntelligenceCore />

      <Sparkles
        count={110}
        scale={[7, 5, 5]}
        size={1}
        speed={0.16}
        opacity={0.3}
        color="#ffffff"
      />

      <OrbitControls
        enableZoom={false}
        enablePan={false}
        autoRotate
        autoRotateSpeed={0.2}
        minPolarAngle={Math.PI / 2.7}
        maxPolarAngle={Math.PI / 1.7}
      />
    </>
  )
}

export function VidinDimensionalCore() {
  return (
    <div className="relative h-[560px] w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#08090c] signal-glow">
      <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(circle_at_center,rgba(139,124,255,0.09),transparent_45%)]" />

      <Canvas
        camera={{
          position: [0, 0, 5.2],
          fov: 42,
        }}
        dpr={[1, 1.5]}
      >
        <Scene />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center pb-7">
        <div className="rounded-full border border-white/10 bg-black/40 px-4 py-2 backdrop-blur-md">
          <span className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">
            Vidin Intelligence Core · Signal Processing
          </span>
        </div>
      </div>
    </div>
  )
}
