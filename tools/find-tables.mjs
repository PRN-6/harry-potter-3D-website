/**
 * Probes the GLB for the banquet table layout.
 *
 * `inspect-glb.mjs` gives the room's bounding box; this script decodes the
 * actual vertices and answers the question the bounding box cannot: WHERE
 * ARE THE FOUR HOUSE TABLES?
 *
 * A table top is a long horizontal slab, so at the table height the
 * vertices form a few narrow bands in X separated by the gaps between the
 * tables. This script:
 *   1. finds the densest horizontal slabs in the model
 *   2. for a given slab, reports the X bands and the Z extent of each
 *
 * Usage: node tools/find-tables.mjs public/models/hogwarts_dining_hall.glb [slabY]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const slabY = Number(process.argv[3] ?? NaN)
const buf = readFileSync(path)
if (buf.toString('ascii', 0, 4) !== 'glTF') {
  console.error('Not a GLB file:', path)
  process.exit(1)
}

// ── Chunks ─────────────────────────────────────────────────────────────────
let g = null
let bin = null
let offset = 12
while (offset < buf.length) {
  const chunkLength = buf.readUInt32LE(offset)
  // The spec writes the binary chunk's type as "BIN\0" — four bytes, the
  // last one a NUL pad. Reading it as a plain "BIN" never matches.
  const chunkType = buf.toString('ascii', offset + 4, offset + 8)
  if (chunkType === 'JSON') {
    g = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + chunkLength))
  } else if (chunkType.startsWith('BIN')) {
    bin = buf.subarray(offset + 8, offset + 8 + chunkLength)
  }
  offset += 8 + chunkLength
}
if (!g || !bin) {
  console.error('Missing JSON or BIN chunk.')
  process.exit(1)
}

// ── Matrix maths (column-major) ────────────────────────────────────────────
const IDENT = [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]

function multiply(a, b) {
  const out = new Array(16).fill(0)
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      let sum = 0
      for (let k = 0; k < 4; k++) sum += a[k * 4 + r] * b[c * 4 + k]
      out[c * 4 + r] = sum
    }
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

// ── Decode POSITION accessors ─────────────────────────────────────────────
const COMPONENT_SIZE = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 }
const NUM_COMPONENTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 }

function readAccessor(accessorIndex) {
  const acc = g.accessors?.[accessorIndex]
  if (!acc) return null
  const bv = g.bufferViews?.[acc.bufferView]
  if (!bv) return null
  const comps = NUM_COMPONENTS[acc.type]
  const size = COMPONENT_SIZE[acc.componentType]
  if (!comps || !size || acc.componentType !== 5126) return null
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
  const stride = bv.byteStride ?? comps * size
  const out = new Float32Array(acc.count * comps)
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * stride
    for (let c = 0; c < comps; c++) out[i * comps + c] = bin.readFloatLE(o + c * size)
  }
  return { values: out, comps, count: acc.count }
}

// ── World-space vertex cloud ───────────────────────────────────────────────
const world = []

function visit(nodeIndex, parentMatrix) {
  const node = g.nodes?.[nodeIndex]
  if (!node) return
  const m = multiply(parentMatrix, composeTRS(node))
  if (node.mesh !== undefined) {
    for (const prim of g.meshes?.[node.mesh]?.primitives ?? []) {
      const data = readAccessor(prim.attributes?.POSITION)
      if (!data) continue
      for (let i = 0; i < data.count; i++) {
        const x = data.values[i * data.comps]
        const y = data.values[i * data.comps + 1]
        const z = data.values[i * data.comps + 2]
        world.push(
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

const n = world.length / 3
let minX = Infinity, minY = Infinity, minZ = Infinity
let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity
for (let i = 0; i < n; i++) {
  const x = world[i * 3], y = world[i * 3 + 1], z = world[i * 3 + 2]
  if (x < minX) minX = x; if (x > maxX) maxX = x
  if (y < minY) minY = y; if (y > maxY) maxY = y
  if (z < minZ) minZ = z; if (z > maxZ) maxZ = z
}
console.log(`VERTICES ${n.toLocaleString()}`)
console.log(`BOUNDS x ${minX.toFixed(0)}..${maxX.toFixed(0)}  y ${minY.toFixed(0)}..${maxY.toFixed(0)}  z ${minZ.toFixed(0)}..${maxZ.toFixed(0)}`)

// ── Densest horizontal slabs ───────────────────────────────────────────────
const SLAB = 1
const yCount = new Map()
for (let i = 0; i < n; i++) {
  const k = Math.round(world[i * 3 + 1] / SLAB)
  yCount.set(k, (yCount.get(k) ?? 0) + 1)
}
const slabs = [...yCount.entries()]
  .map(([k, c]) => ({ y: k * SLAB, c }))
  .sort((a, b) => b.c - a.c)
  .slice(0, 24)
  .sort((a, b) => a.y - b.y)

console.log('\nDENSEST HORIZONTAL SLABS')
for (const s of slabs) console.log(`  y=${s.y.toFixed(0).padStart(6)}  ${String(s.c).padStart(7)}`)

// ── X bands + their Z extents at a given slab ──────────────────────────────
function bandsAt(y, tol) {
  const bins = new Map()
  for (let i = 0; i < n; i++) {
    if (Math.abs(world[i * 3 + 1] - y) > tol) continue
    const x = Math.round(world[i * 3] / 4) * 4
    bins.set(x, (bins.get(x) ?? 0) + 1)
  }
  const keys = [...bins.keys()].sort((a, b) => a - b)
  const bands = []
  let start = null
  let prev = null
  for (const k of keys) {
    if (start === null) { start = k; prev = k; continue }
    if (k - prev > 10) { bands.push([start, prev]); start = k }
    prev = k
  }
  if (start !== null) bands.push([start, prev])
  return bands.filter(([a, b]) => b - a >= 12)
}

function zExtent(x0, x1, y, tol) {
  let lo = Infinity
  let hi = -Infinity
  let count = 0
  for (let i = 0; i < n; i++) {
    const x = world[i * 3]
    if (x < x0 || x > x1) continue
    if (Math.abs(world[i * 3 + 1] - y) > tol) continue
    const z = world[i * 3 + 2]
    if (z < lo) lo = z
    if (z > hi) hi = z
    count++
  }
  return { lo, hi, count }
}

const probeY = Number.isFinite(slabY) ? slabY : 420
console.log(`\nBANDS AT y=${probeY} (and the Z extent of each band)`)
for (const [a, b] of bandsAt(probeY, 2)) {
  const { lo, hi, count } = zExtent(a, b, probeY, 3)
  console.log(
    `  x ${String(a).padStart(6)} .. ${String(b).padStart(6)}  (centre ${((a + b) / 2).toFixed(0).padStart(5)}, width ${b - a})  ` +
      `z ${lo === Infinity ? '   -' : lo.toFixed(0).padStart(6)} .. ${hi === -Infinity ? '   -' : hi.toFixed(0).padStart(6)}  verts ${count}`,
  )
}

// ── Top-down map of the whole room, normalised by log ──────────────────────
const COLS = 100
const ROWS = 44
const grid = new Int32Array(COLS * ROWS)
for (let i = 0; i < n; i++) {
  const c = Math.min(COLS - 1, Math.max(0, Math.floor(((world[i * 3] - minX) / (maxX - minX)) * COLS)))
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor(((world[i * 3 + 2] - minZ) / (maxZ - minZ)) * ROWS)))
  grid[r * COLS + c]++
}
let peak = 1
for (const v of grid) if (v > peak) peak = v
const RAMP = ' .:-=+*#%@'
console.log(`\nTOP-DOWN MAP (x →, z ↓)  peak ${peak}  [x ${minX.toFixed(0)}..${maxX.toFixed(0)}, z ${minZ.toFixed(0)}..${maxZ.toFixed(0)}]`)
console.log('     ' + Array.from({ length: COLS }, (_, c) => (c % 10 === 0 ? String(Math.round(minX + ((c + 0.5) / COLS) * (maxX - minX)) / 100 % 10) : ' ')).join(''))
for (let r = 0; r < ROWS; r++) {
  let line = ''
  for (let c = 0; c < COLS; c++) {
    const v = grid[r * COLS + c]
    if (v === 0) { line += ' '; continue }
    const t = Math.log1p(v) / Math.log1p(peak)
    line += RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1))))]
  }
  if (line.trim()) console.log(`${line} | z=${(minZ + ((r + 0.5) / ROWS) * (maxZ - minZ)).toFixed(0)}`)
}
