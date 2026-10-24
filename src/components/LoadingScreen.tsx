import React from 'react'

export function LoadingScreen({ progress }: { progress: number }) {
  const getLoadingText = () => {
    if (progress === 0) return 'Lighting the candles...'
    if (progress < 0.3) return 'Unlocking the Great Hall...'
    if (progress < 0.6) return 'Summoning the house ghosts...'
    if (progress < 0.9) return 'Setting the feast tables...'
    return 'Opening the doors...'
  }

  return (
    <div className="fixed inset-0 z-0 flex items-center justify-center overflow-hidden">
      {/*
          We removed the background color and the gradient overlay from here
          because the FadeOutWrapper now provides the background images.
          The gradient is moved to the wrapper to avoid blocking the images.
      */}
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
