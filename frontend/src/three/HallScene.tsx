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

export function isMobileDevice(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.matchMedia?.('(pointer: coarse)').matches ||
    /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  )
}

export function isMobileViewport(): boolean {
  if (typeof window === 'undefined') return false
  return (
    window.innerWidth < 768 ||
    isMobileDevice() ||
    (window.innerWidth < 1024 && window.innerHeight > window.innerWidth)
  )
}

export function detectQualityTier(): QualityTier {
  if (typeof window === 'undefined') return 'medium'

  const cores = navigator.hardwareConcurrency ?? 4
  const memory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4
  const coarse = window.matchMedia?.('(pointer: coarse)').matches ?? false
  const mobile = isMobileDevice()

  if (mobile || coarse) {
    if (cores <= 4 || memory <= 3) return 'low'
    return 'medium'
  }

  if (cores <= 4 || memory <= 3) return 'low'
  if (cores >= 8 && memory >= 8) return 'high'
  return 'medium'
}

/**
 * The cinematic camera rig — 7 discrete scroll-snaps (Point 0 → Point 7):
 * - Cinematic lens breathing (dynamic focal length / FOV).
 * - Dutch tilt roll banking into turns and mouse sway.
 * - Organic steadicam micro-float.
 * - Slow cinematic entrance through the doors.
 */
