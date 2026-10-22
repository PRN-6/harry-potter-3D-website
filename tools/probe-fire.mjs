/**
 * Finds every fire source in the Great Hall.
 *
 * The GLB merges the whole hall into 28 big meshes, so the individual
 * candles, the gold braziers and the fireplace are all buried inside them.
 * This script splits each mesh into its LOOSE PARTS the same way Blender's
 * "Separate > Loose Parts" does — by finding the connected components of
 * the triangle mesh — and reports each part's world-space box.
 *
 * It is much faster than doing it in Blender (seconds, not minutes) and it
 * uses three.js's OWN matrix maths, so the coordinates are exactly the ones
 * the scene will see.
 *
 * THE COORDINATE SYSTEM
 *   The GLB's root node rotates the SketchUp export (Z-up) into Y-up, so
 *   after the transform:
 *     X = across the hall   (630 units, -109.9 .. 520.1)
 *     Y = up                (540 units,  382.4 .. 923.1)
 *     Z = along the hall    (1744 units, -1370.7 .. 373.8)
 *   The entrance is at z = -1370 and the High Table end at z = +374.
 *
 * The output is JSON, which `src/three/firePoints.ts` reads.
 *
 * Usage: node tools/probe-fire.mjs <glb> [out.json]
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { Matrix4, Vector3, Box3, Quaternion } from 'three'

const path = process.argv[2] ?? 'blender/source/undifined.glb'
const outPath = process.argv[3] ?? 'blender/out/fire-points.json'

const buf = readFileSync(path)
if (buf.toString('ascii', 0, 4) !== 'glTF') {
  console.error('Not a GLB file:', path)
  process.exit(1)
}

let g = null
let bin = null
let offset = 12
while (offset < buf.length) {
  const len = buf.readUInt32LE(offset)
  const type = buf.toString('ascii', offset + 4, offset + 8)
  if (type === 'JSON') {
    g = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + len))
  } else if (type.startsWith('BIN')) {
    bin = buf.subarray(offset + 8, offset + 8 + len)
  }
  offset += 8 + len
}
if (!g || !bin) {
  console.error('Missing JSON or BIN chunk.')
  process.exit(1)
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
  if (!comps || !size) return null
  const base = (bv.byteOffset ?? 0) + (acc.byteOffset ?? 0)
  const stride = bv.byteStride ?? comps * size
  const out = new Float32Array(acc.count * comps)
  for (let i = 0; i < acc.count; i++) {
    const o = base + i * stride
    for (let c = 0; c < comps; c++) {
      const off = o + c * size
      out[i * comps + c] =
        acc.componentType === 5126
          ? bin.readFloatLE(off)
          : acc.componentType === 5123
            ? bin.readUInt16LE(off)
            : acc.componentType === 5125
              ? bin.readUInt32LE(off)
              : bin.readUInt8(off)
    }
  }
  return { values: out, comps, count: acc.count }
}

/** The world matrix of a node, using three.js's own composition. */
function nodeMatrix(node) {
  const m = new Matrix4()
  if (node.matrix) {
    m.fromArray(node.matrix)
    return m
  }
  // A glTF node stores its rotation as a QUATERNION under the key
  // "rotation" — not "quaternion", which is three.js's own name for it.
  // Reading the wrong key silently drops the root's 90° rotation, which
  // turns the hall onto its end.
  const q = node.rotation ?? [0, 0, 0, 1]
  const t = node.translation ?? [0, 0, 0]
  const s = node.scale ?? [1, 1, 1]
  m.compose(
    new Vector3(t[0], t[1], t[2]),
    new Quaternion(q[0], q[1], q[2], q[3]),
    new Vector3(s[0], s[1], s[2]),
  )
  return m
}

/**
 * Splits one primitive into connected components.
 *
 * Two triangles belong to the same part when they share a VERTEX (not just
 * an edge) — that is exactly Blender's "loose parts" rule.
 */
function looseParts(prim, world) {
  const pos = readAccessor(prim.attributes?.POSITION)
  if (!pos) return []

  const idx = prim.indices !== undefined ? readAccessor(prim.indices) : null
  const triCount = idx ? idx.count / 3 : pos.count / 3
  if (!Number.isFinite(triCount) || triCount === 0) return []

  const v = new Vector3()

  // The world-space position of every vertex.
  const wx = new Float32Array(pos.count)
  const wy = new Float32Array(pos.count)
  const wz = new Float32Array(pos.count)
  for (let i = 0; i < pos.count; i++) {
    v.set(pos.values[i * pos.comps], pos.values[i * pos.comps + 1], pos.values[i * pos.comps + 2])
    v.applyMatrix4(world)
    wx[i] = v.x
    wy[i] = v.y
    wz[i] = v.z
  }

  // Union-find over vertices, joined through triangle edges.
  const parent = new Int32Array(pos.count)
  for (let i = 0; i < pos.count; i++) parent[i] = i
  const find = (a) => {
    while (parent[a] !== a) {
      parent[a] = parent[parent[a]]
      a = parent[a]
    }
    return a
  }
  const union = (a, b) => {
    const ra = find(a)
    const rb = find(b)
    if (ra !== rb) parent[rb] = ra
  }

  for (let t = 0; t < triCount; t++) {
    const a = idx ? idx.values[t * 3] : t * 3
    const b = idx ? idx.values[t * 3 + 1] : t * 3 + 1
    const c = idx ? idx.values[t * 3 + 2] : t * 3 + 2
    union(a, b)
    union(b, c)
  }

  // Group the triangles by their root vertex, and box each group.
  const groups = new Map()
  for (let t = 0; t < triCount; t++) {
    const a = idx ? idx.values[t * 3] : t * 3
    const root = find(a)
    let box = groups.get(root)
    if (!box) {
      box = new Box3()
      groups.set(root, box)
    }
    for (let k = 0; k < 3; k++) {
      const vi = idx ? idx.values[t * 3 + k] : t * 3 + k
      box.expandByPoint(v.set(wx[vi], wy[vi], wz[vi]))
    }
  }

  return [...groups.values()]
}

