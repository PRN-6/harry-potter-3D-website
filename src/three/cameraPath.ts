import * as THREE from 'three'
import type { HallFeatures } from './hallBounds'

/**
 * THE CAMERA PATH
 *
 * The site is one full-screen 3D hall, with 7 discrete scroll points:
 * Point 0: At the doorway entrance
 * Point 1 (Scroll 1): Enter through doors into the middle of the hall
 * Point 2 (Scroll 2): Look right at the house tables
 * Point 3 (Scroll 3): Rotate left across to the left house tables
 * Point 4 (Scroll 4): Rise up above the feast towards the vault
 * Point 5 (Scroll 5): High in the enchanted sky among the candles
 * Point 6 (Scroll 6): Descending down to the Main Head Table
 * Point 7 (Scroll 7): Back to the top for the grand panoramic wide view
 */

export interface CameraKeyframe {
  /** The camera's position. */
  position: [number, number, number]
  /** What the camera looks at. */
  target: [number, number, number]
  /** Lens field of view in degrees (cinematic breathing). */
  fov?: number
  /** Dutch tilt roll angle in radians (cinematic banking into turns). */
  roll?: number
  /** The on-screen chapter title. */
  label?: string
  /** The one-line caption under the title. */
  caption?: string
}

export const SCROLL_LENGTH = 3500

export interface CameraPathSample {
  position: [number, number, number]
  target: [number, number, number]
  fov: number
  roll: number
}

export interface CameraPath {
  keyframes: CameraKeyframe[]
  keyframeFractions: number[]
  sample(t: number): CameraPathSample
  chapterAt(t: number): number
}

/**
 * Builds the 8 keyframe points for the 7-scroll journey with cinematic
 * lens field-of-view breathing and dynamic Dutch tilt banking.
 */
export function buildCameraPath(features: HallFeatures, isMobile: boolean = false): CameraPath {
  const { bounds, aisleX, highTableZ } = features
  const { width, height, length } = bounds
  const half = length / 2
  const eyeY = 1.9
  const doorZ = features.entranceZ

  // Exact doorway center in world coordinates:
  // The Great Hall model doorway midpoint is at 0.093 in raw GLTF units,
  // and DiningHallModel shifts the entire model group by +0.5 along X.
  // Thus the exact doorway center / seam in world coordinates is:
  // 0.09305 + 0.5 = 0.59305.
  const doorCenterX = 0.593

  const keyframes: CameraKeyframe[] = [
    {
      // 0 — Point 0: At the doorway entrance
      // Mobile: center the door in the screen at doorCenterX (0.593)
      // Desktop: preserve original aisleX framing unchanged
      position: isMobile ? [doorCenterX, 2.2, doorZ - 1.2] : [aisleX, 2.2, doorZ - 1.2],
      target: isMobile ? [doorCenterX, 2.3, doorZ + 14] : [aisleX, 2.3, doorZ + 14],
      label: 'The Great Hall',
      caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
    },
    {
      // 1 — Point 1 (Scroll 1): Enter through doors into middle of the hall
      position: [aisleX, eyeY, -half * 0.35],
      target: [aisleX, eyeY + 0.05, half * 0.1],
      label: 'The Long Tables',
      caption: 'Four benches, four houses, and a place set for every witch and wizard.',
    },
    {
      // 2 — Point 2 (Scroll 2): See right - house tables on the right
      position: [aisleX - 0.5, eyeY, -half * 0.15],
      target: [width * 0.32, 1.4, half * 0.12],
      label: 'House Tables',
      caption: 'Golden platters and goblets catching the warm glow of candlelight.',
    },
    {
      // 3 — Point 3 (Scroll 3): Rotate left - house tables on the left
      position: [aisleX + 0.5, eyeY, half * 0.05],
      target: [-width * 0.32, 1.4, half * 0.32],
      label: 'The Four Houses',
      caption: 'Choose a house. It decides your table, your colour and your chances of the Cup.',
    },
    {
      // 4 — Point 4 (Scroll 4): Go up - rising above the feast towards the vault
      position: [aisleX, height * 0.40, half * 0.18],
      target: [aisleX, 1.8, half * 0.60],
      label: 'The Vault',
      caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
    },
    {
      // 5 — Point 5 (Scroll 5): High among rafters and enchanted sky
      position: [aisleX, height * 0.78, -half * 0.18],
      target: [aisleX, height * 0.38, half * 0.20],
      label: 'The Enchanted Sky',
      caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
    },
    {
      // 6 — Point 6 (Scroll 6): Descending to the Main Head Table
      position: [aisleX, 2.6, highTableZ - 11.0],
      target: [aisleX, 2.1, highTableZ],
      label: 'Head of the Hall',
      caption: 'Where the professors watch, and where the House Cup is decided.',
    },
    {
      // 7 — Point 7 (Scroll 7): Back to the top - grand panoramic wide view (complete)
      position: [-width * 0.28, height * 0.48, -half * 0.44],
      target: [aisleX, 1.8, half * 0.1],
      label: 'AJ-ASTRIX2K27',
      caption: 'Hogwarts College of Wizardry · Grand Fest Edition',
    },
  ]

  return createPath(keyframes)
}

/**
 * Turns keyframes into a smooth, constant-speed cinematic path with continuous
 * lens breathing (FOV) and Dutch tilt (roll) interpolation.
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
    keyframeFractions,

    sample(t: number): CameraPathSample {
      const clamped = Math.min(1, Math.max(0, t))
      const parameter = positionCurve.getUtoTmapping(clamped, 0)

      const p = positionCurve.getPoint(parameter)
      const q = targetCurve.getPoint(parameter)

      // Smoothly interpolate lens FOV and roll between keyframes using cubic Hermite easing
      let kLow = 0
      for (let i = 0; i < keyframeFractions.length - 1; i++) {
        if (clamped >= keyframeFractions[i]) {
          kLow = i
        }
      }
      const kHigh = Math.min(keyframes.length - 1, kLow + 1)
      const u0 = keyframeFractions[kLow]
      const u1 = keyframeFractions[kHigh]
      const span = u1 - u0
      const localT = span > 0.00001 ? Math.max(0, Math.min(1, (clamped - u0) / span)) : 0
      // Smoothstep: 3t^2 - 2t^3
      const easedT = localT * localT * (3 - 2 * localT)

      const fov0 = keyframes[kLow].fov ?? 50
      const fov1 = keyframes[kHigh].fov ?? 50
      const fov = THREE.MathUtils.lerp(fov0, fov1, easedT)

      const roll0 = keyframes[kLow].roll ?? 0
      const roll1 = keyframes[kHigh].roll ?? 0
      const roll = THREE.MathUtils.lerp(roll0, roll1, easedT)

      return {
        position: [p.x, p.y, p.z],
        target: [q.x, q.y, q.z],
        fov,
        roll,
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
