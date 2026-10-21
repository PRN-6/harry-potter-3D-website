/**
 * The four houses, their colours, and their table placement in the Great Hall.
 *
 * Colours are the "canonical" house colours used across the whole site —
 * the 3D hall, the UI accents, and the CSS variables all read from here, so
 * changing a value in this one file restyles the entire experience.
 */

export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'

export interface House {
  id: HouseId
  name: string
  /** Crest emoji — used in list rows and headings. */
  crest: string
  /** Primary house colour, hex. */
  color: string
  /** Secondary/accent colour, hex. */
  accent: string
  /** Traits, shown in the house cards. */
  traits: string[]
  /** One line of house lore. */
  motto: string
  /** The elemental glow the floating candles take in this house's corner. */
  glow: string
}

/** Order matters: this is the seating order down the hall. */
export const HOUSES: House[] = [
  {
    id: 'gryffindor',
    name: 'Gryffindor',
    crest: '🦁',
    color: '#ae1c28',
    accent: '#d4a017',
    traits: ['Courage', 'Chivalry', 'Nerve'],
    motto: 'Might makes right.',
    glow: '#ffb648',
  },
  {
    id: 'slytherin',
    name: 'Slytherin',
    crest: '🐍',
    color: '#0a5c36',
    accent: '#c0c8d0',
    traits: ['Ambition', 'Cunning', 'Leadership'],
    motto: 'Courage can be found in others.',
    glow: '#5ce6a0',
  },
  {
    id: 'ravenclaw',
    name: 'Ravenclaw',
    crest: '🦅',
    color: '#0e1a40',
    accent: '#8ec9ff',
    traits: ['Wit', 'Learning', 'Curiosity'],
    motto: 'Might is made, not born.',
    glow: '#7fb5ff',
  },
  {
    id: 'hufflepuff',
    name: 'Hufflepuff',
    crest: '🦡',
    color: '#ecb939',
    accent: '#6b4a12',
    traits: ['Loyalty', 'Patience', 'Fairness'],
    motto: 'We are the best of what we are.',
    glow: '#ffd75e',
  },
]

export const HOUSE_BY_ID: Record<HouseId, House> = Object.fromEntries(
  HOUSES.map((h) => [h.id, h]),
) as Record<HouseId, House>

export const DEFAULT_HOUSE: HouseId = 'gryffindor'
