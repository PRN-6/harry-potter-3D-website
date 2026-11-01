import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface DailyProphetSectionProps {
  onExploreFaculty: () => void
  onExploreCouncil: () => void
}

export function DailyProphetSection({
  onExploreFaculty,
  onExploreCouncil,
}: DailyProphetSectionProps) {
  const [isZoomed, setIsZoomed] = useState(false)

  return (
    <div className="w-full max-w-5xl mx-auto py-6 px-3 sm:px-6">
      {/* ── Gazette Header & Issue Date ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between border-b-2 border-[#5c3c1e] pb-3 mb-6 px-2 gap-2 text-center sm:text-left">
        <div className="flex items-center gap-2">
          <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
          <h2 className="font-harry text-lg sm:text-xl text-[#ffd700] tracking-wider drop-shadow-sm">
            The Daily Prophet · Special Fest Edition
          </h2>
          <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
        </div>
        <div className="flex items-center gap-3 font-serif italic text-xs text-[#a37f4e]">
          <span>Sat, 25 October 2027</span>
          <span className="text-[#6d4620]">·</span>
          <span>Hogwarts Castle, UK</span>
          <span className="text-[#6d4620]">·</span>
          <span className="font-cinzel text-[11px] text-[#c9a44c] font-bold uppercase tracking-wider">
            Issue № 7287
          </span>
        </div>
      </div>

      {/* ── Enchanted Broadside on Carved Mahogany Desk ────────────────── */}
      <div className="relative rounded-lg p-2 sm:p-3 bg-gradient-to-b from-[#1c1007] via-[#120803] to-[#0a0502] border-2 border-[#7a4e23] shadow-[0_25px_80px_rgba(0,0,0,0.95)]">
        {/* Brass Corner Clasps */}
        <div className="absolute top-1 left-1 text-[#ffd700] text-xs select-none">⚜</div>
        <div className="absolute top-1 right-1 text-[#ffd700] text-xs select-none">⚜</div>
        <div className="absolute bottom-1 left-1 text-[#ffd700] text-xs select-none">⚜</div>
        <div className="absolute bottom-1 right-1 text-[#ffd700] text-xs select-none">⚜</div>

        {/* Newspaper Paper Container with Deckled / Parchment Drop Shadow */}
        <div className="relative overflow-hidden rounded-md bg-[#d8c097] border border-[#a17843] shadow-[0_15px_40px_rgba(0,0,0,0.85)] group cursor-pointer"
             onClick={() => setIsZoomed(true)}
        >
          {/* Subtle enchanted parchment sheen / moving magic dust */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-tr from-transparent via-[#ffd700]/10 to-transparent opacity-30 group-hover:opacity-75 transition-opacity duration-700 z-10" />

          {/* Center Vertical Crease (authentic folded newspaper broadsheet) */}
          <div className="pointer-events-none absolute inset-y-0 left-1/2 w-[2px] bg-gradient-to-r from-black/25 via-black/10 to-transparent -translate-x-1/2 z-15" />

          {/* The Authentic Newspaper Artwork */}
          <img
            src="/images/daily-prophet-team.jpg"
            alt="The Daily Prophet - Meet The AJ-ASTRIX2K27 Team!"
            loading="lazy"
            decoding="async"
            className="w-full h-auto object-contain select-none block transition-transform duration-700 group-hover:scale-[1.01]"
          />

          {/* Floating Wax Seal in Top-Right Corner */}
          <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 pointer-events-none drop-shadow-[0_4px_10px_rgba(0,0,0,0.8)]">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-[#801414] via-[#590a0a] to-[#360404] border-2 border-[#d4af37]/80 flex flex-col items-center justify-center text-center rotate-12 shadow-lg">
              <span className="text-[#ffd700] font-cinzel text-[8px] sm:text-[9px] uppercase font-bold tracking-tighter">
                Hogwarts
              </span>
              <span className="text-[#ffd700] font-cinzel text-[11px] sm:text-xs font-black">
                SEAL
              </span>
            </div>
          </div>

          {/* Click to inspect broadside indicator banner */}
          <div className="absolute bottom-3 right-3 z-20 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <span className="font-cinzel text-[10px] sm:text-xs uppercase tracking-widest text-[#1c1107] bg-[#ffd700]/90 px-3 py-1 rounded-sm font-bold shadow-md border border-[#8c6738]">
              🔍 Click to Enlarge Broadside
            </span>
          </div>
        </div>

        {/* ── Vintage Desk Controls Bar ──────────────────────────────── */}
        <div className="mt-4 pt-4 border-t border-[#4a2e14] flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <div className="text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-1.5 text-[#ffd700] text-xs mb-0.5">
              <span>✦</span>
              <span className="font-harry text-sm tracking-wider text-[#ffd700]">
                Official AJ-ASTRIX2K27 Broadsheet
              </span>
              <span>✦</span>
            </div>
            <p className="font-serif italic text-xs text-[#bda075]">
              "Together, they turn ideas into reality, challenges into achievements, and a fest into a lifelong memory."
            </p>
          </div>

          {/* Grand Wizarding Action Seals */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onExploreFaculty}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-sm font-cinzel text-xs uppercase tracking-wider font-bold bg-gradient-to-b from-[#c9a44c] via-[#b58f38] to-[#8c6721] hover:from-[#dfb564] hover:to-[#a3792c] text-[#1a0f05] shadow-[0_4px_15px_rgba(201,164,76,0.3)] transition-all hover:scale-105 cursor-pointer border border-[#ffe082]"
            >
              <span>📜</span>
              <span>Faculty Mentors</span>
              <span className="text-sm font-black group-hover:translate-y-0.5 transition-transform">↓</span>
            </button>

            <button
              onClick={onExploreCouncil}
              className="group flex items-center gap-2 px-4 py-2.5 rounded-sm font-cinzel text-xs uppercase tracking-wider font-bold border-2 border-[#c9a44c] hover:border-[#ffd700] text-[#e5c78c] hover:text-[#ffd700] bg-[#24150b]/90 hover:bg-[#331c0e] shadow-[0_4px_15px_rgba(0,0,0,0.6)] transition-all hover:scale-105 cursor-pointer"
            >
              <span>🪄</span>
              <span>12 Council Mages</span>
              <span className="text-sm font-black text-[#ffd700] group-hover:translate-y-0.5 transition-transform">↓</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── Zoomed Fullscreen Modal for Gazette ────────────────────────── */}
      <AnimatePresence>
        {isZoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[300] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-3 sm:p-6"
            onClick={() => setIsZoomed(false)}
          >
            <div className="w-full max-w-5xl flex items-center justify-between pb-3 text-[#e5c78c] border-b border-[#5c3e21] mb-3">
              <span className="font-cinzel text-xs sm:text-sm uppercase tracking-widest text-[#ffd700]">
                ✦ The Daily Prophet · Archived Broadside Edition
              </span>
              <button
                onClick={() => setIsZoomed(false)}
                className="font-cinzel text-xs uppercase tracking-widest px-3 py-1 bg-[#24150b] border border-[#8c6738] hover:border-[#ffd700] text-[#e5c78c] rounded-sm cursor-pointer"
              >
                ✕ Close Broadside
              </button>
            </div>
            <div className="relative max-h-[85vh] overflow-y-auto rounded-md border-2 border-[#8c6738] shadow-2xl">
              <img
                src="/images/daily-prophet-team.jpg"
                alt="The Daily Prophet Full View"
                loading="lazy"
                decoding="async"
                className="w-full h-auto max-w-5xl object-contain block"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
