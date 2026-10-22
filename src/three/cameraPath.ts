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
 * WHY A PATH AND NOT PRESETS
 *   The old design had four buttons that jumped between fixed viewpoints.
 *   That reads as a slideshow. A path reads as a journey: the visitor
 *   enters through the doors, walks the aisle, rises to the rafters,
 *   and ends looking down the length of the hall.
 *
 * WHY A SPLINE AND NOT A STRAIGHT LINE BETWEEN KEYFRAMES
 *   The first version of this file interpolated each segment with a
 *   smoothstep. That is the classic mistake: a smoothstep has ZERO
 *   velocity at both ends, so the camera decelerated to a dead stop at
 *   every keyframe and then accelerated again. Eleven keyframes meant
 *   eleven little stalls — the "jerky" feeling.
 *
 *   The path here is a CENTRIPETAL CATMULL-ROM SPLINE through the
 *   keyframes. It is C1-continuous: the camera's velocity is continuous
 *   all the way through, so it never stops and never changes direction
 *   abruptly. It also has no overshoot — centripetal parameterisation
 *   cannot loop or bulge the way the uniform version does, which matters
 *   when the path runs through a room with walls in it.
 *
 * THE SPEED IS CONSTANT
 *   The camera is placed by ARC LENGTH along the spline, not by spline
 *   parameter. Without this the camera would race through the short
 *   segments and crawl through the long ones, because spline parameter
 *   is not distance. The result is a camera that moves at one even
 *   speed the whole way through, like a dolly on rails.
 *
 * THE LOOK TARGET MOVES WITH IT
 *   The target has its own spline, and it is sampled at the SAME curve
 *   parameter as the position. The camera therefore always looks where
 *   the shot is pointing, and the framing rotates smoothly instead of
 *   snapping between keyframes.
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
export const SCROLL_LENGTH = 7200

/**
 * A camera path: the keyframes it was built from, plus the splines that
 * interpolate them.
 */
export interface CameraPath {
  /** The keyframes, in order. */
  keyframes: CameraKeyframe[]
  /**
   * Samples the path at a normalised position.
   *
   * `t` is 0..1 along the whole path. The result is the camera's position
   * and look-at target for that moment.
   */
  sample(t: number): { position: [number, number, number]; target: [number, number, number] }
  /**
   * The index of the keyframe the camera is nearest to.
   *
   * This is the chapter the visitor is looking at. It is measured in
   * ARC LENGTH, so a chapter changes when the camera has actually
   * ARRIVED at that shot rather than at some arbitrary scroll fraction.
   */
  chapterAt(t: number): number
}

/**
 * Builds the keyframes for a given hall.
 *
 * The path is expressed in terms of the hall's own dimensions, so it works
 * for the real model and for the procedural fallback alike.
 *
 * THE JOURNEY
 *   The path begins AT the doors — just inside the threshold, where the
 *   visitor has just come in — and never leaves the room. It walks the
 *   central aisle, turns to the house tables, rises through the rafters
 *   to the enchanted sky, comes back down to the High Table, and finishes
 *   looking back down the length of the hall.
 */
