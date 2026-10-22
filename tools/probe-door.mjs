/**
 * THE DOOR, IN THE RAW GLB.
 *
 * The website needs to split the entrance door into two leaves and swing
 * them open on the scroll. That means knowing:
 *   • the door node's name and its place in the node hierarchy
 *   • its local matrix, so a world-space split plane can be expressed in
 *     the mesh's own local space
 *   • its world-space bounding box, so the hinges can be placed on its
 *     outer edges
 *
 * Usage: node tools/probe-door.mjs [glb]
 */
import { readFileSync } from 'node:fs'

const path = process.argv[2] ?? 'blender/source/undifined.glb'
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
  if (!bv) return null
  const comps = NUM_COMPONENTS[acc.type]
  const size = COMPONENT_SIZE[acc.componentType]
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
  const stride = bv.byteStride ?? comps * size
  const out = new Float32Array(acc.count * comps)
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * stride
    for (let c = 0; c < comps; c++) {
      out[i * comps + c] =
        acc.componentType === 5126
          ? bin.readFloatLE(o + c * size)
          : acc.componentType === 5123
            ? bin.readUInt16LE(o + c * size)
            : bin.readUInt32LE(o + c * size)
    }
  }
  return { values: out, comps, count: acc.count }
}

// ── The node tree ──────────────────────────────────────────────────────────
const worldOf = new Array(g.nodes.length).fill(null)
const parentOf = new Array(g.nodes.length).fill(-1)

function visit(nodeIndex, parent) {
  const node = g.nodes[nodeIndex]
  const m = multiply(parent, composeTRS(node))
  worldOf[nodeIndex] = m
  parentOf[nodeIndex] = parent
  for (const child of node.children ?? []) visit(child, m)
}
for (const root of g.scenes?.[g.scene ?? 0]?.nodes ?? []) visit(root, IDENT)

function worldBounds(nodeIndex) {
  const node = g.nodes[nodeIndex]
  const mesh = g.meshes?.[node.mesh]
  const m = worldOf[nodeIndex]
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const prim of mesh?.primitives ?? []) {
    const data = readAccessor(prim.attributes?.POSITION)
    if (!data) continue
    for (let i = 0; i < data.count; i++) {
      const x = data.values[i * data.comps]
      const y = data.values[i * data.comps + 1]
      const z = data.values[i * data.comps + 2]
      const w = [
        m[0] * x + m[4] * y + m[8] * z + m[12],
        m[1] * x + m[5] * y + m[9] * z + m[13],
        m[2] * x + m[6] * y + m[10] * z + m[14],
      ]
      for (let a = 0; a < 3; a++) {
        if (w[a] < min[a]) min[a] = w[a]
        if (w[a] > max[a]) max[a] = w[a]
      }
    }
  }
  return { min, max }
}

console.log('NODE TREE')
for (let i = 0; i < g.nodes.length; i++) {
  const node = g.nodes[i]
  const mesh = g.meshes?.[node.mesh]
  console.log(
    `  [${String(i).padStart(2)}] ${(node.name ?? '(unnamed)').padEnd(20)}` +
      ` parent=${String(parentOf[i]).padStart(2)}  mesh=${node.mesh ?? '-'} ` +
      `children=${(node.children ?? []).length}` +
      (mesh ? `  "${mesh.name}" prims=${mesh.primitives.length}` : ''),
  )
}

// ── The door ───────────────────────────────────────────────────────────────
// The entrance is the LOW-Z end of the hall in three.js space. The door is
// the thin, wide object standing at that end.
console.log()
console.log('CANDIDATES AT THE ENTRANCE END (low Z)')
const cands = []
for (let i = 0; i < g.nodes.length; i++) {
  if (g.nodes[i].mesh === undefined) continue
  const b = worldBounds(i)
  const size = [0, 1, 2].map((a) => b.max[a] - b.min[a])
  cands.push({ i, b, size })
}
cands.sort((a, b) => a.b.min[2] - b.b.min[2])
for (const c of cands.slice(0, 6)) {
  const node = g.nodes[c.i]
  console.log(
    `  [${String(c.i).padStart(2)}] ${(node.name ?? '(unnamed)').padEnd(20)}` +
      ` x ${c.b.min[0].toFixed(1).padStart(8)}..${c.b.max[0].toFixed(1).padStart(8)}` +
      `  y ${c.b.min[1].toFixed(1).padStart(7)}..${c.b.max[1].toFixed(1).padStart(7)}` +
      `  z ${c.b.min[2].toFixed(1).padStart(9)}..${c.b.max[2].toFixed(1).padStart(9)}` +
      `   size ${c.size.map((v) => v.toFixed(1)).join(' x ')}`,
  )
}

// ── The door node's own matrix ─────────────────────────────────────────────
const doorIndex = cands[0].i
const doorNode = g.nodes[doorIndex]
console.log()
console.log(`THE DOOR: node [${doorIndex}] "${doorNode.name}"`)
console.log(`  local matrix: ${JSON.stringify(doorNode.matrix ?? null)}`)
console.log(`  translation:  ${JSON.stringify(doorNode.translation ?? null)}`)
console.log(`  rotation:     ${JSON.stringify(doorNode.rotation ?? null)}`)
console.log(`  scale:        ${JSON.stringify(doorNode.scale ?? null)}`)
console.log(`  world matrix: ${JSON.stringify(worldOf[doorIndex].map((v) => +v.toFixed(6)))}`)

const mesh = g.meshes[doorNode.mesh]
for (const [pi, prim] of mesh.primitives.entries()) {
  const pos = readAccessor(prim.attributes.POSITION)
  const idx = prim.indices !== undefined ? readAccessor(prim.indices) : null
  console.log(
    `  primitive ${pi}: mode=${prim.mode ?? 4} verts=${pos.count}` +
      ` indices=${idx ? idx.count : 'none'} material=${prim.material}` +
      ` attrs=${Object.keys(prim.attributes).join(',')}`,
  )
  console.log(`    accessor min=${JSON.stringify(g.accessors[prim.attributes.POSITION].min)}`)
  console.log(`    accessor max=${JSON.stringify(g.accessors[prim.attributes.POSITION].max)}`)
}
