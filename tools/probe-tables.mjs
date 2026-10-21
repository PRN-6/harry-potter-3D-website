/**
 * Locates the four banquet tables inside the GLB.
 *
 * A table top is a big flat HORIZONTAL surface: at its own height, and only
 * at its own height, there is a dense band of vertices spanning a narrow
 * range of X and a long range of Z. The floor is also flat and horizontal,
 * but it is much wider in X, and it is at the bottom of the room.
 *
 * So: for each Y band, bucket the vertices by X, keep the buckets that are
 * dense, and report the X runs and their Z extent. The table height is the
 * one where exactly four narrow, evenly-spaced runs appear.
 *
 * Usage: node tools/probe-tables.mjs <glb> [yMin] [yMax]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const yMin = Number(process.argv[3] ?? 380)
const yMax = Number(process.argv[4] ?? 620)
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
console.log(`VERTICES ${n.toLocaleString()}`)

// ── For each Y band: the X buckets, their density, and their Z extent ─────
const YSTEP = 4
const XSTEP = 8

for (let y = Math.ceil(yMin / YSTEP) * YSTEP; y <= yMax; y += YSTEP) {
  const buckets = new Map()
  for (let i = 0; i < n; i++) {
    const vy = world[i * 3 + 1]
    if (vy < y - YSTEP / 2 || vy >= y + YSTEP / 2) continue
    const kx = Math.round(world[i * 3] / XSTEP)
    let b = buckets.get(kx)
    if (!b) { b = { n: 0, zLo: Infinity, zHi: -Infinity }; buckets.set(kx, b) }
    b.n++
    const z = world[i * 3 + 2]
    if (z < b.zLo) b.zLo = z
    if (z > b.zHi) b.zHi = z
  }
  if (!buckets.size) continue

  // Dense buckets only — a table top is made of many vertices.
  const dense = [...buckets.entries()]
    .filter(([, b]) => b.n >= 60)
    .sort((a, b) => a[0] - b[0])
  if (dense.length < 4) continue

  // Group consecutive buckets.
  const groups = []
  let cur = { x0: dense[0][0] * XSTEP, x1: dense[0][0] * XSTEP, b: dense[0][1] }
  for (let i = 1; i < dense.length; i++) {
    const [kx, b] = dense[i]
    if (kx - cur.b === 1 || kx - cur.x1 / XSTEP <= 1) {
      cur.x1 = kx * XSTEP
      cur.b.zLo = Math.min(cur.b.zLo, b.zLo)
      cur.b.zHi = Math.max(cur.b.zHi, b.zHi)
      cur.b.n += b.n
    } else {
      groups.push(cur)
      cur = { x0: kx * XSTEP, x1: kx * XSTEP, b }
    }
  }
  groups.push(cur)

  const desc = groups
    .map((g) => `${g.x0}..${g.x1}(n${g.b.n},z${g.b.zLo.toFixed(0)}..${g.b.zHi.toFixed(0)})`)
    .join('  ')
  console.log(`  y=${String(y).padStart(4)}  ${groups.length} runs: ${desc}`)
}
