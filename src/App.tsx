import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHouse } from './context/HouseContext'
import { HOUSE_BY_ID, HOUSES, type HouseId } from './data/houses'
import { CHAPTERS } from './data/chapters'
import SceneErrorBoundary from './components/SceneErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { FadeOutWrapper } from './components/FadeOutWrapper'
import { ScrollHint } from './components/ScrollHint'
import { GlobalStyles } from './components/GlobalStyles'
import { HouseCard } from './components/HouseCard'
import { Header } from './components/Header'
import { FestCountdown } from './components/FestCountdown'
import { SCROLL_LENGTH } from './three/cameraPath'

// Lazy-loaded routes & 3D canvas (on-demand code-splitting)
const HallScene = lazy(() => import('./three/HallScene'))
const TeamPage = lazy(() => import('./components/TeamPage').then((m) => ({ default: m.TeamPage })))
const HouseCardPage = lazy(() => import('./components/HouseCardPage').then((m) => ({ default: m.HouseCardPage })))
const MaraudersMapPage = lazy(() => import('./components/marauders-map/MaraudersMapPage').then((m) => ({ default: m.MaraudersMapPage })))

function RouteLoadingFallback() {
  return (
    <div className="fixed inset-0 z-[300] bg-[#0b0502] flex flex-col items-center justify-center text-center p-6">
      <div className="w-10 h-10 rounded-full border-2 border-[#ffd700] border-t-transparent animate-spin mb-4" />
      <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-[#e5c78c] font-bold animate-pulse">
        ✦ Opening Hogwarts Archives...
      </span>
    </div>
  )
}

/**
 * Enchanthia — the Great Hall.
 *
 * The whole site is one full-screen 3D model. Scrolling flies the camera
 * through the hall, and the page's own scroll position IS the timeline
 * (see `three/cameraPath.ts`).
 */

function parseRoute(): { view: 'home' | 'map' | 'house' | 'team'; houseId: HouseId | null } {
  if (typeof window === 'undefined') return { view: 'home', houseId: null }
  const hash = window.location.hash
  if (hash === '#/map') return { view: 'map', houseId: null }
  if (hash === '#/team') return { view: 'team', houseId: null }
  if (hash.startsWith('#/house/')) {
    const id = hash.replace(/^#\/house\//, '').replace(/\/.*$/, '').toLowerCase() as HouseId
    if (HOUSES.some((h) => h.id === id)) {
      return { view: 'house', houseId: id }
    }
  }
  return { view: 'home', houseId: null }
}

export default function App() {
  const { house } = useHouse()
  const [modelReady, setModelReady] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [chapter, setChapter] = useState(0)
  const [route, setRoute] = useState(parseRoute)

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
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

  return (
    <>
      <GlobalStyles />

      {/* ── The 3D hall, fixed directly to viewport behind everything ─────── */}
      <div className="fixed inset-0 z-0 bg-[#0a0714]">
        <SceneErrorBoundary>
          <Suspense fallback={null}>
            <HallScene
              house={house}
              onLoadProgress={setProgress}
              onModelReady={() => setModelReady(true)}
              onChapter={setChapter}
              isActive={route.view === 'home'}
            />
          </Suspense>
        </SceneErrorBoundary>

        {/* ── Cinematic 35mm Vignette Overlay ─────────────────────────────── */}
        <div
          className="pointer-events-none fixed inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(5,3,12,0.55)_100%)]"
          aria-hidden="true"
        />

        {/* Loading overlay, until the model is in the scene. */}
        {showLoading && (
          <FadeOutWrapper isFadingOut={isFadingOut}>
            <LoadingScreen progress={progress} modelReady={modelReady} />
          </FadeOutWrapper>
        )}
      </div>

      {/* ── When on home view (Great Hall experience) ──────────────────────── */}
      {route.view === 'home' && (
        <>
          {/* Header with Burger Menu — reveals only after the complete 3D model camera animation is done (Chapter >= 7) */}
          <Header
            onTeamClick={() => {
              window.location.hash = '#/team'
            }}
            currentView="home"
            isVisible={!showLoading && chapter >= 7}
          />

          {/* Chapter Overlay: Centered captions that animate smoothly in/out as you scroll */}
          <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center text-center p-4 sm:p-6">
            <AnimatePresence mode="wait">
              {!showLoading && chapter !== undefined && chapter !== null && chapter < 7 && (
                <motion.div
                  key={`chapter-${chapter}`}
                  initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(12px)' }}
                  animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                  exit={{ opacity: 0, y: -20, scale: 1.04, filter: 'blur(12px)' }}
                  transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
                  className="max-w-4xl w-full flex flex-col items-center"
                >
                  <motion.p
                    initial={{ opacity: 0, y: -8, letterSpacing: '0.45em' }}
                    animate={{ opacity: 1, y: 0, letterSpacing: '0.35em' }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="font-cinzel text-xs sm:text-sm uppercase text-amber-200/80 mb-2 font-bold drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]"
                  >
                    {CHAPTERS[chapter]?.kicker}
                  </motion.p>
                  <motion.h1
                    initial={{ opacity: 0, y: 18, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-stone-100 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] tracking-wider uppercase mb-3 sm:mb-4"
                  >
                    {CHAPTERS[chapter]?.title}
                  </motion.h1>

                  {/* Harry Potter Themed Countdown Timer at Chapter 5 */}
                  {chapter === 5 && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.88, y: 16 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.25, ease: [0.16, 1, 0.3, 1] }}
                      className="my-3 sm:my-5 pointer-events-auto"
                    >
                      <FestCountdown targetDate="2027-10-25T09:00:00+05:30" />
                    </motion.div>
                  )}

                  {CHAPTERS[chapter]?.caption ? (
                    <motion.p
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, delay: 0.28 }}
                      className="italic text-sm sm:text-lg text-stone-300/85 max-w-md mx-auto leading-relaxed drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]"
                      style={{ fontFamily: '"Crimson Pro", serif' }}
                    >
                      {CHAPTERS[chapter]?.caption}
                    </motion.p>
                  ) : null}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* House Cards Grid: Appears at the final step (Chapter 7) */}
          <AnimatePresence>
            {chapter >= 7 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="fixed inset-0 z-40 flex flex-col items-center justify-center p-4 sm:p-6 overflow-y-auto"
              >
                {/* Floating Finale Heading */}
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center mb-4 sm:mb-6 select-none"
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/40 backdrop-blur-md mb-2 shadow-[0_0_15px_rgba(245,158,11,0.25)]">
                    <span className="text-amber-400 text-xs">✦</span>
                    <span className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.25em] text-amber-300 font-bold">
                      The Sorting & Collector Cards
                    </span>
                    <span className="text-amber-400 text-xs">✦</span>
                  </div>
                  <h2 className="font-cinzel-decorative font-black text-2xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#c9a44c] uppercase tracking-wider drop-shadow-[0_2px_15px_rgba(255,215,0,0.4)]">
                    Choose Your House
                  </h2>
                </motion.div>

                {/* The 4 Staggered Animated Cards */}
                <div className="grid grid-cols-2 gap-3 sm:gap-4 md:flex md:flex-row md:gap-8 lg:gap-12 w-full max-w-xs sm:max-w-md md:max-w-7xl mx-auto justify-center items-center">
                  {HOUSES.map((h, i) => (
                    <HouseCard
                      key={h.id}
                      house={h}
                      index={i}
                      isVisible={chapter >= 7}
                      onClick={() => {
                        window.location.hash = `#/house/${h.id}`
                      }}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* The rest of the UI is hidden until the model is ready and loading screen is gone */}
          {!showLoading && (
            <>
              {/* ── The scroll track: pointer-events-none so it doesn't block card clicks ─── */}
              <div className="relative z-10 pointer-events-none" style={{ height: SCROLL_LENGTH }} />

              {/* ── Scroll hint: hidden once user reaches the cards page (Chapter 7+) ────── */}
              <ScrollHint isVisible={chapter < 7} />
            </>
          )}
        </>
      )}

      {/* ── Overlay Pages (Marauder's Map, Team, House Card) with Framer Motion ── */}
      <AnimatePresence mode="wait">
        {route.view === 'map' && (
          <motion.div
            key="page-map"
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[150] overflow-y-auto bg-[#0e0703]"
          >
            <Suspense fallback={<RouteLoadingFallback />}>
              <MaraudersMapPage />
            </Suspense>
          </motion.div>
        )}

        {route.view === 'team' && (
          <motion.div
            key="page-team"
            initial={{ opacity: 0, y: 16, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -16, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[150] overflow-y-auto bg-[#0b0502]"
          >
            <Suspense fallback={<RouteLoadingFallback />}>
              <TeamPage
                onBack={() => {
                  window.location.hash = '#/'
                }}
              />
            </Suspense>
          </motion.div>
        )}

        {route.view === 'house' && route.houseId && (
          <motion.div
            key={`page-house-${route.houseId}`}
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[150] overflow-y-auto bg-[#07050e]"
          >
            <Suspense fallback={<RouteLoadingFallback />}>
              <HouseCardPage
                houseId={route.houseId}
                onBack={() => {
                  window.location.hash = '#/'
                }}
              />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
