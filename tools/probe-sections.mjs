/**
 * Numeric cross-sections of the GLB.
 *
 * `slice-model.mjs` prints a picture; this prints NUMBERS — for a slab of
 * Z, it lists every Y band and, inside each band, the X runs. That is what
 * you need to place something in the model: the tables show up as four
 * narrow, evenly spaced runs at one specific height.
 *
 * Usage: node tools/probe-sections.mjs <glb> <z1> [z2 ...] [thickness]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const args = process.argv.slice(3)
const thickness = Number(args.pop() ?? 8)
const slices = args.map(Number)
if (!slices.length) slices.push(-600)

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

// ── For one Z slab: Y bands, and the X runs inside each band ───────────────
function section(sliceZ) {
  // Collect the vertices in the slab.
  const pts = []
  for (let i = 0; i < n; i++) {
    const z = world[i * 3 + 2]
    if (Math.abs(z - sliceZ) > thickness) continue
    pts.push(world[i * 3], world[i * 3 + 1])
  }

  // Bucket by Y.
  const YSTEP = 4
  const byY = new Map()
  for (let i = 0; i < pts.length; i += 2) {
    const y = pts[i + 1]
    const k = Math.round(y / YSTEP)
    if (!byY.has(k)) byY.set(k, [])
    byY.get(k).push(pts[i])
  }

  console.log(`\n=== SECTION z=${sliceZ} +/- ${thickness}   (${pts.length / 2} verts) ===`)
  const keys = [...byY.keys()].sort((a, b) => b - a) // top down
  for (const k of keys) {
    const xs = byY.get(k)
    // Bucket by X and find runs.
    const XSTEP = 4
    const bins = new Map()
    for (const x of xs) {
      const b = Math.round(x / XSTEP)
      bins.set(b, (bins.get(b) ?? 0) + 1)
    }
    const bkeys = [...bins.keys()].sort((a, b) => a - b)
    const runs = []
    let start = null
    let prev = null
    for (const b of bkeys) {
      if (start === null) { start = b; prev = b; continue }
      if (b - prev > 1) { runs.push([start, prev]); start = b }
      prev = b
    }
    if (start !== null) runs.push([start, prev])

    const wide = runs.filter(([a, b]) => (b - a) * XSTEP >= 10)
    if (!wide.length) continue
    const parts = wide.map(([a, b]) => `${a * XSTEP}..${b * XSTEP}`).join('  ')
    console.log(`  y=${(k * YSTEP).toFixed(0).padStart(5)}  ${String(xs.length).padStart(6)} pts   ${parts}`)
  }
}

for (const s of slices) section(s)
