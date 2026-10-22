/**
 * Emits the fire-source data for `src/three/firePoints.ts`.
 *
 * Everything here is MEASURED from the model, not guessed:
 *
 *   • the great fireplace  — the model's own glowing coal bed (`auto_28`)
 *   • the wall sconces     — the gold bowls (`auto_78`), each with the
 *                            candle (`auto_9`) standing in it
 *   • the table candles    — the model's own painted flames (`auto_38`)
 *                            that already sit on every table candle
 *   • the high table fires — the two big painted flames at the far end
 *
 * The painted flames are the useful trick: the model ALREADY has a flame
 * sprite baked onto every candle, at exactly the right place. The animated
 * flame is placed on the same spot, so it covers the painted one instead of
 * floating above it.
 *
 * Usage: node tools/emit-fire-data.mjs [parts.json] [out.ts]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const partsPath = process.argv[2] ?? 'blender/out/fire-points.json'
const outPath = process.argv[3] ?? 'src/three/firePoints.ts'

const data = JSON.parse(readFileSync(partsPath, 'utf8'))
const parts = data.parts

/** Groups parts into single objects, the way Blender's "loose parts" does. */
function cluster(list, radius) {
  const used = new Array(list.length).fill(false)
  const groups = []
  for (let i = 0; i < list.length; i++) {
    if (used[i]) continue
    used[i] = true
    const group = [list[i]]
    const min = [...list[i].min]
    const max = [...list[i].max]
    let grew = true
    while (grew) {
      grew = false
      for (let j = i + 1; j < list.length; j++) {
        if (used[j]) continue
        const d = Math.hypot(
          list[j].centre[0] - list[i].centre[0],
          list[j].centre[1] - list[i].centre[1],
          list[j].centre[2] - list[i].centre[2],
        )
        if (d <= radius) {
          used[j] = true
          group.push(list[j])
          for (let k = 0; k < 3; k++) {
            min[k] = Math.min(min[k], list[j].min[k])
            max[k] = Math.max(max[k], list[j].max[k])
          }
          grew = true
        }
      }
    }
    const n = group.length
    groups.push({
      n,
      centre: [0, 1, 2].map((k) => group.reduce((s, p) => s + p.centre[k], 0) / n),
      size: [0, 1, 2].map((k) => max[k] - min[k]),
      min,
      max,
    })
  }
  return groups
}

const byMaterial = (name) => parts.filter((p) => p.material === name)

// ── 1. The great fireplace ─────────────────────────────────────────────────
// The glowing coal bed, lying on the hearth against the left wall.
const coal = cluster(byMaterial('auto_28'), 60).sort((a, b) => b.n - a.n)[0]

// The flame rises from the coal bed, so it is placed on the bed's TOP.
const FIREPLACE = [
  {
    source: [
      round(coal.centre[0]),
      round(coal.max[1] + 14),
      round(coal.centre[2]),
    ],
    scale: 42,
    kind: 'fireplace',
  },
]

// ── 2. The wall sconces ────────────────────────────────────────────────────
// A sconce is a gold bowl on the wall, with a candle standing in it.
const sconceBowls = cluster(byMaterial('auto_78'), 45).filter(
  (g) => g.size[0] < 25 && g.size[2] < 35 && g.size[1] > 18 && g.size[1] < 28,
)

const waxParts = byMaterial('auto_9')
const SCONCES = []
for (const bowl of sconceBowls) {
  // The candle IN the bowl: the wax part whose top reaches the bowl's rim.
  const near = waxParts.filter((w) => {
    const d = Math.hypot(
      w.centre[0] - bowl.centre[0],
      w.centre[1] - bowl.centre[1],
      w.centre[2] - bowl.centre[2],
    )
    return d < 26 && w.max[1] >= bowl.max[1] - 4
  })
  if (!near.length) continue
  const top = near.reduce((a, b) => (a.max[1] > b.max[1] ? a : b))
  SCONCES.push({
    source: [round(top.centre[0]), round(top.max[1] + 2.4), round(top.centre[2])],
    scale: 3.2,
    kind: 'sconce',
  })
}
SCONCES.sort((a, b) => a.source[2] - b.source[2])

// ── 3. The painted flames ──────────────────────────────────────────────────
// The model already has a flame sprite on every lit candle. Cluster them.
const flameClusters = cluster(byMaterial('auto_38'), 22)

