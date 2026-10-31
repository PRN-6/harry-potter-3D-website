import { useEffect, useState } from 'react'
import { useProgress } from '@react-three/drei'

interface LoadingScreenProps {
  progress?: number
  modelReady?: boolean
}

export function LoadingScreen({ progress: propProgress, modelReady }: LoadingScreenProps) {
  const { progress: dreiProgress } = useProgress()
  const [displayPercent, setDisplayPercent] = useState(0)

  // Target progress: prioritize modelReady (100) or real-time 3D loader progress
  const targetProgress = modelReady ? 100 : Math.max(dreiProgress, (propProgress ?? 0) * 100)

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayPercent((prev) => {
        if (modelReady) {
          if (prev >= 100) {
            clearInterval(interval)
            return 100
          }
          return Math.min(100, prev + Math.max(2, (100 - prev) * 0.25))
        }

        // Smoothly approach targetProgress
        if (prev < targetProgress) {
          const step = Math.max(0.5, (targetProgress - prev) * 0.15)
          return Math.min(targetProgress, prev + step)
        }
        return prev
      })
    }, 30)

    return () => clearInterval(interval)
  }, [targetProgress, modelReady])

  const rounded = Math.min(100, Math.floor(displayPercent))

  // Contextual magical status message based on progress
  let statusText = 'Entering the Great Hall...'
  if (rounded >= 100 || modelReady) {
    statusText = 'The Great Hall Awaits'
  } else if (rounded >= 75) {
    statusText = 'Lighting the floating candles...'
  } else if (rounded >= 45) {
    statusText = 'Setting the four house tables...'
  } else if (rounded >= 20) {
    statusText = 'Awakening the ancient stone...'
  }

  return (
    <div className="fixed inset-0 z-0 flex flex-col items-center justify-end overflow-hidden bg-stone-950 select-none pb-14 sm:pb-16 md:pb-20">
      {/* Background Image */}
      <img
        src="/images/loading-pic.png"
        alt="Loading..."
        className="absolute inset-0 w-full h-full object-cover opacity-100"
      />

      {/* Atmospheric dark gradient so loading bar pops clearly */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0714] via-[#0a0714]/60 to-transparent pointer-events-none" />

      {/* Loading Bar Card Container */}
      <div className="relative z-10 flex flex-col items-center max-w-sm sm:max-w-md w-full px-6 text-center">
        {/* Status text */}
        <p className="font-cinzel text-xs sm:text-sm text-amber-200/90 tracking-[0.25em] uppercase mb-3 drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)] animate-pulse">
          {statusText}
        </p>

        {/* The Outer Bar Track */}
        <div className="w-full h-2.5 sm:h-3 rounded-full bg-black/75 border border-amber-500/40 p-0.5 shadow-[0_0_20px_rgba(0,0,0,0.9),inset_0_1px_3px_rgba(0,0,0,0.8)] backdrop-blur-md">
          {/* The Inner Glowing Fill */}
          <div
            className="h-full rounded-full bg-gradient-to-r from-amber-600 via-amber-400 to-yellow-200 transition-all duration-150 ease-out shadow-[0_0_12px_rgba(245,158,11,0.8)]"
            style={{ width: `${rounded}%` }}
          />
        </div>

        {/* Percentage Indicator */}
        <div className="flex justify-between w-full mt-2 px-1">
          <span className="font-cinzel text-[10px] sm:text-xs text-stone-400 tracking-widest uppercase">
            Loading Magic
          </span>
          <span className="font-cinzel text-xs sm:text-sm font-bold text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]">
            {rounded}%
          </span>
        </div>
      </div>
    </div>
  )
}
