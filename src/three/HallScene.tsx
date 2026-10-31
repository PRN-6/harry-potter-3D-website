import { Suspense, useEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { AdaptiveDpr, Preload } from '@react-three/drei'
import GreatHall from './GreatHall'
import DiningHallModel, { type ModelFit } from './DiningHallModel'
import Fire from './Fire'
import HallBloom from './HallBloom'
import HallEnvironment from './HallEnvironment'
import { EnchantedCeiling, FloatingCandles, Sparkles } from './Atmosphere'
import Entrance from './Entrance'
import { buildCameraPath, type CameraPath } from './cameraPath'
import { hallFeatures, PROCEDURAL_HALL, type HallBounds, type HallFeatures } from './hallBounds'
import { buildFirePoints } from './firePoints'
import { HOUSE_BY_ID, type HouseId } from '../data/houses'
import { animateDoors, type DoorHinges } from './doorRig'

export type QualityTier = 'low' | 'medium' | 'high'

export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium'

  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false

  if (cores <= 4 || memory <= 3) return 'low'
  if (coarse && cores <= 6) return 'low'
  if (cores >= 8 && memory >= 8) return 'high'
  return 'medium'
}

/**
 * The scroll-driven camera rig.
 *
 * Choreography:
 * 1. Doors start closed.
 * 2. On the first scroll, doors immediately part open and the camera glides
 *    straight through the doorway into the middle of the hall.
 * 3. Rotates right to admire the right house tables.
 * 4. Rotates left across the hall to admire the left house tables.
 * 5. Rises up above the feast into the rafters and enchanted sky.
 * 6. Descends down to the Main Head Table.
 * 7. Returns back to the top for the grand panoramic wide view.
 */
