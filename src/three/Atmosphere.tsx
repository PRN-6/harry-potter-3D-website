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
 * `hogwarts_dining_hall_rigged.glb` or the procedural one — so both get
 * the same enchanted feel.
 *
 * EVERYTHING HERE IS LAID OUT AGAINST THE HALL'S REAL SIZE
 *   The candles, the stars and the motes are positioned from the hall's
 *   measured dimensions (`HallFeatures`), not from hard-coded numbers.
 *   The real model is 20.2 wide and 17.4 tall; candles placed against the
 *   procedural hall's 34 × 22 would hang outside the stone walls.
 *
 * THE CANDLES ARE SMALL ON PURPOSE
 *   A floating candle in the films is a thin stub of wax with a small
 *   flame on top — a couple of centimetres across. The earlier version
 *   drew them as half-metre white tubes with a white ball on the end,
 *   which read as floating PVC pipe rather than as magic. The wax here
 *   is barely wider than the flame, and the flame is a real teardrop.
 *
 * THE DUST IS DUST, NOT SNOW
 *   The motes are tiny, warm and slow. They are the size of a speck of
 *   plaster, and they only show up where the candlelight catches them.
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

  /**
   * Each candle gets a stable random position and a slow bobbing phase.
   *
   * The candles are distributed on a LATTICE through the hall's volume, not
   * on a single plane. A naive `row * spacing` layout pushes the lowest
   * candles through the floor once the count grows, and a flat ceiling of
   * candles reads as a grid rather than as floating magic.
   */
  const candles = useMemo(() => {
    const out: {
      position: [number, number, number]
      phase: number
      speed: number
      scale: number
    }[] = []

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
        // A little variation in size, so the swarm is not a regiment.
        scale: 0.75 + Math.random() * 0.5,
      })
    }
    return out
  }, [count, bounds])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const cameraMatrix = useMemo(() => new THREE.Matrix4(), [])
  const materials = getHallMaterials()

  useFrame((state) => {
    const t = state.clock.elapsedTime
    const waxMesh = wax.current
    const flameMesh = flames.current
    const glowMesh = glows.current
    if (!flameMesh) return

    cameraMatrix.copy(state.camera.matrixWorld)

    candles.forEach((c, i) => {
      const bob = Math.sin(t * c.speed + c.phase) * 0.16
      const flicker = 1 + Math.sin(t * 8 + c.phase * 3) * 0.09

      // The wax stub. It bobs with its flame, and it is the only part of
      // the candle that has any volume.
      if (waxMesh) {
        dummy.position.set(c.position[0], c.position[1] + bob, c.position[2])
        dummy.quaternion.identity()
        dummy.scale.set(c.scale, c.scale, c.scale)
        dummy.updateMatrix()
        waxMesh.setMatrixAt(i, dummy.matrix)
      }

      // The flame: a billboard, so it always shows its full shape.
      dummy.position.set(c.position[0], c.position[1] + bob + 0.11, c.position[2])
      dummy.quaternion.setFromRotationMatrix(cameraMatrix)
      dummy.scale.set(0.09 * c.scale * flicker, 0.13 * c.scale * flicker, 1)
      dummy.updateMatrix()
      flameMesh.setMatrixAt(i, dummy.matrix)

      // The halo around the flame, breathing on its own rhythm.
      if (glowMesh) {
        const pulse = 1 + Math.sin(t * c.speed * 2.2 + c.phase) * 0.14
        const g = 0.3 * c.scale * pulse
        dummy.position.set(c.position[0], c.position[1] + bob + 0.12, c.position[2])
        dummy.scale.set(g, g, g)
        dummy.quaternion.setFromRotationMatrix(cameraMatrix)
        dummy.updateMatrix()
        glowMesh.setMatrixAt(i, dummy.matrix)
      }
    })

    if (waxMesh) waxMesh.instanceMatrix.needsUpdate = true
    flameMesh.instanceMatrix.needsUpdate = true
    if (glowMesh) glowMesh.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      {/* The wax. A thin stub, instanced — one draw call for the whole
          swarm rather than one per candle. */}
      <instancedMesh
        ref={wax}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleWax}
        frustumCulled={false}
      >
        <cylinderGeometry args={[0.028, 0.034, 0.16, 6]} />
      </instancedMesh>

      {/* The flames — one instanced mesh for the whole hall. */}
      <instancedMesh
        ref={flames}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleFlame}
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

      {/* The soft halo that makes the flame read as light. */}
      <instancedMesh
        ref={glows}
        args={[undefined, undefined, Math.max(1, count)]}
        material={materials.candleGlow}
        frustumCulled={false}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
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

      {/*
        THE AMBIENT LIGHT
 *
 *   This is the single most important number in the whole scene, and it
 *   is deliberately LOW.
 *
 *   A hall lit by a thousand candles is NOT a bright room. It is a dark
 *   room with a thousand small bright points in it. The eye adapts to
 *   the bright points and the stone between them falls away into warm
 *   shadow. That contrast — the pools of light and the dark between them
 *   — is what makes a candlelit hall feel like a candlelit hall.
 *
 *   The earlier version used a strong ambient plus a strong hemisphere
 *   light, which flooded every surface with flat, shadowless fill. It
 *   looked like a photo of a set with the lights on. Dropping both
 *   right down lets the fires, the sconces and the candle swarms do the
 *   work, and the stonework finally has depth.
 *
 *   The ambient is not zero: a little warm fill keeps the deepest
 *   shadows from crushing to pure black, which is what a real room
 *   full of firelight does — the shadows are warm, not empty.
 */}
      <ambientLight intensity={0.16} color="#5a3f2e" />

      {/* A dim cool sky fill from the enchanted ceiling above, so the
          top of the vault is not the same value as the floor. */}
      <hemisphereLight args={['#3b3a63', '#2a1c12', 0.32]} />
    </group>
  )
}

// ─── Enchanted ceiling ─────────────────────────────────────────────────────

export function EnchantedCeiling({ features }: { features: HallFeatures }) {
  const stars = useRef<THREE.Points>(null)
  const { bounds } = features

  const starPositions = useMemo(() => {
    const count = 700
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

export function Sparkles({ features }: { features: HallFeatures }) {
  const points = useRef<THREE.Points>(null)
  const { bounds } = features

  const positions = useMemo(() => {
    const count = 180
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
