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
    kicker: 'AJ-ASTRIX 2K27',
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
    kicker: 'The MCA',
    title: 'INOVEX',
    caption: 'Department of Computer Applications · Technical symposium of IT wizardry and innovation.',
  },
  {
    // Point 3 (Scroll 3) — Rotate left
    kicker: 'The MBA',
    title: 'NEXORA',
    caption: 'Department of Business Administration · Management conclave of strategy, leadership, and vision.',
  },
  {
    // Point 4 (Scroll 4) — AJ-ASTRIX
    kicker: 'The Grand Fest',
    title: 'AJ-ASTRIX',
    caption: 'The flagship intercollegiate festival uniting INOVEX and NEXORA under one enchanted roof.',
  },
  {
    // Point 5 (Scroll 5) — Time Remaining
    kicker: 'AJ-ASTRIX 2K27',
    title: 'Time Remaining',
    caption: '',
  },
  {
    // Point 6 (Scroll 6) — Four Houses Championship
    kicker: 'Inter-House Championship',
    title: 'The Four Houses',
    caption: 'Four noble houses participate in the grand festival — choose your house, compete for points, and claim the House Cup.',
  },
  {
    // Point 7 (Scroll 7) — Grand Finale
    kicker: 'AJ-ASTRIX 2K27',
    title: 'Grand Fest Finale',
    caption: 'Hogwarts College of Wizardry · Three days of Quidditch, Potions and the Yule Ball.',
  },
]
