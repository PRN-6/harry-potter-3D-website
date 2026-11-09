import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

interface IntroVideoProps {
  onComplete: () => void
}

export function IntroVideo({ onComplete }: IntroVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isMuted, setIsMuted] = useState(true)
  const [hasEnded, setHasEnded] = useState(false)
  const [videoProgress, setVideoProgress] = useState(0)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    // Attempt autoplay
    const playPromise = video.play()
    if (playPromise !== undefined) {
      playPromise.catch(() => {
        // Autoplay policy fallback: ensure muted and retry
        video.muted = true
        setIsMuted(true)
        video.play().catch(() => {})
      })
    }
  }, [])

  const handleTimeUpdate = () => {
    if (videoRef.current && videoRef.current.duration) {
      const p = (videoRef.current.currentTime / videoRef.current.duration) * 100
      setVideoProgress(p)
    }
  }

  const handleEnded = () => {
    setHasEnded(true)
    setTimeout(() => {
      onComplete()
    }, 600)
  }

  const toggleSound = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoRef.current) {
      videoRef.current.muted = !videoRef.current.muted
      setIsMuted(videoRef.current.muted)
    }
  }

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation()
    setHasEnded(true)
    setTimeout(() => {
      onComplete()
    }, 400)
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: hasEnded ? 0 : 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.8, ease: 'easeInOut' }}
      className="fixed inset-0 z-[280] bg-black flex items-center justify-center overflow-hidden select-none"
    >
      {/* ── Video Player with Watermark Cropping (Scale + Vignette) ── */}
      <div className="relative w-full h-full overflow-hidden flex items-center justify-center">
        <video
          ref={videoRef}
          src="/intro.mp4"
          autoPlay
          playsInline
          muted={isMuted}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="w-full h-full object-cover scale-[1.08] origin-center"
        />

        {/* ── Corner Watermark Suppressor (masks bottom-right Gemini icon completely) ── */}
        <div className="pointer-events-none absolute bottom-0 right-0 w-36 h-24 bg-gradient-to-tl from-black via-black/80 to-transparent" />

        {/* ── Cinematic Top & Bottom Vignettes ── */}
        <div className="pointer-events-none absolute top-0 inset-x-0 h-28 bg-gradient-to-b from-black/80 via-black/30 to-transparent" />
        <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
      </div>

      {/* ── Top Bar Controls ── */}
      <div className="absolute top-4 sm:top-6 inset-x-4 sm:inset-x-8 flex items-center justify-between z-30 pointer-events-auto">
        {/* Brand Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-amber-500/30">
          <span className="text-amber-400 text-xs">⚡</span>
          <span className="font-cinzel font-bold text-xs tracking-[0.2em] uppercase text-amber-200">
            AJ-ASTRIX 2K27
          </span>
        </div>

        {/* Action Controls: Sound Toggle + Skip Button */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Sound Toggle Button */}
          <button
            onClick={toggleSound}
            aria-label={isMuted ? 'Unmute video' : 'Mute video'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/60 hover:bg-black/80 backdrop-blur-md border border-white/20 hover:border-amber-400/50 text-amber-200 text-xs font-cinzel font-semibold transition-all cursor-pointer shadow-[0_0_15px_rgba(0,0,0,0.6)]"
          >
            <span>{isMuted ? '🔇' : '🔊'}</span>
            <span className="hidden sm:inline">{isMuted ? 'Sound On' : 'Muted'}</span>
          </button>

          {/* Skip Intro Button */}
          <button
            onClick={handleSkip}
            className="group flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 font-cinzel font-black text-xs uppercase tracking-wider shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all cursor-pointer hover:scale-105 active:scale-95"
          >
            <span>Enter Great Hall</span>
            <span className="text-xs group-hover:translate-x-0.5 transition-transform">→</span>
          </button>
        </div>
      </div>

      {/* ── Bottom Progress Line ── */}
      <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10 z-30 pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-amber-500 to-yellow-300 shadow-[0_0_10px_#ffd700] transition-all duration-150 ease-out"
          style={{ width: `${videoProgress}%` }}
        />
      </div>
    </motion.div>
  )
}
