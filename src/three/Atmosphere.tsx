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
 *
 * This layer sits INSIDE whichever hall is being shown — the real
 * `undifined.glb` or the procedural one — so both get the same
 * enchanted feel.
 *
 * EVERYTHING HERE IS LAID OUT AGAINST THE HALL'S REAL SIZE
 *   The candles, the stars and the motes are positioned from the hall's
 *   measured dimensions (`HallFeatures`), not from hard-coded numbers.
 *   The real model is 20.2 wide and 17.4 tall; candles placed against the
 *   procedural hall's 34 × 22 would hang outside the stone walls.
 *
 * The candles are the expensive part, so their count is passed in from the
 * quality tier.
 */

// ─── Floating candles ──────────────────────────────────────────────────────

interface CandlesProps {
  count: number
  features: HallFeatures
}

export function FloatingCandles({ count, features }: CandlesProps) {
  const flames = useRef<THREE.InstancedMesh>(null)
  const { bounds } = features

  /**
   * Each candle gets a stable random position and a slow bobbing phase.
   *
   * The candles are distributed on a LATTICE through the hall's volume, not
   * on a single plane. A naive `row * spacing` layout pushes the lowest
   * candles through the floor once the count grows, and a flat ceiling of
   * candles reads as a grid rather than as floating magic.
   */
  const candles = useMemo(() => {
    const out: { position: [number, number, number]; phase: number; speed: number }[] = []

    // Spread the candles over three bands of height, so they fill the
    // volume of the room the way they do in the film.
    const bands = 3
    const perBand = Math.ceil(count / bands)

    // The top band sits just under the vault; the lowest band hangs well
    // above the tables, so the candles never clip through the feast.
    const lowY = bounds.height - 3.5
    const highY = bounds.height - 9.5

    // Leave a margin from the walls so the candles are inside the room.
    const margin = 1.6

    for (let i = 0; i < count; i++) {
      const band = Math.floor(i / perBand)
      const indexInBand = i % perBand
      const countInBand = band === bands - 1 ? count - perBand * (bands - 1) : perBand

      // Evenly spaced columns and rows WITHIN the band, then jittered.
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
      })
    }
    return out
  }, [count, bounds])

  const dummy = useMemo(() => new THREE.Object3D(), [])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (!flames.current) return
    candles.forEach((c, i) => {
      const bob = Math.sin(t * c.speed + c.phase) * 0.16
      dummy.position.set(c.position[0], c.position[1] + bob, c.position[2])
      // Flames flicker slightly in scale.
      const flicker = 1 + Math.sin(t * 8 + c.phase * 3) * 0.09
      dummy.scale.set(flicker, flicker, flicker)
      dummy.updateMatrix()
      flames.current!.setMatrixAt(i, dummy.matrix)
    })
    flames.current.instanceMatrix.needsUpdate = true
  })

  const waxMaterial = getHallMaterials().candleWax

  return (
    <group>
      {candles.map((c, i) => (
        <mesh key={`candle-${i}`} position={c.position} material={waxMaterial}>
          <cylinderGeometry args={[0.09, 0.11, 0.55, 8]} />
        </mesh>
      ))}

      {/* Flames as one instanced mesh — far cheaper than one mesh per candle. */}
      <instancedMesh
        ref={flames}
        args={[undefined, undefined, count]}
        material={getHallMaterials().flame}
        frustumCulled={false}
      >
        <sphereGeometry args={[0.1, 6, 6]} />
      </instancedMesh>

      {/*
        The warm light the candles cast over the hall.

        Three lights spaced along the length of the hall, because a single
        point light in the middle leaves the far ends in near-darkness and
        the falloff makes the near end much brighter than the rest.
      */}
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
      <ambientLight intensity={0.55} color="#c8b8ff" />
      <hemisphereLight args={['#6a5a92', '#241c16', 0.85]} />
    </group>
  )
}

// ─── Enchanted ceiling ─────────────────────────────────────────────────────

export function EnchantedCeiling({ features }: { features: HallFeatures }) {
  const stars = useRef<THREE.Points>(null)
  const { bounds } = features

  const starPositions = useMemo(() => {
    const count = 900
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * bounds.width
      arr[i * 3 + 1] = Math.random() * bounds.height
      arr[i * 3 + 2] = (Math.random() - 0.5) * bounds.length
    }
    return arr
  }, [bounds])

  useFrame((state, delta) => {
    if (!stars.current) return
    stars.current.rotation.y += delta * 0.008
    stars.current.position.y = Math.sin(state.clock.elapsedTime * 0.2) * 0.3
  })

  return (
    <group>
      {/* Sky dome seen through the ceiling. */}
      <mesh position={[0, bounds.height + 8, 0]} material={getHallMaterials().sky}>
        <sphereGeometry args={[120, 16, 12]} />
      </mesh>

      {/* Drifting stars. */}
      <points ref={stars}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[starPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial
          size={0.24}
          color="#dfe9ff"
          sizeAttenuation
          transparent
          opacity={0.8}
          map={getDotTexture()}
          alphaTest={0.01}
          depthWrite={false}
        />
      </points>
    </group>
  )
}

// ─── Drifting motes ────────────────────────────────────────────────────────

export function Sparkles({ features }: { features: HallFeatures }) {
  const points = useRef<THREE.Points>(null)
  const { bounds } = features

  const positions = useMemo(() => {
    const count = 220
    const arr = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      arr[i * 3] = (Math.random() - 0.5) * bounds.width
      arr[i * 3 + 1] = Math.random() * bounds.height
      arr[i * 3 + 2] = (Math.random() - 0.5) * bounds.length
    }
    return arr
  }, [bounds])

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
        // Small and faint: these are dust in candlelight, not a snowstorm.
        // `sizeAttenuation` makes a mote close to the camera huge, so the
        // size has to stay small to survive being near the lens.
        size={0.12}
        color="#ffe9b8"
        transparent
        opacity={0.32}
        sizeAttenuation
        map={getDotTexture()}
        alphaTest={0.01}
        depthWrite={false}
      />
    </points>
  )
}
