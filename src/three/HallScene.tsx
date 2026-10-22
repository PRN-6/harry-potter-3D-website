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
import { FadeOverlay } from './FadeOverlay'
import { buildCameraPath, type CameraPath } from './cameraPath'
import { hallFeatures, PROCEDURAL_HALL, type HallBounds, type HallFeatures } from './hallBounds'
import { buildFirePoints } from './firePoints'
import { HOUSE_BY_ID, type HouseId } from '../data/houses'
import { animateDoors, type DoorHinges } from './doorRig'

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
 *   The hall is the real `hogwarts_dining_hall_rigged.glb`. If that file
 *   fails to load, the procedural `GreatHall` takes over so the visitor
 *   never gets an empty box. The magical atmosphere — candles, stars,
 *   motes — is layered on top of EITHER hall.
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
 * The scroll position therefore IS the timeline: 0 is on the threshold,
 * 100% is the last keyframe.
 *
 * THE CAMERA IS PLACED, NOT STEERED
 *   The path in `cameraPath.ts` is a spline, and it is sampled by ARC
 *   LENGTH, so the camera moves at one even speed the whole way. It is
 *   then placed there DIRECTLY — the position and the look-at target are
 *   both written straight from the sample.
 *
 *   The older version of this file lerped the camera towards the sample
 *   every frame. That is what made the movement feel like it was
 *   fighting something: the camera was always chasing a position that
 *   had already moved on, so it lagged, and the lag was worst exactly
 *   where the path was turning. Placing the camera directly removes the
 *   lag entirely, and the spline removes the stutter.
 *
 * THE LOOK TARGET IS SMOOTHED, THE POSITION IS NOT
 *   The target gets a gentle easing so that the framing rotates like a
 *   camera operator's neck rather than snapping between shots. The
 *   position does not, because easing it would re-introduce the lag.
 *
 * THE VISITOR CAN STILL LOOK AROUND
 *   The old scene used OrbitControls, which fought the scroll for the
 *   camera's position and made the movement feel like it was being
 *   argued with. Instead the mouse now adds a small OFFSET to the look
 *   target — the visitor can glance at the ceiling or across the hall
 *   without ever leaving the path. The offset is damped, so letting go
 *   of the mouse drifts the view back to where the shot wants it.
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
  fadeRef: React.MutableRefObject<HTMLDivElement | null>
}) {
  const { camera } = useThree()

  const desired = useMemo(() => new THREE.Vector3(), [])
  const desiredTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothTarget = useMemo(() => new THREE.Vector3(), [])

  // The scroll position. It is written to a ref rather than state so that
  // scrolling never triggers a React re-render — the camera moves in
  // `useFrame`, at 60fps, and a re-render per scroll event would be far
  // too slow.
  const scrollRef = useRef(0)

  // The visitor's mouse, as a -1..1 offset from the centre of the screen.
  const look = useRef({ x: 0, y: 0, targetX: 0, targetY: 0 })

  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      scrollRef.current = max > 0 ? window.scrollY / max : 0
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)

    // The mouse-look. It is a TARGET that the camera eases towards, so
    // the movement is damped and never snaps.
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

  // Prime the smoothed target at the first sample, so the camera does not
  // swing around on the very first frame.
  const primed = useRef(false)

  // The chapter the camera is currently at. The caption follows the
  // CAMERA, not the scrollbar: the path is sampled by arc length, so a
  // chapter changes when the camera arrives at that shot, which is not
  // the same moment as a fixed fraction of the page.
  const chapter = useRef(-1)

  useFrame((_, delta) => {
    const { position, target } = path.sample(scrollRef.current)

    desired.set(position[0], position[1], position[2])
    desiredTarget.set(target[0], target[1], target[2])

    // The mouse offset, damped. It eases towards the pointer and back to
    // centre when the pointer leaves.
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

    // The camera is PLACED. No lerp, no lag.
    camera.position.copy(desired)

    // The look-at is eased, so the framing turns smoothly.
    // Frame-rate independent: the same curve at 30fps and 120fps.
    const k = 1 - Math.pow(0.002, delta)
    smoothTarget.lerp(desiredTarget, k)

    // The mouse offset, applied perpendicular to the view, so looking
    // around slides the gaze rather than shearing the camera.
    // We only enable mouse-look after the camera has moved slightly
    // from the start to keep the initial shot perfectly centered.
    const forward = desiredTarget.clone().sub(desired).normalize()
    const right = new THREE.Vector3().crossVectors(forward, camera.up).normalize()
    const up = new THREE.Vector3().crossVectors(right, forward).normalize()

    const mouseEnabled = scrollRef.current > 0.01
    const offset = mouseEnabled
      ? right.multiplyScalar(l.x * 2.6).add(up.multiplyScalar(-l.y * 1.6))
      : new THREE.Vector3(0, 0, 0)

    camera.lookAt(smoothTarget.clone().add(offset))

    // Report the chapter, but only when it actually changes — the
    // caption above the scene re-renders on every change, and firing it
    // every frame would re-render React sixty times a second.
    const active = path.chapterAt(scrollRef.current)
    if (active !== chapter.current) {
      chapter.current = active
      onChapter?.(active)
    }

    // Animate the doors based on scroll progress.
    if (doorRef.current) {
      // The target progress based on scroll.
      const targetT = Math.min(1, scrollRef.current * 20)

      animateDoors(doorRef.current, targetT)

      // Handle the screen fade at halfway point (t ≈ 0.5)
      if (fadeRef.current) {
        // Hold at black for ~3 seconds while text is shown.
        // To do this in a scroll-driven timeline, we need a "plateau" in the opacity function.
        // t=0.2: start fade in
        // t=0.4: reach full black (opacity 1)
        // t=0.6: stay full black (hold)
        // t=1.0: fade out to 0
        const t = targetT
        let opacity = 0

        if (t < 0.4) {
          // Fade in: 0 to 1 from t=0.2 to t=0.4
          opacity = Math.max(0, (t - 0.2) / 0.2)
        } else if (t < 0.5) {
          // Hold: opacity = 1 from t=0.4 to t=0.5
          opacity = 1
        } else {
          // Slow fade out: 1 to 0 from t=0.5 to t=1.0
          opacity = Math.max(0, 1 - (t - 0.5) / 0.5)
        }

        fadeRef.current.style.opacity = opacity.toString()
      }
    }
  })

  return null
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
    target.updateWorldMatrix()
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
  /** Fired when the camera arrives at a new chapter. */
  onChapter?: (index: number) => void
}

