import { useEffect, useState, useRef } from 'react'
import { useHouse } from './context/HouseContext'
import { HOUSE_BY_ID } from './data/houses'
import { CHAPTERS } from './data/chapters'
import HallScene from './three/HallScene'
import { FadeOverlay } from './three/FadeOverlay'
import SceneErrorBoundary from './components/SceneErrorBoundary'
import { LoadingScreen } from './components/LoadingScreen'
import { FadeOutWrapper } from './components/FadeOutWrapper'
import { ScrollHint } from './components/ScrollHint'
import { GlobalStyles } from './components/GlobalStyles'
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
  const { house } = useHouse()
  const [modelReady, setModelReady] = useState(false)
  const [showLoading, setShowLoading] = useState(true)
  const [isFadingOut, setIsFadingOut] = useState(false)
  const [progress, setProgress] = useState(0)
  const [chapter, setChapter] = useState(0)
  const fadeRef = useRef<HTMLDivElement>(null)

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
      // 1. Small delay to ensure the model is painted on screen
      const timer = setTimeout(() => {
        // 2. Trigger the splitting animation immediately
        setIsFadingOut(true)

        // 3. Remove the wrapper from the DOM after the animation finishes
        setTimeout(() => {
          setShowLoading(false)
        }, 1500)
      }, 500) // Reduced from 1500ms to 500ms for faster reveal
      return () => clearTimeout(timer)
    }
  }, [modelReady])

  // The chapter follows the CAMERA, not the scrollbar.
  //
  // The camera path is sampled by arc length, so the camera does not
  // reach a keyframe at a fixed fraction of the page — it reaches it
  // when it has actually travelled that far. The scene reports the
  // chapter it is at, and the caption changes with it. The two can
  // never drift apart, because there is only one source of truth.
  // const current = CHAPTERS[chapter]

  return (
    <>
      <GlobalStyles />
      {/* ── The 3D hall, fixed behind everything ─────────────────────────── */}
      <div className="fixed inset-0 z-0 bg-[#0a0714]">
        <SceneErrorBoundary>
          <HallScene
            house={house}
            onLoadProgress={setProgress}
            onModelReady={() => setModelReady(true)}
            onChapter={setChapter}
            fadeRef={fadeRef as React.RefObject<HTMLDivElement>}
          />
        </SceneErrorBoundary>
        <FadeOverlay ref={fadeRef as React.RefObject<HTMLDivElement>} />

        {/* Chapter Overlay: Centered captions that fade in/out as you scroll */}
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center text-center p-6">
          <div
            className="transition-all duration-1000 ease-in-out"
            style={{
              opacity: (showLoading || chapter === undefined || chapter === null) ? 0 : 1,
              transform: `scale(${(showLoading || chapter === undefined || chapter === null) ? 0.95 : 1})`,
              filter: `blur(${(showLoading || chapter === undefined || chapter === null) ? '10px' : '0px'})`
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


        {/* Loading overlay, until the model is in the scene. */}
        {showLoading && (
          <FadeOutWrapper isFadingOut={isFadingOut}>
            <LoadingScreen progress={progress} />
          </FadeOutWrapper>
        )}
      </div>

      {/* The rest of the UI is hidden until the model is ready and loading screen is gone */}
      {!showLoading && (
        <>
          {/* ── The scroll track ─────────────────────────────────────────────── */}
          {/* An empty, full-height spacer. Its only job is to make the page
              scroll, because the scroll position is the camera's timeline. */}
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
