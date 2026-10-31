import { useEffect, useState } from 'react'
import { useHouse } from './context/HouseContext'
import { HOUSE_BY_ID, HOUSES, type HouseId } from './data/houses'
import { CHAPTERS } from './data/chapters'
import HallScene from './three/HallScene'
import SceneErrorBoundary from './components/SceneErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { FadeOutWrapper } from './components/FadeOutWrapper'
import { ScrollHint } from './components/ScrollHint'
import { GlobalStyles } from './components/GlobalStyles'
import { HouseCard } from './components/HouseCard'
import { Header } from './components/Header'
import { TeamOverlay } from './components/TeamOverlay'
import { HouseEventsOverlay } from './components/HouseEventsOverlay'
import { MaraudersMapPage } from './components/marauders-map/MaraudersMapPage'
import { SCROLL_LENGTH } from './three/cameraPath'

/**
 * Enchanthia — the Great Hall.
 *
 * The whole site is one full-screen 3D model. Scrolling flies the camera
 * through the hall, and the page's own scroll position IS the timeline
 * (see `three/cameraPath.ts`).
 */

export default function App() {
  const { house } = useHouse()
  const [modelReady, setModelReady] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [chapter, setChapter] = useState(0)
  const [isTeamOpen, setIsTeamOpen] = useState(false)
  const [eventsHouse, setEventsHouse] = useState<HouseId | null>(null)
  const [view, setView] = useState<'home' | 'map'>(window.location.hash === '#/map' ? 'map' : 'home')

  useEffect(() => {
    const onHash = () => setView(window.location.hash === '#/map' ? 'map' : 'home')
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const houseData = HOUSE_BY_ID[house]

  // Tint the whole UI with the visitor's house colour.
  useEffect(() => {
    const root = document.documentElement
    root.style.setProperty('--house', houseData.color)
    root.style.setProperty('--house-accent', houseData.accent)
  }, [houseData])

  // Handle the transition from loading screen to actual app
  useEffect(() => {
    if (modelReady) {
      const timer = setTimeout(() => {
        setIsFadingOut(true)
        setTimeout(() => {
          setShowLoading(false)
        }, 1200)
      }, 650)
      return () => clearTimeout(timer)
    }
  }, [modelReady])

  if (view === 'map') return <MaraudersMapPage />

  return (
    <>
      <GlobalStyles />

      {/* Header: revealed only after the House Cards appear (Chapter 7+) */}
      <div className={`fixed top-0 left-0 w-full z-[100] transition-all duration-[2000ms] ease-in-out ${
        chapter >= 7 ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-full pointer-events-none'
      }`}>
        <Header onTeamClick={() => setIsTeamOpen(true)} />
      </div>

      {/* ── The 3D hall, fixed behind everything ─────────────────────────── */}
      <div className="fixed inset-0 z-0 bg-[#0a0714]">
        <SceneErrorBoundary>
          <HallScene
            house={house}
            onLoadProgress={setProgress}
            onModelReady={() => setModelReady(true)}
            onChapter={setChapter}
          />
        </SceneErrorBoundary>

        {/* Chapter Overlay: Centered captions that fade in/out as you scroll */}
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center text-center p-6">
          <div
            className="transition-all duration-[2000ms] ease-in-out"
            style={{
              opacity: (showLoading || chapter === undefined || chapter === null || chapter >= 7) ? 0 : 1,
              transform: `scale(${(showLoading || chapter === undefined || chapter === null || chapter >= 7) ? 0.95 : 1})`,
              filter: `blur(${(showLoading || chapter === undefined || chapter === null || chapter >= 7) ? '10px' : '0px'})`
            }}
          >
            <p className="font-cinzel text-xs uppercase tracking-[0.3em] text-amber-200/60 mb-2">
              {CHAPTERS[chapter]?.kicker}
            </p>
            <h1 className="font-cinzel text-3xl sm:text-5xl md:text-6xl font-bold text-stone-100 drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] mb-4">
              {CHAPTERS[chapter]?.title}
            </h1>
            <p className="italic text-sm sm:text-lg text-stone-300/80 max-w-md mx-auto leading-relaxed" style={{ fontFamily: '"Crimson Pro", serif' }}>
              {CHAPTERS[chapter]?.caption}
            </p>
          </div>
        </div>

        {/* House Cards Grid: Appears at the final step (Chapter 7) */}
        <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-1000 p-4 sm:p-6 ${
          chapter >= 7 ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:flex md:flex-row md:gap-8 lg:gap-12 w-full max-w-xs sm:max-w-md md:max-w-7xl mx-auto justify-center items-center">
            {HOUSES.map((h) => (
              <HouseCard
                key={h.id}
                house={h}
                isVisible={chapter >= 7}
                onClick={() => setEventsHouse(h.id)}
              />
            ))}
          </div>
        </div>

        {/* Loading overlay, until the model is in the scene. */}
        {showLoading && (
          <FadeOutWrapper isFadingOut={isFadingOut}>
            <LoadingScreen progress={progress} modelReady={modelReady} />
          </FadeOutWrapper>
        )}
      </div>

      <TeamOverlay isOpen={isTeamOpen} onClose={() => setIsTeamOpen(false)} />
      <HouseEventsOverlay
        initialHouseId={eventsHouse}
        isOpen={Boolean(eventsHouse)}
        onClose={() => setEventsHouse(null)}
      />

      {/* The rest of the UI is hidden until the model is ready and loading screen is gone */}
      {!showLoading && (
        <>
          {/* ── The scroll track ─────────────────────────────────────────────── */}
          <div className="relative z-10" style={{ height: SCROLL_LENGTH }} />

          {/* ── Scroll hint ──────────────────────────────────────────────────── */}
          <ScrollHint />

          {/* ── Wordmark ─────────────────────────────────────────────────────── */}
          <div className="pointer-events-none fixed top-4 left-4 z-20 sm:top-6 sm:left-6">
            <span className="font-cinzel text-sm font-bold tracking-wide text-stone-100/90 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)] sm:text-lg">
              ✦ Enchanthia <span className="text-amber-300/80">2026</span>
            </span>
          </div>
        </>
      )}
    </>
  )
}
