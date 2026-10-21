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
 * WHY A PATH AND NOT PRESETS
 *   The old design had four buttons that jumped between fixed viewpoints.
 *   That reads as a slideshow. A path reads as a journey: the visitor
 *   enters through the doors, walks the aisle, rises to the rafters, and
 *   ends looking down the length of the hall.
 *
 * THE INTERPOLATION
 *   Positions are interpolated with a smoothstep, so the camera eases into
 *   and out of each keyframe instead of moving at a constant rate. The
 *   easing is applied to the *fraction between keyframes*, not to the
 *   positions themselves, so the camera never overshoots.
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

/** How tall the scrollable page is, in pixels. */
export const SCROLL_LENGTH = 5600

/**
 * Builds the keyframes for a given hall.
 *
 * The path is expressed in terms of the hall's own dimensions, so it works
 * for the real model and for the procedural fallback alike.
 *
 * EVERY KEYFRAME STAYS INSIDE THE ROOM
 *   The real model is 20.2 wide, 17.4 tall and 56 long, with the entrance
 *   doors at z = -27 and the High Table at z = +27. A camera placed at
 *   z = -31 would be OUTSIDE the entrance wall, looking at the back of the
 *   door — which renders as a black wall, not a hall. So the path starts
 *   just inside the threshold.
 */
export function buildCameraPath(features: HallFeatures): CameraKeyframe[] {
  const { bounds, aisleX, highTableZ } = features
  const { width, height, length } = bounds
  const half = length / 2

  // Eye level for a standing witch or wizard, and just above it for the
  // table-height shots.
  const eyeY = 1.9

  return [
    {
      // 0 — On the threshold, looking down the length of the hall.
      position: [aisleX, 4.2, -half + 6],
      target: [aisleX, 5.4, 6],
      label: 'The Great Hall',
      caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
    },
    {
      // 1 — Down at table height, walking the aisle.
      position: [aisleX, eyeY, -half * 0.42],
      target: [aisleX, 2.4, half * 0.2],
      label: 'The Aisle',
      caption: 'Goblets and platters stretch away on both sides, catching the candlelight.',
    },
    {
      // 2 — Turning to the house tables on the left.
      position: [aisleX + 0.4, eyeY + 0.3, -half * 0.16],
      target: [-width * 0.3, 1.3, -half * 0.12],
      label: 'The House Tables',
      caption: 'Every witch and wizard has a table, and every table has a house.',
    },
    {
      // 3 — Swinging across to the other side of the hall.
      position: [aisleX - 0.4, eyeY + 0.3, half * 0.1],
      target: [width * 0.32, 1.3, half * 0.06],
      label: 'Four Houses',
      caption: 'Choose a house. It decides your table, your colour and your chances of the Cup.',
    },
    {
      // 4 — Rising above the feast, looking back down the hall.
      position: [aisleX, height * 0.36, -half * 0.2],
      target: [aisleX, 1.8, half * 0.24],
      label: 'The Rafters',
      caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
    },
    {
      // 5 — Up among the floating candles.
      position: [aisleX, height * 0.72, -half * 0.3],
      target: [aisleX, height * 0.3, half * 0.18],
      label: 'The Enchanted Ceiling',
      caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
    },
    {
      // 6 — The High Table.
      position: [aisleX, 3.2, highTableZ - 12],
      target: [aisleX, 2.2, highTableZ],
      label: 'The High Table',
      caption: 'Where the professors watch, and where the House Cup is decided.',
    },
    {
      // 7 — The last look, from high and wide.
      position: [-width * 0.26, height * 0.5, -half * 0.42],
      target: [aisleX, 2.0, half * 0.05],
      label: 'Enchanthia',
      caption: '12–14 September 2026 · Hogwarts College of Wizardry',
    },
  ]
}

/** Smoothstep — eases in and out, and never overshoots. */
function smoothstep(t: number): number {
  return t * t * (3 - 2 * t)
}

/**
 * Samples the path at a normalised position.
 *
 * `t` is 0..1 along the whole path. The result is the camera's position
 * and look-at target for that moment.
 */
export function sampleCameraPath(
  path: CameraKeyframe[],
  t: number,
): { position: [number, number, number]; target: [number, number, number] } {
  if (path.length === 0) {
    return { position: [0, 0, 0], target: [0, 0, 0] }
  }
  if (path.length === 1) {
    return { position: path[0].position, target: path[0].target }
  }

  const clamped = Math.min(1, Math.max(0, t))
  const scaled = clamped * (path.length - 1)
  const index = Math.min(path.length - 2, Math.floor(scaled))
  const local = smoothstep(scaled - index)

  const a = path[index]
  const b = path[index + 1]

  const lerp = (u: number, v: number) => u + (v - u) * local

  return {
    position: [
      lerp(a.position[0], b.position[0]),
      lerp(a.position[1], b.position[1]),
      lerp(a.position[2], b.position[2]),
    ],
    target: [
      lerp(a.target[0], b.target[0]),
      lerp(a.target[1], b.target[1]),
      lerp(a.target[2], b.target[2]),
    ],
  }
}

/** The index of the keyframe the camera is closest to, for the caption. */
export function activeKeyframe(path: CameraKeyframe[], t: number): number {
  if (path.length === 0) return 0
  return Math.min(path.length - 1, Math.round(Math.min(1, Math.max(0, t)) * (path.length - 1)))
}
