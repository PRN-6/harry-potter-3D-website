import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getHallMaterials } from './hallTheme'
import type { FirePoint } from './firePoints'

/**
 * THE FIRES
 *
 * Live billboard flames on fireplaces, sconces, braziers and candles.
 */

const KIND_LOOK = {
  fireplace: { flame: '#ff8a2a', glow: '#ff5a10', light: 90, distance: 26 },
  brazier: { flame: '#ffab3d', glow: '#ff6a12', light: 34, distance: 13 },
  sconce: { flame: '#ffc266', glow: '#ff8a30', light: 12, distance: 8 },
  candle: { flame: '#ffd79a', glow: '#ff9c3c', light: 0, distance: 0 },
} as const satisfies Record<FirePoint['kind'], {
  flame: string
  glow: string
  light: number
  distance: number
}>

interface FireProps {
  points: FirePoint[]
  lowPower?: boolean
}

function Fire({ points, lowPower = false }: FireProps) {
  const flames = useRef<THREE.InstancedMesh>(null)
  const glows = useRef<THREE.InstancedMesh>(null)

  const materials = getHallMaterials()

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

  const coloursSet = useRef(false)
  useMemo(() => {
    coloursSet.current = false
  }, [flamesData])

  const dummy = useMemo(() => new THREE.Object3D(), [])
  const flameColour = useMemo(() => new THREE.Color(), [])
  const glowColour = useMemo(() => new THREE.Color(), [])

  const cameraMatrix = useMemo(() => new THREE.Matrix4(), [])
  const cameraRotation = useMemo(() => new THREE.Quaternion(), [])

  useFrame((state) => {
    const mesh = flames.current
    const glow = glows.current
    if (!mesh) return

    const t = state.clock.elapsedTime
    cameraMatrix.copy(state.camera.matrixWorld)
    // Extract rotation ONCE per frame instead of 74 times in the loop
    cameraRotation.setFromRotationMatrix(cameraMatrix)

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

      const stretch = 0.85 + Math.sin(t * f.speed * 6 + f.phase) * 0.12 + Math.sin(t * f.speed * 13 + f.phase) * 0.06
      const lean = f.lean + Math.sin(t * f.leanSpeed + f.phase) * 0.1

      dummy.position.set(f.point.position[0], f.point.position[1], f.point.position[2])
      dummy.scale.set(f.point.scale, f.point.scale * stretch, f.point.scale)

      dummy.quaternion.copy(cameraRotation)
      dummy.rotateZ(lean)

      dummy.updateMatrix()
      mesh.setMatrixAt(i, dummy.matrix)

      if (glow) {
        const pulse = 1 + Math.sin(t * f.speed * 2.4 + f.phase) * 0.16
        const g = f.point.scale * 2.4 * pulse
        dummy.position.set(f.point.position[0], f.point.position[1] + f.point.scale * 0.5, f.point.position[2])
        dummy.scale.set(g, g, g)
        dummy.quaternion.copy(cameraRotation)
        dummy.updateMatrix()
        glow.setMatrixAt(i, dummy.matrix)
      }
    }
    mesh.instanceMatrix.needsUpdate = true
    if (glow) glow.instanceMatrix.needsUpdate = true
  })

  const litFires = useMemo(
    () => points.filter((p) => KIND_LOOK[p.kind].light > 0),
    [points],
  )

  const count = Math.max(1, flamesData.length)

  return (
    <group>
      <instancedMesh
        ref={flames}
        args={[undefined, undefined, count]}
        material={materials.fireFlame}
        frustumCulled={false}
        renderOrder={2}
      >
        <planeGeometry args={[1, 1.5]} />
      </instancedMesh>

      <instancedMesh
        ref={glows}
        args={[undefined, undefined, count]}
        material={materials.fireGlow}
        frustumCulled={false}
        renderOrder={1}
      >
        <planeGeometry args={[1, 1]} />
      </instancedMesh>

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
