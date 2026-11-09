import { useEffect } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

/**
 * THE HALL'S ENVIRONMENT MAP
 *
 * WHY THIS IS THE BIGGEST REALISM WIN
 *   Every material in the model is a PBR material with `roughness: 0.6` and
 *   a painted base-colour texture, and none of them had an environment to
 *   reflect. A PBR surface with nothing to reflect looks FLAT — the texture
 *   reads as a photograph stuck onto cardboard, because there is no
 *   specular highlight rolling across it and no ambient bounce filling the
 *   shadowed side.
 *
 *   An environment map fixes both. It is a tiny pre-filtered cube of the
 *   room, sampled by every material in the scene, and it costs one texture
 *   lookup per pixel.
 *
 * WHAT IS IN IT
 *   The hall is lit from below by candles and from above by an enchanted
 *   sky, so the environment is built to match:
 *     • a WARM floor bounce  — the candlelight coming up off the stone
 *     • a COOL violet ceiling — the night sky through the vault
 *     • a ring of small WARM lights — the candles themselves, which give
 *       the gold and the polished wood a moving specular highlight
 *   The gold is what sells it: gold with a warm-from-below, cool-from-above
 *   environment is what gold looks like in a candlelit hall.
 *
 * THE SIZE OF IT
 *   The room in this scene is a 20-unit box standing in for a hall that is
 *   56 units long, so the reflections are scaled down to match.
 */

/** Builds the little scene that gets pre-filtered into the environment map. */
function buildEnvironmentScene(): THREE.Scene {
  const scene = new THREE.Scene()

  // The shell: the dark stone of the room itself. It is nearly black,
  // because a hall lit only by candles IS nearly black.
  const shell = new THREE.Mesh(
    new THREE.BoxGeometry(20, 12, 20),
    new THREE.MeshBasicMaterial({ color: 0x0a0709, side: THREE.BackSide }),
  )
  scene.add(shell)

  // The floor bounce: the candlelight coming up off the stone floor.
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0x4a2410 }),
  )
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -5.9
  scene.add(floor)

  // The enchanted sky above: a dim, cold violet.
  const sky = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshBasicMaterial({ color: 0x2b2450 }),
  )
  sky.rotation.x = Math.PI / 2
  sky.position.y = 5.9
  scene.add(sky)

  // The candles: a ring of small warm lights down both sides of the hall.
  // These are the specular highlights that travel across the gold.
  const candleGeo = new THREE.PlaneGeometry(0.9, 0.9)
  const candleMat = new THREE.MeshBasicMaterial({ color: 0xffb055 })
  for (let i = 0; i < 10; i++) {
    const t = i / 9
    const z = -8 + t * 16
    for (const x of [-7.2, 7.2]) {
      const candle = new THREE.Mesh(candleGeo, candleMat)
      candle.position.set(x, 1.2 + Math.sin(t * 9) * 0.6, z)
      candle.lookAt(0, 1, 0)
      scene.add(candle)
    }
  }

  // The two great fires: the brightest things in the hall, and the reason
  // the gold flares when the camera swings past them.
  const fireMat = new THREE.MeshBasicMaterial({ color: 0xff7a22 })
  for (const x of [-3.4, 3.4]) {
    const fire = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.2), fireMat)
    fire.position.set(x, -2.6, 0)
    fire.lookAt(0, 1, 0)
    scene.add(fire)
  }

  return scene
}

/**
 * Installs the environment map on the scene.
 *
 * The map is generated ONCE and then disposed of — the source scene and its
 * geometry are throwaway, and only the pre-filtered cube map survives.
 */
export default function HallEnvironment({ intensity = 0.55 }: { intensity?: number }) {
  const { gl, scene } = useThree()

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl)
    pmrem.compileEquirectangularShader()

    const source = buildEnvironmentScene()
    const target = pmrem.fromScene(source, 0.04, 0.1, 100)

    scene.environment = target.texture
    scene.environmentIntensity = intensity

    // Throw the source away — only the pre-filtered map is needed.
    source.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (mesh.geometry) mesh.geometry.dispose()
    })
    pmrem.dispose()

    return () => {
      scene.environment = null
      target.dispose()
    }
  }, [gl, scene, intensity])

  return null
}
