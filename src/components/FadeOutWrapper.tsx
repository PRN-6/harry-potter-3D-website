import React from 'react'

interface FadeOutWrapperProps {
  isFadingOut: boolean;
  children: React.ReactNode;
}

/**
 * A wrapper component that handles the cinematic fade-out transition
 * for the loading screen.
 */
export function FadeOutWrapper({ isFadingOut, children }: FadeOutWrapperProps) {
  return (
    <div
      className={`fixed inset-0 z-[300] transition-opacity duration-[1500ms] ease-in-out ${
        isFadingOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        transitionProperty: 'opacity',
        pointerEvents: isFadingOut ? 'none' : 'all'
      }}
    >
      {children}
    </div>
  );
}
