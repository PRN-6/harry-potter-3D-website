import { Suspense, useEffect, useMemo, useRef, useState, type ComponentRef } from 'react'
import * as THREE from 'three'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { OrbitControls, AdaptiveDpr, Preload } from '@react-three/drei'
import GreatHall from './GreatHall'
import DiningHallModel from './DiningHallModel'
import { EnchantedCeiling, FloatingCandles, Sparkles } from './Atmosphere'
import { buildCameraPath, sampleCameraPath } from './cameraPath'
import { hallFeatures, PROCEDURAL_HALL, type HallBounds, type HallFeatures } from './hallBounds'
import { HOUSE_BY_ID, type HouseId } from '../data/houses'

/**
 * The R3F canvas: the camera, the controls and the quality tiering that
 * keeps the hall smooth on a phone.
 *
 * QUALITY TIERS
 *   low    — phone / low core count: fewer candles, no shadows, lower DPR
 *   medium — tablet: shadows on, moderate candles
 *   high   — desktop: full candles, shadows, higher DPR
 *
 * The tier is chosen once at mount from `hardwareConcurrency`, the device
 * pixel ratio and a coarse pointer check. Changing DPR on the fly is what
 * `AdaptiveDpr` handles when the frame rate drops.
 *
 * THE MODEL
 *   The hall is the real `undifined.glb`. If that file fails to
 *   load, the procedural `GreatHall` takes over so the visitor never gets
 *   an empty box. The magical atmosphere — candles, stars, motes — is
 *   layered on top of EITHER hall.
 *
 * SCROLL DRIVES THE CAMERA
 *   The canvas is fixed behind a tall scrolling page, and `CameraRig` reads
 *   the scroll position every frame to place the camera along the path in
 *   `cameraPath.ts`.
 */

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
 * The scroll-driven camera.
 *
 * The page is `SCROLL_LENGTH` pixels tall; the canvas is fixed behind it.
 * The scroll position therefore IS the timeline: 0 is the entrance, 100%
 * is the last keyframe.
 *
 * The camera position is eased towards the sampled target with a
 * frame-rate independent lerp, so a flick of the scroll wheel glides the
 * camera into place instead of teleporting it. The look-at target is
 * applied directly, because the camera's orientation is what sells the
 * movement.
 */
function CameraRig({ path }: { path: ReturnType<typeof buildCameraPath> }) {
  const controls = useRef<ComponentRef<typeof OrbitControls>>(null)
  const { camera } = useThree()

  const desired = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const scrollRef = useRef(0)

  // Track the scroll position. It is written to a ref rather than state so
  // that scrolling never triggers a React re-render — the camera moves in
  // `useFrame`, at 60fps, and a re-render per scroll event would be far
  // too slow.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  useFrame((_, delta) => {
    const c = controls.current
    if (!c) return

    const { position, target } = sampleCameraPath(path, scrollRef.current)
    desired.set(position[0], position[1], position[2])
    desiredTarget.set(target[0], target[1], target[2])

    // Frame-rate independent easing (the same curve at 30fps and 120fps).
    const k = 1 - Math.pow(0.0015, delta)
    camera.position.lerp(desired, k)
    c.target.lerp(desiredTarget, k)
    c.update()
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      // The visitor can look around, but cannot leave the hall or fall
      // through the floor.
      minDistance={1.5}
      maxDistance={40}
      maxPolarAngle={Math.PI / 2.02}
      minPolarAngle={0.12}
      enablePan={false}
      // The scroll drives the camera, so the wheel must NOT zoom.
      enableZoom={false}
    />
  )
}

/**
 * A soft spotlight that follows the selected house's table.
 *
 * THREE.JS GOTCHA: a SpotLight aims at `light.target`, a plain Object3D that
 * three.js creates but does NOT add to the scene. An object outside the
 * scene graph never has its matrixWorld updated, so the light would aim at
 * the world origin no matter where the target was placed. The fix is to add
 * the target to the scene with `<primitive>` and assign it to the light.
 */
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
    target.updateMatrixWorld()
    if (light.current) {
      light.current.target = target
    }
  }, [spot, features.tableTopY, target])

  return (
    <>
      {/* Adding the target to the scene is what makes it aim correctly. */}
      <primitive object={target} />
      <spotLight
        ref={light}
        position={[spot.x, features.bounds.height * 0.72, spot.z + 2]}
        angle={0.5}
        penumbra={0.8}
        intensity={90}
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
  /** Fired while the model downloads, 0..1. */
  onLoadProgress?: (p: number) => void
  /** Fired once the model is in the scene. */
  onModelReady?: () => void
}

export default function HallScene({ house, onLoadProgress, onModelReady }: HallSceneProps) {
  const [tier] = useState<QualityTier>(() => detectQualityTier())
  const [modelFailed, setModelFailed] = useState(false)

  // The fitted room's dimensions. Until the model reports in, the scene is
  // laid out against the procedural fallback's size.
  const [bounds, setBounds] = useState<HallBounds>(PROCEDURAL_HALL)

  // Once the real model reports its size, the scene is laid out against
  // THAT — not against the procedural fallback's numbers.
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

  return (
    <Canvas
      shadows={tier !== 'low'}
      dpr={dpr}
      // Tone mapping keeps the candlelight from blowing out the highlights.
      gl={{
        antialias: tier === 'high',
        powerPreference: 'high-performance',
        alpha: false,
      }}
      camera={{
        fov: 58,
        near: 0.1,
        far: 300,
        position: path[0].position,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <color attach="background" args={['#0a0714']} />
      <fog attach="fog" args={['#0a0714', 26, 96]} />

      <Suspense fallback={null}>
        {modelFailed ? (
          <GreatHall />
        ) : (
          <DiningHallModel
            onProgress={onLoadProgress}
            onReady={onModelReady}
            onBounds={setBounds}
            // If the GLB cannot be fetched or parsed, fall back to the
            // procedural hall rather than showing an empty room.
            onError={() => setModelFailed(true)}
          />
        )}
      </Suspense>

      {/* The magic, layered over whichever hall is showing. */}
      <FloatingCandles count={candleCount} features={features} />
      <EnchantedCeiling features={features} />
      <Sparkles features={features} />

      <HouseSpotlight house={house} features={features} castShadow={tier !== 'low'} />
      <CameraRig path={path} />

      {/* Drops the pixel ratio automatically when the frame rate sags. */}
      <AdaptiveDpr pixelated={false} />
      <Preload all />
    </Canvas>
  )
}
