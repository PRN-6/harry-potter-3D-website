import React, { Suspense, useEffect, useRef } from 'react'
import * as THREE from 'three'
import { useGLTF, useProgress } from '@react-three/drei'
import type { Group } from 'three'
import type { HallBounds } from './hallBounds'
import { findDoorHinges, openDoors } from './doorRig'

/**
 * THE DINING HALL — the real 3D model.
 *
 * `hogwarts_dining_hall_rigged.glb` is the Blender export of the Great
 * Hall (the model originated as a Sketchfab export by Asmodeo666,
 * CC-BY-4.0, and was re-exported from Blender, then rigged by
 * `blender/build_door_rig.py`). It is a 36 MB file: 29 meshes, ~190k
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
 * THE DOORS
 *   The model carries two hinge empties, `DoorHinge_L` and `DoorHinge_R`,
 *   with the two door leaves parented to them. `build_door_rig.py` cut a
 *   real opening in the end wall, so the camera can walk through the
 *   doorway rather than into masonry. The doors are turned open ONCE,
 *   here, when the model loads — they do not animate on the scroll.
 *
 * THE MATERIALS
 *   The model is a SketchUp export, and SketchUp exports are blunt: every
 *   material is the same roughness, none of them has a normal map, and
 *   the "metal" is not metal. This block gives the hall its surface back:
 *
 *   • NORMAL MAPS. A painted texture lit by a light from one direction
 *     looks like a photograph on cardboard. A normal map gives the stone
 *     its bumps, and the stonework in this hall has a lot of detail that
 *     is currently being thrown away.
 *   • ROUGHNESS. Stone, wood, cloth and gold all scatter light
 *     differently. Left at the export's flat 0.6, everything reads as the
 *     same plastic. The gold in particular has to be smooth enough to
 *     catch a highlight, or it looks like paint.
 *   • METALNESS. The gold bowls, the sconces and the candlesticks are
 *     metal. Without metalness they are grey paint.
 *   • COLOUR. The textures are washed out towards pink. A slight warm
 *     tint on the stone and a cool one on the shadow side is what makes
 *     a candlelit hall feel like stone rather than plaster.
 *
 * PERFORMANCE — the file is heavy, so:
 *   • it is fetched with a progress bar, and the site shows a loader
 *   • the model's own textures are left as they are; re-encoding them to
 *     KTX2/Basis would cut the download by ~70%, but that needs a
 *     `gltf-transform` pass, which is a build step, not a runtime fix
 */

const MODEL_URL = '/models/hogwarts_dining_hall_rigged.glb'

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
  /** Called with the transform that maps the model's space to the scene. */
  onFit?: (fit: ModelFit) => void
}

/**
 * The transform that maps the model's own space into the fitted scene.
 *
 * The fire layer needs this: the flames are placed at positions measured
 * in the model's space, and they have to be transformed by exactly the
 * same scale and offset the model itself is given, or they would float
 * away from the candles and bowls they belong to.
 */
export interface ModelFit {
  /** World units per model unit. */
  scale: number
  /** The model's re-centring offset, in world units. */
  offset: [number, number, number]
}

/**
 * Scales and centres the model so its bounding box fits the hall's size.
 *
 * Returns the fitted room's dimensions, so the camera path and the candle
 * lattice can be laid out against the real room rather than against a
 * guess. The model's length is pinned to `TARGET_LENGTH`; its width and
 * height follow from the export's proportions.
 */
function fitModel(group: Group): { bounds: HallBounds; fit: ModelFit } | null {
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
  const offset: [number, number, number] = [
    -center.x * scale,
    -box.min.y * scale,
    -center.z * scale,
  ]
  group.position.set(offset[0], offset[1], offset[2])

  return {
    bounds: {
      width: size.x * scale,
      height: size.y * scale,
      length: size.z * scale,
    },
    fit: { scale, offset },
  }
}

