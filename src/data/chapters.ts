/**
 * THE CHAPTERS
 *
 * The words that appear as the camera moves through the hall. There is one
 * chapter per camera keyframe, and they live here — in ONE place — so the
 * camera path and the on-screen captions can never drift apart.
 *
 * The index of a chapter IS the index of the keyframe it belongs to.
 */

export interface Chapter {
  /** The small line above the title. */
  kicker: string
  /** The big title. */
  title: string
  /** The one-line description under the title. */
  caption: string
}

export const CHAPTERS: Chapter[] = [
  {
    // Keyframe 0 — Entrance doors
    kicker: 'Enchanthia',
    title: 'The Great Hall',
    caption: 'Welcome to the heart of Hogwarts. A place of magic, feasts, and the four great houses.',
  },
  {
    // Keyframe 1 — Entering through parting doors
    kicker: 'Enter',
    title: 'Crossing the Threshold',
    caption: 'Goblets and platters stretch away on both sides, catching the warm candlelight.',
  },
  {
    // Keyframe 2 — Middle of the hall
    kicker: 'The Aisle',
    title: 'The Long Tables',
    caption: 'Four benches, four houses, and a place set for every witch and wizard.',
  },
  {
    // Keyframe 3 — Look right
    kicker: 'To The Right',
    title: 'House Tables',
    caption: 'Hufflepuff and Slytherin banners gleaming with golden warmth.',
  },
  {
    // Keyframe 4 — Rotate left
    kicker: 'Across The Hall',
    title: 'The Four Houses',
    caption: 'Gryffindor and Ravenclaw awaiting the start of the grand festival.',
  },
  {
    // Keyframe 5 — Go up
    kicker: 'Looking Up',
    title: 'The Vault',
    caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
  },
  {
    // Keyframe 6 — Rafters & candles
    kicker: 'The Rafters',
    title: 'High Above',
    caption: 'From up here the four tables read as a single page of the story.',
  },
  {
    // Keyframe 7 — Enchanted ceiling
    kicker: 'The Ceiling',
    title: 'The Enchanted Sky',
    caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
  },
  {
    // Keyframe 8 — Descend towards High Table
    kicker: 'The High Table',
    title: 'Head of the Hall',
    caption: 'Where the professors watch, and where the House Cup is decided.',
  },
  {
    // Keyframe 9 — High Table close
    kicker: 'The Cup',
    title: 'Points of Glory',
    caption: 'The fires burn gold tonight, and every goblet is already full.',
  },
  {
    // Keyframe 10 — Back to top (Grand wide finale)
    kicker: 'Enchanthia 2026',
    title: '12–14 September',
    caption: 'Hogwarts College of Wizardry · Three days of Quidditch, Potions and the Yule Ball.',
  },
]
