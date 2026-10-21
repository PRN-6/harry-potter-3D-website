/**
 * STRIPS THE SKETCHUP EDGE OVERLAY FROM THE GLB.
 *
 * THE PROBLEM
 *   Sketchfab's SketchUp exporter draws every hard edge of the original
 *   model as a separate LINES primitive. In `hogwarts_dining_hall.glb` that
 *   is mesh index 1 — node "Material4", 58,987 vertices, 137,093 edges,
 *   zero triangles, material "edge_color646464255".
 *
 *   three.js loads LINES primitives as `LineSegments` (GLTFLoader.js:3816),
 *   so the overlay really is drawn: a bright white wireframe over every
 *   wall, table, goblet and bench in the hall. It is the single most
 *   visible defect in the scene.
 *
 * WHAT THIS DOES
 *   Rewrites the GLB without the LINES primitives. Everything else is
 *   copied through untouched, and the binary chunk is left byte-identical
 *   — so the textures, the vertex data and the material bindings cannot
 *   possibly be disturbed by the edit.
 *
 *   Orphaned accessors and bufferViews are removed from the JSON where
 *   nothing references them any more. The bytes they used to occupy stay
 *   in the binary chunk, which is legal glTF: a buffer may be longer than
 *   the sum of its views, and a bufferView need not be referenced.
 *
 * SAFETY
 *   The output file NEVER overwrites the input. It defaults to a sibling
 *   with "-clean" before the extension, and refuses to write to the input
 *   path unless `--in-place` is passed explicitly.
 *
 * USAGE
 *   node tools/strip-edge-overlay.mjs --report [glb]
 *   node tools/strip-edge-overlay.mjs [glb] [out.glb]
 *   node tools/strip-edge-overlay.mjs --in-place [glb]
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs'
import { resolve, dirname, basename, extname, join } from 'node:path'

const argv = process.argv.slice(2)
const reportOnly = argv.includes('--report')
const inPlace = argv.includes('--in-place')
const args = argv.filter((a) => !a.startsWith('--'))

const INPUT = resolve(args[0] ?? 'public/models/hogwarts_dining_hall.glb')

if (!existsSync(INPUT)) {
  console.error(`Not found: ${INPUT}`)
  process.exit(1)
}

// The output is a different file unless the caller explicitly asks for
// --in-place. Never silently clobber the source.
let OUTPUT
if (inPlace) {
  OUTPUT = INPUT
} else if (args[1]) {
  OUTPUT = resolve(args[1])
} else {
  const dir = dirname(INPUT)
  const ext = extname(INPUT)
  const stem = basename(INPUT, ext)
  OUTPUT = join(dir, `${stem}-clean${ext}`)
}

if (OUTPUT === INPUT && !inPlace) {
  console.error('Refusing to overwrite the input without --in-place.')
  process.exit(1)
}

// ── Read the GLB ────────────────────────────────────────────────────────────
const buf = readFileSync(INPUT)
if (buf.toString('ascii', 0, 4) !== 'glTF') {
  console.error(`Not a GLB file: ${INPUT}`)
  process.exit(1)
}

let gltf = null
let bin = null
let offset = 12

while (offset < buf.length) {
  const length = buf.readUInt32LE(offset)
  const type = buf.toString('ascii', offset + 4, offset + 8)
  if (type === 'JSON') {
    gltf = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + length))
  } else if (type.startsWith('BIN')) {
    bin = buf.subarray(offset + 8, offset + 8 + length)
  }
  offset += 8 + length
}

if (!gltf || !bin) {
  console.error('Missing JSON or BIN chunk')
  process.exit(1)
}

// ── The glTF primitive modes ────────────────────────────────────────────────
const MODE = {
  0: 'POINTS',
  1: 'LINES',
  2: 'LINE_LOOP',
  3: 'LINE_STRIP',
  4: 'TRIANGLES',
  5: 'TRIANGLE_STRIP',
  6: 'TRIANGLE_FAN',
}

const meshes = gltf.meshes ?? []
const nodes = gltf.nodes ?? []
const accessors = gltf.accessors ?? []
const bufferViews = gltf.bufferViews ?? []
const materials = gltf.materials ?? []

// ── Find every non-triangle primitive ──────────────────────────────────────
// A LINES/POINTS primitive is a drawing aid, never the model itself. They
// are the SketchUp edge overlay and the CAD "hidden line" overlay.
const linePrimitives = []
for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
  const prims = meshes[meshIndex].primitives ?? []
  for (let primIndex = 0; primIndex < prims.length; primIndex++) {
    const prim = prims[primIndex]
    const mode = prim.mode ?? 4
    if (mode === 4) continue
    linePrimitives.push({ meshIndex, primIndex, mode, prim })
  }
}

// Which nodes use which mesh?
const meshUsers = new Map()
for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
  const meshIndex = nodes[nodeIndex].mesh
  if (meshIndex === undefined) continue
  if (!meshUsers.has(meshIndex)) meshUsers.set(meshIndex, [])
  meshUsers.get(meshIndex).push(nodeIndex)
}

// ── Report ──────────────────────────────────────────────────────────────────
console.log('EDGE OVERLAY STRIPPER')
console.log(`  file    ${INPUT}`)
console.log(`  meshes  ${meshes.length}   nodes ${nodes.length}   materials ${materials.length}`)

if (linePrimitives.length === 0) {
  console.log('  nothing to strip — every primitive is a triangle.')
  process.exit(0)
}

for (const { meshIndex, primIndex, mode, prim } of linePrimitives) {
  const posAcc = prim.attributes?.POSITION
  const count = posAcc !== undefined ? (accessors[posAcc]?.count ?? 0) : 0
  const idxAcc = prim.indices
  const idxCount = idxAcc !== undefined ? (accessors[idxAcc]?.count ?? 0) : 0
  const material = prim.material !== undefined ? materials[prim.material] : null
  console.log(
    `  strip   mesh[${meshIndex}] "${meshes[meshIndex].name ?? '(unnamed)'}"` +
      ` prim[${primIndex}] ${MODE[mode] ?? mode}` +
      `  ${count} verts  ${idxCount} indices` +
      `  material "${material?.name ?? 'none'}"`,
  )
  const users = meshUsers.get(meshIndex) ?? []
  if (users.length) {
    console.log(`          used by node(s) ${users.map((n) => `"${nodes[n].name ?? n}"`).join(', ')}`)
  }
}

if (reportOnly) {
  console.log('  --report given: nothing written.')
  process.exit(0)
}

// ── Edit the JSON ───────────────────────────────────────────────────────────
// 1. Drop the line primitives from their meshes.
for (const { meshIndex, primIndex } of linePrimitives) {
  meshes[meshIndex].primitives.splice(primIndex, 1)
}

// 2. Drop the meshes that are now empty, and the nodes that used them.
const emptiedMeshes = new Set()
for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
  if (!meshes[meshIndex].primitives || meshes[meshIndex].primitives.length === 0) {
    emptiedMeshes.add(meshIndex)
  }
}

const removedNodeSet = new Set()
for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
  const node = nodes[nodeIndex]
  if (node.mesh !== undefined && emptiedMeshes.has(node.mesh)) {
    removedNodeSet.add(nodeIndex)
  }
}

// Remove the dead nodes from their parents' child lists and the scene roots.
for (const node of nodes) {
  if (!node.children) continue
  node.children = node.children.filter((child) => !removedNodeSet.has(child))
}
if (gltf.scenes) {
  for (const scene of gltf.scenes) {
    if (!scene.nodes) continue
    scene.nodes = scene.nodes.filter((node) => !removedNodeSet.has(node))
  }
}

// Rebuild the node array so the indices stay contiguous.
const nodeRemap = new Map()
const keptNodes = []
for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex++) {
  if (removedNodeSet.has(nodeIndex)) continue
  nodeRemap.set(nodeIndex, keptNodes.length)
  keptNodes.push(nodes[nodeIndex])
}
gltf.nodes = keptNodes
for (const node of keptNodes) {
  if (node.children) {
    node.children = node.children.map((child) => nodeRemap.get(child) ?? child)
  }
}

// 3. Rebuild the mesh array the same way.
const meshRemap = new Map()
const keptMeshes = []
for (let meshIndex = 0; meshIndex < meshes.length; meshIndex++) {
  if (emptiedMeshes.has(meshIndex)) continue
  meshRemap.set(meshIndex, keptMeshes.length)
  keptMeshes.push(meshes[meshIndex])
}
gltf.meshes = keptMeshes
for (const node of keptNodes) {
  if (node.mesh !== undefined) {
    node.mesh = meshRemap.get(node.mesh) ?? node.mesh
  }
}

// 4. Work out which accessors and bufferViews are now orphaned.
const usedAccessors = new Set()
for (const mesh of keptMeshes) {
  for (const prim of mesh.primitives ?? []) {
    for (const accIndex of Object.values(prim.attributes ?? {})) {
      usedAccessors.add(accIndex)
    }
    if (prim.indices !== undefined) usedAccessors.add(prim.indices)
  }
}
for (const skin of gltf.skins ?? []) {
  if (skin.inverseBindMatrices !== undefined) usedAccessors.add(skin.inverseBindMatrices)
}
for (const anim of gltf.animations ?? []) {
  for (const sampler of anim.samplers ?? []) {
    if (sampler.input !== undefined) usedAccessors.add(sampler.input)
    if (sampler.output !== undefined) usedAccessors.add(sampler.output)
  }
}

const usedBufferViews = new Set()
for (const accIndex of usedAccessors) {
  const acc = accessors[accIndex]
  if (acc && acc.bufferView !== undefined) usedBufferViews.add(acc.bufferView)
}

const accRemap = new Map()
const keptAccessors = []
for (let accIndex = 0; accIndex < accessors.length; accIndex++) {
  if (!usedAccessors.has(accIndex)) continue
  accRemap.set(accIndex, keptAccessors.length)
  keptAccessors.push(accessors[accIndex])
}
gltf.accessors = keptAccessors

const bvRemap = new Map()
const keptBufferViews = []
for (let bvIndex = 0; bvIndex < bufferViews.length; bvIndex++) {
  if (!usedBufferViews.has(bvIndex)) continue
  bvRemap.set(bvIndex, keptBufferViews.length)
  keptBufferViews.push(bufferViews[bvIndex])
}
gltf.bufferViews = keptBufferViews

for (const acc of keptAccessors) {
  if (acc.bufferView !== undefined) {
    acc.bufferView = bvRemap.get(acc.bufferView) ?? acc.bufferView
  }
}
for (const mesh of keptMeshes) {
  for (const prim of mesh.primitives ?? []) {
    for (const [key, accIndex] of Object.entries(prim.attributes ?? {})) {
      prim.attributes[key] = accRemap.get(accIndex) ?? accIndex
    }
    if (prim.indices !== undefined) {
      prim.indices = accRemap.get(prim.indices) ?? prim.indices
    }
  }
}
for (const anim of gltf.animations ?? []) {
  for (const sampler of anim.samplers ?? []) {
    if (sampler.input !== undefined) sampler.input = accRemap.get(sampler.input) ?? sampler.input
    if (sampler.output !== undefined) sampler.output = accRemap.get(sampler.output) ?? sampler.output
  }
}

// 5. Drop materials that nothing uses any more.
const usedMaterials = new Set()
for (const mesh of keptMeshes) {
  for (const prim of mesh.primitives ?? []) {
    if (prim.material !== undefined) usedMaterials.add(prim.material)
  }
}
const matRemap = new Map()
const keptMaterials = []
for (let matIndex = 0; matIndex < materials.length; matIndex++) {
  if (!usedMaterials.has(matIndex)) continue
  matRemap.set(matIndex, keptMaterials.length)
  keptMaterials.push(materials[matIndex])
}
gltf.materials = keptMaterials
for (const mesh of keptMeshes) {
  for (const prim of mesh.primitives ?? []) {
    if (prim.material !== undefined) {
      prim.material = matRemap.get(prim.material) ?? prim.material
    }
  }
}

// 6. An animation may name a node by index — remap those too.
for (const anim of gltf.animations ?? []) {
  for (const channel of anim.channels ?? []) {
    if (channel.target && channel.target.node !== undefined) {
      channel.target.node = nodeRemap.get(channel.target.node) ?? channel.target.node
    }
  }
}

// ── Write the GLB back out ──────────────────────────────────────────────────
// The binary chunk is copied verbatim. The JSON chunk is re-serialised and
// padded with spaces to a 4-byte boundary, as the spec requires.
const jsonText = JSON.stringify(gltf)
const jsonBytes = Buffer.from(jsonText, 'utf8')
const jsonPadding = (4 - (jsonBytes.length % 4)) % 4
const jsonChunkLength = jsonBytes.length + jsonPadding
const binPadding = (4 - (bin.length % 4)) % 4
const binChunkLength = bin.length + binPadding

const out = Buffer.alloc(12 + 8 + jsonChunkLength + 8 + binChunkLength)
out.write('glTF', 0, 'ascii')
out.writeUInt32LE(2, 4)
out.writeUInt32LE(out.length, 8)

out.writeUInt32LE(jsonChunkLength, 12)
out.write('JSON', 16, 'ascii')
jsonBytes.copy(out, 20)
out.fill(0x20, 20 + jsonBytes.length, 20 + jsonChunkLength)

const binHeader = 20 + jsonChunkLength
out.writeUInt32LE(binChunkLength, binHeader)
out.write('BIN\0', binHeader + 4, 'ascii')
bin.copy(out, binHeader + 8)
out.fill(0, binHeader + 8 + bin.length, binHeader + 8 + binChunkLength)

mkdirSync(dirname(OUTPUT), { recursive: true })
writeFileSync(OUTPUT, out)

console.log('')
console.log(`  wrote   ${OUTPUT}`)
console.log(`  size    ${(buf.length / 1048576).toFixed(2)} MB → ${(out.length / 1048576).toFixed(2)} MB`)
console.log(`  meshes  ${meshes.length} → ${keptMeshes.length}`)
console.log(`  nodes   ${nodes.length} → ${keptNodes.length}`)
console.log(`  accessors ${accessors.length} → ${keptAccessors.length}`)
console.log(`  bufferViews ${bufferViews.length} → ${keptBufferViews.length}`)
console.log(`  materials ${materials.length} → ${keptMaterials.length}`)
console.log('')
console.log('  The binary chunk was copied byte-for-byte; only the JSON changed.')
