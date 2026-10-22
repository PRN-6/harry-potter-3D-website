import { useRef } from 'react'

/**
 * Overlay to handle the mid-animation screen fade.
 * This must be outside the Canvas because it's a 2D HTML element.
 */
export function FadeOverlay({ ref }: { ref: React.RefObject<HTMLDivElement> }) {
  return (
    <div
      ref={ref}
      className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center bg-black transition-opacity duration-75"
      style={{ opacity: 0 }}
    >
      <div className="text-center px-6 transition-opacity duration-500 fade-text">
        <p className="font-cinzel text-2xl sm:text-4xl text-amber-200 tracking-widest uppercase drop-shadow-lg">
          Welcome to the Great Hall
        </p>
      </div>
    </div>
  )
}
