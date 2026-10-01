'use client'

import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, Line, Sparkles } from '@react-three/drei'
import { useMemo, useRef } from 'react'
import * as THREE from 'three'

const COLORS = {
  white: '#ffffff',
  silver: '#c5cad6',
  signal: '#a99cff',
  insight: '#b59cff',
  creator: '#ffc66d',
  live: '#72ddff',
}

type NodeData = {
  position: [number, number, number]
  size: number
  color: string
  phase: number
}

function IntelligenceField() {
  const group = useRef<THREE.Group>(null)
  const signalGroup = useRef<THREE.Group>(null)

  const { pointer } = useThree()

  const nodes = useMemo<NodeData[]>(() => {
    const result: NodeData[] = []

    const colors = [
      COLORS.white,
      COLORS.silver,
      COLORS.signal,
      COLORS.insight,
      COLORS.creator,
      COLORS.live,
    ]

    for (let i = 0; i < 72; i++) {
      const angle = (i / 72) * Math.PI * 2
      const radius = 1.8 + Math.sin(i * 1.7) * 0.55

      result.push({
        position: [
          Math.cos(angle) * radius + Math.sin(i * 0.8) * 0.7,
          Math.sin(angle) * radius * 0.58 + Math.cos(i * 1.4) * 0.45,
          Math.sin(i * 0.9) * 1.25,
        ],
        size: 0.018 + (i % 5) * 0.006,
        color: colors[i % colors.length],
        phase: i * 0.37,
      })
    }

    return result
  }, [])

  const connections = useMemo(() => {
    const result: [number, number][] = []

    for (let i = 0; i < nodes.length; i++) {
      const distances = nodes
        .map((node, index) => {
          if (index === i) return { index, distance: Infinity }

          const a = new THREE.Vector3(...nodes[i].position)
          const b = new THREE.Vector3(...node.position)

          return {
            index,
            distance: a.distanceTo(b),
          }
        })
        .sort((a, b) => a.distance - b.distance)

      distances.slice(0, 2).forEach(({ index }) => {
        const exists = result.some(
          ([a, b]) => (a === i && b === index) || (a === index && b === i),
        )

        if (!exists) {
          result.push([i, index])
        }
      })
    }

    return result
  }, [nodes])

  useFrame((state, delta) => {
    const time = state.clock.elapsedTime

    if (group.current) {
      group.current.rotation.y += delta * 0.025

      group.current.rotation.x +=
        (pointer.y * 0.055 - group.current.rotation.x) * 0.02

      group.current.rotation.z +=
        (-pointer.x * 0.035 - group.current.rotation.z) * 0.02
    }

    if (signalGroup.current) {
      signalGroup.current.position.x =
        Math.sin(time * 0.35) * 0.16 + pointer.x * 0.08

      signalGroup.current.position.y =
        Math.cos(time * 0.28) * 0.1 + pointer.y * 0.05
    }
  })

  return (
    <group ref={group} scale={1.15}>
      {/* Monumental color architecture */}
      <group position={[0, 0, -4.2]}>
        {/* Main violet wall */}
        <mesh position={[-1.8, 0.4, 0]} rotation={[0, 0, -0.035]}>
          <planeGeometry args={[11, 8]} />
          <meshBasicMaterial
            color={COLORS.signal}
            transparent
            opacity={0.16}
          />
        </mesh>

        {/* Inner violet depth layer */}
        <mesh position={[-1.2, 0.2, 0.12]} rotation={[0, 0, -0.025]}>
          <planeGeometry args={[8.5, 6.5]} />
          <meshBasicMaterial
            color={COLORS.insight}
            transparent
            opacity={0.10}
          />
        </mesh>

        {/* Cyan architectural wall */}
        <mesh position={[4.6, 0.7, -0.5]} rotation={[0, 0.045, 0.06]}>
          <planeGeometry args={[7, 9]} />
          <meshBasicMaterial
            color={COLORS.live}
            transparent
            opacity={0.105}
          />
        </mesh>

        {/* Amber distant wall */}
        <mesh position={[1.8, -2.2, -1]} rotation={[0, -0.04, -0.04]}>
          <planeGeometry args={[9, 4.5]} />
          <meshBasicMaterial
            color={COLORS.creator}
            transparent
            opacity={0.075}
          />
        </mesh>

        {/* Architectural vertical divisions */}
        {[-5.2, -3.7, -2.2, -0.7, 0.8, 2.3, 3.8, 5.3].map(
          (x, index) => (
            <mesh
              key={`wall-column-${index}`}
              position={[x, 0, 0.22]}
            >
              <boxGeometry args={[0.018, 7.2, 0.035]} />
              <meshBasicMaterial
                color={
                  index % 3 === 0
                    ? COLORS.signal
                    : index % 3 === 1
                      ? COLORS.live
                      : COLORS.white
                }
                transparent
                opacity={0.16}
              />
            </mesh>
          ),
        )}

        {/* Horizontal monumental divisions */}
        {[-2.5, -1.25, 0, 1.25, 2.5].map(
          (y, index) => (
            <mesh
              key={`wall-line-${index}`}
              position={[0, y, 0.24]}
            >
              <boxGeometry args={[11.5, 0.012, 0.035]} />
              <meshBasicMaterial
                color={
                  index % 2 === 0
                    ? COLORS.signal
                    : COLORS.white
                }
                transparent
                opacity={0.11}
              />
            </mesh>
          ),
        )}
      </group>

      {/* Living information architecture */}
      <group>
        {connections.map(([from, to], index) => (
          <Line
            key={`connection-${index}`}
            points={[nodes[from].position, nodes[to].position]}
            color={index % 7 === 0 ? COLORS.signal : COLORS.white}
            transparent
            opacity={index % 7 === 0 ? 0.19 : 0.055}
            lineWidth={index % 7 === 0 ? 1.1 : 0.45}
          />
        ))}
      </group>

      {/* Living information points */}
      {nodes.map((node, index) => (
        <Float
          key={`node-${index}`}
          speed={0.35 + (index % 4) * 0.12}
          rotationIntensity={0.12}
          floatIntensity={0.18}
        >
          <mesh position={node.position}>
            <sphereGeometry args={[node.size, 10, 10]} />
            <meshBasicMaterial
              color={node.color}
              transparent
              opacity={0.75}
            />
          </mesh>
        </Float>
      ))}

      {/* Central intelligence */}
      <group ref={signalGroup}>
        <mesh>
          <icosahedronGeometry args={[0.62, 3]} />
          <meshStandardMaterial
            color={COLORS.white}
            emissive={COLORS.signal}
            emissiveIntensity={0.55}
            metalness={0.95}
            roughness={0.16}
            wireframe
          />
        </mesh>

        <mesh scale={0.58}>
          <icosahedronGeometry args={[0.8, 2]} />
          <meshBasicMaterial
            color={COLORS.signal}
            transparent
            opacity={0.07}
            wireframe
          />
        </mesh>

        <mesh scale={0.22}>
          <sphereGeometry args={[1, 32, 32]} />
          <meshBasicMaterial
            color={COLORS.signal}
            transparent
            opacity={0.24}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.006, 12, 128]} />
          <meshBasicMaterial
            color={COLORS.signal}
            transparent
            opacity={0.4}
          />
        </mesh>
      </group>
    </group>
  )
}

