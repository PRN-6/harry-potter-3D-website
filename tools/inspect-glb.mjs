/**
 * A dependency-free GLB inspector that does the real maths.
 *
 * A .glb file is: a 12-byte header, then chunks with 8-byte headers
 * (length + type). The JSON chunk describes nodes, meshes, materials and
 * accessors; the BIN chunk holds the bytes.
 *
 * The naive bounding box (accessor min/max) is in the mesh's LOCAL space and
 * is useless on its own, because SketchUp exports are Z-up and the fix is
 * applied through node transforms. This script therefore:
 *
 *   1. walks the node tree, composing the world matrix of every node
 *   2. transforms each mesh's local bounding box by its world matrix
 *   3. prints a world-space box per mesh, so we can tell which piece of
 *      geometry is the floor, the tables, the walls or the candles
 *
 * Only the JSON chunk is read, so no WebGL and no dependencies are needed.
 *
 * Usage: node tools/inspect-glb.mjs public/models/hogwarts_dining_hall.glb
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'public/models/hogwarts_dining_hall.glb'
const buf = readFileSync(path)

if (buf.toString('ascii', 0, 4) !== 'glTF') {
  console.error('Not a GLB file:', path)
  process.exit(1)
}
console.log(`GLB v${buf.readUInt32LE(4)} — ${buf.readUInt32LE(8).toLocaleString()} bytes`)

// ── Walk the chunks, keep the JSON one ──────────────────────────────────────
let g = null
let offset = 12
while (offset < buf.length) {
  const chunkLength = buf.readUInt32LE(offset)
  const chunkType = buf.toString('ascii', offset + 4, offset + 8)
  if (chunkType === 'JSON') {
    g = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + chunkLength))
  } else if (chunkType === 'BIN') {
    console.log(`BIN chunk: ${chunkLength.toLocaleString()} bytes`)
  }
  offset += 8 + chunkLength
}
if (!g) {
  console.error('No JSON chunk found.')
  process.exit(1)
}

// ── Minimal column-major 4x4 matrix maths ──────────────────────────────────
// glTF matrices are column-major: m[0..3] is the first COLUMN.

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
  const x2 = x + x
  const y2 = y + y
  const z2 = z + z
  const xx = x * x2
  const xy = x * y2
  const xz = x * z2
  const yy = y * y2
  const yz = y * z2
  const zz = z * z2
  const wx = w * x2
  const wy = w * y2
  const wz = w * z2

  // Rotation, then scale, then translation.
  return [
    (1 - (yy + zz)) * s[0], (xy + wz) * s[0], (xz - wy) * s[0], 0,
    (xy - wz) * s[1], (1 - (xx + zz)) * s[1], (yz + wx) * s[1], 0,
    (xz + wy) * s[2], (yz - wx) * s[2], (1 - (xx + yy)) * s[2], 0,
    t[0], t[1], t[2], 1,
  ]
}

function transformPoint(m, x, y, z) {
  return [
    m[0] * x + m[4] * y + m[8] * z + m[12],
    m[1] * x + m[5] * y + m[9] * z + m[13],
    m[2] * x + m[6] * y + m[10] * z + m[14],
  ]
}

const fmt = (v) => v.toFixed(1).padStart(8)

// ── Local bounding box of every mesh ───────────────────────────────────────
function meshLocalBox(meshIndex) {
  const mesh = g.meshes?.[meshIndex]
  if (!mesh) return null
  let min = [Infinity, Infinity, Infinity]
  let max = [-Infinity, -Infinity, -Infinity]
  for (const prim of mesh.primitives) {
    const acc = g.accessors?.[prim.attributes?.POSITION]
    if (!acc?.min || !acc?.max) continue
    for (let i = 0; i < 3; i++) {
      min[i] = Math.min(min[i], acc.min[i])
      max[i] = Math.max(max[i], acc.max[i])
    }
  }
  if (!Number.isFinite(min[0])) return null
  return { min, max }
}

// ── Walk the scene, composing world matrices ───────────────────────────────
const meshes = [] // { name, node, box }

function visit(nodeIndex, parentMatrix) {
  const node = g.nodes?.[nodeIndex]
  if (!node) return
  const world = multiply(parentMatrix, composeTRS(node))

  if (node.mesh !== undefined) {
    const box = meshLocalBox(node.mesh)
    if (box) {
      // Transform all 8 corners: the world AABB of a rotated box is not the
      // box of the transformed min/max.
      let min = [Infinity, Infinity, Infinity]
      let max = [-Infinity, -Infinity, -Infinity]
      for (let i = 0; i < 8; i++) {
        const p = transformPoint(
          world,
          i & 1 ? box.max[0] : box.min[0],
          i & 2 ? box.max[1] : box.min[1],
          i & 4 ? box.max[2] : box.min[2],
        )
        for (let a = 0; a < 3; a++) {
          min[a] = Math.min(min[a], p[a])
          max[a] = Math.max(max[a], p[a])
        }
      }
      meshes.push({
        name: node.name || `mesh${node.mesh}`,
        node: nodeIndex,
        meshIndex: node.mesh,
        min,
        max,
        size: [max[0] - min[0], max[1] - min[1], max[2] - min[2]],
        world,
      })
    }
  }

  for (const child of node.children ?? []) visit(child, world)
}

for (const root of g.scenes?.[g.scene ?? 0]?.nodes ?? []) visit(root, IDENT)

// ── Report ──────────────────────────────────────────────────────────────────
const overall = meshes.reduce(
  (acc, m) => {
    for (let i = 0; i < 3; i++) {
      acc.min[i] = Math.min(acc.min[i], m.min[i])
      acc.max[i] = Math.max(acc.max[i], m.max[i])
    }
    return acc
  },
  { min: [Infinity, Infinity, Infinity], max: [-Infinity, -Infinity, -Infinity] },
)

console.log('\nWORLD-SPACE BOUNDING BOX')
console.log(`  min  ${overall.min.map((v) => v.toFixed(1)).join(', ')}`)
console.log(`  max  ${overall.max.map((v) => v.toFixed(1)).join(', ')}`)
console.log(
  `  size ${overall.max.map((v, i) => (v - overall.min[i]).toFixed(1)).join(' x ')}   (X x Y x Z)`,
)

const worldSize = overall.max.map((v, i) => v - overall.min[i])
const upAxis = worldSize.indexOf(Math.max(...worldSize))
console.log(
  `  tallest axis is ${['X', 'Y', 'Z'][upAxis]} — the model is ${upAxis === 'Y' ? 'already Y-up' : 'NOT Y-up (SketchUp Z-up export)'}`,
)

// The transform applied by the root, so we know which way to point the camera.
const sceneRoot = g.scenes?.[g.scene ?? 0]?.nodes?.[0]
const root = g.nodes?.[sceneRoot]
if (root) {
  console.log('\nROOT NODE TRANSFORM')
  if (root.matrix) console.log('  matrix      ', root.matrix.map((v) => v.toFixed(3)).join(', '))
  if (root.translation) console.log('  translation ', root.translation.join(', '))
  if (root.rotation) console.log('  rotation    ', root.rotation.join(', '))
  if (root.scale) console.log('  scale       ', root.scale.join(', '))
}

console.log(`\nPER-MESH WORLD BOXES (${meshes.length})`)
console.log('  node  name                          centre                size')
for (const m of meshes) {
  const c = [0, 1, 2].map((i) => (m.min[i] + m.max[i]) / 2)
  const s = [0, 1, 2].map((i) => m.max[i] - m.min[i])
  console.log(
    `  [${String(m.node).padStart(2)}] ${m.name.padEnd(28).slice(0, 28)}  ${c.map((v) => v.toFixed(0).padStart(6)).join(',')}   ${s.map((v) => v.toFixed(0).padStart(6)).join(' x ')}`,
  )
}

// ── Materials ───────────────────────────────────────────────────────────────
console.log(`\nMATERIALS (${g.materials?.length ?? 0})`)
g.materials?.forEach((m, i) => {
  const flags = []
  if (m.doubleSided) flags.push('doubleSided')
  if (m.alphaMode && m.alphaMode !== 'OPAQUE') flags.push(m.alphaMode)
  if (m.extensions?.KHR_materials_unlit) flags.push('unlit')
  const base = m.pbrMetallicRoughness?.baseColorFactor
  console.log(
    `  [${String(i).padStart(2)}] ${(m.name || '(unnamed)').padEnd(28).slice(0, 28)}  ${
      base ? `rgba(${base.map((v) => v.toFixed(2)).join(',')})` : ''
    } ${flags.join(' ')}`,
  )
})

let texBytes = 0
for (const img of g.images ?? []) {
  if (img.bufferView !== undefined) texBytes += g.bufferViews[img.bufferView]?.byteLength ?? 0
}
let tris = 0
for (const mesh of g.meshes ?? []) {
  for (const prim of mesh.primitives) {
    if ((prim.mode ?? 4) === 4) tris += (g.accessors?.[prim.indices]?.count ?? 0) / 3
  }
}
console.log(`\nMESHES ${g.meshes?.length ?? 0}  TRIANGLES ~${Math.round(tris).toLocaleString()}  TEXTURE BYTES ${texBytes.toLocaleString()}`)
console.log(`extensions used: ${Object.keys(g.extensionsUsed ?? {}).join(', ') || 'none'}`)