export function buildCameraPath(features: HallFeatures): CameraPath {
  const { bounds, aisleX, highTableZ } = features
  const { width, height, length } = bounds
  const half = length / 2

  // Eye level for a standing witch or wizard, and just above it for the
  // table-height shots.
  const eyeY = 1.9

  // The doorway's plane. The camera starts just INSIDE it — the visitor
  // has already stepped into the hall — and looks down its length.
  const doorZ = features.entranceZ

  const keyframes: CameraKeyframe[] = [
    {
      // 0 — In the antechamber, looking in through the open doors.
      //
      // The doors stand open, so the hall is framed by the doorway
      // itself: the visitor arrives in the corridor and sees the feast
      // through the opening. This is the shot the whole site is built
      // around, and it is why the doors are a fixed open pose rather
      // than an animation.
      position: [aisleX, 2.5, doorZ - 5.5],
      target: [aisleX, 3.0, doorZ + 16],
      label: 'The Great Hall',
      caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
    },
    {
      // 1 — Crossing the threshold, the hall opening up around you.
      position: [aisleX, 2.0, doorZ + 8.5],
      target: [aisleX, 2.9, 2],
      label: 'The Aisle',
      caption: 'Goblets and platters stretch away on both sides, catching the candlelight.',
    },
    {
      // 2 — Down the centre, at table height.
      position: [aisleX, eyeY, -half * 0.45],
      target: [aisleX, 1.95, half * 0.14],
      label: 'The Long Tables',
      caption: 'Four benches, four houses, and a place set for every witch and wizard.',
    },
    {
      // 3 — Turning to the house tables on the left.
      position: [aisleX + 0.8, eyeY - 0.3, -half * 0.16],
      target: [-width * 0.3, 1.15, -half * 0.12],
      label: 'Four Houses',
      caption: 'Choose a house. It decides your table, your colour and your chances of the Cup.',
    },
    {
      // 4 — Swinging across to the other side of the hall.
      position: [aisleX - 0.8, eyeY - 0.25, half * 0.12],
      target: [width * 0.32, 1.2, half * 0.08],
      label: 'A Thousand Candles',
      caption: 'A thousand candles drift above the tables, waiting for the first course.',
    },
    {
      // 5 — Rising above the feast.
      position: [aisleX, height * 0.3, -half * 0.05],
      target: [aisleX, 1.6, half * 0.36],
      label: 'The Vault',
      caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
    },
    {
      // 6 — Up among the rafters.
      position: [aisleX, height * 0.55, -half * 0.2],
      target: [aisleX, height * 0.25, half * 0.3],
      label: 'High Above',
      caption: 'From up here the four tables read as a single page of the story.',
    },
    {
      // 7 — Near the enchanted ceiling.
      position: [aisleX, height * 0.78, -half * 0.24],
      target: [aisleX, height * 0.42, half * 0.16],
      label: 'The Enchanted Sky',
      caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
    },
    {
      // 8 — Coming back down towards the High Table.
      position: [aisleX, height * 0.22, half * 0.22],
      target: [aisleX, 2.0, highTableZ],
      label: 'Head of the Hall',
      caption: 'Where the professors watch, and where the House Cup is decided.',
    },
    {
      // 9 — The High Table, close.
      position: [aisleX, 2.4, highTableZ - 7.5],
      target: [aisleX, 1.9, highTableZ],
      label: 'Points of Glory',
      caption: 'The fires burn gold tonight, and every goblet is already full.',
    },
    {
      // 10 — The last look, from high and wide.
      position: [-width * 0.28, height * 0.45, -half * 0.45],
      target: [aisleX, 1.8, half * 0.1],
      label: 'Enchanthia',
      caption: '12–14 September 2026 · Hogwarts College of Wizardry',
    },
  ]

  return createPath(keyframes)
}

/**
 * Turns keyframes into a smooth, constant-speed path.
 *
 * The spline is built once and the arc-length table is measured once, so
 * sampling the path every frame is just two table lookups.
 */
function createPath(keyframes: CameraKeyframe[]): CameraPath {
  const points = keyframes.map((k) => new THREE.Vector3(...k.position))
  const targets = keyframes.map((k) => new THREE.Vector3(...k.target))

  // `centripetal` is the parameterisation that cannot overshoot. The
  // uniform version of Catmull-Rom bulges badly when keyframes are
  // unevenly spaced, and this path's keyframes are VERY unevenly spaced
  // — a two-unit step next to a twenty-unit one.
  const positionCurve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)
  const targetCurve = new THREE.CatmullRomCurve3(targets, false, 'centripetal', 0.5)

  // Arc-length reparameterisation.
  //
  // `getLengths` measures the curve at 200 evenly-spaced PARAMETERS.
  // `getUtoTmapping` converts an arc-length fraction into the parameter
  // that sits at that distance along the curve — which is what makes the
  // camera move at a constant speed.
  const lengths = positionCurve.getLengths(200)
  const totalLength = lengths[lengths.length - 1] || 1

  // Where each keyframe sits along the path, as an arc-length fraction.
  //
  // The curve parameter of keyframe i is i / (n - 1), and the arc length
  // there is read out of the same table. These are the positions the
  // chapter titles are anchored to.
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

      // The arc-length fraction — this is the "distance along the path".
      const u = clamped

      // The parameter that sits at that distance. The position and the
      // target are both sampled at THIS parameter, so they stay in step.
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

      // The nearest keyframe in ARC LENGTH. Comparing fractions rather
      // than raw indices is what makes the chapter change when the
      // camera arrives at the shot.
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
