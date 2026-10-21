/**
 * Prints a cross-section (slice) of the GLB.
 *
 * A slice is the strongest way to read a model you cannot look at: cut it
 * at a given Z and print the X-Y cross-section as ASCII art. Walls, columns,
 * the four banquet tables and the central aisle all show up immediately.
 *
 * Usage: node tools/slice-model.mjs public/models/hogwarts_dining_hall.glb [sliceZ] [thickness]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const sliceZ = Number(process.argv[3] ?? -600)
const thickness = Number(process.argv[4] ?? 12)
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

// ── Slice ──────────────────────────────────────────────────────────────────
const COLS = 110
const ROWS = 50
const grid = new Int32Array(COLS * ROWS)
let kept = 0
for (let i = 0; i < n; i++) {
  const z = world[i * 3 + 2]
  if (Math.abs(z - sliceZ) > thickness) continue
  kept++
  const c = Math.min(COLS - 1, Math.max(0, Math.floor(((world[i * 3] - minX) / (maxX - minX)) * COLS)))
  const r = Math.min(ROWS - 1, Math.max(0, Math.floor(((maxY - world[i * 3 + 1]) / (maxY - minY)) * ROWS)))
  grid[r * COLS + c]++
}
let peak = 1
for (const v of grid) if (v > peak) peak = v
const RAMP = ' .:-=+*#%@'
console.log(`\nSLICE at z=${sliceZ} +/- ${thickness}   kept ${kept.toLocaleString()}   peak ${peak}`)
console.log(`x ${minX.toFixed(0)} .. ${maxX.toFixed(0)}   y ${minY.toFixed(0)} .. ${maxY.toFixed(0)}`)
const header = '     ' + Array.from({ length: COLS }, (_, c) => {
  const x = minX + ((c + 0.5) / COLS) * (maxX - minX)
  return Math.abs(x % 100) < (maxX - minX) / COLS / 2 ? '|' : ' '
}).join('')
console.log(header)
for (let r = 0; r < ROWS; r++) {
  let line = ''
  for (let c = 0; c < COLS; c++) {
    const v = grid[r * COLS + c]
    if (v === 0) { line += ' '; continue }
    const t = Math.log1p(v) / Math.log1p(peak)
    line += RAMP[Math.max(1, Math.min(RAMP.length - 1, Math.round(t * (RAMP.length - 1))))]
  }
  const y = maxY - ((r + 0.5) / ROWS) * (maxY - minY)
  console.log(`${line} | y=${y.toFixed(0)}`)
}
