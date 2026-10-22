import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getHallMaterials } from './hallTheme'
import type { FirePoint } from './firePoints'

/**
 * THE FIRES
 *
 * The Great Hall model has four kinds of fire in it, and none of them are
 * animated — the fireplace is a bed of painted coals, the wall sconces hold
 * bare candles, and the table candles have a flat painted flame sprite on
 * top. This layer puts the fire back: a live flame on every one of them.
 *
 * HOW A FLAME IS DRAWN
 *   Each flame is a BILLBOARD — a textured quad that always faces the
 *   camera. A real 3D flame shape would vanish edge-on as the visitor
 *   walks past it, which reads as a flickering gap; a billboard always
 *   presents its full shape.
 *
 *   The texture is drawn on a canvas as a teardrop with a soft, hot core
 *   and a cooler, translucent edge, so it does not need a download.
 *
 * THE ANIMATION
 *   Every flame gets its own phase and speed, so they do not pulse in
 *   unison — which is the single thing that makes a fake fire look fake.
 *   Three things move: the flame scales vertically (it stretches and
 *   settles), it leans slightly (a draught), and its brightness flickers.
 *
 * THE LIGHT
 *   The big fires get real point lights; the many small candles are lit by
 *   the hall's general candlelight instead, because a hall with thirty
 *   point lights would cost more than the whole rest of the scene.
 *
 * PERFORMANCE
 *   The flames are one InstancedMesh for the whole hall, so thirty-seven
 *   fires cost two draw calls, not thirty-seven. The per-fire colour rides
 *   on the instance colour attribute, so a brazier is gold-hot and a
 *   table candle is pale without needing a second material.
 */

/** How each kind of fire is coloured and lit. */
const KIND_LOOK = {
  // The great fireplace: a wide, roaring, orange fire.
  fireplace: { flame: '#ff8a2a', glow: '#ff5a10', light: 90, distance: 26 },
  // The high table: two big ceremonial fires.
  brazier: { flame: '#ffab3d', glow: '#ff6a12', light: 34, distance: 13 },
  // The wall sconces: small, steady tapers.
  sconce: { flame: '#ffc266', glow: '#ff8a30', light: 12, distance: 8 },
  // The table candles: small and pale.
  candle: { flame: '#ffd79a', glow: '#ff9c3c', light: 0, distance: 0 },
} as const satisfies Record<FirePoint['kind'], {
  flame: string
  glow: string
  light: number
  distance: number
}>

interface FireProps {
  /** Every fire source in the hall. */
  points: FirePoint[]
  /** Whether the scene is running on a low-power device. */
  lowPower?: boolean
}

/**
 * One flame, drawn as a camera-facing quad.
 *
 * The billboard is done by hand rather than with drei's `<Billboard>`, so
 * every flame in the hall can share a single InstancedMesh.
 */