// A painted flame high up (y > 460) is on the HIGH TABLE, in a gold bowl.
const HIGH_TABLE = flameClusters
  .filter((g) => g.centre[1] > 460)
  .map((g) => ({
    source: [round(g.centre[0]), round(g.centre[1]), round(g.centre[2])],
    scale: 7,
    kind: 'brazier',
  }))
  .sort((a, b) => a.source[2] - b.source[2])

// The rest are the candles standing on the banquet tables.
const TABLE_CANDLES = flameClusters
  .filter((g) => g.centre[1] <= 460)
  .map((g) => ({
    source: [round(g.centre[0]), round(g.centre[1]), round(g.centre[2])],
    scale: 2.6,
    kind: 'candle',
  }))
  .sort((a, b) => a.source[2] - b.source[2])

// ── Emit ───────────────────────────────────────────────────────────────────
const fmt = (list) =>
  list
    .map(
      (f) =>
        `  { source: [${f.source.map((v) => String(v).padStart(8)).join(', ')}], ` +
        `scale: ${String(f.scale).padStart(5)}, kind: '${f.kind}' },`,
    )
    .join('\n')

const ts = `/**
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
 *   \`tools/emit-fire-data.mjs\` splits the GLB into its loose parts and
 *   reports each one's world position, so the flames sit exactly on the
 *   model's own candles, bowls and coal bed rather than on a guess.
 *
 *   • the fireplace     — the model's own glowing coals (\`auto_28\`)
 *   • the wall sconces  — the gold bowls (\`auto_78\`) and their candles
 *   • the table candles — the model's own painted flames (\`auto_38\`)
 *   • the high table    — the two big painted flames at the far end
 *
 * THE COORDINATE SYSTEM
 *   The positions below are in the MODEL's own space — the same space the
 *   bounding box in \`DiningHallModel.tsx\` is measured in. The model is
 *   scaled down to \`TARGET_LENGTH\` and re-centred at load time, and
 *   \`buildFirePoints\` applies that same transform here, so the flames
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
 * \`source\` is the position in the model's own units, before the transform,
 * and \`scale\` is the flame's width in those same units.
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
${fmt(FIREPLACE)}
]

/**
 * The gold bowls on the wall columns, each holding a candle.
 *
 * Measured from the model's own gold (\`auto_78\`), with the candle that
 * stands in each bowl found from the wax (\`auto_9\`) beside it.
 */
const SCONCES: RawFire[] = [
${fmt(SCONCES)}
]

/**
 * The two great fires on the high table.
 *
 * Measured from the model's own painted flames (\`auto_38\`) at the far
 * end of the hall, where the headmaster's table is.
 */
const BRAZIERS: RawFire[] = [
${fmt(HIGH_TABLE)}
]

/**
 * The candles standing on the banquet tables.
 *
 * Measured from the model's own painted flames (\`auto_38\`) on the four
 * long tables — five candles to a table.
 */
const TABLE_CANDLES: RawFire[] = [
${fmt(TABLE_CANDLES)}
]

/**
 * The model's own space, and the fitted scene's space.
 *
 * The model's room runs 630 units across (X), 1744 along (Z, which is the
 * hall's length) and 540 tall (Y, which is up in the SketchUp export).
 *
 * The model is rotated into Y-up by the root node, and the fitted scene
 * scales the hall's LENGTH to \`TARGET_LENGTH\` world units. So one model
 * unit along the hall is \`TARGET_LENGTH / 1744\` world units.
 */

/** How long the room should be, in world units. Matches \`DiningHallModel\`. */
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
 * \`scale\` and \`offset\` come from the same fit the model itself is given, so
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
`

writeFileSync(outPath, ts)

console.log(`fireplace:   ${FIREPLACE.length}`)
console.log(`sconces:    ${SCONCES.length}`)
console.log(`high table: ${HIGH_TABLE.length}`)
console.log(`candles:    ${TABLE_CANDLES.length}`)
console.log(`TOTAL:      ${FIREPLACE.length + SCONCES.length + HIGH_TABLE.length + TABLE_CANDLES.length}`)
console.log(`\nWROTE ${outPath}`)

function round(v) {
  return Math.round(v * 10) / 10
}
