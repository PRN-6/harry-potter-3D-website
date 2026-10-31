import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

interface HallBloomProps {
  /** How bright the glow is. */
  strength?: number
  /** How far the glow spreads. */
  radius?: number
  /** The brightness above which pixels start to glow. */
  threshold?: number
  /** Whether the effect runs at all — off on low-power devices. */
  enabled?: boolean
}

function BloomPipeline({
  strength = 0.55,
  radius = 0.5,
  threshold = 0.62,
}: Omit<HallBloomProps, 'enabled'>) {
  const { gl, scene, camera, size, viewport } = useThree()

  // Capped pixel ratio for bloom to prevent heavy fillrate overhead on high-DPI screens
  const bloomDpr = Math.min(1.25, viewport.dpr)

  const composer = useMemo(() => {
    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))

    // Bloom computed at 75% resolution: softer glow and saves 44% pixel processing
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(Math.round(size.width * 0.75), Math.round(size.height * 0.75)),
      strength,
      radius,
      threshold,
    )
    c.addPass(bloom)
    c.addPass(new OutputPass())

    return c
  }, [gl, scene, camera, size.width, size.height, strength, radius, threshold])

  useEffect(() => {
    composer.setPixelRatio(bloomDpr)
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height, bloomDpr])

  useEffect(() => {
    return () => {
      composer.dispose()
    }
  }, [composer])

  useFrame(() => {
    composer.render()
  }, 1)

  return null
}

export default function HallBloom({
  enabled = true,
  ...props
}: HallBloomProps) {
  // If disabled, do not mount the pipeline so R3F renders directly to the canvas at full speed
  if (!enabled) return null
  return <BloomPipeline {...props} />
}
