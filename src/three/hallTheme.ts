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