function Fire({ points, lowPower = false }: FireProps) {
  const flames = useRef<THREE.InstancedMesh>(null)
  const glows = useRef<THREE.InstancedMesh>(null)

  const materials = getHallMaterials()

  // Every flame gets a stable random phase, speed and lean, so no two
  // flames move together.
  const flamesData = useMemo(() => {
    const out: {
      point: FirePoint
      phase: number
      speed: number
      lean: number
      leanSpeed: number
    }[] = []

    for (const p of points) {
      out.push({
        point: p,
        phase: Math.random() * Math.PI * 2,
        speed: 0.8 + Math.random() * 0.9,
        lean: (Math.random() - 0.5) * 0.18,
        leanSpeed: 0.5 + Math.random() * 0.7,
      })
    }
    return out
  }, [points])

  /**
   * The per-fire colours are set once, on the instance colour attribute.
   *
   * `instanceColor` multiplies the material's colour, so the material
   * stays white and each instance carries its own tint. This is why one
   * draw call can hold a roaring orange fireplace AND a pale table candle.
   */
  const coloursSet = useRef(false)
  useMemo(() => {
    coloursSet.current = false
  }, [flamesData])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const flameColour = useMemo(() => new THREE.Color(), [])
  const glowColour = useMemo(() => new THREE.Color(), [])

  // The camera's world matrix, needed to turn each flame to face it.
  const cameraMatrix = useMemo(() => new THREE.Matrix4(), [])

  useFrame((state) => {
    const mesh = flames.current
    const glow = glows.current
    if (!mesh) return

    const t = state.clock.elapsedTime
    cameraMatrix.copy(state.camera.matrixWorld)

    // The colours only need setting once, but the meshes are ready on the
    // first frame after mount.
    if (!coloursSet.current && mesh.instanceColor && glow?.instanceColor) {
      flamesData.forEach((f, i) => {
        const look = KIND_LOOK[f.point.kind]
        flameColour.set(look.flame)
        glowColour.set(look.glow)
        mesh.setColorAt(i, flameColour)
        glow.setColorAt(i, glowColour)
      })
      mesh.instanceColor.needsUpdate = true
      if (glow.instanceColor) glow.instanceColor.needsUpdate = true
      coloursSet.current = true
    }

    for (let i = 0; i < flamesData.length; i++) {
      const f = flamesData[i]

      // The flame stretches and settles, the way a real flame does as the
      // convection pulls it upward.
      const stretch = 0.85 + Math.sin(t * f.speed * 6 + f.phase) * 0.12 + Math.sin(t * f.speed * 13 + f.phase) * 0.06

      // A draught leans the flame side to side.
      const lean = f.lean + Math.sin(t * f.leanSpeed + f.phase) * 0.1

      dummy.position.set(f.point.position[0], f.point.position[1], f.point.position[2])
      dummy.scale.set(f.point.scale, f.point.scale * stretch, f.point.scale)

      // Face the camera, then lean the flame about its own up axis.
      dummy.quaternion.setFromRotationMatrix(cameraMatrix)
      dummy.rotateZ(lean)

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      // The halo follows the flame, but it breathes on its own rhythm and
      // sits a little lower — it is the glow in the air, not the flame.
      if (glow) {
        const pulse = 1 + Math.sin(t * f.speed * 2.4 + f.phase) * 0.16
        const g = f.point.scale * 2.4 * pulse
        dummy.position.set(f.point.position[0], f.point.position[1] + f.point.scale * 0.5, f.point.position[2])
        dummy.scale.set(g, g, g)
        dummy.quaternion.setFromRotationMatrix(cameraMatrix)
        dummy.updateMatrix()
        glow.setMatrixAt(i, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (glow) glow.instanceMatrix.needsUpdate = true
  })

  // ── The lights ───────────────────────────────────────────────────────────
  // Only the big fires get their own light. The table candles are too
  // small and too many; they are lit by the hall's general candlelight
  // instead, and their flames still glow.
  const litFires = useMemo(
    () => points.filter((p) => KIND_LOOK[p.kind].light > 0),
    [points],
  )

  const count = Math.max(1, flamesData.length)

  return (
    <group>
      {/* Every flame in the hall, in one draw call. */}
      <instancedMesh
        ref={flames}
        args={[undefined, undefined, count]}
        material={materials.fireFlame}
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry args={[1, 1.5]} />
      </instancedMesh>

      {/* The glow around the flame — a soft, additive halo that makes the
          fire feel like it is throwing light into the air. */}
      <instancedMesh
        ref={glows}
        args={[undefined, undefined, count]}
        material={materials.fireGlow}
        frustumCulled={false}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

      {/* Real lights, one per big fire. */}
      {!lowPower &&
        litFires.map((p, i) => {
          const look = KIND_LOOK[p.kind]
          return (
            <pointLight
              key={`fire-light-${i}`}
              position={[p.position[0], p.position[1] + p.scale * 0.6, p.position[2]]}
              intensity={look.light}
              distance={look.distance}
              decay={2}
              color={look.flame}
            />
          )
        })}
    </group>
  )
}

export default Fire
