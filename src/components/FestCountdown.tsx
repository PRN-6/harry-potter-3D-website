import { useState, useEffect } from 'react'

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
  targetDate = '2027-10-25T09:00:00',
  className = '',
}: FestCountdownProps) {
  const [timeLeft, setTimeLeft] = useState<TimeRemaining>(() => calculateTimeLeft(targetDate))

  useEffect(() => {
    // Initial calculation
    setTimeLeft(calculateTimeLeft(targetDate))

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(targetDate))
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  function calculateTimeLeft(target: string | Date): TimeRemaining {
    const targetMs = typeof target === 'string' ? new Date(target).getTime() : target.getTime()
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
      {/* ── Magical Time-Turner Header Inscription ── */}
      <div className="flex items-center gap-2 mb-3 sm:mb-4">
        {/* Animated Rotating Time-Turner Icon */}
        <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full border border-amber-400/60 animate-spin [animation-duration:8s]" />
          <div className="absolute inset-1 rounded-full border border-amber-300/40 animate-spin [animation-duration:5s] [animation-direction:reverse]" />
          <span className="text-amber-300 text-xs sm:text-sm drop-shadow-[0_0_8px_rgba(255,215,0,0.8)]">
            ⏳
          </span>
        </div>
        <span className="font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.3em] text-amber-300/90 font-bold drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
          Time-Turner Countdown
        </span>
      </div>

      {/* ── 4 Enchanted Countdown Digit Boxes ── */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-3 md:gap-4 max-w-full">
        {timeUnits.map((unit, idx) => (
          <div key={unit.label} className="flex items-center gap-1.5 sm:gap-3 md:gap-4">
            {/* The Digit Card */}
            <div className="relative group min-w-[62px] xs:min-w-[70px] sm:min-w-[85px] md:min-w-[100px] px-2 sm:px-4 py-2 sm:py-3.5 rounded-xl sm:rounded-2xl bg-gradient-to-b from-[#180e07]/90 via-[#0e0703]/90 to-[#050201]/95 border border-amber-500/40 shadow-[0_0_20px_rgba(212,175,55,0.25)] hover:border-amber-400/80 hover:shadow-[0_0_30px_rgba(255,215,0,0.45)] backdrop-blur-xl transition-all duration-300 flex flex-col items-center justify-center overflow-hidden">
              {/* Corner Runic Flourishes */}
              <span className="absolute top-1 left-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute top-1 right-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute bottom-1 left-1.5 text-[8px] text-amber-500/40">✦</span>
              <span className="absolute bottom-1 right-1.5 text-[8px] text-amber-500/40">✦</span>

              {/* Ambient radial candle glow */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(251,191,36,0.15)_0%,transparent_75%)] pointer-events-none" />

              {/* Number Value */}
              <span className="relative font-cinzel-decorative font-black text-2xl xs:text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-b from-[#fff6be] via-[#ffd700] to-[#b8860b] drop-shadow-[0_2px_12px_rgba(255,215,0,0.5)] tracking-wider">
                {unit.value}
              </span>

              {/* Unit Label */}
              <span className="relative font-cinzel text-[9px] sm:text-[10px] md:text-xs uppercase tracking-[0.25em] text-amber-300/80 font-bold mt-0.5 sm:mt-1">
                {unit.label}
              </span>
            </div>

            {/* Separator Colon (omitted after last item) */}
            {idx < timeUnits.length - 1 && (
              <div className="flex flex-col gap-1 sm:gap-1.5 items-center justify-center">
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700] animate-pulse" />
                <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700] animate-pulse [animation-delay:500ms]" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* ── Sub-pill: Inauguration Status ── */}
      <div className="mt-3 sm:mt-4 flex items-center gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-amber-500/30 shadow-[0_0_12px_rgba(212,175,55,0.2)]">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <span className="font-cinzel text-[9px] sm:text-[10px] tracking-[0.22em] uppercase text-amber-200/90 font-bold">
          Grand Fest Inauguration · 25 Oct 2027
        </span>
      </div>
    </div>
  )
}

