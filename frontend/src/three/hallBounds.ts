import type { HouseId } from '../data/houses'

/**
 * The hall's dimensions and furniture, in world units.
 *
 * The hall the visitor sees is the real `hogwarts_dining_hall_rigged.glb`,
 * and its
 * size is only known once the file has downloaded and been fitted into the
 * scene. Until then the scene uses the procedural fallback's dimensions, and
 * `DiningHallModel` publishes the fitted ones the moment it has them.
 *
 * The numbers below are the FITTED model, measured from the GLB's own
 * vertex data with `tools/probe-tables.mjs`:
 *
 *   length  56.0   the entrance doors to the High Table
 *   width   20.2   wall to wall
 *   height  17.4   floor to the vault
 *
 * The model is scaled so one world unit is roughly one metre, which is why
 * the camera path uses eye-level heights like 1.9 and 2.4.
 */

export interface HallBounds {
  /** Left-to-right width (X). */
  width: number
  /** Floor-to-ceiling height (Y). */
  height: number
  /** Entrance-to-High-Table length (Z). */
  length: number
}

/** The procedural fallback hall's size — used until the model reports in. */
export const PROCEDURAL_HALL: HallBounds = {
  width: 34,
  height: 22,
  length: 56,
}

/** Where a house sits in the hall. */
export interface HouseSpot {
  house: HouseId
  /** Across the hall (X). */
  x: number
  /** Along the hall (Z). */
  z: number
}

/**
 * The real model's four banquet tables.
 *
 * Measured from the GLB: the tables are four long horizontal slabs whose
 * centres sit at these X positions, with the central aisle running between
 * the two middle ones.
 */
const MODEL_HOUSE_SPOTS: HouseSpot[] = [
  { house: 'gryffindor', x: -5.8, z: 0 },
  { house: 'ravenclaw', x: -2.1, z: 0 },
  { house: 'hufflepuff', x: 3.2, z: 0 },
  { house: 'slytherin', x: 6.8, z: 0 },
]

/** The procedural fallback's layout: two tables per side of a central aisle. */
const PROCEDURAL_HOUSE_SPOTS: HouseSpot[] = [
  { house: 'gryffindor', x: -5.5, z: -15 },
  { house: 'ravenclaw', x: -5.5, z: 7 },
  { house: 'hufflepuff', x: 5.5, z: 7 },
  { house: 'slytherin', x: 5.5, z: -15 },
]

/** The height of the banquet table tops, in world units. */
export const MODEL_TABLE_TOP_Y = 1.05

/**
 * The Z of the entrance doorway, in world units.
 *
 * Measured from the model by `blender/build_door_rig.py`, which writes
 * the same number to `public/data/hall-door.json`: the doorway sits at
 * z ≈ -27.37, just outside the room's -28 end wall.
 */
export const MODEL_ENTRANCE_Z = -28.5

/**
 * Everything the scene needs to know about whichever hall is on screen.
 *
 * The camera path, the candle lattice and the house spotlight all need to
 * know where the tables are, and they need to know it for BOTH halls: the
 * real model and the procedural fallback.
 */
export interface HallFeatures {
  bounds: HallBounds
  /** Where each house sits. */
  spots: HouseSpot[]
  /** The height of the table tops. */
  tableTopY: number
  /** The X of the middle of the central aisle. */
  aisleX: number
  /** The Z of the High Table. */
  highTableZ: number
  /** The Z of the entrance doors. */
  entranceZ: number
}

/**
 * Describes the hall currently on screen.
 *
 * `model` is true once the real GLB has been fitted; until then the
 * procedural fallback's layout is used.
 */
export function hallFeatures(bounds: HallBounds, model: boolean): HallFeatures {
  const spots = model ? MODEL_HOUSE_SPOTS : PROCEDURAL_HOUSE_SPOTS
  const { length } = bounds

  // The aisle runs between the two middle tables.
  const middle = spots.map((s) => s.x).sort((a, b) => a - b)
  const aisleX = (middle[1] + middle[2]) / 2

  return {
    bounds,
    spots,
    tableTopY: model ? MODEL_TABLE_TOP_Y : 1.9,
    aisleX,
    highTableZ: model ? length / 2 - 1.5 : length / 2 - 4,
    entranceZ: model ? MODEL_ENTRANCE_Z : -length / 2 + 4,
  }
}
