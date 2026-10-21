import { useEffect, useState } from 'react'
import { useHouse } from './context/HouseContext'
import { HOUSE_BY_ID } from './data/houses'
import HallScene from './three/HallScene'
import SceneErrorBoundary from './components/SceneErrorBoundary'
import { SCROLL_LENGTH } from './three/cameraPath'

/**
 * Enchanthia — the Great Hall.
 *
 * The whole site is one full-screen 3D model. Scrolling flies the camera
 * through the hall, and the page's own scroll position IS the timeline
 * (see `three/cameraPath.ts`).
 *
 * There is no other content. The chapter titles fade in and out as the
 * camera passes each keyframe, so the visitor is walked through the hall
 * rather than dropped into it.
 */

export default function App() {
  const { house, setHouse } = useHouse()
  const [modelReady, setModelReady] = useState(false)
  const [progress, setProgress] = useState(0)
  const [chapter, setChapter] = useState(0)

  const houseData = HOUSE_BY_ID[house]

  // Tint the whole UI with the visitor's house colour.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--house', houseData.color)
    root.style.setProperty('--house-accent', houseData.accent)
  }, [houseData])

  // Track the scroll position to know which chapter is on screen.
  useEffect(() => {
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight
      const t = max > 0 ? window.scrollY / max : 0
      // The chapter changes at the midpoint between keyframes, so the title
      // changes as the camera ARRIVES rather than as it leaves.
      const count = CHAPTERS.length
      setChapter(Math.min(count - 1, Math.round(t * (count - 1))))
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const current = CHAPTERS[chapter]

  return (
    <>
      {/* ── The 3D hall, fixed behind everything ─────────────────────────── */}
      <div className="fixed inset-0 z-0 bg-[#0a0714]">
        <SceneErrorBoundary>
          <HallScene
            house={house}
            onLoadProgress={setProgress}
            onModelReady={() => setModelReady(true)}
          />
        </SceneErrorBoundary>

        {/* Loading overlay, until the model is in the scene. */}
        {!modelReady && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-[#0a0714]">
            <div className="w-full max-w-xs px-6 text-center">
              <p className="font-cinzel text-sm tracking-wide text-amber-200/80">
                {progress > 0
                  ? `Opening the Great Hall… ${Math.round(progress * 100)}%`
                  : 'Lighting the candles…'}
              </p>
              <div className="mt-3 h-1 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-amber-300/80 transition-all duration-300"
                  style={{ width: `${Math.max(4, progress * 100)}%` }}
                />
              </div>
              <p className="mt-2 text-[11px] text-stone-600">
                The full 3D hall is 38 MB — it loads once, then is cached.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ── The scroll track ─────────────────────────────────────────────── */}
      {/* An empty, full-height spacer. Its only job is to make the page
          scroll, because the scroll position is the camera's timeline. */}
      <div className="relative z-10" style={{ height: SCROLL_LENGTH }} />

      {/* ── Chapter caption ──────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center px-4 pb-10 sm:pb-16">
        <div
          key={chapter}
          className="max-w-xl text-center"
          style={{ animation: 'chapter-in 900ms ease-out' }}
        >
          <p className="font-cinzel text-[10px] tracking-[0.45em] text-amber-200/60 uppercase sm:text-xs">
            {current.kicker}
          </p>
          <h1 className="mt-2 font-cinzel text-2xl font-bold text-stone-50 drop-shadow-[0_2px_18px_rgba(0,0,0,0.9)] sm:text-4xl lg:text-5xl">
            {current.title}
          </h1>
          <p className="mx-auto mt-2 max-w-md text-xs text-stone-400 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-sm">
            {current.caption}
          </p>
        </div>
      </div>

      {/* ── House picker ─────────────────────────────────────────────────── */}
      <div className="fixed top-4 right-4 z-20 flex items-center gap-1.5 sm:top-6 sm:right-6">
        {(['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'] as const).map((id) => {
          const h = HOUSE_BY_ID[id]
          return (
            <button
              key={id}
              onClick={() => setHouse(id)}
              aria-label={h.name}
              aria-pressed={house === id}
              title={h.name}
              className={`flex h-9 w-9 items-center justify-center rounded-full text-base backdrop-blur-md transition-all duration-300 sm:h-10 sm:w-10 sm:text-lg ${
                house === id
                  ? 'scale-110'
                  : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
              }`}
              style={{
                backgroundColor: h.color,
                boxShadow: house === id ? `0 0 0 2px ${h.accent}, 0 0 0 4px #0a0714` : undefined,
              }}
            >
              <span aria-hidden>{h.crest}</span>
            </button>
          )
        })}
      </div>

      {/* ── Scroll hint ──────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed bottom-3 left-1/2 z-20 -translate-x-1/2 sm:bottom-5">
        <span className="animate-bounce text-sm text-stone-600">↓</span>
      </div>

      {/* ── Wordmark ─────────────────────────────────────────────────────── */}
      <div className="pointer-events-none fixed top-4 left-4 z-20 sm:top-6 sm:left-6">
        <span className="font-cinzel text-sm font-bold tracking-wide text-stone-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-lg">
          ✦ Enchanthia <span className="text-amber-300/80">2026</span>
        </span>
      </div>
    </>
  )
}

/**
 * The chapters, one per camera keyframe.
 *
 * These are the only words on the page. They appear as the camera reaches
 * each part of the hall and fade before the next one takes over.
 */
const CHAPTERS = [
  {
    kicker: 'Enchanthia',
    title: 'The Great Hall',
    caption: 'Four long tables, a thousand floating candles, and an enchanted ceiling.',
  },
  {
    kicker: 'Enter',
    title: 'The Doors Open',
    caption: 'The hall has been laid for a feast that is three hundred years overdue.',
  },
  {
    kicker: 'The Aisle',
    title: 'Down the Centre',
    caption: 'Goblets and platters stretch away on both sides, catching the candlelight.',
  },
  {
    kicker: 'The Tables',
    title: 'Four Houses',
    caption: 'Every witch and wizard has a table, and every table has a house.',
  },
  {
    kicker: 'The Rafters',
    title: 'Look Up',
    caption: 'Ribbed vaults arc away overhead, hung with baskets of fire.',
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
    kicker: 'Enchanthia 2026',
    title: '12–14 September',
    caption: 'Hogwarts College of Wizardry · Three days of Quidditch, Potions and the Yule Ball.',
  },
]
