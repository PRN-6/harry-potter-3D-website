/**
 * THE CHAPTERS
 *
 * The words that appear as the camera moves through the hall.
 * There is one chapter per camera keyframe point (0 through 7).
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
    // Point 0 — Entrance
    kicker: 'AJ-ASTRIX2K27',
    title: 'The Great Hall',
    caption: 'Welcome to the heart of Hogwarts. A place of magic, feasts, and the four great houses.',
  },
  {
    // Point 1 (Scroll 1) — Middle of the hall
    kicker: 'The Aisle',
    title: 'The Long Tables',
    caption: 'Four benches, four houses, and a place set for every witch and wizard.',
  },
  {
    // Point 2 (Scroll 2) — Look right
    kicker: 'To The Right',
    title: 'House Tables',
    caption: 'Hufflepuff and Slytherin banners gleaming with golden warmth.',
  },
  {
    // Point 3 (Scroll 3) — Rotate left
    kicker: 'Across The Hall',
    title: 'The Four Houses',
    caption: 'Gryffindor and Ravenclaw awaiting the start of the grand festival.',
  },
  {
    // Point 4 (Scroll 4) — The Vault
    kicker: 'Looking Up',
    title: 'The Vault',
    caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
  },
  {
    // Point 5 (Scroll 5) — Enchanted Sky
    kicker: 'The Ceiling',
    title: 'The Enchanted Sky',
    caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
  },
  {
    // Point 6 (Scroll 6) — Main Head Table
    kicker: 'The High Table',
    title: 'Head of the Hall',
    caption: 'Where the professors watch, and where the House Cup is decided.',
  },
  {
    // Point 7 (Scroll 7) — Grand Finale
    kicker: 'AJ-ASTRIX2K27',
    title: 'Grand Fest Finale',
    caption: 'Hogwarts College of Wizardry · Three days of Quidditch, Potions and the Yule Ball.',
  },
]
