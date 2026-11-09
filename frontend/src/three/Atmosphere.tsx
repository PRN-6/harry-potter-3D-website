import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getHallMaterials, getDotTexture, CANDLE_LIGHT } from './hallTheme'
import type { HallFeatures } from './hallBounds'

/**
 * THE ATMOSPHERE
 *
 * The magic that the 3D model cannot provide: floating candles, a starry
 * enchanted ceiling and dust drifting in the candlelight.
 */

// ─── Floating candles ──────────────────────────────────────────────────────

interface CandlesProps {
  count: number
  features: HallFeatures
}

export function FloatingCandles({ count, features }: CandlesProps) {
  const wax = useRef<THREE.InstancedMesh>(null)
  const flames = useRef<THREE.InstancedMesh>(null)
  const glows = useRef<THREE.InstancedMesh>(null)
  const { bounds } = features

  const candles = useMemo(() => {
    const out: {
      position: [number, number, number]
      phase: number
      speed: number
      scale: number
    }[] = []

    const bands = 3
    const perBand = Math.ceil(count / bands)

    const lowY = bounds.height - 3.5
    const highY = bounds.height - 9.5
    const margin = 1.6

    for (let i = 0; i < count; i++) {
      const band = Math.floor(i / perBand)
      const indexInBand = i % perBand
      const countInBand = band === bands - 1 ? count - perBand * (bands - 1) : perBand

      const columns = Math.max(1, Math.ceil(Math.sqrt(countInBand)))
      const col = indexInBand % columns
      const row = Math.floor(indexInBand / columns)
      const rows = Math.ceil(countInBand / columns)

      const x =
        -bounds.width / 2 + margin + (col + 0.5) * ((bounds.width - margin * 2) / columns)
      const z =
        -bounds.length / 2 + margin + (row + 0.5) * ((bounds.length - margin * 2) / rows)
      const y = highY + (band / Math.max(1, bands - 1)) * (lowY - highY)

      out.push({
        position: [
          x + (Math.random() - 0.5) * 1.2,
          y + (Math.random() - 0.5) * 0.9,
          z + (Math.random() - 0.5) * 1.2,
        ],
        phase: Math.random() * Math.PI * 2,
        speed: 0.35 + Math.random() * 0.4,
        scale: 0.75 + Math.random() * 0.5,
      })
    }
    return out
  }, [count, bounds])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cameraMatrix = useMemo(() => new THREE.Matrix4(), [])
  const cameraRotation = useMemo(() => new THREE.Quaternion(), [])
  const materials = getHallMaterials()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const waxMesh = wax.current
    const flameMesh = flames.current
    const glowMesh = glows.current
    if (!flameMesh) return

    cameraMatrix.copy(state.camera.matrixWorld)
    // Extract camera rotation ONCE per frame instead of 300 times in the loop
    cameraRotation.setFromRotationMatrix(cameraMatrix)

    for (let i = 0; i < candles.length; i++) {
      const c = candles[i]
      const bob = Math.sin(t * c.speed + c.phase) * 0.16
      const flicker = 1 + Math.sin(t * 8 + c.phase * 3) * 0.09

      // The wax stub
      if (waxMesh) {
        dummy.position.set(c.position[0], c.position[1] + bob, c.position[2])
        dummy.quaternion.identity()
        dummy.scale.set(c.scale, c.scale, c.scale)
        dummy.updateMatrix()
        waxMesh.setMatrixAt(i, dummy.matrix)
      }

      // The flame: billboard facing camera
      dummy.position.set(c.position[0], c.position[1] + bob + 0.11, c.position[2])
      dummy.quaternion.copy(cameraRotation)
      dummy.scale.set(0.09 * c.scale * flicker, 0.13 * c.scale * flicker, 1)
      dummy.updateMatrix()
      flameMesh.setMatrixAt(i, dummy.matrix)

      // The halo around the flame
      if (glowMesh) {
        const pulse = 1 + Math.sin(t * c.speed * 2.2 + c.phase) * 0.14
        const g = 0.3 * c.scale * pulse
        dummy.position.set(c.position[0], c.position[1] + bob + 0.12, c.position[2])
        dummy.scale.set(g, g, g)
        dummy.quaternion.copy(cameraRotation)
        dummy.updateMatrix()
        glowMesh.setMatrixAt(i, dummy.matrix)
      }
    }

    if (waxMesh) waxMesh.instanceMatrix.needsUpdate = true
    flameMesh.instanceMatrix.needsUpdate = true
    if (glowMesh) glowMesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <instancedMesh
        ref={wax}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleWax}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.028, 0.034, 0.16, 6]} />
      </instancedMesh>

      <instancedMesh
        ref={flames}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleFlame}
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

      <instancedMesh
        ref={glows}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleGlow}
        frustumCulled={false}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

      {[-bounds.length * 0.3, 0, bounds.length * 0.3].map((z) => (
        <pointLight
          key={`candle-light-${z}`}
          position={[0, bounds.height - 3, z]}
          intensity={70}
          distance={46}
          decay={1.3}
          color={CANDLE_LIGHT}
        />
      ))}

      <ambientLight intensity={0.16} color="#5a3f2e" />
      <hemisphereLight args={['#3b3a63', '#2a1c12', 0.32]} />
    </group>
  )
}

// ─── Enchanted ceiling ─────────────────────────────────────────────────────

export function EnchantedCeiling({
  features,
  lowPower = false,
}: {
  features: HallFeatures
  lowPower?: boolean
}) {
  const stars = useRef<THREE.Points>(null)
  const { bounds } = features

  const starPositions = useMemo(() => {
    const count = lowPower ? 350 : 700
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * bounds.width
      arr[i * 3 + 1] = Math.random() * bounds.height
      arr[i * 3 + 2] = (Math.random() - 0.5) * bounds.length
    }
    return arr
  }, [bounds, lowPower])

  useFrame((state, delta) => {
    if (!stars.current) return
    stars.current.rotation.y += delta * 0.008
    stars.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3
  })

  return (
    <group>
      <mesh position={[0, bounds.height + 8, 0]} material={getHallMaterials().sky}>
        <sphereGeometry args={[120, 16, 12]} />
      </mesh>

      <points ref={stars}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.09}
          color="#dfe9ff"
          sizeAttenuation
          transparent
          opacity={0.55}
          map={getDotTexture()}
          alphaTest={0.01}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─── Drifting motes ────────────────────────────────────────────────────────

export function Sparkles({
  features,
  lowPower = false,
}: {
  features: HallFeatures
  lowPower?: boolean
}) {
  const points = useRef<THREE.Points>(null)
  const { bounds } = features

  const positions = useMemo(() => {
    const count = lowPower ? 75 : 180
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * bounds.width
      arr[i * 3 + 1] = Math.random() * bounds.height
      arr[i * 3 + 2] = (Math.random() - 0.5) * bounds.length
    }
    return arr
  }, [bounds, lowPower])

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y = state.clock.elapsedTime * 0.015
    }
  })

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        size={0.045}
        color="#ffd9a0"
        transparent
        opacity={0.22}
        sizeAttenuation
        map={getDotTexture()}
        alphaTest={0.01}
        depthWrite={false}
      />
    </points>
  )
}