/**
 * How each of the model's materials should behave.
 *
 * The keys are the material names from the export, and the values say how
 * the surface scatters light. The names are not pretty — `auto_14` is the
 * stone, `auto_78` is the gold — but they are what the file contains, and
 * they were identified by sampling each texture's average colour with
 * `blender/out/material-colours.json`.
 */
interface Surface {
  /** 0 = mirror, 1 = chalk. */
  roughness: number
  /** 0 = wood, 1 = metal. */
  metalness: number
  /** A tint multiplied over the texture. */
  tint?: [number, number, number]
}

/**
 * THE SURFACES
 *
 * `auto_78` is the brightest thing in the model (average colour 0.92,
 * 0.70, 0.05 — a deep gold) and it is the gold: the wall bowls, the
 * sconces, the candlesticks. Metal at a low roughness, so it flares when
 * the candlelight sweeps across it.
 *
 * `auto_9` is the candle wax (0.76, 0.62, 0.30 — a warm cream) and
 * `auto_53` / `auto_100` are the pale stone and plaster.
 *
 * The rest are stone, wood and fabric, and they are tuned by feel: stone
 * is rough and slightly warm, wood is rougher and browner, and the
 * banners and cloth are rough all the way down so they never catch a
 * specular highlight.
 */
const SURFACES: Record<string, Surface> = {
  // The gold: bowls, sconces, candlesticks, door furniture.
  auto_78: { roughness: 0.24, metalness: 0.92, tint: [1.0, 0.86, 0.52] },
  // The painted fire — handled by the emissive pass below.
  auto_38: { roughness: 0.6, metalness: 0 },
  auto_28: { roughness: 0.6, metalness: 0 },
  // Candle wax: waxy, and it glows a little from within.
  auto_9: { roughness: 0.52, metalness: 0, tint: [1.0, 0.95, 0.84] },
  // The pale stone and plaster of the walls and the ribs.
  auto_14: { roughness: 0.88, metalness: 0, tint: [1.0, 0.97, 0.93] },
  auto_2: { roughness: 0.9, metalness: 0, tint: [0.98, 0.96, 0.94] },
  auto_30: { roughness: 0.85, metalness: 0, tint: [1.0, 0.98, 0.95] },
  auto_53: { roughness: 0.86, metalness: 0, tint: [1.0, 0.97, 0.93] },
  auto_100: { roughness: 0.86, metalness: 0, tint: [1.0, 0.97, 0.93] },
  // The dark wood: the beams, the tables, the benches.
  auto: { roughness: 0.78, metalness: 0, tint: [1.0, 0.93, 0.85] },
  auto_4: { roughness: 0.8, metalness: 0, tint: [1.0, 0.93, 0.84] },
  auto_7: { roughness: 0.8, metalness: 0, tint: [0.98, 0.9, 0.82] },
  auto_8: { roughness: 0.82, metalness: 0, tint: [0.98, 0.9, 0.82] },
  auto_32: { roughness: 0.8, metalness: 0, tint: [0.98, 0.91, 0.83] },
  auto_35: { roughness: 0.82, metalness: 0, tint: [0.96, 0.9, 0.84] },
  auto_86: { roughness: 0.8, metalness: 0, tint: [0.98, 0.9, 0.82] },
  // The warm bronze of the braziers and the tall candlesticks.
  auto_66: { roughness: 0.38, metalness: 0.7, tint: [1.0, 0.88, 0.7] },
  auto_12: { roughness: 0.55, metalness: 0.35, tint: [1.0, 0.9, 0.76] },
  auto_23: { roughness: 0.82, metalness: 0, tint: [0.98, 0.92, 0.86] },
  // The banners and the cloth: matte, and a little cool so the warm
  // candlelight has something to play against.
  auto_37: { roughness: 0.95, metalness: 0, tint: [0.94, 0.94, 1.0] },
  auto_45: { roughness: 0.95, metalness: 0, tint: [0.94, 0.94, 1.0] },
  auto_54: { roughness: 0.92, metalness: 0, tint: [0.95, 0.98, 0.96] },
  auto_6: { roughness: 0.8, metalness: 0, tint: [0.98, 0.92, 0.85] },
}