function SignalPaths() {
  const paths = [
    {
      color: COLORS.insight,
      points: [
        [-4.5, 1.6, -0.6],
        [-2.2, 0.9, -0.1],
        [0, 0, 0],
      ] as [number, number, number][],
    },
    {
      color: COLORS.creator,
      points: [
        [4.6, 1.1, -0.8],
        [2.4, 0.55, -0.2],
        [0, 0, 0],
      ] as [number, number, number][],
    },
    {
      color: COLORS.live,
      points: [
        [-4.2, -1.5, -0.4],
        [-2.1, -0.7, -0.1],
        [0, 0, 0],
      ] as [number, number, number][],
    },
  ]

  return (
    <group>
      {paths.map((path, index) => (
        <Line
          key={index}
          points={path.points}
          color={path.color}
          transparent
          opacity={0.22}
          lineWidth={0.8}
        />
      ))}
    </group>
  )
}

function Scene() {
  return (
    <>
      <color attach="background" args={['#08090c']} />

      <fog attach="fog" args={['#08090c', 4.5, 10]} />

      <ambientLight intensity={0.2} />

      <pointLight
        position={[0, 0, 3]}
        intensity={11}
        distance={7}
        color={COLORS.signal}
      />

      <pointLight
        position={[-4, 2, 1]}
        intensity={3}
        distance={7}
        color={COLORS.insight}
      />

      <pointLight
        position={[4, -2, 1]}
        intensity={2}
        distance={7}
        color={COLORS.live}
      />

      <IntelligenceField />

      <SignalPaths />

      <Sparkles
        count={180}
        scale={[10, 6, 6]}
        size={0.7}
        speed={0.08}
        opacity={0.22}
        color={COLORS.white}
      />
    </>
  )
}

export function VidinIntelligenceWorld() {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{
          position: [0, 0, 6.5],
          fov: 48,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
        }}
      >
        <Scene />
      </Canvas>

      {/* Cinematic atmospheric layers */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_18%,rgba(8,9,12,0.12)_48%,rgba(8,9,12,0.86)_100%)]" />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#08090c] via-[#08090c]/30 to-transparent" />

      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(255,255,255,0.8)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.8)_1px,transparent_1px)] [background-size:72px_72px]" />
    </div>
  )
}
