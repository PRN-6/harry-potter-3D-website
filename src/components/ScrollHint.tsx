import React from 'react'

interface ScrollHintProps {
  className?: string;
}

/**
 * A cinematic scroll indicator that encourages users to explore the hall.
 * Features a pulsing caption and a custom animated mouse-wheel icon.
 */
export function ScrollHint({ className }: ScrollHintProps) {
  return (
    <div className={`pointer-events-none fixed bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-3 ${className}`}>
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
