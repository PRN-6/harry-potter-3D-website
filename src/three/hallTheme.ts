import * as THREE from 'three'
import type { House, HouseId } from '../data/houses'
import { HOUSE_BY_ID } from '../data/houses'

/**
 * Materials and palette for the Great Hall.
 *
 * Every material is created ONCE and shared by the meshes that use it.
 * Three.js recompiles a shader per material, so sharing them is the single
 * biggest win for render performance on a phone.
 */

/** The floating candles' warm light. */
export const CANDLE_LIGHT = '#ffb347'

/** The deep night sky visible through the enchanted ceiling. */
export const NIGHT_SKY = '#0a0714'

/** Warm stone for the walls and floor. */
export const STONE = '#4a4238'
export const STONE_DARK = '#2c2721'
export const WOOD = '#3d2b1f'
export const WOOD_LIGHT = '#6b4a2f'
export const GOLD = '#c9a227'
export const CANDLE_FLAME = '#fff3c4'

/** The hot core of a flame. */
export const FIRE_FLAME_COLOUR = '#ffb43c'
/** The soft halo thrown off by a flame. */
export const FIRE_GLOW_COLOUR = '#ff7a1a'

export interface HallMaterials {
  floor: THREE.MeshStandardMaterial
  floorEdge: THREE.MeshStandardMaterial
  wall: THREE.MeshStandardMaterial
  wallStone: THREE.MeshStandardMaterial
  beam: THREE.MeshStandardMaterial
  wood: THREE.MeshStandardMaterial
  woodLight: THREE.MeshStandardMaterial
  gold: THREE.MeshStandardMaterial
  banner: THREE.MeshStandardMaterial
  candleWax: THREE.MeshStandardMaterial
  flame: THREE.MeshBasicMaterial
  sky: THREE.MeshBasicMaterial
  tableCloth: THREE.MeshStandardMaterial
  goblet: THREE.MeshStandardMaterial
  plate: THREE.MeshStandardMaterial
  /** The animated flame's billboard material. */
  fireFlame: THREE.MeshBasicMaterial
  /** The soft halo around each flame. */
  fireGlow: THREE.MeshBasicMaterial
  /** The floating candles' own small flames. */
  candleFlame: THREE.MeshBasicMaterial
  /** The halo around each floating candle's flame. */
  candleGlow: THREE.MeshBasicMaterial
}

