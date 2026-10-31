import * as THREE from 'three'
import type { HallFeatures } from './hallBounds'

/**
 * THE CAMERA PATH
 *
 * The site is one full-screen 3D hall, and scrolling flies the camera
 * through it. The path is a list of keyframes — each one a camera position
 * and a look-at target — and the scroll position picks the point along the
 * path between two keyframes.
 *
 * THE SCROLL IS THE TIMELINE
 *   The page is `SCROLL_LENGTH` pixels tall and the canvas is fixed behind
 *   it, so scrolling 0 → 100% of the page maps exactly onto keyframe 0 →
 *   the last keyframe. `CameraRig` reads `window.scrollY` every frame.
 *
 * THE CHOREOGRAPHY
 *   1. Starts at the entrance doorway.
 *   2. On the first scroll, doors open and the camera glides straight through
 *      the doorway into the middle of the hall.
 *   3. Smoothly glances right to admire the right house tables (Hufflepuff & Slytherin).
 *   4. Smoothly rotates across to the left to admire the left house tables (Gryffindor & Ravenclaw).
 *   5. Rises up above the feast into the rafters and enchanted sky.
 *   6. Descends down to the Main Head Table.
 *   7. Returns back to the top for the grand panoramic wide finale.
 */

export interface CameraKeyframe {
  /** The camera's position. */
  position: [number, number, number]
  /** What the camera looks at. */
  target: [number, number, number]
  /** The on-screen chapter title, shown as the visitor scrolls past. */
  label?: string
  /** The one-line caption under the title. */
  caption?: string
}

/** How tall the scrollable page is, in pixels. Optimized so 1 scroll reaches the hall center. */
export const SCROLL_LENGTH = 4200

/**
 * A camera path: the keyframes it was built from, plus the splines that
 * interpolate them.
 */
export interface CameraPath {
  /** The keyframes, in order. */
  keyframes: CameraKeyframe[]
  /**
   * Samples the path at a normalised position.
   * `t` is 0..1 along the whole path.
   */
  sample(t: number): { position: [number, number, number]; target: [number, number, number] }
  /**
   * The index of the keyframe the camera is nearest to.
   */
  chapterAt(t: number): number
}

/**
 * Builds the keyframes for a given hall.
 */
export function buildCameraPath(features: HallFeatures): CameraPath {
  const { bounds, aisleX, highTableZ } = features
  const { width, height, length } = bounds
  const half = length / 2

  // Eye level for a standing witch or wizard.
  const eyeY = 1.9

  // The doorway's plane.
  const doorZ = features.entranceZ

  const keyframes: CameraKeyframe[] = [
    {
      // 0 — At the doorway entrance.
      position: [aisleX, 2.2, doorZ - 1.2],
      target: [aisleX, 2.3, doorZ + 14],
      label: 'The Great Hall',
      caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
    },
    {
      // 1 — Crossing through the parting doors into the hall.
      position: [aisleX, 2.0, doorZ + 5.0],
      target: [aisleX, 2.05, doorZ + 18],
      label: 'The Aisle',
      caption: 'Crossing the threshold into the ancient, candlelit hall.',
    },
    {
      // 2 — Middle of the hall, straight down the central aisle.
      position: [aisleX, eyeY, -half * 0.35],
      target: [aisleX, eyeY + 0.05, half * 0.1],
      label: 'The Long Tables',
      caption: 'Four benches, four houses, and a place set for every witch and wizard.',
    },
    {
      // 3 — See right: house tables on the right. Target stays well ahead (+Z) for silky-smooth rotation.
      position: [aisleX - 0.4, eyeY, -half * 0.15],
      target: [width * 0.32, 1.4, half * 0.12],
      label: 'House Tables',
      caption: 'Golden platters and goblets catching the warm glow of candlelight.',
    },
    {
      // 4 — Rotate to left: house tables on the left. Target stays well ahead (+Z) for silky-smooth rotation.
      position: [aisleX + 0.4, eyeY, half * 0.05],
      target: [-width * 0.32, 1.4, half * 0.32],
      label: 'The Four Houses',
      caption: 'Choose a house. It decides your table, your colour and your chances of the Cup.',
    },
    {
      // 5 — Go up: rising above the feast towards the vault.
      position: [aisleX, height * 0.35, half * 0.18],
      target: [aisleX, 1.8, half * 0.60],
      label: 'The Vault',
      caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
    },
    {
      // 6 — Up among the rafters and candles.
      position: [aisleX, height * 0.58, -half * 0.10],
      target: [aisleX, height * 0.25, half * 0.36],
      label: 'High Above',
      caption: 'A thousand candles drift above the feast, reflecting the magic within.',
    },
    {
      // 7 — Near the enchanted ceiling / sky.
      position: [aisleX, height * 0.78, -half * 0.22],
      target: [aisleX, height * 0.42, half * 0.16],
      label: 'The Enchanted Sky',
      caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
    },
    {
      // 8 — Descending towards the Main Head Table.
      position: [aisleX, height * 0.22, half * 0.22],
      target: [aisleX, 2.0, highTableZ],
      label: 'Head of the Hall',
      caption: 'Where the professors watch, and where the House Cup is decided.',
    },
    {
      // 9 — The Main Head Table, close.
      position: [aisleX, 2.3, highTableZ - 6.5],
      target: [aisleX, 1.85, highTableZ],
      label: 'Points of Glory',
      caption: 'The fires burn gold tonight, and every goblet is already full.',
    },
    {
      // 10 — Back to the top: grand panoramic wide shot looking down the hall.
      position: [-width * 0.28, height * 0.48, -half * 0.44],
      target: [aisleX, 1.8, half * 0.1],
      label: 'Enchanthia',
      caption: '12–14 September 2026 · Hogwarts College of Wizardry',
    },
  ]

  return createPath(keyframes)
}

/**
 * Turns keyframes into a smooth, constant-speed path.
 */
function createPath(keyframes: CameraKeyframe[]): CameraPath {
  const points = keyframes.map((k) => new THREE.Vector3(...k.position))
  const targets = keyframes.map((k) => new THREE.Vector3(...k.target))

  const positionCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)
  const targetCurve = new THREE.CatmullRomCurve3(targets, false, 'centripetal', 0.5)

  const lengths = positionCurve.getLengths(200)
  const totalLength = lengths[lengths.length - 1] || 1

  const keyframeFractions = keyframes.map((_, i) => {
    const parameter = i / (keyframes.length - 1)
    const tableIndex = parameter * (lengths.length - 1)
    const low = Math.floor(tableIndex)
    const high = Math.min(lengths.length - 1, low + 1)
    const fraction = tableIndex - low
    const arc = lengths[low] + (lengths[high] - lengths[low]) * fraction
    return arc / totalLength
  })

  return {
    keyframes,

    sample(t: number) {
      const clamped = Math.min(1, Math.max(0, t))
      const u = clamped
      const parameter = positionCurve.getUtoTmapping(u, 0)

      const p = positionCurve.getPoint(parameter)
      const q = targetCurve.getPoint(parameter)

      return {
        position: [p.x, p.y, p.z],
        target: [q.x, q.y, q.z],
      }
    },

    chapterAt(t: number) {
      const u = Math.min(1, Math.max(0, t))

      let best = 0
      let bestDistance = Infinity
      for (let i = 0; i < keyframeFractions.length; i++) {
        const distance = Math.abs(keyframeFractions[i] - u)
        if (distance < bestDistance) {
          bestDistance = distance
          best = i
        }
      }
      return best
    },
  }
}