export default function HallScene({
  house,
  onLoadProgress,
  onModelReady,
  onChapter,
  fadeRef,
}: HallSceneProps & { fadeRef: React.RefObject<HTMLDivElement> }) {
  const [tier] = useState<QualityTier>(() => detectQualityTier())
  const [modelFailed, setModelFailed] = useState(false)

  // The fitted room's dimensions. Until the model reports in, the scene is
  // laid out against the procedural fallback's size.
  const [bounds, setBounds] = useState<HallBounds>(PROCEDURAL_HALL)

  // The transform that maps the model's own space into the scene. The fire
  // layer needs it, so the flames land on the model's own candles, bowls
  // and firebox rather than floating near them.
  const [fit, setFit] = useState<ModelFit | null>(null)

  // The doors' opening progress.
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

  // The fires, placed once the model's fit is known.
  const firePoints = useMemo(() => {
    if (!fit) return []
    return buildFirePoints(fit.scale, fit.offset)
  }, [fit])

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
        position: path.keyframes[0].position,
      }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
        gl.shadowMap.type = THREE.PCFSoftShadowMap
      }}
    >
      <color attach="background" args={['#0a0714']} />
      <fog attach="fog" args={['#0a0714', 26, 96]} />

      {/* The environment map. Every material in the model is a PBR
          material with nothing to reflect, which is what makes it look
          flat — this gives them all a candlelit room to reflect. */}
      <HallEnvironment intensity={0.6} />

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

      {/* The fires: the fireplace, the wall braziers and the table candles.
          They are a separate layer because the model's own fire is a flat
          orange sheet that cannot be animated. */}
      {firePoints.length > 0 && (
        <Fire points={firePoints} lowPower={tier === 'low'} />
      )}

      {/* The magic, layered over whichever hall is showing. */}
      <FloatingCandles count={candleCount} features={features} />
      <EnchantedCeiling features={features} />
      <Sparkles features={features} />

      {/* The stone antechamber outside the open doors, so the doorway
          frames a lit corridor rather than a void. */}
      <Entrance features={features} />

      <HouseSpotlight house={house} features={features} castShadow={tier !== 'low'} />
      <CameraRig path={path} onChapter={onChapter} doorRef={doorRef} fadeRef={fadeRef} />

      {/* The bloom. The model's fires are painted, and a painted flame has
          no glow around it — this is what makes it read as light. It
          takes over the render loop, so it goes last. */}
      <HallBloom enabled={tier !== 'low'} strength={0.5} radius={0.55} threshold={0.6} />

      {/* Drops the pixel ratio automatically when the frame rate sags. */}
      <AdaptiveDpr pixelated={false} />
      <Preload all />
    </Canvas>
  )
}
