/**
 * Festival programme.
 *
 * Each event carries a `track` so the schedule can be filtered by type, and a
 * `day` (1 | 2 | 3) so the timeline can be broken into the three days of the
 * fest.
 */

import type { HouseId } from './houses'

export type EventTrack = 'quidditch' | 'potion' | 'arts' | 'debate' | 'music' | 'quest'

export interface FestEvent {
  id: string
  title: string
  track: EventTrack
  day: 1 | 2 | 3
  start: string
  end: string
  venue: string
  blurb: string
  /** Points awarded to the winning house. */
  points: number
  house?: 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
}

export const TRACK_META: Record<EventTrack, { label: string; icon: string; color: string }> = {
  quidditch: { label: 'Quidditch', icon: '🧹', color: '#7c3aed' },
  potion: { label: 'Potions', icon: '⚗️', color: '#0ea5e9' },
  arts: { label: 'Arts & Magic', icon: '🎨', color: '#ec4899' },
  debate: { label: 'Debate', icon: '🗣️', color: '#f59e0b' },
  music: { label: 'Music', icon: '🎵', color: '#10b981' },
  quest: { label: 'Quest', icon: '🗝️', color: '#ef4444' },
}

export const EVENTS: FestEvent[] = [
  {
    id: 'opening-feast',
    title: 'The Opening Feast',
    track: 'music',
    day: 1,
    start: '18:00',
    end: '20:00',
    venue: 'The Great Hall',
    blurb:
      'The Sorting Ceremony, the house tables, and a feast fit for the founders. Bring your house colours.',
    points: 0,
  },
  {
    id: 'sorting-ceremony',
    title: 'Sorting Ceremony',
    track: 'arts',
    day: 1,
    start: '17:00',
    end: '18:00',
    venue: 'The Great Hall',
    blurb: 'The Hat remembers every student. A new year, a new house.',
    points: 0,
  },
  {
    id: 'quidditch-cup',
    title: 'Inter-House Quidditch Cup',
    track: 'quidditch',
    day: 1,
    start: '09:00',
    end: '11:30',
    venue: 'The Quidditch Pitch',
    blurb: 'Chasers, keepers, beaters and a Quaffle that refuses to be caught.',
    points: 40,
  },
  {
    id: 'potion-brewing',
    title: 'Potion Brewing Lab',
    track: 'potion',
    day: 1,
    start: '12:00',
    end: '14:00',
    venue: 'The Dungeon',
    blurb: 'Polyjuice, Felix Felicis and a cauldron that judges your technique.',
    points: 25,
  },
  {
    id: 'duelling-club',
    title: 'Wizard Duel — First Blood',
    track: 'debate',
    day: 1,
    start: '15:00',
    end: '17:00',
    venue: 'The Armoury',
    blurb: 'First blood wins the duel, and a point for the house. Expect sparks.',
    points: 30,
  },
  {
    id: 'astronomy',
    title: 'Astronomy Night',
    track: 'quest',
    day: 2,
    start: '20:00',
    end: '23:00',
    venue: 'The Astronomy Tower',
    blurb: 'Chart a constellation, name a star, and win the house the moon.',
    points: 20,
  },
  {
    id: 'dragon-hunt',
    title: 'The Dragon Hunt',
    track: 'quest',
    day: 2,
    start: '07:00',
    end: '10:00',
    venue: 'The Forbidden Forest',
    blurb: 'A dragon guards the treasure. Bring a wand, a cloak and nerve.',
    points: 50,
  },
  {
    id: 'hogsmeade',
    title: 'Hogsmeade & Honeydukes',
    track: 'quest',
    day: 2,
    start: '14:00',
    end: '18:00',
    venue: 'Hogsmeade Village',
    blurb: 'Butterbeers, a wand shop, and three owls to deliver the marks.',
    points: 15,
  },
  {
    id: 'debate-chamber',
    title: 'The Debating Chamber',
    track: 'debate',
    day: 2,
    start: '11:00',
    end: '13:00',
    venue: 'The Chamber',
    blurb: 'Motion: "House points should be abolished." The house with the best argument wins.',
    points: 30,
  },
  {
    id: 'muggle-music',
    title: 'The Yule Ball',
    track: 'music',
    day: 3,
    start: '19:00',
    end: '23:00',
    venue: 'The Great Hall',
    blurb: 'A ball, a band, and one last chance to win the Cup. Formal dress encouraged.',
    points: 45,
  },
  {
    id: 'broomstick-race',
    title: 'Broomstick Circuit',
    track: 'quidditch',
    day: 3,
    start: '08:00',
    end: '10:00',
    venue: 'The Quidditch Pitch',
    blurb: 'Three laps, one broom, and a course through the towers.',
    points: 25,
  },
  {
    id: 'spellcasting',
    title: 'Spellcasting Showcase',
    track: 'arts',
    day: 3,
    start: '10:30',
    end: '12:30',
    venue: 'The Courtyard',
    blurb: 'Show us what you can conjure. Choreography, effects and pure flair.',
    points: 35,
  },
  {
    id: 'closing-feast',
    title: 'The Closing Feast & Cup Ceremony',
    track: 'music',
    day: 3,
    start: '17:00',
    end: '20:00',
    venue: 'The Great Hall',
    blurb: 'The House Cup is awarded. Whatever happens, the feast goes on.',
    points: 0,
  },
]

export const DAYS: { day: 1 | 2 | 3; label: string; date: string }[] = [
  { day: 1, label: 'Day One', date: 'Friday' },
  { day: 2, label: 'Day Two', date: 'Saturday' },
  { day: 3, label: 'Day Three', date: 'Sunday' },
]

/**
 * The House Cup standings after Day One.
 *
 * In production this comes from the results API. Until then it lives here,
 * next to the rest of the festival data, so there is one place to edit.
 */
export const STANDINGS: { house: HouseId; points: number }[] = [
  { house: 'gryffindor', points: 120 },
  { house: 'slytherin', points: 105 },
  { house: 'ravenclaw', points: 95 },
  { house: 'hufflepuff', points: 80 },
]
