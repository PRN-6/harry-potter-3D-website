/**
 * The hall's layout in THREE.JS WORLD SPACE.
 *
 * The GLB is authored Z-up, but three.js applies the file's own root matrix
 * and hands the scene over Y-up. So the numbers printed here are already in
 * the space the website's camera lives in — no conversion needed.
 *
 * This answers the questions the camera path depends on:
 *   • which end of the hall is the entrance on?  (the site assumed -Z)
 *   • where are the four banquet tables, in X and Z?
 *   • how high are the table tops?
 *
 * Usage: node tools/probe-hall.mjs [glb]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const buf = readFileSync(path)

let g = null
let bin = null
let offset = 12
while (offset < buf.length) {
  const len = buf.readUInt32LE(offset)
  const type = buf.toString('ascii', offset + 4, offset + 8)
  if (type === 'JSON') g = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + len))
  else if (type.startsWith('BIN')) bin = buf.subarray(offset + 8, offset + 8 + len)
  offset += 8 + len
}
if (!g || !bin) throw new Error('Missing JSON or BIN chunk')

// ── Matrix maths (column-major, as glTF stores them) ───────────────────────
const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k]
      out[c * 4 + r] = sum
    }
  return out
}

function composeTRS(node) {
  if (node.matrix) return node.matrix.slice()
  const t = node.translation ?? [0, 0, 0]
  const r = node.rotation ?? [0, 0, 0, 1]
  const s = node.scale ?? [1, 1, 1]
  const [x, y, z, w] = r
  const x2 = x + x, y2 = y + y, z2 = z + z
  const xx = x * x2, xy = x * y2, xz = x * z2
  const yy = y * y2, yz = y * z2, zz = z * z2
  const wx = w * x2, wy = w * y2, wz = w * z2
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}

const COMPONENT_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
const NUM_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function readAccessor(index) {
  const acc = g.accessors?.[index]
  if (!acc) return null
  const bv = g.bufferViews?.[acc.bufferView]
  if (!bv || acc.componentType !== 5126) return null
  const comps = NUM_COMPONENTS[acc.type]
  const size = COMPONENT_SIZE[acc.componentType]
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
  const stride = bv.byteStride ?? comps * size
  const out = new Float32Array(acc.count * comps)
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * stride
    for (let c = 0; c < comps; c++) out[i * comps + c] = bin.readFloatLE(o + c * size)
  }
  return { values: out, comps, count: acc.count }
}

// ── Collect the vertex cloud in three.js world space ───────────────────────
const pts = []
const edgePts = []

function visit(nodeIndex, parent) {
  const node = g.nodes?.[nodeIndex]
  if (!node) return
  const m = multiply(parent, composeTRS(node))
  if (node.mesh !== undefined) {
    const mesh = g.meshes?.[node.mesh]
    for (const prim of mesh?.primitives ?? []) {
      const data = readAccessor(prim.attributes?.POSITION)
      if (!data) continue
      const isLine = (prim.mode ?? 4) !== 4
      const target = isLine ? edgePts : pts
      for (let i = 0; i < data.count; i++) {
        const x = data.values[i * data.comps]
        const y = data.values[i * data.comps + 1]
        const z = data.values[i * data.comps + 2]
        target.push(
          m[0] * x + m[4] * y + m[8] * z + m[12],
          m[1] * x + m[5] * y + m[9] * z + m[13],
          m[2] * x + m[6] * y + m[10] * z + m[14],
        )
      }
    }
  }
  for (const child of node.children ?? []) visit(child, m)
}

for (const root of g.scenes?.[g.scene ?? 0]?.nodes ?? []) visit(root, IDENT)

const n = pts.length / 3
const bounds = { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] }
for (let i = 0; i < n; i++)
  for (let a = 0; a < 3; a++) {
    const v = pts[i * 3 + a]
    if (v < bounds.min[a]) bounds.min[a] = v
    if (v > bounds.max[a]) bounds.max[a] = v
  }

const size = [0, 1, 2].map((i) => bounds.max[i] - bounds.min[i])
console.log('THREE.JS WORLD SPACE (what the website camera sees)')
console.log(`  X ${bounds.min[0].toFixed(1)} .. ${bounds.max[0].toFixed(1)}   across the hall`)
console.log(`  Y ${bounds.min[1].toFixed(1)} .. ${bounds.max[1].toFixed(1)}   up`)
console.log(`  Z ${bounds.min[2].toFixed(1)} .. ${bounds.max[2].toFixed(1)}   along the hall`)
console.log(`  size ${size.map((v) => v.toFixed(1)).join(' x ')}`)
console.log(`  edge-overlay verts: ${edgePts.length / 3}`)

// ── The floor ──────────────────────────────────────────────────────────────
// The floor is a vast horizontal slab, so the lowest Y that carries a lot of
// geometry is the floor.
const ys = new Float32Array(n)
for (let i = 0; i < n; i++) ys[i] = pts[i * 3 + 1]
ys.sort()
const floorY = ys[Math.floor(n * 0.002)]
console.log(`\nFLOOR  y = ${floorY.toFixed(1)}`)

// ── The entrance wall ──────────────────────────────────────────────────────
// The doors are the only tall, narrow structure at one end of the hall.
// Find the end of the hall that has a wall: look at the extreme Z slabs and
// see how much geometry sits in them.
function slabProfile(z, halfWidth) {
  let count = 0
  for (let i = 0; i < n; i++) {
    const dz = pts[i * 3 + 2] - z
    if (Math.abs(dz) <= halfWidth) count++
  }
  return count
}

console.log('\nEND WALLS (vertex count in a 20-unit slab at each end)')
for (const z of [bounds.min[2] + 20, bounds.min[2] + 60, bounds.max[2] - 60, bounds.max[2] - 20])
  console.log(`  z=${z.toFixed(0).padStart(7)}  ${slabProfile(z, 10).toString().padStart(7)} verts`)

// ── The banquet tables ─────────────────────────────────────────────────────
// A table top is a wide flat horizontal surface. Look for the Y band that
// holds the most geometry ABOVE the floor, then look at the X runs inside it.
console.log('\nLOOKING FOR THE TABLE TOPS')
const YSTEP = 2
const buckets = new Map()
for (let i = 0; i < n; i++) {
  const y = pts[i * 3 + 1]
  if (y < floorY + 20) continue
  const k = Math.round(y / YSTEP)
  buckets.set(k, (buckets.get(k) ?? 0) + 1)
}

const candidates = [...buckets.entries()]
  .map(([k, c]) => ({ y: k * YSTEP, c }))
  .filter((b) => b.c > 400)
  .sort((a, b) => b.c - a.c)
  .slice(0, 8)

for (const cand of candidates) {
  // The X runs inside this Y band.
  const xs = []
  for (let i = 0; i < n; i++) {
    if (Math.abs(pts[i * 3 + 1] - cand.y) > YSTEP) continue
    xs.push(pts[i * 3])
  }
  xs.sort((a, b) => a - b)
  const runs = []
  let start = xs[0]
  let prev = xs[0]
  for (let i = 1; i < xs.length; i++) {
    if (xs[i] - prev > 8) {
      runs.push([start, prev])
      start = xs[i]
    }
    prev = xs[i]
  }
  runs.push([start, prev])

  // A table is a narrow run: a table top is not the whole width of the hall.
  const tables = runs.filter(([a, b]) => b - a > 15 && b - a < 160)
  if (tables.length < 3) continue

  console.log(`\n  y=${cand.y}  (${cand.c} verts)  ${tables.length} candidate runs`)
  for (const [a, b] of tables) {
    // The Z extent of the geometry in this run.
    let zLo = Infinity
    let zHi = -Infinity
    let count = 0
    for (let i = 0; i < n; i++) {
      const x = pts[i * 3]
      if (x < a || x > b) continue
      if (Math.abs(pts[i * 3 + 1] - cand.y) > YSTEP) continue
      const z = pts[i * 3 + 2]
      if (z < zLo) zLo = z
      if (z > zHi) zHi = z
      count++
    }
    console.log(
      `    x ${a.toFixed(0).padStart(6)} .. ${b.toFixed(0).padStart(6)}` +
        `  centre ${((a + b) / 2).toFixed(0).padStart(6)}` +
        `  width ${(b - a).toFixed(0).padStart(4)}` +
        `  z ${zLo.toFixed(0).padStart(7)} .. ${zHi.toFixed(0).padStart(7)}` +
        `  (${count} verts)`,
    )
  }
}