/**
 * Builds a normal map for a texture, from the texture's own luminance.
 *
 * THE WHY
 *   A normal map is a direction map: each texel says which way the
 *   surface faces. Most of the model's detail is painted as light and
 *   dark in the albedo — the mortar lines between the stones, the grain
 *   in the wood, the fluting on the columns — and with a flat normal map
 *   all of that detail lies down flat when a light moves across it. It
 *   looks like a photograph.
 *
 *   A normal map makes the light REACT to that detail: the mortar lines
 *   catch a shadow, the wood grain catches a highlight, the stonework
 *   has depth. That is the difference between "a picture of a hall" and
 *   "a hall".
 *
 * THE HOW
 *   The bump is derived from the luminance of the colour texture: bright
 *   pixels are high, dark pixels are low. A Sobel filter turns that
 *   height field into a gradient, and the gradient becomes a normal.
 *
 *   The result is a tangent-space normal map with the usual convention:
 *   R to the right, G upwards, B outwards. Three.js reads it directly.
 *
 *   It is generated ONCE per texture, at load, on the CPU, and it is
 *   cheap: the source textures are at most 1024².
 */
function buildNormalMap(texture: THREE.Texture, strength: number): THREE.Texture | null {
  const image = texture.image as
    | { width: number; height: number; data: Uint8Array }
    | HTMLCanvasElement
    | ImageBitmap
    | undefined
  if (!image) return null

  const { width, height, data } = image as {
    width: number
    height: number
    data: Uint8Array
  }
  if (!width || !height || !data) return null

  const out = new Uint8Array(width * height * 4)

  // The luminance of the texel to the left, at the same height.
  const lum = (x: number, y: number) => {
    const px = (x + width) % width
    const py = (y + height) % height
    const i = (py * width + px) * 4
    // Rec. 601 luma, which is what the eye weights.
    return (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255
  }

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      // Sobel: the height difference across the surface.
      const tl = lum(x - 1, y - 1)
      const t = lum(x, y - 1)
      const tr = lum(x + 1, y - 1)
      const l = lum(x - 1, y)
      const r = lum(x + 1, y)
      const bl = lum(x - 1, y + 1)
      const b = lum(x, y + 1)
      const br = lum(x + 1, y + 1)

      const dx = tl + 2 * l + bl - (tr + 2 * r + br)
      const dy = tl + 2 * t + tr - (bl + 2 * b + br)

      // The normal is perpendicular to the height gradient.
      let nx = dx * strength
      let ny = dy * strength
      let nz = 1

      const length = Math.hypot(nx, ny, nz)
      nx /= length
      ny /= length
      nz /= length

      const i = (y * width + x) * 4
      out[i] = Math.round((nx * 0.5 + 0.5) * 255)
      out[i + 1] = Math.round((ny * 0.5 + 0.5) * 255)
      out[i + 2] = Math.round((nz * 0.5 + 0.5) * 255)
      out[i + 3] = 255
    }
  }

  const normalMap = new THREE.DataTexture(out, width, height, THREE.RGBAFormat)
  normalMap.needsUpdate = true
  // The normal map is DATA, not colour — it must not be sRGB-decoded.
  normalMap.colorSpace = THREE.NoColorSpace
  normalMap.wrapS = texture.wrapS
  normalMap.wrapT = texture.wrapT
  normalMap.minFilter = THREE.LinearMipmapLinearFilter
  normalMap.magFilter = THREE.LinearFilter
  normalMap.generateMipmaps = true
  normalMap.anisotropy = texture.anisotropy
  return normalMap
}

