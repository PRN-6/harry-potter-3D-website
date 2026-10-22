/**
 * A Harry Potter themed loading screen.
 *
 * Features:
 * - Deep mystical background.
 * - Magical "sparkle" animation.
 * - Themed loading text that changes based on progress.
 * - A golden progress bar with a glow effect.
 */
export function LoadingScreen({ progress }: { progress: number }) {
  const getLoadingText = () => {
    if (progress === 0) return 'Lighting the candles...'
    if (progress < 0.3) return 'Unlocking the Great Hall...'
    if (progress < 0.6) return 'Summoning the house ghosts...'
    if (progress < 0.9) return 'Setting the feast tables...'
    return 'Opening the doors...'
  }

  return (
    <div className="pointer-events-none absolute inset-0 z-0 flex items-center justify-center bg-[#0a0714] overflow-hidden">
      {/* Background magical ambience */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-900/10 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-1/4 left-1/3 w-2 h-2 bg-amber-200 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-1/3 right-1/4 w-1 h-1 bg-amber-100 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '4s' }} />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-amber-300 rounded-full blur-[1px] animate-ping" style={{ animationDuration: '2s' }} />
      </div>

      <div className="relative z-10 w-full max-w-xs px-6 text-center">
        {/* Themed Header */}
        <div className="mb-8">
          <h2 className="font-cinzel text-3xl text-amber-200 tracking-[0.2em] uppercase drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]">
            Enchanthia
          </h2>
          <div className="h-px w-12 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mt-2" />
        </div>

        {/* Loading Status */}
        <div className="space-y-4">
          <p className="font-cinzel text-sm tracking-wide text-amber-200/70 italic animate-pulse">
            {getLoadingText()}
          </p>

          {/* Magical Progress Bar */}
          <div className="relative h-1 w-full overflow-hidden rounded-full bg-white/5 p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-300 to-amber-600 transition-all duration-500 ease-out relative"
              style={{ width: `${Math.max(4, progress * 100)}%` }}
            >
              {/* Glow effect on the tip of the progress bar */}
              <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 bg-amber-200 rounded-full blur-sm" />
            </div>
          </div>

          <div className="flex justify-between items-center text-[10px] font-cinzel text-stone-500 tracking-widest uppercase">
            <span>Loading</span>
            <span>{Math.round(progress * 100)}%</span>
          </div>
        </div>

        {/* Footer note */}
        <p className="mt-12 text-[10px] text-stone-600 font-sans uppercase tracking-tighter opacity-50">
          Entering the world of wizardry
        </p>
      </div>
    </div>
  )
}