export function createHallMaterials(): HallMaterials {
  return {
    floor: new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.85, metalness: 0.05 }),
    floorEdge: new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 0.9 }),
    wall: new THREE.MeshStandardMaterial({ color: STONE_DARK, roughness: 0.95, side: THREE.DoubleSide }),
    wallStone: new THREE.MeshStandardMaterial({ color: STONE, roughness: 0.9 }),
    beam: new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.8 }),
    wood: new THREE.MeshStandardMaterial({ color: WOOD, roughness: 0.75 }),
    woodLight: new THREE.MeshStandardMaterial({ color: WOOD_LIGHT, roughness: 0.7 }),
    gold: new THREE.MeshStandardMaterial({
      color: GOLD,
      roughness: 0.25,
      metalness: 0.85,
      emissive: new THREE.Color(GOLD).multiplyScalar(0.08),
    }),
    banner: new THREE.MeshStandardMaterial({
      color: '#6b1f2a',
      roughness: 0.9,
      side: THREE.DoubleSide,
    }),
    candleWax: new THREE.MeshStandardMaterial({ color: '#f2ead6', roughness: 0.6 }),
    flame: new THREE.MeshBasicMaterial({ color: CANDLE_FLAME, toneMapped: false }),
    sky: new THREE.MeshBasicMaterial({ color: NIGHT_SKY, side: THREE.BackSide, toneMapped: false }),
    tableCloth: new THREE.MeshStandardMaterial({ color: '#d8c9a8', roughness: 0.95 }),
    goblet: new THREE.MeshStandardMaterial({
      color: '#c9c9d1',
      roughness: 0.15,
      metalness: 0.9,
    }),
    plate: new THREE.MeshStandardMaterial({ color: '#f0ece0', roughness: 0.4 }),
    fireFlame: new THREE.MeshBasicMaterial({
      // WHITE, not orange. The per-fire colour rides on the instance colour
      // attribute, which MULTIPLIES the material's colour — so a coloured
      // material would tint every flame the same way and the instance
      // colours would have no effect. White leaves the tint to the
      // instance, so one draw call can hold a roaring fireplace AND a pale
      // table candle.
      color: 0xffffff,
      map: getFlameTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    fireGlow: new THREE.MeshBasicMaterial({
      color: 0xffffff,
      map: getGlowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    // The floating candles' flames.
    //
    // The same teardrop as the big fires, but TINTED WARM at the material
    // level rather than through the instance colour, because these are a
    // separate mesh with a separate material. Additive blending, so
    // overlapping candles build up into a warm haze rather than turning
    // into a sheet of white.
    candleFlame: new THREE.MeshBasicMaterial({
      color: '#ffb861',
      map: getFlameTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
    candleGlow: new THREE.MeshBasicMaterial({
      color: '#ff9a3c',
      map: getGlowTexture(),
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      toneMapped: false,
    }),
  }
}

/**
 * Shared singleton materials.
 *
 * A `<meshStandardMaterial>` written inline in JSX creates a NEW material for
 * every instance. The hall has hundreds of goblets, plates and stones, and
 * each distinct material costs a shader program. These singletons are
 * created once for the whole scene and shared by every mesh that needs them.
 */
let _shared: HallMaterials | null = null

export function getHallMaterials(): HallMaterials {
  if (!_shared) {
    _shared = createHallMaterials()
  }
  return _shared
}

/**
 * A soft round dot, used as the sprite for every `pointsMaterial` in the hall.
 *
 * Without a map, a points material renders each point as a hard SQUARE —
 * which looks like broken pixels rather than dust and stars. A radial
 * gradient makes them soft and round.
 *
 * The texture is generated on a canvas, so it costs nothing to download.
 */
let _dotTexture: THREE.Texture | null = null

export function getDotTexture(): THREE.Texture {
  if (_dotTexture) return _dotTexture

  const size = 64
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    gradient.addColorStop(0, 'rgba(255,255,255,1)')
    gradient.addColorStop(0.35, 'rgba(255,255,255,0.85)')
    gradient.addColorStop(0.7, 'rgba(255,255,255,0.2)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  _dotTexture = texture
  return texture
}

/**
 * The flame's texture — a teardrop with a hot core.
 *
 * Drawn on a canvas rather than downloaded, so it costs nothing.
 *
 * The shape matters more than the colour: a flame is a teardrop that is
 * WIDE at the base and comes to a point at the top, and it fades out at the
 * edges. A plain soft blob reads as a light, not as fire.
 */
let _flameTexture: THREE.Texture | null = null

export function getFlameTexture(): THREE.Texture {
  if (_flameTexture) return _flameTexture

  const w = 128
  const h = 256
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h

  const ctx = canvas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, w, h)

    // The flame's outline: a teardrop. The width narrows as it rises, and it
    // comes to a point at the top.
    const path = new Path2D()
    const cx = w / 2
    path.moveTo(cx, h * 0.02)
    path.bezierCurveTo(cx + w * 0.34, h * 0.34, cx + w * 0.46, h * 0.72, cx + w * 0.3, h * 0.93)
    path.bezierCurveTo(cx + w * 0.16, h * 0.99, cx - w * 0.16, h * 0.99, cx - w * 0.3, h * 0.93)
    path.bezierCurveTo(cx - w * 0.46, h * 0.72, cx - w * 0.34, h * 0.34, cx, h * 0.02)
    path.closePath()

    // A vertical gradient: white-hot at the base, orange at the tip, and
    // fading out entirely at the very bottom where the wax is.
    const grad = ctx.createLinearGradient(0, h, 0, 0)
    grad.addColorStop(0.0, 'rgba(255,255,240,0.95)')
    grad.addColorStop(0.18, 'rgba(255,236,150,0.9)')
    grad.addColorStop(0.48, 'rgba(255,170,50,0.72)')
    grad.addColorStop(0.78, 'rgba(255,110,25,0.38)')
    grad.addColorStop(1.0, 'rgba(255,80,10,0)')

    ctx.fillStyle = grad
    ctx.fill(path)

    // The hot inner core, a smaller teardrop offset downward.
    const core = new Path2D()
    core.moveTo(cx, h * 0.3)
    core.bezierCurveTo(cx + w * 0.2, h * 0.55, cx + w * 0.22, h * 0.84, cx, h * 0.95)
    core.bezierCurveTo(cx - w * 0.22, h * 0.84, cx - w * 0.2, h * 0.55, cx, h * 0.3)
    core.closePath()
    const coreGrad = ctx.createLinearGradient(0, h, 0, h * 0.3)
    coreGrad.addColorStop(0, 'rgba(255,255,255,0.95)')
    coreGrad.addColorStop(1, 'rgba(255,240,190,0)')
    ctx.fillStyle = coreGrad
    ctx.fill(core)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  _flameTexture = texture
  return texture
}

/**
 * The soft halo thrown off by a flame.
 *
 * A plain radial gradient, tinted warm. It sits behind the flame and makes
 * the fire look like it is glowing into the air around it, rather than
 * pasted on top of the scene.
 */
let _glowTexture: THREE.Texture | null = null

export function getGlowTexture(): THREE.Texture {
  if (_glowTexture) return _glowTexture

  const size = 128
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size

  const ctx = canvas.getContext('2d')
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2,
    )
    gradient.addColorStop(0, 'rgba(255,190,90,0.75)')
    gradient.addColorStop(0.25, 'rgba(255,140,40,0.35)')
    gradient.addColorStop(0.6, 'rgba(255,100,20,0.1)')
    gradient.addColorStop(1, 'rgba(255,80,10,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  _glowTexture = texture
  return texture
}

/**
 * The four house table settings.
 *
 * The four long tables run the length of the hall, two on each side of a
 * central aisle — exactly as in the film.
 */
export interface TableSetting {
  house: House
  /** Position of the table's centre along the Z axis (length of the hall). */
  z: number
  /** Position along X. */
  x: number
  /** Cloth tint taken from the house colour, kept dark enough to read. */
  clothColor: THREE.Color
  bannerColor: THREE.Color
}

/**
 * Seating layout for the PROCEDURAL hall.
 *
 * The procedural hall runs along Z. Gryffindor and Ravenclaw sit on the
 * left, Slytherin and Hufflepuff on the right, and the High Table sits at
 * the far end (+Z).
 *
 * The Z positions are derived from the hall's dimensions rather than picked
 * by eye, because the two tables on each side must NOT overlap:
 *   table length 18 × 2 tables = 36, plus a 4-unit gap = 40.
 *   That leaves the span from z = -24 (4 units from the entrance doors)
 *   to z = 16 (5 units clear of the High Table dais at z = 21).
 *
 * The REAL model's seating is measured from the GLB and lives in
 * `hallBounds.ts`; this function is only for the fallback.
 */
export function buildTableSettings(): TableSetting[] {
  const nearZ = -15 // spans -24 to -6
  const farZ = 7 //   spans  -2 to 16

  const layout: { id: HouseId; x: number; z: number }[] = [
    { id: 'gryffindor', x: -5.5, z: nearZ },
    { id: 'ravenclaw', x: -5.5, z: farZ },
    { id: 'slytherin', x: 5.5, z: nearZ },
    { id: 'hufflepuff', x: 5.5, z: farZ },
  ]

  return layout.map(({ id, x, z }) => {
    const house = HOUSE_BY_ID[id]
    return {
      house,
      x,
      z,
      // The cloth keeps the house hue but is darkened so the gold still reads.
      clothColor: new THREE.Color(house.color).multiplyScalar(0.55),
      bannerColor: new THREE.Color(house.color),
    }
  })
}
