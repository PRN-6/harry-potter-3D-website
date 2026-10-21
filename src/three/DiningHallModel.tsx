import React, { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, useProgress } from '@react-three/drei'
import type { Group } from 'three'
import type { HallBounds } from './hallBounds'

/**
 * THE DINING HALL — the real 3D model.
 *
 * `undifined.glb` is the Blender export of the Great Hall (the model
 * originated as a Sketchfab export by Asmodeo666, CC-BY-4.0, and was
 * re-exported from Blender). It is a 37 MB file: 28 meshes, ~192k
 * triangles and 25 PNG textures, of which roughly 16 MB is texture data.
 *
 * The export arrives in the Sketchfab coordinate space:
 *   • Z-up, converted to Y-up by the root node's matrix
 *   • roughly 630 units long, 540 wide and 990 tall
 *   • origin somewhere off to one side, NOT at the centre of the room
 *
 * So the model is RE-CENTRED and RE-SCALED at load time: the bounding box
 * is measured, the model is scaled to a target size, and it is moved so the
 * centre of the room sits at the world origin. This is what lets the
 * existing camera code keep working without knowing anything about the
 * model's original units.
 *
 * PERFORMANCE — the file is heavy, so:
 *   • it is fetched with a progress bar, and the site shows a loader
 *   • shadows are disabled on the model itself (the room is lit by the
 *     scene's own lights, and shadow-mapping a 700k-triangle model is the
 *     single most expensive thing this scene could do on a phone)
 *   • the model's textures are left as they are; re-encoding them to
 *     KTX2/Basis would cut the download by ~70%, but that needs a
 *     `gltf-transform` pass, which is a build step, not a runtime fix
 */

const MODEL_URL = '/models/undifined.glb'

/** How long the room should be, in world units, after scaling. */
const TARGET_LENGTH = 56

interface ModelProps {
  /** Called once the model is loaded and fitted. */
  onReady?: () => void
  /** Called with 0..1 while the file downloads. */
  onProgress?: (p: number) => void
  /** Called if the file cannot be fetched or parsed. */
  onError?: () => void
  /** Called with the fitted room's dimensions. */
  onBounds?: (bounds: HallBounds) => void
}

/**
 * Scales and centres the model so its bounding box fits the hall's size.
 *
 * Returns the fitted room's dimensions, so the camera path and the candle
 * lattice can be laid out against the real room rather than against a
 * guess. The model's length is pinned to `TARGET_LENGTH`; its width and
 * height follow from the export's proportions.
 */
function fitModel(group: Group): HallBounds | null {
  const box = new THREE.Box3().setFromObject(group)
  if (box.isEmpty()) return null

  const size = box.getSize(new THREE.Vector3())
  const center = box.getCenter(new THREE.Vector3())

  // The room's long axis is Z in the Sketchfab export (630 units) and the
  // height is Y. Scale by the largest horizontal dimension so the room
  // fills the hall without distorting it.
  const longest = Math.max(size.x, size.z)
  const scale = TARGET_LENGTH / longest

  group.scale.setScalar(scale)

  // Recentre: move the model so the middle of the room is at the origin.
  // The scale is applied to the translation too, because the offset is
  // measured in the model's original units.
  group.position.set(-center.x * scale, -box.min.y * scale, -center.z * scale)

  return {
    width: size.x * scale,
    height: size.y * scale,
    length: size.z * scale,
  }
}

function Model({ onReady, onProgress, onBounds }: ModelProps) {
  const group = useRef<Group>(null)
  const { progress } = useProgress()

  // The GLTF is fetched with Draco/meshopt support if available, and the
  // whole scene is static, so it is cached aggressively by the browser.
  const { scene } = useGLTF(MODEL_URL, true)

  // The model is fitted exactly once.
  //
  // The effect below publishes the fitted dimensions, and the parent
  // stores them in state — which re-renders, which hands this component a
  // NEW `onReady` closure, which would re-run the effect, which would
  // publish the dimensions again… forever. A ref guard breaks the cycle.
  const fitted = useRef(false)

  useEffect(() => {
    onProgress?.(progress / 100)
  }, [progress, onProgress])

  useEffect(() => {
    const g = group.current
    if (!g || fitted.current) return
    fitted.current = true

    // SketchUp exports carry a LINES primitive holding the model's raw edge
    // wireframe. three.js loads it as `LineSegments` with the default white
    // material, which draws a white cage of dotted lines over the whole
    // hall. The current export is triangles-only, but a re-export from
    // SketchUp can bring it straight back, so any line geometry is dropped
    // here rather than being left to chance.
    //
    // This runs BEFORE the model is measured, so the wireframe cannot
    // inflate the bounding box either. The objects are collected first and
    // removed afterwards: removing a child while `traverse` is walking the
    // tree can make it skip the next sibling.
    const junk: THREE.Object3D[] = []
    const LINE_TYPES = new Set(['Line', 'LineSegments', 'LineLoop', 'Points'])
    scene.traverse((obj) => {
      // A stray camera in the scene graph also confuses R3F's default
      // camera handling.
      if ((obj as THREE.Camera).isCamera || LINE_TYPES.has(obj.type)) {
        junk.push(obj)
      }
    })
    for (const obj of junk) {
      obj.parent?.remove(obj)
    }

    const bounds = fitModel(g)

    // The model is static, so its matrices never change.
    g.updateMatrixWorld(true)

    // Publish the fitted dimensions, so the rest of the scene can be laid
    // out against the real room.
    if (bounds) onBounds?.(bounds)

    onReady?.()
  }, [scene, onReady, onBounds])

  return (
    <group ref={group}>
      <primitive object={scene} />
    </group>
  )
}

/**
 * Catches a failed GLTF load.
 *
 * `useGLTF` throws while rendering when the file cannot be fetched or
 * parsed — a 404, a truncated download, a WebGL driver that refuses the
 * geometry. Without a boundary the error takes down the whole canvas and
 * the visitor sees a black rectangle. With it, the caller can swap in the
 * procedural hall.
 */
class ModelErrorBoundary extends React.Component<
  { children: React.ReactNode; onError: () => void },
  { failed: boolean }
> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch(error: Error) {
    console.error('[Enchanthia] The Dining Hall model failed to load:', error)
    this.props.onError()
  }

  render() {
    if (this.state.failed) return null
    return this.props.children
  }
}

/** Wraps the model with a suspense-friendly loader and an error boundary. */
export default function DiningHallModel({ onError, ...props }: ModelProps) {
  if (!onError) {
    return (
      <Suspense fallback={null}>
        <Model {...props} />
      </Suspense>
    )
  }

  return (
    <ModelErrorBoundary onError={onError}>
      <Suspense fallback={null}>
        <Model {...props} />
      </Suspense>
    </ModelErrorBoundary>
  )
}

// Preload the file as soon as the module is imported, so the download
// starts before the visitor scrolls the Hall into view.
useGLTF.preload(MODEL_URL)
