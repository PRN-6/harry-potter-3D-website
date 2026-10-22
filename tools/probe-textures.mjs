/**
 * Finds the fire sources by the COLOUR of the model's own textures.
 *
 * The hall's materials are painted into 25 PNGs, one per material. Reading
 * their average colour tells us what each one is:
 *
 *   • the FIREBOX   — a saturated orange sheet (the painted fire)
 *   • the BRAZIERS  — the gold bowls on the wall columns
 *   • the CANDLES   — the pale wax standing on the banquet tables
 *
 * This script writes each texture out as a PNG so they can also be looked
 * at directly, and prints each material's average colour.
 *
 * Usage: node tools/probe-textures.mjs <glb> [outDir]
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { inflateSync } from 'node:zlib'

const path = process.argv[2] ?? 'public/models/undifined.glb'
const outDir = process.argv[3] ?? 'blender/out/textures'

const buf = readFileSync(path)
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

mkdirSync(outDir, { recursive: true })

// ── Decode a PNG far enough to find its average colour ────────────────────
//
// A full PNG decoder is a lot of code, and all that is needed here is the
// average colour. The images are PNGs, so the trick is to let the BROWSER
// do it — but this script runs in Node. So: a tiny PNG reader is used, which
// only has to handle the colour types Blender actually writes (8-bit RGB
// and RGBA, with or without a filter).

function crc32(bytes) {
  let c
  const table = crc32.table ?? (crc32.table = buildTable())
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    c = table[(crc ^ bytes[i]) & 0xff]
    crc = (crc >>> 8) ^ c
  }
  return (crc ^ 0xffffffff) >>> 0
}

function buildTable() {
  const table = new Int32Array(256)
  for (let n = 0; n < 256; n++) {
    let c = n
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[n] = c
  }
  return table
}

function paeth(a, b, c) {
  const p = a + b - c
  const pa = Math.abs(p - a)
  const pb = Math.abs(p - b)
  const pc = Math.abs(p - c)
  if (pa <= pb && pa <= pc) return a
  if (pb <= pc) return b
  return c
}

/** Decodes a PNG into { width, height, pixels } (RGBA, 8-bit). */
function decodePng(data) {
  let pos = 8
  let width = 0
  let height = 0
  let bitDepth = 8
  let colorType = 6
  let interlace = 0
  const idat = []

  while (pos < data.length) {
    const len = data.readUInt32BE(pos)
    const type = data.toString('ascii', pos + 4, pos + 8)
    const body = data.subarray(pos + 8, pos + 8 + len)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      bitDepth = body[8]
      colorType = body[9]
      interlace = body[12]
    } else if (type === 'IDAT') {
      idat.push(body)
    } else if (type === 'IEND') {
      break
    }
    pos += 12 + len
  }

  if (bitDepth !== 8) throw new Error(`unsupported bit depth ${bitDepth}`)
  if (interlace !== 0) throw new Error('interlaced PNG not supported')

  const channels = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[colorType]
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = Buffer.alloc(height * stride)

  // Undo the per-scanline filters.
  let rp = 0
  for (let y = 0; y < height; y++) {
    const filter = raw[rp++]
    const line = raw.subarray(rp, rp + stride)
    rp += stride
    const prev = y > 0 ? out.subarray((y - 1) * stride, y * stride) : null
    const cur = out.subarray(y * stride, (y + 1) * stride)
    for (let x = 0; x < stride; x++) {
      const a = x >= channels ? cur[x - channels] : 0
      const b = prev ? prev[x] : 0
      const c = prev && x >= channels ? prev[x - channels] : 0
      let v = line[x]
      if (filter === 1) v += a
      else if (filter === 2) v += b
      else if (filter === 3) v += (a + b) >> 1
      else if (filter === 4) v += paeth(a, b, c)
      cur[x] = v & 0xff
    }
  }

  // Normalise to RGBA.
  const rgba = new Uint8Array(width * height * 4)
  for (let i = 0; i < width * height; i++) {
    const s = i * channels
    const d = i * 4
    if (channels === 1) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]
      rgba[d + 3] = 255
    } else if (channels === 2) {
      rgba[d] = rgba[d + 1] = rgba[d + 2] = out[s]
      rgba[d + 3] = out[s + 1]
    } else if (channels === 3) {
      rgba[d] = out[s]
      rgba[d + 1] = out[s + 1]
      rgba[d + 2] = out[s + 2]
      rgba[d + 3] = 255
    } else {
      rgba[d] = out[s]
      rgba[d + 1] = out[s + 1]
      rgba[d + 2] = out[s + 2]
      rgba[d + 3] = out[s + 3]
    }
  }
  return { width, height, pixels: rgba }
}

