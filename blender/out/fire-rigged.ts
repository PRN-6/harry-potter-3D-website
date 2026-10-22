/**
 * WHERE THE FIRES ARE
 *
 * The Great Hall model has four kinds of fire in it, and the model itself
 * cannot animate any of them — the fireplace is a bed of painted coals, the
 * wall sconces hold bare candles, and the table candles have a flat painted
 * flame sprite on top.
 *
 * So the flames are added as a SEPARATE layer, placed at the positions
 * MEASURED from the model. This file holds those positions.
 *
 * WHERE THE NUMBERS COME FROM
 *   `tools/emit-fire-data.mjs` splits the GLB into its loose parts and
 *   reports each one's world position, so the flames sit exactly on the
 *   model's own candles, bowls and coal bed rather than on a guess.
 *
 *   • the fireplace     — the model's own glowing coals (`auto_28`)
 *   • the wall sconces  — the gold bowls (`auto_78`) and their candles
 *   • the table candles — the model's own painted flames (`auto_38`)
 *   • the high table    — the two big painted flames at the far end
 *
 * THE COORDINATE SYSTEM
 *   The positions below are in the MODEL's own space — the same space the
 *   bounding box in `DiningHallModel.tsx` is measured in. The model is
 *   scaled down to `TARGET_LENGTH` and re-centred at load time, and
 *   `buildFirePoints` applies that same transform here, so the flames
 *   follow the model exactly.
 */

/** How the model's own space maps onto the fitted scene. */
export interface FireTransform {
  /** The model's scale factor (world units per model unit). */
  scale: number
  /** The model's re-centring offset, in world units. */
  offset: [number, number, number]
}

/** Where a fire source sits, in the fitted scene's world units. */
export interface FirePoint {
  /** Position in the scene. */
  position: [number, number, number]
  /** How big the flame is, in world units. */
  scale: number
  /** Which kind of fire this is — it changes the colour and the light. */
  kind: FireKind
}

/** The kinds of fire in the hall. */
export type FireKind = 'fireplace' | 'brazier' | 'sconce' | 'candle'

/**
 * The fire sources, measured from the model.
 *
 * `source` is the position in the model's own units, before the transform,
 * and `scale` is the flame's width in those same units.
 */
interface RawFire {
  source: [number, number, number]
  scale: number
  kind: FireKind
}

/**
 * The great fireplace, against the left wall.
 *
 * Measured from the model's own glowing coals — one bed lying on the
 * hearth, a few hundred units from the entrance.
 */
const FIREPLACE: RawFire[] = [
  { source: [     -67,    434.5,   -489.5], scale:    42, kind: 'fireplace' },
]

/**
 * The gold bowls on the wall columns, each holding a candle.
 *
 * Measured from the model's own gold (`auto_78`), with the candle that
 * stands in each bowl found from the wax (`auto_9`) beside it.
 */
const SCONCES: RawFire[] = [
  { source: [   471.6,    494.6,  -1159.4], scale:   3.2, kind: 'sconce' },
  { source: [     -53,    501.6,  -1137.7], scale:   3.2, kind: 'sconce' },
  { source: [   472.2,    501.6,   -965.3], scale:   3.2, kind: 'sconce' },
  { source: [   -55.5,    494.6,   -953.2], scale:   3.2, kind: 'sconce' },
  { source: [   472.2,    501.6,   -770.7], scale:   3.2, kind: 'sconce' },
  { source: [     -56,    501.6,   -769.5], scale:   3.2, kind: 'sconce' },
  { source: [   471.6,    501.6,   -587.5], scale:   3.2, kind: 'sconce' },
  { source: [   469.1,    494.6,   -408.2], scale:   3.2, kind: 'sconce' },
  { source: [   470.6,    501.6,   -214.8], scale:   3.2, kind: 'sconce' },
  { source: [   -54.5,    501.6,   -197.6], scale:   3.2, kind: 'sconce' },
  { source: [   470.6,    501.6,    -27.1], scale:   3.2, kind: 'sconce' },
  { source: [   -54.5,    500.9,     -8.7], scale:   3.2, kind: 'sconce' },
  { source: [   470.6,    501.6,    161.7], scale:   3.2, kind: 'sconce' },
  { source: [   -54.4,    501.6,    180.3], scale:   3.2, kind: 'sconce' },
]

