/**
 * THE CHAPTERS
 *
 * The words that appear as the camera moves through the hall. There is one
 * chapter per camera keyframe, and they live here — in ONE place — so the
 * camera path and the on-screen captions can never drift apart.
 *
 * The index of a chapter IS the index of the keyframe it belongs to. The
 * camera path builder reads this list to label its keyframes, and the caption
 * overlay reads the same list to show the chapter the camera is currently at.
 * Adding a keyframe means adding a chapter, and nothing else.
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
    kicker: 'Enchanthia',
    title: 'The Great Hall',
    caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
  },
  {
    kicker: 'Enter',
    title: 'Down the Aisle',
    caption: 'Goblets and platters stretch away on both sides, catching the candlelight.',
  },
  {
    kicker: 'The Aisle',
    title: 'The Long Tables',
    caption: 'Four benches, four houses, and a place set for every witch and wizard.',
  },
  {
    kicker: 'The Tables',
    title: 'Four Houses',
    caption: 'Choose a house. It decides your table, your colour and your chances of the Cup.',
  },
  {
    kicker: 'The Feast',
    title: 'A Thousand Candles',
    caption: 'A thousand candles drift above the tables, waiting for the first course.',
  },
  {
    kicker: 'Looking Up',
    title: 'The Vault',
    caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
  },
  {
    kicker: 'The Rafters',
    title: 'High Above',
    caption: 'From up here the four tables read as a single page of the story.',
  },
  {
    kicker: 'The Ceiling',
    title: 'The Enchanted Sky',
    caption: 'Above the rafters there is no sky at all. There is a spell, and it is moving.',
  },
  {
    kicker: 'The High Table',
    title: 'Head of the Hall',
    caption: 'Where the professors watch, and where the House Cup is decided.',
  },
  {
    kicker: 'The Cup',
    title: 'Points of Glory',
    caption: 'The fires burn gold tonight, and every goblet is already full.',
  },
  {
    kicker: 'Enchanthia 2026',
    title: '12–14 September',
    caption: 'Hogwarts College of Wizardry · Three days of Quidditch, Potions and the Yule Ball.',
  },
]
