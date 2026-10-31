import { EVENTS, type FestEvent } from './events'

export type LocationDef = {
  id: string
  name: string
  description: string
  category: string
  mapPosition: { x: number; y: number }
  match: (e: FestEvent) => boolean
}

export const LOCATION_DEFS: LocationDef[] = [
  { id: 'great-hall', name: 'The Great Hall', description: 'Main events, feasts and flagship competitions.', category: 'Main Events', mapPosition: { x: 50, y: 42 }, match: e => e.venue === 'The Great Hall' },
  { id: 'library', name: 'Hogwarts Library', description: 'Technical events, coding competitions and workshops.', category: 'Technical', mapPosition: { x: 72, y: 34 }, match: e => e.track === 'debate' && e.venue !== 'The Great Hall' },
  { id: 'astronomy', name: 'Astronomy Tower', description: 'Creative events, design competitions and photography.', category: 'Creative', mapPosition: { x: 30, y: 22 }, match: e => e.venue === 'The Astronomy Tower' },
  { id: 'quidditch', name: 'Quidditch Grounds', description: 'Sports, gaming and outdoor competitions.', category: 'Sports', mapPosition: { x: 18, y: 72 }, match: e => e.venue === 'The Quidditch Pitch' },
  { id: 'dungeons', name: 'The Dungeons', description: 'Science, innovation and project exhibitions.', category: 'Science', mapPosition: { x: 46, y: 74 }, match: e => e.venue === 'The Dungeon' },
  { id: 'potions', name: 'Potions Classroom', description: 'Potion brewing and alchemical experiments.', category: 'Potions', mapPosition: { x: 60, y: 68 }, match: e => e.track === 'potion' },
  { id: 'charms', name: 'Charms Classroom', description: 'Technical workshops and demonstrations.', category: 'Workshops', mapPosition: { x: 78, y: 58 }, match: e => e.track === 'arts' && e.venue !== 'The Great Hall' && e.venue !== 'The Astronomy Tower' },
  { id: 'courtyard', name: 'The Courtyard', description: 'Spellcasting and open-air performances.', category: 'Performance', mapPosition: { x: 54, y: 52 }, match: e => e.venue === 'The Courtyard' },
  { id: 'forbidden', name: 'The Forbidden Forest', description: 'Mystery events and adventure activities.', category: 'Quest', mapPosition: { x: 26, y: 58 }, match: e => e.venue === 'The Forbidden Forest' },
  { id: 'hogsmeade', name: 'Hogsmeade Village', description: 'Special events and surprise activities.', category: 'Special', mapPosition: { x: 84, y: 76 }, match: e => e.venue === 'Hogsmeade Village' || e.venue === 'The Chamber' || e.venue === 'The Armoury' },
  { id: 'room', name: 'Room of Requirement', description: 'Secret events and surprises.', category: 'Secret', mapPosition: { x: 40, y: 30 }, match: e => e.track === 'quest' && e.venue === 'The Astronomy Tower' },
]

export function buildMapLocations(): { id: string; name: string; description: string; category: string; mapPosition: { x: number; y: number }; events: FestEvent[] }[] {
  const used = new Set<string>()
  const result = LOCATION_DEFS.map((def) => {
    const events = EVENTS.filter((e) => def.match(e) && !used.has(e.id))
    events.forEach((e) => used.add(e.id))
    return {
      id: def.id,
      name: def.name,
      description: def.description,
      category: def.category,
      mapPosition: def.mapPosition,
      events,
    }
  })
  // any unmatched events -> Great Hall fallback
  const leftover = EVENTS.filter((e) => !used.has(e.id))
  if (leftover.length) {
    const gh = result.find((r) => r.id === 'great-hall')
    if (gh) gh.events.push(...leftover)
  }
  return result
}