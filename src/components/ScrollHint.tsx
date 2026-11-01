interface ScrollHintProps {
  className?: string
  isVisible?: boolean
}

/**
 * A cinematic scroll indicator that encourages users to explore the hall.
 * Features a pulsing caption and a custom animated mouse-wheel icon.
 * Fades out smoothly when isVisible is false (e.g. when reaching the house cards).
 */
export function ScrollHint({ className = '', isVisible = true }: ScrollHintProps) {
  return (
    <div
      className={`pointer-events-none fixed bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-3 transition-all duration-700 ease-in-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
      } ${className}`}
      aria-hidden={!isVisible}
    >
      <span className="font-cinzel text-[10px] tracking-[0.2em] text-amber-200/40 uppercase animate-pulse">
        Scroll to explore
      </span>

      {/* Cinematic Scroll Mouse Icon */}
      <div className="relative w-6 h-10 border-2 border-amber-200/30 rounded-full flex justify-center p-1">
        <div className="w-1 h-2 bg-amber-200 rounded-full animate-[scroll-mouse_2s_infinite]" />
      </div>
    </div>
  )
}