/** The average colour of a PNG, ignoring transparent pixels. */
function averageColour(png) {
  let r = 0
  let gg = 0
  let b = 0
  let n = 0
  const { width, height, pixels } = png
  // Sample every 4th pixel — plenty for an average, and 16× faster.
  for (let y = 0; y < height; y += 4) {
    for (let x = 0; x < width; x += 4) {
      const i = (y * width + x) * 4
      const a = pixels[i + 3]
      if (a < 128) continue
      r += pixels[i]
      gg += pixels[i + 1]
      b += pixels[i + 2]
      n++
    }
  }
  if (!n) return null
  return [r / n / 255, gg / n / 255, b / n / 255]
}

/** The brightest, most saturated pixel — the painted fire's colour. */
function hottestColour(png) {
  let best = null
  let bestScore = -1
  const { width, height, pixels } = png
  for (let y = 0; y < height; y += 2) {
    for (let x = 0; x < width; x += 2) {
      const i = (y * width + x) * 4
      if (pixels[i + 3] < 128) continue
      const r = pixels[i] / 255
      const gg = pixels[i + 1] / 255
      const bl = pixels[i + 2] / 255
      const max = Math.max(r, gg, bl)
      const min = Math.min(r, gg, bl)
      const sat = max > 0 ? (max - min) / max : 0
      // Saturated AND bright is what a painted flame looks like.
      const score = sat * 2 + max
      if (score > bestScore) {
        bestScore = score
        best = [r, gg, bl]
      }
    }
  }
  return best
}

// ── Run over every material ───────────────────────────────────────────────
console.log('=== MATERIAL TEXTURES ===')
const results = []

for (let m = 0; m < (g.materials?.length ?? 0); m++) {
  const mat = g.materials[m]
  const texIndex = mat.pbrMetallicRoughness?.baseColorTexture?.index
  if (texIndex === undefined) continue

  const tex = g.textures[texIndex]
  const image = g.images[tex.source]
  if (image?.bufferView === undefined) continue

  const bv = g.bufferViews[image.bufferView]
  const pngBytes = bin.subarray(bv.byteOffset ?? 0, (bv.byteOffset ?? 0) + bv.byteLength)

  let avg = null
  let hot = null
  let dims = ''
  try {
    const png = decodePng(pngBytes)
    dims = `${png.width}x${png.height}`
    avg = averageColour(png)
    hot = hottestColour(png)
  } catch (err) {
    console.log(`  [${m}] ${mat.name}: decode failed — ${err.message}`)
    continue
  }

  const name = `${String(m).padStart(2, '0')}_${mat.name ?? 'unnamed'}.png`
  writeFileSync(`${outDir}/${name}`, pngBytes)

  results.push({ index: m, name: mat.name, avg, hot, dims })
  console.log(
    `  [${String(m).padStart(2)}] ${(mat.name ?? '?').padEnd(12)} ${dims.padEnd(11)} ` +
      `avg=(${avg ? avg.map((v) => v.toFixed(2)).join(',') : '?'})  ` +
      `hot=(${hot ? hot.map((v) => v.toFixed(2)).join(',') : '?'})`,
  )
}

// ── Classify ──────────────────────────────────────────────────────────────
console.log('\n=== CLASSIFIED ===')
const fire = results.filter((r) => r.hot && r.hot[0] > 0.6 && r.hot[0] > r.hot[2] * 1.6)
const gold = results.filter(
  (r) => r.avg && r.avg[0] > 0.4 && r.avg[0] > r.avg[2] * 1.15 && r.avg[1] > r.avg[2] * 1.05,
)

console.log('  FIREBOX materials (saturated orange):')
fire.forEach((r) => console.log(`    [${r.index}] ${r.name} hot=(${r.hot.map((v) => v.toFixed(2)).join(',')})`))

console.log('  GOLD / BRASS materials:')
gold.forEach((r) => console.log(`    [${r.index}] ${r.name} avg=(${r.avg.map((v) => v.toFixed(2)).join(',')})`))

writeFileSync(`${outDir}/../material-colours.json`, JSON.stringify(results, null, 1))
console.log(`\nWrote ${outDir}/ and material-colours.json`)