/**
 * The two great fires on the high table.
 *
 * Measured from the model's own painted flames (`auto_38`) at the far
 * end of the hall, where the headmaster's table is.
 */
const BRAZIERS: RawFire[] = [
  { source: [   222.6,    482.5,      131], scale:     7, kind: 'brazier' },
  { source: [   193.8,    482.1,    131.6], scale:     7, kind: 'brazier' },
]

/**
 * The candles standing on the banquet tables.
 *
 * Measured from the model's own painted flames (`auto_38`) on the four
 * long tables — five candles to a table.
 */
const TABLE_CANDLES: RawFire[] = [
  { source: [   416.3,    437.2,  -1165.9], scale:   2.6, kind: 'candle' },
  { source: [    24.3,      437,  -1160.3], scale:   2.6, kind: 'candle' },
  { source: [   140.2,    436.9,  -1150.7], scale:   2.6, kind: 'candle' },
  { source: [   304.6,    436.9,    -1126], scale:   2.6, kind: 'candle' },
  { source: [    27.7,    436.9,     -937], scale:   2.6, kind: 'candle' },
  { source: [   301.5,    437.1,   -930.6], scale:   2.6, kind: 'candle' },
  { source: [   413.6,    436.8,     -930], scale:   2.6, kind: 'candle' },
  { source: [   144.1,    437.1,   -913.9], scale:   2.6, kind: 'candle' },
  { source: [   416.3,    436.8,   -702.7], scale:   2.6, kind: 'candle' },
  { source: [    24.3,    436.9,   -697.3], scale:   2.6, kind: 'candle' },
  { source: [   140.2,    437.1,   -687.6], scale:   2.6, kind: 'candle' },
  { source: [   304.2,    436.8,   -663.2], scale:   2.6, kind: 'candle' },
  { source: [    27.2,    436.8,   -443.9], scale:   2.6, kind: 'candle' },
  { source: [   300.8,    436.9,   -436.8], scale:   2.6, kind: 'candle' },
  { source: [   413.8,    436.8,   -436.4], scale:   2.6, kind: 'candle' },
  { source: [   144.2,      437,   -420.3], scale:   2.6, kind: 'candle' },
  { source: [   415.8,    436.9,   -209.3], scale:   2.6, kind: 'candle' },
  { source: [    24.3,      437,   -204.7], scale:   2.6, kind: 'candle' },
  { source: [   139.8,      437,   -194.2], scale:   2.6, kind: 'candle' },
  { source: [   304.8,      437,   -169.4], scale:   2.6, kind: 'candle' },
]

/**
 * The model's own space, and the fitted scene's space.
 *
 * The model's room runs 630 units across (X), 1744 along (Z, which is the
 * hall's length) and 540 tall (Y, which is up in the SketchUp export).
 *
 * The model is rotated into Y-up by the root node, and the fitted scene
 * scales the hall's LENGTH to `TARGET_LENGTH` world units. So one model
 * unit along the hall is `TARGET_LENGTH / 1744` world units.
 */

/** How long the room should be, in world units. Matches `DiningHallModel`. */
const TARGET_LENGTH = 56

/** The hall's length in the model's own units. */
const MODEL_LENGTH = 1744.5

/** The hall's width in the model's own units. */
const MODEL_WIDTH = 630

/** The hall's height in the model's own units. */
const MODEL_HEIGHT = 540.7

/**
 * Builds the fire points for a given model fit.
 *
 * `scale` and `offset` come from the same fit the model itself is given, so
 * the flames land on the model's own candles and bowls.
 */
export function buildFirePoints(
  scale: number,
  offset: [number, number, number],
): FirePoint[] {
  const all = [...FIREPLACE, ...BRAZIERS, ...SCONCES, ...TABLE_CANDLES]
  return all.map((f) => ({
    // The model's X runs across the hall, its Z runs along it, and its Y is
    // up — but the model arrives Z-up, so the axes are swapped on the way in.
    position: [
      f.source[0] * scale + offset[0],
      f.source[1] * scale + offset[1],
      f.source[2] * scale + offset[2],
    ],
    scale: f.scale * scale,
    kind: f.kind,
  }))
}

/** The model-space size of the hall, for callers that need to reason about it. */
export const MODEL_SIZE = {
  width: MODEL_WIDTH,
  height: MODEL_HEIGHT,
  length: MODEL_LENGTH,
  targetLength: TARGET_LENGTH,
}