/** How hard each material's derived bump is. */
const BUMP_STRENGTH: Record<string, number> = {
  // Stone: strong. The mortar lines and the blockwork are the whole point.
  auto_14: 3.2,
  auto_2: 2.6,
  auto_30: 2.4,
  auto_53: 2.4,
  auto_100: 2.4,
  auto_23: 2.2,
  // Wood: the grain is fine, so the bump is fine.
  auto: 1.4,
  auto_4: 1.6,
  auto_7: 1.6,
  auto_8: 1.6,
  auto_32: 1.6,
  auto_35: 1.6,
  auto_86: 1.6,
  // The gold: hammered, so a soft, broad bump.
  auto_78: 1.0,
  auto_66: 1.2,
  auto_12: 1.4,
  // Cloth and banners: barely there.
  auto_37: 0.8,
  auto_45: 0.8,
  auto_54: 0.8,
  // Wax: smooth.
  auto_9: 0.5,
}

function Model({ onReady, onProgress, onBounds, onFit }: ModelProps) {
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

    // ── The materials ────────────────────────────────────────────────────
    //
    // The model paints its own fires — a flat orange sprite on every
    // candle, and a bed of glowing coals in the fireplace. As a plain
    // texture they are just orange paint, which is exactly what a fake
    // flame looks like.
    //
    // Giving those materials an EMISSIVE map makes the painted fire glow
    // for real: the same texture, but this time it is treated as light
    // rather than as colour. The bloom pass then smears it, and the flat
    // sprite becomes a flame.
    //
    // The emissive map is the material's OWN base-colour texture, so the
    // fire lights up and nothing else does.
    const EMISSIVE_MATERIALS = new Set(['auto_38', 'auto_28'])
    const normalMaps = new Map<THREE.Texture, THREE.Texture>()

    scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh
      if (!mesh.isMesh) return
      const material = mesh.material as THREE.MeshStandardMaterial
      if (!material?.isMeshStandardMaterial) return

      // Every material in the export is a plain PBR surface, and every one
      // of them is a single-sided shell. The hall is only ever seen from
      // inside, but the DOORS are seen from both sides as they stand open
      // in the wall — so the leaves are made double-sided, and only the
      // leaves.
      const surface = SURFACES[material.name]
      if (surface) {
        material.roughness = surface.roughness
        material.metalness = surface.metalness
        if (surface.tint) {
          material.color.setRGB(surface.tint[0], surface.tint[1], surface.tint[2])
        }
      }

      // The normal map, derived from the texture's own luminance.
      //
      // The map is built ONCE per source texture and shared by every
      // material that uses it, because a normal map is 4 bytes per texel
      // and there is no point making the same one twice.
      if (material.map && !material.normalMap) {
        const strength = BUMP_STRENGTH[material.name]
        if (strength) {
          const existing = normalMaps.get(material.map)
          if (existing) {
            material.normalMap = existing
          } else {
            const built = buildNormalMap(material.map, strength)
            if (built) {
              normalMaps.set(material.map, built)
              material.normalMap = built
            }
          }
        }
      }

      // The painted fire glows.
      if (EMISSIVE_MATERIALS.has(material.name) && material.map) {
        material.emissiveMap = material.map
        material.emissive = new THREE.Color(0xffffff)
        // The painted fire is already bright in the texture, so the emissive
        // is turned down a little — otherwise the bloom eats it.
        material.emissiveIntensity = 0.85
      }

      material.needsUpdate = true
    })

    const result = fitModel(g)

    // The model is static, so its matrices never change.
    g.updateMatrixWorld(true)

    // The doors stand open. They are turned once, here, and they stay put.
    // See `doorRig.ts` for why they have to be double-sided.
    openDoors(findDoorHinges(scene))

    // Publish the fitted dimensions, so the rest of the scene can be laid
    // out against the real room.
    if (result) {
      onBounds?.(result.bounds)
      onFit?.(result.fit)
    }

    onReady?.()
  }, [scene, onReady, onBounds, onFit])

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
