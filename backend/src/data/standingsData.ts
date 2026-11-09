import { HouseStanding } from '../models/types.js'

export const INITIAL_STANDINGS: HouseStanding[] = [
  {
    house: 'gryffindor',
    name: 'Gryffindor',
    crest: '🦁',
    points: 472,
    color: '#ae1c28',
    accent: '#d4a017',
  },
  {
    house: 'slytherin',
    name: 'Slytherin',
    crest: '🐍',
    points: 486,
    color: '#0a5c36',
    accent: '#c0c8d0',
  },
  {
    house: 'ravenclaw',
    name: 'Ravenclaw',
    crest: '🦅',
    points: 426,
    color: '#0e1a40',
    accent: '#8ec9ff',
  },
  {
    house: 'hufflepuff',
    name: 'Hufflepuff',
    crest: '🦡',
    points: 352,
    color: '#ecb939',
    accent: '#6b4a12',
  },
]

// Mutable in-memory store for festival standings
export let liveStandings: HouseStanding[] = [...INITIAL_STANDINGS]

export function getRankedStandings(): HouseStanding[] {
  return [...liveStandings]
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))
}

export function voteForHouse(houseId: string, deltaPoints = 10): HouseStanding | null {
  const target = liveStandings.find((s) => s.house === houseId)
  if (!target) return null
  target.points += deltaPoints
  return target
}

