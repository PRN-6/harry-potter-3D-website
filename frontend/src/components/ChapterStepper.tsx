import { motion } from 'framer-motion'

export interface ChapterStepperProps {
  currentChapter: number
  totalChapters?: number
  onStepChange?: (step: number) => void
  isVisible?: boolean
}

const STEP_LABELS = [
  { short: 'Hero', full: 'Fest Inception', icon: '✦' },
  { short: 'Hall', full: 'The Great Hall', icon: '🏰' },
  { short: 'MCA', full: 'INOVEX Technical Symposium', icon: '💻' },
  { short: 'MBA', full: 'NEXORA Management Conclave', icon: '📈' },
  { short: 'Fest', full: 'AJ-ASTRIX Flagship Union', icon: '⚡' },
  { short: 'Timer', full: 'Time-Turner Countdown', icon: '⏳' },
  { short: 'Cup', full: 'House Championship', icon: '🏆' },
  { short: 'Houses', full: 'House Collector Cards', icon: '🦁' },
]

export function ChapterStepper({
  currentChapter,
  totalChapters = 8,
  onStepChange,
  isVisible = true,
}: ChapterStepperProps) {
  if (!isVisible) return null

  const jumpTo = (step: number) => {
    const target = Math.max(0, Math.min(totalChapters - 1, step))
    if (onStepChange) {
      onStepChange(target)
    } else {
      window.dispatchEvent(new CustomEvent('go-to-step', { detail: { step: target } }))
    }
  }

  return (
    <>
      {/* ── Desktop Right Vertical Enchanted Stepper HUD ── */}
      <aside
        aria-label="Chapter Navigation"
        className="hidden md:flex fixed right-4 lg:right-6 top-1/2 -translate-y-1/2 z-40 flex-col items-center gap-2.5 p-2 rounded-full bg-black/45 backdrop-blur-md border border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.6)] select-none pointer-events-auto"
      >
        {/* Step Up Chevron */}
        <button
          onClick={() => jumpTo(currentChapter - 1)}
          disabled={currentChapter <= 0}
          aria-label="Previous Chapter"
          className="w-7 h-7 rounded-full flex items-center justify-center text-amber-300/70 hover:text-amber-200 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer text-xs"
        >
          ▲
        </button>

        {/* 8 Step Dots with Floating Tooltip */}
        <div className="flex flex-col items-center gap-2">
          {Array.from({ length: totalChapters }).map((_, idx) => {
            const isActive = currentChapter === idx
            const label = STEP_LABELS[idx] || { short: `C${idx}`, full: `Chapter ${idx}`, icon: '•' }

            return (
              <button
                key={idx}
                onClick={() => jumpTo(idx)}
                aria-label={`Jump to ${label.full}`}
                className="group relative flex items-center justify-center cursor-pointer p-1"
              >
                {/* Floating Tooltip to the Left */}
                <div className="absolute right-9 pointer-events-none opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 whitespace-nowrap px-2.5 py-1 rounded-md bg-stone-950/95 border border-amber-500/40 text-amber-200 text-[11px] font-cinzel font-bold shadow-lg flex items-center gap-1.5 z-50">
                  <span>{label.icon}</span>
                  <span>{label.full}</span>
                </div>

                {/* Dot Element */}
                <div
                  className={`transition-all duration-300 rounded-full flex items-center justify-center ${
                    isActive
                      ? 'w-5 h-5 bg-amber-400/25 border-2 border-amber-300 shadow-[0_0_12px_rgba(255,215,0,0.8)]'
                      : 'w-2.5 h-2.5 bg-white/30 hover:bg-amber-300/70 hover:scale-125'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="stepper-active-dot"
                      className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_6px_#ffd700]"
                      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                    />
                  )}
                </div>
              </button>
            )
          })}
        </div>

        {/* Step Down Chevron */}
        <button
          onClick={() => jumpTo(currentChapter + 1)}
          disabled={currentChapter >= totalChapters - 1}
          aria-label="Next Chapter"
          className="w-7 h-7 rounded-full flex items-center justify-center text-amber-300/70 hover:text-amber-200 hover:bg-white/10 disabled:opacity-20 disabled:pointer-events-none transition-all cursor-pointer text-xs"
        >
          ▼
        </button>
      </aside>

      {/* ── Mobile Bottom Floating Compact Stepper Pill ── */}
      <div className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/65 backdrop-blur-md border border-amber-500/30 shadow-[0_4px_25px_rgba(0,0,0,0.7)] select-none pointer-events-auto">
        <button
          onClick={() => jumpTo(currentChapter - 1)}
          disabled={currentChapter <= 0}
          aria-label="Previous Chapter"
          className="text-amber-300/80 hover:text-amber-100 disabled:opacity-20 text-xs px-1"
        >
          ◀
        </button>

        <div className="flex items-center gap-1.5 px-1">
          <span className="font-cinzel text-[10px] uppercase tracking-wider text-amber-200 font-bold">
            {currentChapter + 1}/{totalChapters} · {STEP_LABELS[currentChapter]?.short || `C${currentChapter}`}
          </span>
        </div>

        <button
          onClick={() => jumpTo(currentChapter + 1)}
          disabled={currentChapter >= totalChapters - 1}
          aria-label="Next Chapter"
          className="text-amber-300/80 hover:text-amber-100 disabled:opacity-20 text-xs px-1"
        >
          ▶
        </button>
      </div>
    </>
  )
}

