import { motion } from 'framer-motion'

interface ScrollHintProps {
  className?: string
  isVisible?: boolean
}

/**
 * An enchanted, floating scroll indicator that encourages users to explore the hall.
 * Features a glowing pulsing caption, floating levitation, and animated falling light droplet.
 */
export function ScrollHint({ className = '', isVisible = true }: ScrollHintProps) {
  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 15 }}
      transition={{ duration: 0.5 }}
      className={`pointer-events-none fixed bottom-8 sm:bottom-10 left-1/2 z-20 -translate-x-1/2 flex flex-col items-center gap-2.5 select-none ${className}`}
      aria-hidden={!isVisible}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
        className="flex flex-col items-center gap-2"
      >
        <span className="font-cinzel text-[10px] tracking-[0.28em] text-amber-200/70 uppercase font-semibold drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
          <span className="text-[8px] text-amber-400">✦</span>
          <span>Scroll to explore</span>
          <span className="text-[8px] text-amber-400">✦</span>
        </span>

        {/* Cinematic Scroll Mouse with smooth falling light droplet */}
        <div className="relative w-5 h-9 sm:w-6 sm:h-10 border-2 border-amber-300/40 rounded-full flex justify-center p-1 bg-black/35 backdrop-blur-sm shadow-[0_0_12px_rgba(212,175,55,0.25)]">
          <motion.div
            animate={{ y: [0, 14, 0], opacity: [1, 0.2, 1] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            className="w-1 h-2 bg-amber-300 rounded-full shadow-[0_0_8px_#ffd700]"
          />
        </div>
      </motion.div>
    </motion.div>
  )
}
