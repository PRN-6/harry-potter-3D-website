import { lazy, Suspense, useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useHouse } from './context/HouseContext'
import { HOUSE_BY_ID, HOUSES, type HouseId } from './data/houses'
import SceneErrorBoundary from './components/SceneErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { FadeOutWrapper } from './components/FadeOutWrapper'
import { ScrollHint } from './components/ScrollHint'
import { GlobalStyles } from './components/GlobalStyles'
import { HouseCard } from './components/HouseCard'
import { Header } from './components/Header'
import { RegistrationModal } from './components/RegistrationModal'
import { ChapterOverlay } from './components/ChapterOverlay'
import { ChapterStepper } from './components/ChapterStepper'
import { SCROLL_LENGTH } from './three/cameraPath'

// Lazy-loaded routes & 3D canvas (on-demand code-splitting)
const HallScene = lazy(() => import('./three/HallScene'))
const TeamPage = lazy(() => import('./components/TeamPage').then((m) => ({ default: m.TeamPage })))
const HouseCardPage = lazy(() => import('./components/HouseCardPage').then((m) => ({ default: m.HouseCardPage })))
const MaraudersMapPage = lazy(() => import('./components/marauders-map/MaraudersMapPage').then((m) => ({ default: m.MaraudersMapPage })))
const AdminPanel = lazy(() => import('./components/admin/AdminPanel').then((m) => ({ default: m.AdminPanel })))

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

function parseRoute(): { view: 'home' | 'map' | 'house' | 'team' | 'admin'; houseId: HouseId | null } {
  if (typeof window === 'undefined') return { view: 'home', houseId: null }
  const hash = window.location.hash
  if (hash === '#/admin') return { view: 'admin', houseId: null }
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
  const [isRegisterOpen, setIsRegisterOpen] = useState(false)

  useEffect(() => {
    const onHash = () => setRoute(parseRoute())
    const onOpenRegister = () => setIsRegisterOpen(true)

    window.addEventListener('hashchange', onHash)
    window.addEventListener('open-register-modal', onOpenRegister)

    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('open-register-modal', onOpenRegister)
    }
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
          {/* Header with Burger Menu — reveals only after the camera animation reaches the end (Chapter >= 7) */}
          <Header
            onTeamClick={() => {
              window.location.hash = '#/team'
            }}
            onRegisterClick={() => setIsRegisterOpen(true)}
            currentView="home"
            isVisible={!showLoading && chapter >= 7}
          />

          {/* Interactive Chapter Stepper HUD (Reveals at Chapter >= 7 with the rest of the navigation) */}
          {!showLoading && chapter >= 7 && (
            <ChapterStepper
              currentChapter={chapter}
              totalChapters={8}
              onStepChange={(step) => {
                window.dispatchEvent(new CustomEvent('go-to-step', { detail: { step } }))
              }}
              isVisible={!showLoading && chapter >= 7}
            />
          )}

          {/* Chapter Overlay: Rich College Fest Presentation for Chapters 0 to 6 */}
          {!showLoading && chapter !== undefined && chapter !== null && chapter < 7 && (
            <ChapterOverlay
              chapter={chapter}
              onRegisterClick={() => setIsRegisterOpen(true)}
              onExploreMap={() => {
                window.location.hash = '#/map'
              }}
              onViewTeam={() => {
                window.location.hash = '#/team'
              }}
              onJumpToChapter={(step) => {
                window.dispatchEvent(new CustomEvent('go-to-step', { detail: { step } }))
              }}
            />
          )}

          {/* House Cards Grid & College Fest Finale (Chapter 7) */}
          <AnimatePresence>
            {chapter >= 7 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.7 }}
                className="fixed inset-0 z-40 flex flex-col items-center p-3 sm:p-6 overflow-y-auto overscroll-contain"
              >
                {/* Spacer for Top Header */}
                <div className="h-14 sm:h-20 shrink-0" />

                {/* Floating Finale Heading */}
                <motion.div
                  initial={{ opacity: 0, y: -20, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-center mb-3 sm:mb-5 select-none"
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
                  <p className="font-outfit text-xs sm:text-sm text-stone-300/85 mt-1 max-w-md mx-auto">
                    Select your house to inspect lore, unlock tailored event schedules, and boost your house standings.
                  </p>
                </motion.div>

                {/* The 4 Staggered Animated Cards */}
                <div className="grid grid-cols-2 gap-2.5 sm:gap-4 md:flex md:flex-row md:gap-8 lg:gap-12 w-full max-w-sm sm:max-w-md md:max-w-7xl mx-auto justify-center items-center my-auto py-3">
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

                {/* Authentic College Fest Footer Strip */}
                <motion.footer
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4, duration: 0.5 }}
                  className="w-full max-w-5xl mx-auto mt-4 pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-stone-400 text-xs select-none pb-6"
                >
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel font-bold text-amber-300">AJ-ASTRIX 2K27</span>
                    <span className="text-stone-500">·</span>
                    <span className="text-stone-300 font-outfit">Department of MCA & MBA</span>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 font-cinzel text-[11px] text-amber-200/80">
                    <button
                      onClick={() => {
                        window.dispatchEvent(new CustomEvent('go-to-step', { detail: { step: 0 } }))
                      }}
                      className="hover:text-amber-300 cursor-pointer p-0.5"
                    >
                      Return to Entrance
                    </button>
                    <span>·</span>
                    <a href="#/map" className="hover:text-amber-300 p-0.5">
                      Events & Schedule
                    </a>
                    <span>·</span>
                    <a href="#/team" className="hover:text-amber-300 p-0.5">
                      Meet The Team
                    </a>
                    <span>·</span>
                    <button
                      onClick={() => setIsRegisterOpen(true)}
                      className="text-amber-400 font-bold hover:underline cursor-pointer p-0.5"
                    >
                      Register Pass (₹250)
                    </button>
                  </div>
                </motion.footer>
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

        {route.view === 'admin' && (
          <motion.div
            key="page-admin"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-[150] overflow-y-auto bg-[#0a0502]"
          >
            <Suspense fallback={<RouteLoadingFallback />}>
              <AdminPanel />
            </Suspense>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Interactive Wizarding Registration Modal */}
      <RegistrationModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
        defaultHouseId={house}
      />
    </>
  )
}