function CameraRig({
  path,
  onChapter,
  doorRef,
  fadeRef,
  isActive = true,
}: {
  path: CameraPath
  onChapter?: (index: number) => void
  doorRef: React.MutableRefObject<DoorHinges | null>
  fadeRef?: React.RefObject<HTMLDivElement | null>
  isActive?: boolean
}) {
  const { camera } = useThree()

  const desired = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothMouseOffset = useRef(new THREE.Vector3())

  // Reused vectors in useFrame to eliminate garbage collection pauses (zero allocations per frame)
  const forwardVec = useMemo(() => new THREE.Vector3(), [])
  const rightVec = useMemo(() => new THREE.Vector3(), [])
  const upVec = useMemo(() => new THREE.Vector3(), [])
  const targetMouseOffsetVec = useMemo(() => new THREE.Vector3(), [])
  const finalLookAt = useMemo(() => new THREE.Vector3(), [])

  // Step 0 to 7
  const currentStep = useRef(0)
  const targetU = useRef(0)
  const currentU = useRef(0)
  const lastStepTime = useRef(0)
  // True while any step transition is animating — blocks all further scroll inputs
  const isAnimating = useRef(false)
  // True while the slow door-opening entrance is playing (Step 0 -> 1)
  const entrancePlaying = useRef(false)
  const isSyncingScroll = useRef(false)
  const currentRoll = useRef(0)

  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  const goToStep = (step: number) => {
    const clamped = Math.max(0, Math.min(7, step))
    if (clamped === currentStep.current) return

    // Trigger slow entrance animation when going from 0 → 1
    if (currentStep.current === 0 && clamped === 1) {
      entrancePlaying.current = true
    } else {
      entrancePlaying.current = false
    }

    currentStep.current = clamped
    targetU.current = path.keyframeFractions[clamped] ?? (clamped / 7)
    isAnimating.current = true
    lastStepTime.current = performance.now()
    onChapter?.(clamped)

    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll > 0) {
      isSyncingScroll.current = true
      window.scrollTo({ top: (clamped / 7) * maxScroll, behavior: 'instant' })
      setTimeout(() => {
        isSyncingScroll.current = false
      }, 80)
    }
  }

  useEffect(() => {
    if (!isActive) return

    // Determine initial step or restore scroll when returning to home view
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight
    if (maxScroll > 0) {
      if (currentStep.current > 0) {
        isSyncingScroll.current = true
        window.scrollTo({ top: (currentStep.current / 7) * maxScroll, behavior: 'instant' })
        setTimeout(() => {
          isSyncingScroll.current = false
        }, 80)
      } else if (window.scrollY > 50) {
        const step = Math.min(7, Math.round((window.scrollY / maxScroll) * 7))
        currentStep.current = step
        targetU.current = path.keyframeFractions[step] ?? (step / 7)
        currentU.current = targetU.current
        onChapter?.(step)
      }
    }

    const onWheel = (e: WheelEvent) => {
      // Prevent browser from doing default native page scroll on the 3D home view
      e.preventDefault()

      // Block all scroll inputs while the current animation is playing and camera is moving
      if (isAnimating.current) return

      const now = performance.now()
      // Enforce cooldown so trackpad momentum / inertia cannot double-trigger steps
      if (now - lastStepTime.current < 850) return
      // Ignore tiny jitter movements
      if (Math.abs(e.deltaY) < 18) return

      if (e.deltaY > 0 && currentStep.current < 7) {
        goToStep(currentStep.current + 1)
      } else if (e.deltaY < 0 && currentStep.current > 0) {
        goToStep(currentStep.current - 1)
      }
    }

    let touchStartY = 0
    let touchStartX = 0

    const onTouchStart = (e: TouchEvent) => {
      touchStartY = e.touches[0].clientY
      touchStartX = e.touches[0].clientX
    }

    const onTouchMove = (e: TouchEvent) => {
      // Prevent browser rubber-banding and pull-to-refresh on 3D view
      if (e.cancelable) {
        e.preventDefault()
      }
    }

    const onTouchEnd = (e: TouchEvent) => {
      if (isAnimating.current) return
      const now = performance.now()
      if (now - lastStepTime.current < 850) return

      const diffY = touchStartY - e.changedTouches[0].clientY
      const diffX = touchStartX - e.changedTouches[0].clientX

      // Check if vertical swipe is prominent and exceeds threshold
      if (Math.abs(diffY) > 30 && Math.abs(diffY) > Math.abs(diffX)) {
        if (diffY > 0 && currentStep.current < 7) {
          goToStep(currentStep.current + 1)
        } else if (diffY < 0 && currentStep.current > 0) {
          goToStep(currentStep.current - 1)
        }
      }
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (isAnimating.current) {
        if (['ArrowDown', 'PageDown', 'Space', 'ArrowUp', 'PageUp'].includes(e.code)) {
          e.preventDefault()
        }
        return
      }

      const now = performance.now()
      if (now - lastStepTime.current < 850) return

      if (['ArrowDown', 'PageDown', 'Space'].includes(e.code)) {
        e.preventDefault()
        if (currentStep.current < 7) {
          goToStep(currentStep.current + 1)
        }
      } else if (['ArrowUp', 'PageUp'].includes(e.code)) {
        e.preventDefault()
        if (currentStep.current > 0) {
          goToStep(currentStep.current - 1)
        }
      }
    }

    // Scrollbar thumb drag fallback (only when user manually drags scrollbar, not from code)
    const onScroll = () => {
      if (isSyncingScroll.current) return
      if (isAnimating.current) return
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight
      if (maxScroll <= 0) return

      const now = performance.now()
      if (now - lastStepTime.current > 900) {
        const step = Math.min(7, Math.round((window.scrollY / maxScroll) * 7))
        if (step !== currentStep.current) {
          goToStep(step)
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

    const onResetTour = () => {
      goToStep(0)
    }

    const onGoToStep = (e: Event) => {
      const customEvent = e as CustomEvent<{ step: number }>
      if (typeof customEvent.detail?.step === 'number') {
        goToStep(customEvent.detail.step)
      }
    }

    window.addEventListener('wheel', onWheel, { passive: false })
    window.addEventListener('touchstart', onTouchStart, { passive: true })
    window.addEventListener('touchmove', onTouchMove, { passive: false })
    window.addEventListener('touchend', onTouchEnd, { passive: true })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('pointermove', onMove, { passive: true })
    window.addEventListener('pointerleave', onLeave)
    window.addEventListener('reset-hall-tour', onResetTour)
    window.addEventListener('go-to-step', onGoToStep)

    return () => {
      window.removeEventListener('wheel', onWheel)
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove', onTouchMove)
      window.removeEventListener('touchend', onTouchEnd)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerleave', onLeave)
      window.removeEventListener('reset-hall-tour', onResetTour)
      window.removeEventListener('go-to-step', onGoToStep)
    }
  }, [path, isActive])

  // When path updates while at Point 0 (e.g. GLTF model finishes loading and reports bounds),
  // immediately snap camera to Point 0 so it aligns cleanly without drift or lag.
  useEffect(() => {
    if (!isActive) return
    if (currentStep.current === 0 && currentU.current === 0) {
      const sample = path.sample(0)
      camera.position.set(sample.position[0], sample.position[1], sample.position[2])
      desired.set(sample.position[0], sample.position[1], sample.position[2])
      smoothTarget.set(sample.target[0], sample.target[1], sample.target[2])
      desiredTarget.set(sample.target[0], sample.target[1], sample.target[2])
      camera.lookAt(smoothTarget)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50
        camera.updateProjectionMatrix()
      }
    }
  }, [path, camera, desired, desiredTarget, smoothTarget, isActive])

  const primed = useRef(false)

  useFrame((_, delta) => {
    if (!isActive) return

    const point1U = path.keyframeFractions[1] ?? 0.193

    // Slow cinematic glide for the first scroll (0 → 1), smooth weighted dolly for the rest
    const isFirstSegment = entrancePlaying.current
    const uLerp = isFirstSegment
      ? 1 - Math.pow(0.32, delta)   // Slow entrance (~3.2s cinematic glide)
      : 1 - Math.pow(0.003, delta)  // Smooth cinematic inertia dolly motion

    currentU.current += (targetU.current - currentU.current) * uLerp

    // Release animation lock once camera has reached its destination and settled
    if (isAnimating.current) {
      const now = performance.now()
      const timeSinceStep = now - lastStepTime.current
      if (entrancePlaying.current) {
        if (currentU.current >= point1U * 0.96 && timeSinceStep > 2200) {
          entrancePlaying.current = false
          isAnimating.current = false
        }
      } else {
        const dist = Math.abs(targetU.current - currentU.current)
        if (dist < 0.0012 && timeSinceStep > 750) {
          isAnimating.current = false
        }
      }

      // Safety failsafe: never remain locked for longer than 3.5s under any circumstance
      if (timeSinceStep > 3500) {
        entrancePlaying.current = false
        isAnimating.current = false
      }
    }

    const { position, target, roll } = path.sample(currentU.current)

    desired.set(position[0], position[1], position[2])
    desiredTarget.set(target[0], target[1], target[2])

    // Subtle organic steadicam micro-drift (gives photographic life to the floating camera)
    const time = performance.now() * 0.0005
    // At Point 0 on mobile, avoid horizontal drift so the door remains rock-solid centered
    const isMobilePoint0 = currentU.current < 0.01 && isMobileViewport()
    const driftX = isMobilePoint0 ? 0 : Math.sin(time * 0.8) * 0.02
    const driftY = Math.cos(time * 0.6) * 0.015
    desired.x += driftX
    desired.y += driftY

    // Eased mouse target
    const l = look.current
    const lk = 1 - Math.pow(0.05, delta)
    l.x += (l.targetX - l.x) * lk
    l.y += (l.targetY - l.y) * lk

    if (!primed.current) {
      primed.current = true
      smoothTarget.copy(desiredTarget)
      camera.position.copy(desired)
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.fov = 50
        camera.updateProjectionMatrix()
      }
      camera.lookAt(smoothTarget)
      return
    }

    // Smooth position and target interpolation
    const posK = isFirstSegment
      ? 1 - Math.pow(0.001, delta)
      : 1 - Math.pow(0.002, delta)
    camera.position.lerp(desired, posK)

    const k = 1 - Math.pow(0.002, delta)
    smoothTarget.lerp(desiredTarget, k)

    // Smooth mouse-look with zero garbage-collection allocations:
    forwardVec.subVectors(smoothTarget, camera.position).normalize()
    rightVec.crossVectors(forwardVec, camera.up).normalize()
    upVec.crossVectors(rightVec, forwardVec).normalize()

    const mouseWeight = currentU.current < 0.05 ? 0 : Math.min(1, (currentU.current - 0.05) / 0.06)

    targetMouseOffsetVec.set(0, 0, 0)
    if (mouseWeight > 0) {
      targetMouseOffsetVec.addScaledVector(rightVec, l.x * 2.2 * mouseWeight)
      targetMouseOffsetVec.addScaledVector(upVec, -l.y * 1.4 * mouseWeight)
    }

    const offsetK = 1 - Math.pow(0.005, delta)
    smoothMouseOffset.current.lerp(targetMouseOffsetVec, offsetK)

    // Cinematic Dutch tilt banking into movement and mouse yaw
    const mouseRoll = -l.x * 0.012 * mouseWeight
    const targetRoll = roll + mouseRoll
    const rollK = 1 - Math.pow(0.004, delta)
    currentRoll.current += (targetRoll - currentRoll.current) * rollK

    camera.up.set(
      Math.sin(currentRoll.current),
      Math.cos(currentRoll.current),
      0
    ).normalize()

    finalLookAt.copy(smoothTarget).add(smoothMouseOffset.current)
    camera.lookAt(finalLookAt)

    // Door animation:
    if (doorRef.current) {
      const targetDoorT = currentStep.current >= 1 ? 1 : Math.min(1, currentU.current / (point1U * 0.4))
      const doorK = targetDoorT < 0.95
        ? 1 - Math.pow(0.3, delta)
        : 1 - Math.pow(0.01, delta)
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
  isActive?: boolean
}

export default function HallScene({
  house,
  onLoadProgress,
  onModelReady,
  onChapter,
  fadeRef,
  isActive = true,
}: HallSceneProps) {
  const [tier] = useState<QualityTier>(() => detectQualityTier())
  const [isMobile, setIsMobile] = useState(() => isMobileViewport())

  useEffect(() => {
    const onResize = () => {
      const mobile = isMobileViewport()
      setIsMobile((prev) => (prev !== mobile ? mobile : prev))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  const [modelFailed, setModelFailed] = useState(false)

  const [bounds, setBounds] = useState<HallBounds>(PROCEDURAL_HALL)
  const [fit, setFit] = useState<ModelFit | null>(null)
  const doorRef = useRef<DoorHinges | null>(null)

  const isModel = !modelFailed
  const features = useMemo(() => hallFeatures(bounds, isModel), [bounds, isModel])
  const path = useMemo(() => buildCameraPath(features, isMobile), [features, isMobile])

  // Capped DPR: mobile uses [1, 1.25] max; desktop caps at 1.5 to prevent 4K/retina fillrate stalls
  const dpr = useMemo<[number, number]>(() => {
    if (isMobile) {
      return tier === 'low' ? [1, 1.1] : [1, 1.25]
    }
    if (tier === 'low') return [1, 1.25]
    if (tier === 'medium') return [1, 1.5]
    return [1, 1.5]
  }, [tier, isMobile])

  // Scaled candle count tailored for smooth 60fps on both mobile and desktop
  const candleCount = useMemo(() => {
    if (isMobile) return 36
    if (tier === 'low') return 54
    if (tier === 'medium') return 80
    return 110
  }, [tier, isMobile])

  const firePoints = useMemo(() => {
    if (!fit) return []
    return buildFirePoints(fit.scale, fit.offset)
  }, [fit])

  const lowPower = isMobile || tier === 'low'

  return (
    <Canvas
      shadows={!isMobile && tier === 'high'}
      dpr={dpr}
      gl={{
        antialias: !isMobile && tier === 'high',
        powerPreference: 'high-performance',
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{
        fov: isMobile ? 58 : 50,
        near: 0.1,
        far: 300,
        position: path.keyframes[0].position,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 0.32
        if (!isMobile && tier === 'high') {
          gl.shadowMap.type = THREE.PCFShadowMap
        }
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
            skipNormalMaps={lowPower}
          />
        )}
      </Suspense>

      {firePoints.length > 0 && (
        <Fire points={firePoints} lowPower={lowPower} />
      )}

      <FloatingCandles count={candleCount} features={features} />
      <EnchantedCeiling features={features} lowPower={lowPower} />
      <Sparkles features={features} lowPower={lowPower} />

      <Entrance features={features} />

      <HouseSpotlight house={house} features={features} castShadow={!isMobile && tier === 'high'} />
      <CameraRig
        path={path}
        onChapter={onChapter}
        doorRef={doorRef}
        fadeRef={fadeRef}
        isActive={isActive}
      />

      <HallBloom enabled={!isMobile && tier !== 'low'} strength={0.25} radius={0.55} threshold={0.6} />

      <AdaptiveDpr pixelated={false} />
      <Preload all />
    </Canvas>
  )
}
