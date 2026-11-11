import { motion, AnimatePresence } from 'framer-motion'
import { FestCountdown } from './FestCountdown'
import { HOUSES } from '../data/houses'

export interface ChapterOverlayProps {
  chapter: number
  onRegisterClick: () => void
  onExploreMap: () => void
  onViewTeam: () => void
  onJumpToChapter: (step: number) => void
}

export function ChapterOverlay({
  chapter,
  onRegisterClick,
  onExploreMap,
  onViewTeam,
  onJumpToChapter,
}: ChapterOverlayProps) {
  return (
    <div className="pointer-events-none fixed inset-0 z-20 flex items-center justify-center text-center p-3 sm:p-6">
      <AnimatePresence mode="wait">
        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 0: HERO — GRAND COLLEGE FESTIVAL INCEPTION
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 0 && (
          <motion.div
            key="chapter-0"
            initial={{ opacity: 0, y: 24, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            {/* Department Inscription Pill */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/60 border border-amber-500/40 backdrop-blur-md shadow-[0_0_15px_rgba(245,158,11,0.25)] mb-3 sm:mb-4"
            >
              <span className="text-amber-400 text-xs animate-pulse">✦</span>
              <span className="font-cinzel text-[9px] sm:text-xs uppercase tracking-[0.22em] text-amber-200/95 font-bold">
                MCA (INOVEX) & MBA (NEXORA) PRESENT
              </span>
              <span className="text-amber-400 text-xs animate-pulse">✦</span>
            </motion.div>

            {/* Grand Festival Name */}
            <motion.h1
              initial={{ opacity: 0, scale: 0.92, y: 14 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="font-cinzel-decorative text-4xl xs:text-5xl sm:text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-[#fff7d1] via-[#ffd700] to-[#b8860b] drop-shadow-[0_4px_30px_rgba(255,215,0,0.4)] tracking-wider uppercase mb-2 sm:mb-3"
            >
              AJ-ASTRIX 2K27
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.5 }}
              className="font-cinzel text-xs sm:text-base md:text-lg uppercase tracking-[0.25em] text-amber-200/90 font-semibold mb-4 sm:mb-6 drop-shadow-md"
            >
              National Level Intercollegiate Hogwarts Festival
            </motion.p>

            {/* Key Festival Metrics Pill Strip */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-2xl mb-5 sm:mb-7"
            >
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/30 text-amber-200 text-[10px] sm:text-xs font-cinzel font-bold shadow-md">
                <span>📅</span>
                <span>25–27 OCT 2027</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/30 text-amber-200 text-[10px] sm:text-xs font-cinzel font-bold shadow-md">
                <span>🏆</span>
                <span>₹1,00,000+ PRIZES</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/30 text-amber-200 text-[10px] sm:text-xs font-cinzel font-bold shadow-md">
                <span>⚡</span>
                <span>20+ CONTESTS</span>
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/55 backdrop-blur-md border border-amber-400/30 text-amber-200 text-[10px] sm:text-xs font-cinzel font-bold shadow-md">
                <span>🎟️</span>
                <span>₹250 ALL-ACCESS PASS</span>
              </div>
            </motion.div>

            {/* Primary Action Buttons (Clickable) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: 0.38, duration: 0.5 }}
              className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 pointer-events-auto"
            >
              <button
                onClick={onRegisterClick}
                className="group relative overflow-hidden rounded-full p-[1px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_25px_rgba(245,158,11,0.5)] hover:shadow-[0_0_35px_rgba(245,158,11,0.8)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-2 px-5 sm:px-7 py-2.5 sm:py-3 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-black text-xs sm:text-sm tracking-[0.16em] uppercase">
                  <span>⚡</span>
                  <span>Register Now (₹250)</span>
                </div>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              </button>

              <button
                onClick={onExploreMap}
                className="flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full bg-black/60 hover:bg-black/80 border border-white/20 hover:border-amber-400/60 text-amber-200 hover:text-amber-100 font-cinzel text-xs sm:text-sm tracking-[0.16em] uppercase font-bold backdrop-blur-md transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.5)] cursor-pointer"
              >
                <span>🗺️</span>
                <span>Events & Schedule</span>
              </button>

              <button
                onClick={onViewTeam}
                className="hidden sm:flex items-center gap-2 px-4 sm:px-5 py-2.5 sm:py-3 rounded-full bg-black/50 hover:bg-black/75 border border-white/15 hover:border-amber-400/50 text-stone-300 hover:text-amber-200 font-cinzel text-xs sm:text-sm tracking-[0.14em] uppercase font-semibold backdrop-blur-md transition-all duration-300 hover:scale-105 cursor-pointer"
              >
                <span>🗞️</span>
                <span>Meet The Team</span>
              </button>
            </motion.div>

            {/* Scroll Cue Hint */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.6 }}
              onClick={() => onJumpToChapter(1)}
              className="mt-6 sm:mt-8 flex items-center gap-2 text-stone-400/80 hover:text-amber-300 font-cinzel text-[10px] sm:text-xs uppercase tracking-[0.25em] cursor-pointer pointer-events-auto transition-colors"
            >
              <span>Scroll to enter the Great Hall</span>
              <span className="animate-bounce">↓</span>
            </motion.div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 1: THE AISLE — THE LONG TABLES
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 1 && (
          <motion.div
            key="chapter-1"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-3xl w-full flex flex-col items-center select-none"
          >
            <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.35em] text-amber-200/85 mb-2 font-bold drop-shadow-md">
              Grand Congregation · 50+ Visiting Colleges
            </p>
            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-stone-100 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] tracking-wider uppercase mb-3">
              The Long Tables
            </h2>
            <p
              className="italic text-base sm:text-xl text-stone-300/90 max-w-lg mx-auto leading-relaxed drop-shadow-md mb-5"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              Four benches, four noble houses, and a feast set for every aspiring engineer, manager, and tech wizard across the nation.
            </p>

            {/* Stat Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-4 mb-4">
              <span className="px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/30 font-cinzel text-[11px] sm:text-xs text-amber-300 font-bold backdrop-blur-md">
                🏛️ 50+ Colleges
              </span>
              <span className="px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/30 font-cinzel text-[11px] sm:text-xs text-amber-300 font-bold backdrop-blur-md">
                👥 1000+ Delegates
              </span>
              <span className="px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/30 font-cinzel text-[11px] sm:text-xs text-amber-300 font-bold backdrop-blur-md">
                🏰 4 Houses
              </span>
              <span className="px-3.5 py-1 rounded-full bg-black/60 border border-amber-500/30 font-cinzel text-[11px] sm:text-xs text-amber-300 font-bold backdrop-blur-md">
                ⚡ 3 Days of Magic
              </span>
            </div>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 2: INOVEX — MCA TECHNICAL SYMPOSIUM
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 2 && (
          <motion.div
            key="chapter-2"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-cyan-950/60 border border-cyan-400/40 text-cyan-300 text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
              <span>💻</span>
              <span>Department of Computer Applications · MCA</span>
            </div>

            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-200 via-sky-300 to-amber-200 drop-shadow-[0_4px_30px_rgba(14,165,233,0.3)] tracking-wider uppercase mb-2">
              INOVEX 2K27
            </h2>

            <p
              className="italic text-base sm:text-lg text-stone-300/90 max-w-xl mx-auto leading-relaxed drop-shadow-md mb-5"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              The premier national technical symposium where code sorcery, system architecture, and AI engineering clash for supremacy.
            </p>

            {/* Featured MCA Events Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mb-5">
              {[
                { name: 'Hackathon Hex', icon: '💻', desc: '24hr Code Sprint' },
                { name: 'Web Wizardry', icon: '⚡', desc: 'Modern UI/UX Duel' },
                { name: 'Cyber Defense', icon: '🛡️', desc: 'Security CTF' },
                { name: 'Arithmancy', icon: '🧠', desc: 'Algorithm Quest' },
                { name: 'Gaming Guild', icon: '🎮', desc: 'Esports Arena' },
              ].map((ev) => (
                <div
                  key={ev.name}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-cyan-400/30 text-stone-200 text-[11px] sm:text-xs font-outfit shadow-sm backdrop-blur-md"
                >
                  <span>{ev.icon}</span>
                  <span className="font-bold text-cyan-200">{ev.name}</span>
                  <span className="text-stone-400 text-[10px]">({ev.desc})</span>
                </div>
              ))}
            </div>

            {/* Action CTA */}
            <button
              onClick={onExploreMap}
              className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore MCA Events & Rules</span>
              <span>→</span>
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 3: NEXORA — MBA MANAGEMENT CONCLAVE
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 3 && (
          <motion.div
            key="chapter-3"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-400/40 text-emerald-300 text-[10px] sm:text-xs font-cinzel font-bold uppercase tracking-[0.2em] mb-2 backdrop-blur-md">
              <span>📈</span>
              <span>Department of Business Administration · MBA</span>
            </div>

            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-200 via-amber-300 to-yellow-200 drop-shadow-[0_4px_30px_rgba(16,185,129,0.3)] tracking-wider uppercase mb-2">
              NEXORA 2K27
            </h2>

            <p
              className="italic text-base sm:text-lg text-stone-300/90 max-w-xl mx-auto leading-relaxed drop-shadow-md mb-5"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              A high-octane management conclave where visionary strategists, finance wizards, and corporate titans forge the future.
            </p>

            {/* Featured MBA Events Tags */}
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mb-5">
              {[
                { name: 'Minister of Magic', icon: '👑', desc: 'Best Manager' },
                { name: 'Gringotts Pitch', icon: '💰', desc: 'Venture Capital' },
                { name: 'Daily Prophet PR', icon: '📢', desc: 'Crisis Control' },
                { name: 'Quidditch Marketing', icon: '🎯', desc: 'Brand War' },
                { name: 'Order of Phoenix', icon: '🤝', desc: 'HR Conclave' },
              ].map((ev) => (
                <div
                  key={ev.name}
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 border border-emerald-400/30 text-stone-200 text-[11px] sm:text-xs font-outfit shadow-sm backdrop-blur-md"
                >
                  <span>{ev.icon}</span>
                  <span className="font-bold text-emerald-300">{ev.name}</span>
                  <span className="text-stone-400 text-[10px]">({ev.desc})</span>
                </div>
              ))}
            </div>

            {/* Action CTA */}
            <button
              onClick={onExploreMap}
              className="pointer-events-auto flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-500 to-amber-500 hover:from-emerald-400 hover:to-amber-400 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Explore MBA Events & Rules</span>
              <span>→</span>
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 4: THE GRAND UNION — AJ-ASTRIX
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 4 && (
          <motion.div
            key="chapter-4"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.35em] text-amber-200/85 mb-2 font-bold drop-shadow-md">
              The Flagship Union · MCA + MBA
            </p>

            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#d4af37] drop-shadow-[0_4px_30px_rgba(255,215,0,0.5)] tracking-wider uppercase mb-3">
              AJ-ASTRIX 2K27
            </h2>

            <p
              className="italic text-base sm:text-lg text-stone-300/90 max-w-xl mx-auto leading-relaxed drop-shadow-md mb-5"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              The grand union of technology and business administration — uniting INOVEX and NEXORA under one enchanted roof.
            </p>

            {/* Highlights Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 max-w-2xl mb-6">
              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md flex flex-col items-center text-center">
                <span className="text-lg mb-1">🏆</span>
                <span className="font-cinzel text-[11px] font-bold text-amber-200 uppercase">Championship</span>
                <span className="text-[10px] text-stone-400">Rolling Cup</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md flex flex-col items-center text-center">
                <span className="text-lg mb-1">🎭</span>
                <span className="font-cinzel text-[11px] font-bold text-amber-200 uppercase">Yule Ball</span>
                <span className="text-[10px] text-stone-400">Star Night</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md flex flex-col items-center text-center">
                <span className="text-lg mb-1">📜</span>
                <span className="font-cinzel text-[11px] font-bold text-amber-200 uppercase">Certificates</span>
                <span className="text-[10px] text-stone-400">For All Delegates</span>
              </div>
              <div className="p-2.5 rounded-xl bg-black/60 border border-amber-500/30 backdrop-blur-md flex flex-col items-center text-center">
                <span className="text-lg mb-1">🍽️</span>
                <span className="font-cinzel text-[11px] font-bold text-amber-200 uppercase">Grand Feast</span>
                <span className="text-[10px] text-stone-400">Food & Kit Included</span>
              </div>
            </div>

            <button
              onClick={onRegisterClick}
              className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-black text-xs sm:text-sm tracking-[0.16em] uppercase shadow-[0_0_25px_rgba(245,158,11,0.6)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>⚡</span>
              <span>Claim Your ₹250 Fest Pass</span>
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 5: TIME REMAINING — TIME-TURNER COUNTDOWN
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 5 && (
          <motion.div
            key="chapter-5"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.35em] text-amber-200/85 mb-2 font-bold drop-shadow-md">
              AJ-ASTRIX 2K27
            </p>

            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-stone-100 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] tracking-wider uppercase mb-4 sm:mb-6">
              Time Remaining
            </h2>

            {/* Countdown Component */}
            <div className="my-2 sm:my-3 pointer-events-auto">
              <FestCountdown targetDate="2027-10-25T09:00:00+05:30" />
            </div>

            <p
              className="italic text-sm sm:text-base text-stone-300/80 max-w-md mx-auto leading-relaxed drop-shadow-md mt-4 mb-4"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              Above the rafters, the Time-Turner spins — counting down every second until the Great Hall awakens.
            </p>

            <button
              onClick={onRegisterClick}
              className="pointer-events-auto flex items-center gap-2 px-5 py-2 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>⚡</span>
              <span>Register Before Slots Fill Up</span>
            </button>
          </motion.div>
        )}

        {/* ══════════════════════════════════════════════════════════════════
            CHAPTER 6: INTER-HOUSE CHAMPIONSHIP
        ══════════════════════════════════════════════════════════════════ */}
        {chapter === 6 && (
          <motion.div
            key="chapter-6"
            initial={{ opacity: 0, y: 26, scale: 0.95, filter: 'blur(10px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -20, scale: 1.03, filter: 'blur(10px)' }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-4xl w-full flex flex-col items-center select-none"
          >
            <p className="font-cinzel text-xs sm:text-sm uppercase tracking-[0.35em] text-amber-200/85 mb-2 font-bold drop-shadow-md">
              Inter-House Championship
            </p>

            <h2 className="font-cinzel-decorative text-4xl sm:text-6xl md:text-7xl font-black text-stone-100 drop-shadow-[0_4px_30px_rgba(0,0,0,0.95)] tracking-wider uppercase mb-3">
              The Four Houses
            </h2>

            <p
              className="italic text-base sm:text-lg text-stone-300/90 max-w-xl mx-auto leading-relaxed drop-shadow-md mb-6"
              style={{ fontFamily: '"Crimson Pro", serif' }}
            >
              Four noble houses participate in the grand festival — choose your house, compete for points, and claim the House Cup.
            </p>

            {/* 4 Houses Standings Preview Chips */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-2xl mb-6">
              {HOUSES.map((h) => (
                <div
                  key={h.id}
                  className="p-3 rounded-xl bg-black/65 border backdrop-blur-md flex flex-col items-center text-center shadow-md"
                  style={{ borderColor: `${h.color}80` }}
                >
                  <span className="text-2xl mb-1">{h.crest}</span>
                  <span className="font-cinzel font-bold text-xs uppercase text-stone-200 tracking-wider">
                    {h.name}
                  </span>
                  <span className="text-[10px] text-amber-300/90 font-outfit mt-0.5 font-semibold">
                    {h.traits[0]} · {h.traits[1]}
                  </span>
                </div>
              ))}
            </div>

            <button
              onClick={() => onJumpToChapter(7)}
              className="pointer-events-auto flex items-center gap-2 px-6 py-2.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-bold text-xs uppercase tracking-[0.16em] shadow-[0_0_20px_rgba(245,158,11,0.5)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              <span>Choose Your House & Collector Cards</span>
              <span>↓</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
