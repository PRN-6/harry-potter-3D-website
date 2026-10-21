/**
 * Verifies the ROOT transform of two GLBs using three.js's OWN quaternion
 * maths (the project's tools/inspect-glb.mjs has a typo in its quaternion
 * formula, so it is not trusted here).
 */
import { readFileSync } from 'node:fs'
import { Quaternion, Matrix4, Vector3, Box3 } from 'three'

function readGlb(path) {
  const buf = readFileSync(path)
  let g = null
  let offset = 12
  while (offset < buf.length) {
    const len = buf.readUInt32LE(offset)
    const type = buf.toString('ascii', offset + 4, offset + 8)
    if (type === 'JSON') g = JSON.parse(buf.toString('utf8', offset + 8, offset + 8 + len))
    offset += 8 + len
  }
  return g
}

function nodeMatrix(node) {
  const m = new Matrix4()
  if (node.matrix) {
    // glTF matrices are column-major, three.js Matrix4.fromArray is too.
    m.fromArray(node.matrix)
    return m
  }
  const q = new Quaternion(...(node.rotation ?? [0, 0, 0, 1]))
  const t = new Vector3(...(node.translation ?? [0, 0, 0]))
  const s = new Vector3(...(node.scale ?? [1, 1, 1]))
  m.compose(t, q, s)
  return m
}

/** Full world-space bbox using three.js matrix composition. */
function worldBox(g) {
  const box = new Box3()
  const v = new Vector3()
  const visit = (nodeIndex, parent) => {
    const node = g.nodes?.[nodeIndex]
    if (!node) return
    const world = parent.clone().multiply(nodeMatrix(node))
    const mesh = g.meshes?.[node.mesh]
    if (mesh) {
      for (const prim of mesh.primitives) {
        const acc = g.accessors?.[prim.attributes?.POSITION]
        if (!acc?.min || !acc?.max) continue
        for (let i = 0; i < 8; i++) {
          v.set(
            i & 1 ? acc.max[0] : acc.min[0],
            i & 2 ? acc.max[1] : acc.min[1],
            i & 4 ? acc.max[2] : acc.min[2],
          ).applyMatrix4(world)
          box.expandByPoint(v)
        }
      }
    }
    for (const c of node.children ?? []) visit(c, world)
  }
  const root = new Matrix4()
  for (const r of g.scenes?.[g.scene ?? 0]?.nodes ?? []) visit(r, root)
  return box
}

for (const p of process.argv.slice(2)) {
  const g = readGlb(p)
  const rootNode = g.nodes?.[g.scenes?.[g.scene ?? 0]?.nodes?.[0]]
  const rootM = nodeMatrix(rootNode)
  const box = worldBox(g)
  const size = box.getSize(new Vector3())

  const cameras = []
  let anims = 0
  g.nodes?.forEach((n, i) => {
    if (n.camera !== undefined) cameras.push(`${i}:${n.name}`)
  })
  anims = g.animations?.length ?? 0
  const skins = g.skins?.length ?? 0

  console.log(`\n=== ${p}`)
  console.log('root matrix (row-major, three.js):')
  const e = rootM.elements
  for (let r = 0; r < 4; r++) {
    console.log('   ', [0, 1, 2, 3].map((c) => e[c * 4 + r].toFixed(3).padStart(7)).join(''))
  }
  console.log('  bbox min ', box.min.toArray().map((v) => v.toFixed(1)).join(', '))
  console.log('  bbox max ', box.max.toArray().map((v) => v.toFixed(1)).join(', '))
  console.log('  size    ', size.toArray().map((v) => v.toFixed(1)).join(' x '), ' (X x Y x Z)')
  console.log('  meshes  ', g.meshes?.length, ' nodes', g.nodes?.length, ' cameras', cameras.length ? cameras.join(',') : 'none')
  console.log('  animations', anims, ' skins', skins)
  console.log('  extensions', Object.keys(g.extensionsUsed ?? {}).join(', ') || 'none')
}
