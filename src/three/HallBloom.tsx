import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'

/**
 * THE BLOOM
 *
 * A candle flame is a light source that is BRIGHTER than white. When the
 * eye sees something brighter than the page it is reading, it smears — the
 * same way a streetlight smears on a wet road at night. That smear is what
 * makes a fire look like it is actually giving off light.
 *
 * The model is painted, so it has no such smear. The painted flame on a
 * table candle is a flat orange sprite, and flat orange is exactly what a
 * fake flame looks like. Bloom is what turns it into light.
 *
 * HOW IT WORKS
 *   `UnrealBloomPass` renders the scene, keeps only the pixels brighter
 *   than the threshold, blurs them at five different sizes, and adds the
 *   results back. A small bright flame therefore gets a tight hot core
 *   with a wide soft halo, which is exactly how a real flame looks.
 *
 * WHY THREE.JS'S OWN PASSES
 *   The `postprocessing` library would do the same job, but it is a new
 *   dependency and this project already ships three.js — which bundles
 *   these passes. No install, no version skew.
 *
 * THE RENDER ORDER MATTERS
 *   The composer's LAST pass must write to the screen, and the tone mapping
 *   has to happen AFTER the bloom, not before. Blooming an already
 *   tone-mapped image washes the highlights out. `OutputPass` does the
 *   tone mapping and the sRGB conversion in one go, at the end.
 */
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

export default function HallBloom({
  strength = 0.55,
  radius = 0.5,
  threshold = 0.62,
  enabled = true,
}: HallBloomProps) {
  const { gl, scene, camera, size, viewport } = useThree()

  const composer = useMemo(() => {
    if (!enabled) return null

    const c = new EffectComposer(gl)
    c.addPass(new RenderPass(scene, camera))

    const bloom = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      strength,
      radius,
      threshold,
    )
    c.addPass(bloom)

    // The tone mapping and the sRGB conversion happen HERE, at the end.
    c.addPass(new OutputPass())

    return c
  }, [gl, scene, camera, enabled, strength, radius, threshold])

  // The composer has to follow the canvas — a resize, or a change of pixel
  // ratio, would otherwise leave the bloom buffer at the old size and the
  // glow would drift away from the flames.
  useEffect(() => {
    if (!composer) return
    composer.setPixelRatio(viewport.dpr)
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height, viewport.dpr])

  // Dispose of the render targets when the composer goes away.
  useEffect(() => {
    return () => {
      composer?.dispose()
    }
  }, [composer])

  /**
   * A positive render priority takes the render loop over from R3F, so the
   * scene is drawn through the composer instead of straight to the screen.
   */
  useFrame(() => {
    composer?.render()
  }, 1)

  return null
}
