'use client'

import { Float, Line, Sparkles } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const COLORS = {
  violet: '#9b7cff',
  violetBright: '#c2b5ff',
  blue: '#667cff',
  cyan: '#62dcff',
  white: '#ffffff',
  silver: '#cbd2ff',
  amber: '#ffc06a',
  deep: '#21174f',
}

type Signal = {
  position: [number, number, number]
  target: [number, number, number]
  color: string
  size: number
}

function EngineCore() {
  const core = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!core.current) return

    const time = state.clock.elapsedTime

    core.current.rotation.y += delta * 0.12
    core.current.rotation.x =
      Math.sin(time * 0.18) * 0.08
  })

  return (
    <group ref={core}>
      {/* Inner intelligence core */}
      <mesh>
        <icosahedronGeometry args={[0.82, 3]} />
        <meshStandardMaterial
          color={COLORS.white}
          emissive={COLORS.violet}
          emissiveIntensity={1.1}
          metalness={0.9}
          roughness={0.12}
          wireframe
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Energy heart */}
      <mesh scale={0.38}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={COLORS.cyan}
          transparent
          opacity={0.6}
        />
      </mesh>

      {/* Engine rings */}
      {[1.25, 1.65, 2.05].map((radius, index) => (
        <mesh
          key={radius}
          rotation={[
            Math.PI / 2 + index * 0.35,
            index * 0.25,
            index * 0.5,
          ]}
        >
          <torusGeometry
            args={[radius, 0.009, 10, 180]}
          />
          <meshBasicMaterial
            color={
              index === 1
                ? COLORS.cyan
                : COLORS.violetBright
            }
            transparent
            opacity={0.34 - index * 0.06}
          />
        </mesh>
      ))}
    </group>
  )
}

function EngineArchitecture() {
  const architecture = useRef<THREE.Group>(null)

  useFrame((state, delta) => {
    if (!architecture.current) return

    architecture.current.rotation.y -= delta * 0.018
  })

  return (
    <group ref={architecture}>
      {/* Monumental outer rings */}
      {[3.4, 4.6, 5.8].map((radius, index) => (
        <mesh
          key={radius}
          rotation={[
            Math.PI / 2.1,
            index * 0.22,
            index * 0.4,
          ]}
        >
          <torusGeometry
            args={[radius, 0.015, 12, 220]}
          />
          <meshBasicMaterial
            color={
              index === 1
                ? COLORS.blue
                : COLORS.violet
            }
            transparent
            opacity={
              index === 1
                ? 0.22
                : 0.12
            }
          />
        </mesh>
      ))}

      {/* Vertical engine architecture */}
      {Array.from({ length: 14 }).map((_, index) => {
        const angle =
          (index / 14) * Math.PI * 2

        const radius = 4.7

        return (
          <mesh
            key={index}
            position={[
              Math.cos(angle) * radius,
              Math.sin(index * 0.8) * 1.1,
              Math.sin(angle) * radius,
            ]}
            rotation={[0, -angle, 0]}
          >
            <boxGeometry
              args={[
                index % 3 === 0 ? 0.035 : 0.018,
                3.2 + (index % 4) * 0.7,
                0.035,
              ]}
            />
            <meshBasicMaterial
              color={
                index % 4 === 0
                  ? COLORS.cyan
                  : COLORS.white
              }
              transparent
              opacity={
                index % 4 === 0
                  ? 0.22
                  : 0.08
              }
            />
          </mesh>
        )
      })}
    </group>
  )
}

function SignalField() {
  const { pointer } = useThree()
  const group = useRef<THREE.Group>(null)

  const signals = useMemo<Signal[]>(() => {
    const colors = [
      COLORS.violet,
      COLORS.cyan,
      COLORS.blue,
      COLORS.amber,
      COLORS.silver,
    ]

    return Array.from({ length: 70 }, (_, index) => {
      const angle =
        index * 2.39996

      const radius =
        4.8 + (index % 6) * 0.55

      const x =
        Math.cos(angle) * radius

      const y =
        Math.sin(index * 0.43) * 3.2

      const z =
        Math.sin(angle) * radius

      return {
        position: [x, y, z],
        target: [
          x * 0.08,
          y * 0.08,
          z * 0.08,
        ],
        color: colors[index % colors.length],
        size:
          0.025 +
          (index % 4) * 0.012,
      }
    })
  }, [])

  useFrame((state) => {
    if (!group.current) return

    const time = state.clock.elapsedTime

    group.current.rotation.y =
      time * 0.018 + pointer.x * 0.035

    group.current.rotation.x =
      Math.sin(time * 0.12) * 0.025 -
      pointer.y * 0.025
  })

  return (
    <group ref={group}>
      {signals.map((signal, index) => (
        <Float
          key={index}
          speed={0.15 + (index % 5) * 0.04}
          floatIntensity={0.18}
          rotationIntensity={0.04}
        >
          <mesh position={signal.position}>
            <sphereGeometry
              args={[signal.size, 8, 8]}
            />
            <meshBasicMaterial
              color={signal.color}
              transparent
              opacity={0.7}
            />
          </mesh>
        </Float>
      ))}

      {/* Incoming signal pathways */}
      {signals.slice(0, 18).map((signal, index) => (
        <Line
          key={`signal-${index}`}
          points={[
            signal.position,
            signal.target,
          ]}
          color={signal.color}
          transparent
          opacity={0.11}
          lineWidth={0.5}
        />
      ))}
    </group>
  )
}

function MovingAtmosphere() {
  const light = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!light.current) return

    const time = state.clock.elapsedTime

    light.current.position.x =
      Math.sin(time * 0.17) * 5

    light.current.position.y =
      Math.cos(time * 0.13) * 3

    light.current.position.z =
      3 +
      Math.sin(time * 0.11) * 2
  })

  return (
    <pointLight
      ref={light}
      position={[0, 0, 4]}
      intensity={12}
      distance={16}
      color={COLORS.violet}
    />
  )
}

function Scene() {
  return (
    <>
      <color
        attach="background"
        args={['#17112f']}
      />

      <fog
        attach="fog"
        args={['#17112f', 7, 22]}
      />

      <ambientLight intensity={0.65} />

      <MovingAtmosphere />

      <pointLight
        position={[-5, 2, 2]}
        intensity={5}
        distance={12}
        color={COLORS.cyan}
      />

      <pointLight
        position={[5, -2, -2]}
        intensity={4}
        distance={12}
        color={COLORS.amber}
      />

      <EngineArchitecture />

      <SignalField />

      <EngineCore />

      <Sparkles
        count={320}
        scale={[15, 10, 15]}
        size={0.7}
        speed={0.08}
        opacity={0.2}
        color={COLORS.white}
      />
    </>
  )
}

export function VidinSystemWorld() {
  return (
    <div className="absolute inset-0">
      <Canvas
        className="absolute inset-0 !block !h-full !w-full"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          display: 'block',
        }}
        camera={{
          position: [0, 0, 10],
          fov: 48,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
      >
        <Scene />
      </Canvas>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,transparent_8%,rgba(48,30,110,0.08)_42%,rgba(17,10,48,0.55)_100%)]" />

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_bottom,rgba(32,20,76,0.18),transparent_25%,transparent_72%,rgba(17,10,48,0.72))]" />
    </div>
  )
}
