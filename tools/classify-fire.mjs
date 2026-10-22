/**
 * Turns the loose-part scan into the final list of fire sources.
 *
 * The parts are identified by the MATERIAL they use, which is how the
 * model's own textures name them:
 *
 *   auto_28 — the glowing coals in the great fireplace
 *   auto_78 — the polished gold of the wall braziers
 *   auto_9  — the wax of the candles standing on the banquet tables
 *
 * Each one is then clustered into the single object it belongs to, so a
 * brazier made of nine gold pieces becomes one brazier, not nine.
 *
 * The output is `blender/out/fire-points.json`, which
 * `src/three/firePoints.ts` reads.
 *
 * Usage: node tools/classify-fire.mjs [parts.json] [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs'

const partsPath = process.argv[2] ?? 'blender/out/fire-points.json'
const outPath = process.argv[3] ?? 'blender/out/fire-sources.json'

const data = JSON.parse(readFileSync(partsPath, 'utf8'))
const parts = data.parts

// ── Cluster parts that belong to the same object ──────────────────────────
/**
 * Groups parts into objects.
 *
 * Two parts belong to the same object when their centres are within
 * `radius` of each other. The parts are sorted first, so the grouping is
 * deterministic.
 */
function cluster(list, radius) {
  const centres = list.map((p) => p.centre)
  const used = new Array(centres.length).fill(false)
  const groups = []

  for (let i = 0; i < centres.length; i++) {
    if (used[i]) continue
    used[i] = true
    const group = [list[i]]
    const box = {
      min: [...list[i].min],
      max: [...list[i].max],
    }
    const grow = (p) => {
      for (let k = 0; k < 3; k++) {
        box.min[k] = Math.min(box.min[k], p.min[k])
        box.max[k] = Math.max(box.max[k], p.max[k])
      }
    }

    // Grow the cluster until nothing else fits.
    let grew = true
    while (grew) {
      grew = false
      for (let j = i + 1; j < centres.length; j++) {
        if (used[j]) continue
        const d = Math.hypot(
          centres[j][0] - centres[i][0],
          centres[j][1] - centres[i][1],
          centres[j][2] - centres[i][2],
        )
        if (d <= radius) {
          used[j] = true
          group.push(list[j])
          grow(list[j])
          grew = true
        }
      }
    }

    const n = group.length
    const centre = [0, 1, 2].map((k) => group.reduce((s, p) => s + p.centre[k], 0) / n)
    const size = [0, 1, 2].map((k) => box.max[k] - box.min[k])
    groups.push({ parts: group, centre, size, min: box.min, max: box.max })
  }
  return groups
}

const byMaterial = (name) => parts.filter((p) => p.material === name)

// ── 1. The fireplace ──────────────────────────────────────────────────────
// The glowing coals are one lump against the wall.
const coalGroups = cluster(byMaterial('auto_28'), 60)
console.log(`=== FIREPLACE COALS (${coalGroups.length} clusters) ===`)
const fireplaces = coalGroups
  .filter((g) => g.parts.length > 40)
  .map((g) => ({
    centre: g.centre.map((v) => round(v)),
    size: g.size.map((v) => round(v)),
    parts: g.parts.length,
  }))
fireplaces.forEach((f) =>
  console.log(
    `  c=(${f.centre.map((v) => v.toFixed(0).padStart(6)).join(',')}) ` +
      `s=(${f.size.map((v) => v.toFixed(0).padStart(5)).join(' x ')}) parts=${f.parts}`,
  ),
)

// ── 2. The wall braziers ──────────────────────────────────────────────────
// The gold bowls: pieces of `auto_78` that are high up and hard against
// one of the side walls.
const goldGroups = cluster(byMaterial('auto_78'), 45)
console.log(`\n=== GOLD CLUSTERS (${goldGroups.length}) ===`)

const wallXs = [data.hall.min[0], data.hall.max[0]]
const braziers = []
for (const g of goldGroups) {
  const [cx, cy, cz] = g.centre
  const [sx, sy, sz] = g.size
  const nearWall = wallXs.some((wx) => Math.abs(cx - wx) < 90)
  const high = cy > data.hall.min[1] + 60
  const notHighTable = Math.abs(cz - 274) > 120 && Math.abs(cz + 1340) > 60
  // A brazier is a BOWL: about as wide as it is deep, and taller than it
  // is wide. The other gold pieces are wall trim, sconces and the ceiling
  // bosses, which are wide and flat.
  const bowlShape = sx < 30 && sz < 40 && sy > 15 && sy < 35
  if (nearWall && high && notHighTable && bowlShape) {
    braziers.push({
      centre: g.centre.map((v) => round(v)),
      size: g.size.map((v) => round(v)),
      parts: g.parts.length,
    })
  }
}
braziers.sort((a, b) => a.centre[2] - b.centre[2])
console.log(`  braziers: ${braziers.length}`)
braziers.forEach((b) =>
  console.log(
    `  c=(${b.centre.map((v) => v.toFixed(0).padStart(6)).join(',')}) ` +
      `s=(${b.size.map((v) => v.toFixed(0).padStart(5)).join(' x ')}) parts=${b.parts}`,
  ),
)

// ── 3. The table candles ──────────────────────────────────────────────────
// The wax: `auto_9` pieces that are cube-ish and sit at table height.
const candleGroups = cluster(byMaterial('auto_9'), 22)
console.log(`\n=== auto_9 CLUSTERS (${candleGroups.length}) ===`)

const candles = []
for (const g of candleGroups) {
  const [cx, cy, cz] = g.centre
  const [sx, sy, sz] = g.size
  // A table candle: roughly as wide as it is tall, standing at table height.
  const tableHeight = 415
  if (Math.abs(cy - tableHeight) < 25 && sy > 8 && sy < 40 && sx < 30 && sz < 30) {
    candles.push({
      centre: g.centre.map((v) => round(v)),
      size: g.size.map((v) => round(v)),
      parts: g.parts.length,
    })
  }
}
candles.sort((a, b) => a.centre[2] - b.centre[2] || a.centre[0] - b.centre[0])
console.log(`  table candles: ${candles.length}`)
candles.slice(0, 60).forEach((c) =>
  console.log(
    `  c=(${c.centre.map((v) => v.toFixed(0).padStart(6)).join(',')}) ` +
      `s=(${c.size.map((v) => v.toFixed(0).padStart(5)).join(' x ')}) parts=${c.parts}`,
  ),
)

function round(v) {
  return Math.round(v * 100) / 100
}

writeFileSync(
  outPath,
  JSON.stringify({ hall: data.hall, fireplaces, braziers, candles }, null, 1),
)
console.log(`\nWROTE ${outPath}`)
console.log(
  `SUMMARY: ${fireplaces.length} fireplaces, ${braziers.length} braziers, ${candles.length} candles`,
)
