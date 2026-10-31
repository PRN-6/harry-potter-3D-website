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
 * The camera rig:
 * - Start to Point 1 ("The Long Tables"): Users can freely scroll natively.
 * - Point 1 to Point 7: Discrete point-to-point scroll snaps ("the rest all keep it same").
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

  // Step 0 to 7
  const currentStep = useRef(0)
  const targetU = useRef(0)
  const currentU = useRef(0)
  const lastScrollTime = useRef(0)

  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  const goToStep = (step: number) => {
    const clamped = Math.max(0, Math.min(7, step))
    currentStep.current = clamped
    targetU.current = path.keyframeFractions[clamped] ?? (clamped / 7)
    onChapter?.(clamped)

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll > 0) {
      window.scrollTo({ top: (clamped / 7) * maxScroll, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const point1U = path.keyframeFractions[1] ?? 0.193

    // Determine initial step if page is loaded already scrolled
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll > 0 && window.scrollY > 50) {
      const point1ScrollY = (1 / 7) * maxScroll
      if (window.scrollY < point1ScrollY) {
        currentStep.current = 0
        targetU.current = (window.scrollY / point1ScrollY) * point1U
        currentU.current = targetU.current
        onChapter?.(0)
      } else {
        const step = Math.min(7, Math.round((window.scrollY / maxScroll) * 7))
        currentStep.current = step
        targetU.current = path.keyframeFractions[step] ?? (step / 7)
        currentU.current = targetU.current
        onChapter?.(step)
      }
    }

    const onWheel = (e: WheelEvent) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const point1ScrollY = max > 0 ? (1 / 7) * max : 500

      // 1. Before Point 1 ("The Long Tables"):
      // Users can FREELY scroll natively! Do not intercept or block!
      if (currentStep.current === 0 || window.scrollY < point1ScrollY - 20) {
        return
      }

      // 2. Beyond Point 1 (Point 1 -> 2 -> 3 -> 4 -> 5 -> 6 -> 7):
      // Discrete step points as requested ("the rest all keep it same")
      const now = performance.now()
      if (now - lastScrollTime.current < 650) return
      if (Math.abs(e.deltaY) < 15) return

      if (e.deltaY > 0 && currentStep.current < 7) {
        lastScrollTime.current = now
        goToStep(currentStep.current + 1)
      } else if (e.deltaY < 0) {
        lastScrollTime.current = now
        if (currentStep.current > 1) {
          goToStep(currentStep.current - 1)
        } else {
          // Returning back into the free scroll zone before Point 1
          currentStep.current = 0
          goToStep(0)
        }
      }
    }

    let touchStartY = 0
    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
    }
    const onTouchEnd = (e: TouchEvent) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const point1ScrollY = max > 0 ? (1 / 7) * max : 500

      // Free scroll on touch before Point 1
      if (currentStep.current === 0 || window.scrollY < point1ScrollY - 20) {
        return
      }

      const diff = touchStartY - e.changedTouches[0].clientY
      if (Math.abs(diff) < 25) return

      const now = performance.now()
      if (now - lastScrollTime.current < 650) return

      if (diff > 0 && currentStep.current < 7) {
        lastScrollTime.current = now
        goToStep(currentStep.current + 1)
      } else if (diff < 0) {
        lastScrollTime.current = now
        if (currentStep.current > 1) {
          goToStep(currentStep.current - 1)
        } else {
          currentStep.current = 0
          goToStep(0)
        }
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const point1ScrollY = max > 0 ? (1 / 7) * max : 500

      if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        if (currentStep.current === 0 && window.scrollY < point1ScrollY - 20) {
          // Free keyboard scroll
          return
        }
        e.preventDefault()
        const now = performance.now()
        if (now - lastScrollTime.current < 450) return
        if (currentStep.current < 7) {
          lastScrollTime.current = now
          goToStep(currentStep.current + 1)
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        if (currentStep.current === 0 && window.scrollY < point1ScrollY - 20) {
          // Free keyboard scroll
          return
        }
        e.preventDefault()
        const now = performance.now()
        if (now - lastScrollTime.current < 450) return
        if (currentStep.current > 1) {
          lastScrollTime.current = now
          goToStep(currentStep.current - 1)
        } else if (currentStep.current === 1) {
          currentStep.current = 0
          goToStep(0)
        }
      }
    }

    // Native scroll event handles the free scroll zone
    const onScroll = () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll <= 0) return
      const point1ScrollY = (1 / 7) * maxScroll

      // While scrolling freely before Point 1 ("The Long Tables"):
      if (window.scrollY <= point1ScrollY) {
        const isAtOrPastPoint1 = window.scrollY >= point1ScrollY * 0.96
        currentStep.current = isAtOrPastPoint1 ? 1 : 0
        const progress = Math.min(1, Math.max(0, window.scrollY / point1ScrollY))
        targetU.current = progress * point1U
        onChapter?.(currentStep.current)
        return
      }

      // Beyond Point 1, if user dragged scrollbar thumb
      const now = performance.now()
      if (now - lastScrollTime.current > 850) {
        const step = Math.min(7, Math.round((window.scrollY / maxScroll) * 7))
        if (step !== currentStep.current) {
          currentStep.current = step
          targetU.current = path.keyframeFractions[step] ?? (step / 7)
          onChapter?.(step)
        }
      }
    }

    const onMove = (event: PointerEvent) => {
      const target = look.current
      target.targetX = (event.clientX / window.innerWidth) * 2 - 1
      target.targetY = (event.clientY / window.innerHeight) * 2 - 1
    }
    const onLeave = () => {
      look.current.targetX = 0
      look.current.targetY = 0
    }

    window.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
    }
  }, [path])

  const primed = useRef(false)

  useFrame((_, delta) => {
    const point1U = path.keyframeFractions[1] ?? 0.193
    const isFreeScroll = currentStep.current === 0 && currentU.current < point1U

    // In free-scroll zone, follow native scroll directly; for discrete points, glide smoothly
    const uLerp = isFreeScroll
      ? 1 - Math.pow(0.00002, delta)
      : 1 - Math.pow(0.0008, delta)

    currentU.current += (targetU.current - currentU.current) * uLerp

    const { position, target } = path.sample(currentU.current)

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
    // Kept at 0 at the entrance (currentU < 0.05) so the shot is perfectly aligned
    // and doesn't shift sideways. Once inside the hall, smoothly blends in.
    const forward = new THREE.Vector3().subVectors(smoothTarget, camera.position).normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()

    const mouseWeight = currentU.current < 0.05 ? 0 : Math.min(1, (currentU.current - 0.05) / 0.06)

    const targetMouseOffset = new THREE.Vector3()
    if (mouseWeight > 0) {
      targetMouseOffset.addScaledVector(right, l.x * 2.2 * mouseWeight)
      targetMouseOffset.addScaledVector(up, -l.y * 1.4 * mouseWeight)
    }

    const offsetK = 1 - Math.pow(0.005, delta)
    smoothMouseOffset.current.lerp(targetMouseOffset, offsetK)

    camera.lookAt(smoothTarget.clone().add(smoothMouseOffset.current))

    // Door animation:
    // As the user freely scrolls from the start to Point 1, the doors open smoothly in real-time.
    // Beyond Point 1, doors stay open.
    if (doorRef.current) {
      const targetDoorT = currentStep.current >= 1 ? 1 : Math.min(1, currentU.current / (point1U * 0.4))
      const doorK = 1 - Math.pow(0.01, delta)
      const doorState = doorRef.current as any
      const currT = doorState.currentT ?? 0
      const smoothedT = currT + (targetDoorT - currT) * doorK
      doorState.currentT = smoothedT
      animateDoors(doorRef.current, smoothedT)
    }

    // Subtle door passage glow
    if (fadeRef?.current) {
      if (currentU.current >= 0.015 && currentU.current <= 0.08) {
        const tFade = Math.sin(((currentU.current - 0.015) / 0.065) * Math.PI)
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