function CameraRig({
  path,
  onChapter,
  doorRef,
  fadeRef,
}: {
  path: CameraPath
  onChapter?: (index: number) => void
  doorRef: React.MutableRefObject<DoorHinges | null>
  fadeRef?: React.RefObject<HTMLDivElement | null>
}) {
  const { camera } = useThree()

  const desired = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothMouseOffset = useRef(new THREE.Vector3())

  const scrollRef = useRef(0)
  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    const onMove = (event: PointerEvent) => {
      const target = look.current
      target.targetX = (event.clientX / window.innerWidth) * 2 - 1
      target.targetY = (event.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      look.current.targetX = 0
      look.current.targetY = 0
    }
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  const primed = useRef(false)
  const chapter = useRef(-1)

  useFrame((_, delta) => {
    const { position, target } = path.sample(scrollRef.current)

    desired.set(position[0], position[1], position[2])
    desiredTarget.set(target[0], target[1], target[2])

    // Eased mouse target
    const l = look.current
    const lk = 1 - Math.pow(0.05, delta)
    l.x += (l.targetX - l.x) * lk
    l.y += (l.targetY - l.y) * lk

    if (!primed.current) {
      primed.current = true
      smoothTarget.copy(desiredTarget)
      camera.position.copy(desired)
      camera.lookAt(smoothTarget)
      return
    }

    // Smooth position and target interpolation
    const posK = 1 - Math.pow(0.001, delta)
    camera.position.lerp(desired, posK)

    const k = 1 - Math.pow(0.002, delta)
    smoothTarget.lerp(desiredTarget, k)

    // Smooth mouse-look:
    // Kept at 0 at the entrance (scroll < 0.035) so the shot is perfectly aligned
    // and doesn't shift sideways. Once inside the hall, smoothly blends in.
    const forward = new THREE.Vector3().subVectors(smoothTarget, camera.position).normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()

    const mouseWeight = scrollRef.current < 0.035 ? 0 : Math.min(1, (scrollRef.current - 0.035) / 0.045)

    const targetMouseOffset = new THREE.Vector3()
    if (mouseWeight > 0) {
      targetMouseOffset.addScaledVector(right, l.x * 2.2 * mouseWeight)
      targetMouseOffset.addScaledVector(up, -l.y * 1.4 * mouseWeight)
    }

    const offsetK = 1 - Math.pow(0.005, delta)
    smoothMouseOffset.current.lerp(targetMouseOffset, offsetK)

    camera.lookAt(smoothTarget.clone().add(smoothMouseOffset.current))

    // Chapter reporting
    const active = path.chapterAt(scrollRef.current)
    if (active !== chapter.current) {
      chapter.current = active
      onChapter?.(active)
    }

    // Door animation:
    // As soon as the visitor scrolls, the doors swing open immediately so
    // the camera enters seamlessly on that first scroll.
    if (doorRef.current) {
      const targetT = Math.min(1, scrollRef.current * 30)
      const doorK = 1 - Math.pow(0.01, delta)
      const doorState = doorRef.current as any
      const currentT = doorState.currentT ?? 0
      const smoothedT = currentT + (targetT - currentT) * doorK
      doorState.currentT = smoothedT
      animateDoors(doorRef.current, smoothedT)
    }

    // Seamless doorway passage title glow:
    // Gently introduces "Welcome to the Great Hall" as the visitor passes through the doorway
    // without stalling or interrupting the journey.
    if (fadeRef?.current) {
      if (scrollRef.current >= 0.012 && scrollRef.current <= 0.045) {
        const tFade = Math.sin(((scrollRef.current - 0.012) / 0.033) * Math.PI)
        fadeRef.current.style.opacity = Math.max(0, tFade).toFixed(2)
      } else {
        fadeRef.current.style.opacity = '0'
      }
    }
  })

  return null
}

function HouseSpotlight({
  house,
  features,
  castShadow,
}: {
  house: HouseId
  features: HallFeatures
  castShadow: boolean
}) {
  const light = useRef<THREE.SpotLight>(null)
  const target = useMemo(() => new THREE.Object3D(), [])

  const spot = useMemo(
    () => features.spots.find((s) => s.house === house) ?? features.spots[0],
    [features, house],
  )

  useEffect(() => {
    target.position.set(spot.x, features.tableTopY, spot.z)
    target.updateWorldMatrix(true, false)
    if (light.current) {
      light.current.target = target
    }
  }, [spot, features.tableTopY, target])

  return (
    <>
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[spot.x, features.bounds.height * 0.72, spot.z + 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={50}
        distance={34}
        decay={2}
        castShadow={castShadow}
        shadow-mapSize-width={castShadow ? 1024 : 512}
        shadow-mapSize-height={castShadow ? 1024 : 512}
        shadow-bias={-0.0005}
        color={HOUSE_BY_ID[house].glow}
      />
    </>
  )
}

export interface HallSceneProps {
  house: HouseId
  onLoadProgress?: (p: number) => void
  onModelReady?: () => void
  onChapter?: (index: number) => void
  fadeRef?: React.RefObject<HTMLDivElement | null>
}

export default function HallScene({
  house,
  onLoadProgress,
  onModelReady,
  onChapter,
  fadeRef,
}: HallSceneProps) {
  const [tier] = useState<QualityTier>(() => detectQualityTier())
  const [modelFailed, setModelFailed] = useState(false)

  const [bounds, setBounds] = useState<HallBounds>(PROCEDURAL_HALL)
  const [fit, setFit] = useState<ModelFit | null>(null)
  const doorRef = useRef<DoorHinges | null>(null)

  const isModel = !modelFailed
  const features = useMemo(() => hallFeatures(bounds, isModel), [bounds, isModel])
  const path = useMemo(() => buildCameraPath(features), [features])

  const dpr = useMemo<[number, number]>(() => {
    if (tier === 'low') return [1, 1.25]
    if (tier === 'medium') return [1, 1.75]
    return [1, 2]
  }, [tier])

  const candleCount = useMemo(() => {
    const cores = navigator.hardwareConcurrency ?? 4
    return cores >= 8 ? 150 : cores >= 4 ? 90 : 54
  }, [])

  const firePoints = useMemo(() => {
    if (!fit) return []
    return buildFirePoints(fit.scale, fit.offset)
  }, [fit])

  return (
    <Canvas
      shadows={tier !== 'low'}
      dpr={dpr}
      gl={{
        antialias: tier === 'high',
        powerPreference: 'high-performance',
        alpha: false,
      }}
      camera={{
        fov: 58,
        near: 0.1,
        far: 300,
        position: path.keyframes[0].position,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.32
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <color attach="background" args={['#0a0714']} />
      <fog attach="fog" args={['#0a0714', 26, 96]} />

      <HallEnvironment intensity={0.3} />

      <Suspense fallback={null}>
        {modelFailed ? (
          <GreatHall />
        ) : (
          <DiningHallModel
            onProgress={onLoadProgress}
            onReady={(hinges) => {
              doorRef.current = hinges
              onModelReady?.()
            }}
            onBounds={setBounds}
            onFit={setFit}
            onError={() => setModelFailed(true)}
          />
        )}
      </Suspense>

      {firePoints.length > 0 && (
        <Fire points={firePoints} lowPower={tier === 'low'} />
      )}

      <FloatingCandles count={candleCount} features={features} />
      <EnchantedCeiling features={features} />
      <Sparkles features={features} />

      <Entrance features={features} />

      <HouseSpotlight house={house} features={features} castShadow={tier !== 'low'} />
      <CameraRig path={path} onChapter={onChapter} doorRef={doorRef} fadeRef={fadeRef} />

      <HallBloom enabled={tier !== 'low'} strength={0.25} radius={0.55} threshold={0.6} />

      <AdaptiveDpr pixelated={false} />
      <Preload all />
    </Canvas>
  )
}