// ── Walk the scene, splitting every mesh into loose parts ─────────────────
const parts = []

function visit(nodeIndex, parentMatrix) {
  const node = g.nodes?.[nodeIndex]
  if (!node) return
  const world = parentMatrix.clone().multiply(nodeMatrix(node))

  if (node.mesh !== undefined) {
    const mesh = g.meshes?.[node.mesh]
    for (const prim of mesh?.primitives ?? []) {
      // Only triangle geometry is split; a LINES primitive is skipped.
      if ((prim.mode ?? 4) !== 4) continue
      for (const box of looseParts(prim, world)) {
        const size = box.getSize(new Vector3())
        const centre = box.getCenter(new Vector3())
        parts.push({
          node: node.name,
          material: g.materials?.[prim.material]?.name ?? null,
          materialIndex: prim.material ?? null,
          centre: [round(centre.x), round(centre.y), round(centre.z)],
          size: [round(size.x), round(size.y), round(size.z)],
          min: [round(box.min.x), round(box.min.y), round(box.min.z)],
          max: [round(box.max.x), round(box.max.y), round(box.max.z)],
        })
      }
    }
  }
  for (const child of node.children ?? []) visit(child, world)
}

function round(v) {
  return Math.round(v * 100) / 100
}

const root = new Matrix4()
for (const r of g.scenes?.[g.scene ?? 0]?.nodes ?? []) visit(r, root)

console.log(`LOOSE PARTS: ${parts.length}`)

// ── The overall bounds ────────────────────────────────────────────────────
const all = new Box3()
for (const p of parts) {
  all.expandByPoint(new Vector3(p.min[0], p.min[1], p.min[2]))
  all.expandByPoint(new Vector3(p.max[0], p.max[1], p.max[2]))
}
const hallSize = all.getSize(new Vector3())
console.log(
  `HALL: min ${all.min.toArray().map((v) => v.toFixed(0)).join(', ')}  ` +
    `max ${all.max.toArray().map((v) => v.toFixed(0)).join(', ')}  ` +
    `size ${hallSize.toArray().map((v) => v.toFixed(0)).join(' x ')}`,
)

// ── Classify the fire sources by shape ────────────────────────────────────
//
//  A CANDLE   — small, narrow, and TALLER than it is wide, standing up.
//  A BRAZIER  — a bowl: wider than tall, sitting off to one side, high up.
//  A FIREBOX  — a large, flat, upright sheet (the painted fire backdrop).
const candles = []
const braziers = []
const fireboxes = []

for (const p of parts) {
  const [sx, sy, sz] = p.size
  const [cx, cy, cz] = p.centre

  // A candle: small in X and Z, tall in Y.
  if (sx < 22 && sz < 22 && sy > 6 && sy < 60 && sy > sx * 1.6) {
    candles.push(p)
    continue
  }

  // A firebox: a big flat upright sheet.
  if (sz < 25 && sx > 120 && sy > 120) {
    fireboxes.push(p)
    continue
  }

  // A brazier: a bowl, wide and shallow, off the centre line, above the
  // table height.
  if (sx > 25 && sx < 130 && sy < 70 && Math.abs(cx - hallSize.x / 2 - all.min.x) > 60 && cy > all.min.y + 20) {
    braziers.push(p)
  }
}

const show = (label, list) => {
  console.log(`\n=== ${label} (${list.length}) ===`)
  for (const p of list
    .slice()
    .sort((a, b) => a.centre[2] - b.centre[2])
    .slice(0, 60)) {
    console.log(
      `  ${String(p.node).padEnd(14)} ${String(p.material).padEnd(12)} ` +
        `c=(${p.centre.map((v) => v.toFixed(0).padStart(6)).join(',')}) ` +
        `s=(${p.size.map((v) => v.toFixed(0).padStart(5)).join(' x ')})`,
    )
  }
}

show('CANDLES', candles)
show('BRAZIERS', braziers)
show('FIREBOXES', fireboxes)

writeFileSync(
  outPath,
  JSON.stringify(
    {
      hall: {
        min: all.min.toArray().map(round),
        max: all.max.toArray().map(round),
        size: hallSize.toArray().map(round),
      },
      candles,
      braziers,
      fireboxes,
      parts,
    },
    null,
    1,
  ),
)
console.log(`\nWROTE ${outPath}`)
