import React from 'react'

interface FadeOutWrapperProps {
  isFadingOut: boolean;
  children: React.ReactNode;
}

/**
 * A wrapper component that handles the cinematic "splitting" transition.
 * Removed background color to ensure the 3D model is revealed as images slide.
 */
export function FadeOutWrapper({ isFadingOut, children }: FadeOutWrapperProps) {
  return (
    <div className="fixed inset-0 z-[300] pointer-events-none overflow-hidden">

      {/* Gradient Overlay - Fades out during split */}
      <div className={`absolute inset-0 z-[302] bg-gradient-to-b from-[#0a0714]/70 via-transparent to-[#0a0714]/70 pointer-events-none transition-opacity duration-[1000ms] ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`} />

      {/* UI Content - Fades out during split */}
      <div className={`absolute inset-0 z-[303] pointer-events-none transition-opacity duration-[1000ms] ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}>
        {children}
      </div>
    </div>
  )
}
