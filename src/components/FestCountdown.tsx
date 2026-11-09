import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

export interface FestCountdownProps {
  /** Target date string or Date object. Defaults to 25 October 2027 09:00:00 IST */
  targetDate?: string | Date
  className?: string
}

interface TimeRemaining {
  days: number
  hours: number
  minutes: number
  seconds: number
  isExpired: boolean
}

export function FestCountdown({
  targetDate = '2027-10-25T09:00:00+05:30',
  className = '',
}: FestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeLeft(targetDate))

  useEffect(() => {
    setTimeLeft(calculateTimeLeft(targetDate))

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  function calculateTimeLeft(target: string | Date): TimeRemaining {
    const targetMs = typeof target === 'string' ? new Date(target).getTime() : target.getTime()
    if (isNaN(targetMs)) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }
    const nowMs = Date.now()
    const diff = targetMs - nowMs

    if (diff <= 0) {
      return { days: 0, hours: 0, minutes: 0, seconds: 0, isExpired: true }
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff / (1000 * 60 * 60)) % 24)
    const minutes = Math.floor((diff / (1000 * 60)) % 60)
    const seconds = Math.floor((diff / 1000) % 60)

    return { days, hours, minutes, seconds, isExpired: false }
  }

  const timeUnits = [
    { label: 'Days', value: String(timeLeft.days).padStart(2, '0') },
    { label: 'Hours', value: String(timeLeft.hours).padStart(2, '0') },
    { label: 'Mins', value: String(timeLeft.minutes).padStart(2, '0') },
    { label: 'Secs', value: String(timeLeft.seconds).padStart(2, '0') },
  ]

  return (
    <div className={`relative flex flex-col items-center select-none ${className}`}>
      {/* ── 4 Enchanted Countdown Digit Boxes ── */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 max-w-full">
        {timeUnits.map((unit, idx) => (
          <div key={unit.label} className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
            {/* The Digit Card with interactive spring hover and staggered entrance */}
            <motion.div
              initial={{ opacity: 0, scale: 0.85, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: idx * 0.08, type: 'spring', damping: 16 }}
              whileHover={{ scale: 1.08, y: -4, transition: { duration: 0.2 } }}
              className="relative group min-w-[62px] xs:min-w-[70px] sm:min-w-[85px] md:min-w-[100px] px-2 sm:px-4 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#180e07]/90 via-[#0e0703]/90 to-[#050201]/95 border border-amber-500/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:border-amber-400/80 hover:shadow-[0_0_30px_rgba(255,215,0,0.5)] backdrop-blur-xl transition-colors duration-300 flex flex-col items-center justify-center overflow-hidden cursor-default"
            >
              {/* Corner Runic Flourishes */}
              <span className="absolute top-1 left-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute top-1 right-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute bottom-1 left-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute bottom-1 right-1.5 text-[8px] text-amber-500/40">✦</span>

              {/* Ambient radial candle glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.18)_0%,transparent_75%)] pointer-events-none" />

              {/* Shimmer sweep on hover */}
              <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/15 to-transparent pointer-events-none" />

              {/* Number Value */}
              <span className="relative font-cinzel-decorative font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#fff6be] via-[#ffd700] to-[#b8860b] drop-shadow-[0_2px_12px_rgba(255,215,0,0.5)] tracking-wider">
                {unit.value}
              </span>

              {/* Unit Label */}
              <span className="relative font-cinzel text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.25em] text-amber-300/80 font-bold mt-0.5 sm:mt-1">
                {unit.label}
              </span>
            </motion.div>

            {/* Separator Colon (omitted after last item) */}
            {idx < timeUnits.length - 1 && (
              <div className="flex flex-col gap-1 sm:gap-1.5 items-center justify-center">
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700]"
                />
                <motion.span
                  animate={{ scale: [1, 1.4, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut', delay: 0.75 }}
                  className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700]"
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sub-pill: Inauguration Status ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35, duration: 0.5 }}
        className="mt-3 sm:mt-4 flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]"
      >
        <span className="relative flex h-2 w-2">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${timeLeft.isExpired ? 'bg-emerald-400' : 'bg-amber-400'}`} />
          <span className={`relative inline-flex rounded-full h-2 w-2 ${timeLeft.isExpired ? 'bg-emerald-500' : 'bg-amber-500'}`} />
        </span>
        <span className="font-cinzel text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-amber-200/90 font-bold">
          {timeLeft.isExpired ? 'Festival Commenced · Welcome Wizards!' : 'Grand Fest Inauguration · 25 Oct 2027'}
        </span>
      </motion.div>
    </div>
  )
}
