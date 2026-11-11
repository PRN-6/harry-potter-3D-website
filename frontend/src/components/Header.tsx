import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface HeaderProps {
  onTeamClick?: () => void
  onRegisterClick?: () => void
  currentView?: string
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  showDesktopNav?: boolean
  className?: string
  isVisible?: boolean
}

export function Header({
  onTeamClick,
  onRegisterClick,
  currentView = 'home',
  leftSlot,
  centerSlot,
  showDesktopNav = true,
  className = '',
  isVisible = true,
}: HeaderProps) {
  const [isOpen, setIsOpen] = useState(false)

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close menu on hash change / navigation
  useEffect(() => {
    const handleHashChange = () => setIsOpen(false)
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  // Close menu on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleRegister = () => {
    if (onRegisterClick) {
      onRegisterClick()
    } else {
      window.dispatchEvent(new CustomEvent('open-register-modal'))
    }
    setIsOpen(false)
  }

  const navLinks = [
    {
      title: 'Great Hall',
      fullTitle: 'The Great Hall',
      subtitle: 'Atmospheric 3D Entrance & Floating Candles',
      href: '#/',
      icon: '🏰',
      active: currentView === 'home',
      onClick: () => {
        window.location.hash = '#/'
        window.dispatchEvent(new CustomEvent('reset-hall-tour'))
        setIsOpen(false)
      },
    },
    {
      title: 'The Team',
      fullTitle: 'The Team & Gazette',
      subtitle: 'The Daily Prophet, Faculty & Student Council',
      href: '#/team',
      icon: '🗞️',
      active: currentView === 'team',
      onClick: () => {
        if (onTeamClick) onTeamClick()
        else window.location.hash = '#/team'
        setIsOpen(false)
      },
    },
    {
      title: 'Event Map',
      fullTitle: "Marauder's Event Map",
      subtitle: 'Interactive Castle Grounds & 2-Day Schedule',
      href: '#/map',
      icon: '🗺️',
      active: currentView === 'map',
      onClick: () => {
        window.location.hash = '#/map'
        setIsOpen(false)
      },
    },
    {
      title: 'Staff Portal',
      fullTitle: 'Staff & Admin Chamber',
      subtitle: 'Super Admin, Faculty & Prefects Console',
      href: '#/admin',
      icon: '🏛️',
      active: currentView === 'admin',
      onClick: () => {
        window.location.hash = '#/admin'
        setIsOpen(false)
      },
    },
  ]

  const houseLinks = [
    { name: 'Gryffindor', id: 'gryffindor', crest: '🦁', motto: 'Bravery & Chivalry', color: '#ae0001', glow: '#d3a625' },
    { name: 'Slytherin', id: 'slytherin', crest: '🐍', motto: 'Ambition & Cunning', color: '#1a472a', glow: '#5d5d5d' },
    { name: 'Ravenclaw', id: 'ravenclaw', crest: '🦅', motto: 'Wisdom & Intellect', color: '#0e1a40', glow: '#946b2d' },
    { name: 'Hufflepuff', id: 'hufflepuff', crest: '🦡', motto: 'Dedication & Loyalty', color: '#ecb939', glow: '#372e29' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] pointer-events-none ${
          isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
        } ${className}`}
      >
        {/* Transparent Header Shell with Soft Top Gradient Vignette */}
        <div className="relative w-full bg-gradient-to-b from-black/60 via-black/20 to-transparent">
          {/* Main Content Bar */}
          <div className="max-w-7xl mx-auto px-3 sm:px-6 md:px-8 h-16 sm:h-20 flex items-center justify-between gap-2 sm:gap-4 pointer-events-auto">
            {/* ── Left Section: Wordmark Brand or Custom Page Slot ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {leftSlot ? (
                leftSlot
              ) : (
                <a
                  href="#/"
                  onClick={(e) => {
                    e.preventDefault()
                    window.location.hash = '#/'
                    window.dispatchEvent(new CustomEvent('reset-hall-tour'))
                  }}
                  className="flex items-center gap-2 sm:gap-3 group cursor-pointer select-none"
                >
                  {/* Brand Typography */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 sm:gap-2">
                      <span className="font-cinzel font-black text-sm sm:text-base md:text-lg tracking-[0.2em] bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#d4af37] bg-clip-text text-transparent drop-shadow-[0_2px_10px_rgba(0,0,0,0.95)] uppercase leading-none">
                        AJ-ASTRIX
                      </span>
                      <span className="px-1.5 sm:px-2 py-0.5 rounded-full font-mono font-bold text-[9px] sm:text-[10px] tracking-wider text-amber-300 bg-black/40 backdrop-blur-sm border border-amber-400/40 shadow-[0_0_8px_rgba(245,158,11,0.25)] leading-none">
                        2K27
                      </span>
                    </div>
                    <span className="font-outfit uppercase tracking-[0.28em] text-[8px] text-amber-200/80 drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)] font-semibold mt-0.5 hidden xs:block">
                      COLLEGE FESTIVAL
                    </span>
                  </div>
                </a>
              )}
            </div>

            {/* ── Center Section: Center Slot or Transparent Desktop Pill Navigation ── */}
            <div className="flex-1 min-w-0 flex justify-center items-center px-1 sm:px-4">
              {centerSlot ? (
                <div className="max-w-full overflow-x-auto scrollbar-none py-0.5">
                  {centerSlot}
                </div>
              ) : showDesktopNav ? (
                <nav className="hidden lg:flex items-center gap-1 p-1 rounded-full bg-black/35 backdrop-blur-md border border-white/15 hover:border-amber-400/35 transition-colors shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
                  {navLinks.map((item) => (
                    <a
                      key={item.title}
                      href={item.href}
                      onClick={(e) => {
                        e.preventDefault()
                        item.onClick()
                      }}
                      className={`relative flex items-center gap-1.5 px-3.5 py-1.5 rounded-full font-cinzel text-xs uppercase tracking-[0.16em] font-bold transition-all duration-300 cursor-pointer ${
                        item.active
                          ? 'text-amber-200 bg-amber-400/20 border border-amber-400/50 shadow-[0_0_15px_rgba(245,158,11,0.25)]'
                          : 'text-stone-300 hover:text-amber-200 hover:bg-white/10 border border-transparent hover:border-white/10'
                      }`}
                    >
                      <span className="text-sm">{item.icon}</span>
                      <span>{item.title}</span>
                      {item.active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_8px_#ffd700]" />
                      )}
                    </a>
                  ))}
                </nav>
              ) : null}
            </div>

            {/* ── Right Section: Register CTA + Transparent Circular Burger Button ── */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              {/* College Fest Register CTA Button */}
              <button
                onClick={handleRegister}
                className="relative group overflow-hidden rounded-full p-[1px] bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-600 shadow-[0_0_18px_rgba(245,158,11,0.4)] hover:shadow-[0_0_28px_rgba(245,158,11,0.75)] hover:scale-105 active:scale-95 transition-all duration-300 cursor-pointer"
              >
                <div className="flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-cinzel font-black text-[10px] sm:text-xs tracking-[0.16em] uppercase">
                  <span className="text-xs">⚡</span>
                  <span>Register</span>
                  <span className="hidden xl:inline text-[9px] font-mono font-bold bg-stone-950/20 px-1.5 py-0.2 rounded-full">
                    LIVE
                  </span>
                </div>
                {/* Shimmer sweep */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/40 to-transparent pointer-events-none" />
              </button>

              {/* Transparent Circular Glass Burger Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? 'Close Magical Menu' : 'Open Magical Menu'}
                className="group relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full border border-white/20 hover:border-amber-400/60 bg-black/40 hover:bg-black/60 text-amber-300 shadow-[0_0_15px_rgba(0,0,0,0.5)] hover:shadow-[0_0_20px_rgba(255,215,0,0.4)] transition-all duration-300 cursor-pointer backdrop-blur-md"
              >
                <div className="w-4 sm:w-4.5 h-3.5 flex flex-col justify-between items-center relative">
                  <span
                    className={`w-full h-[2px] bg-amber-300 rounded-full transition-all duration-300 transform origin-center ${
                      isOpen ? 'rotate-45 translate-y-[6px]' : ''
                    }`}
                  />
                  <span
                    className={`w-full h-[2px] bg-amber-400/80 rounded-full transition-all duration-300 ${
                      isOpen ? 'opacity-0 scale-0' : 'opacity-100'
                    }`}
                  />
                  <span
                    className={`w-full h-[2px] bg-amber-300 rounded-full transition-all duration-300 transform origin-center ${
                      isOpen ? '-rotate-45 -translate-y-[6px]' : ''
                    }`}
                  />
                </div>
                {/* Ambient glow on hover */}
                <span className="absolute inset-0 rounded-full bg-amber-400/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          FULL-SCREEN / SLIDE-IN ENCHANTED COLLEGE FESTIVAL DRAWER
      ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            {/* Dark Frosted Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Slide-over Enchanted Festival Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#140b05] via-[#0d0703] to-[#050201] border-l border-amber-500/35 shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-y-auto"
            >
              {/* Drawer Top Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-amber-500/20 bg-[#120904]/95 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex items-center gap-2">
                    <span className="font-cinzel font-black text-base sm:text-lg tracking-[0.2em] bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#d4af37] bg-clip-text text-transparent uppercase">
                      AJ-ASTRIX
                    </span>
                    <span className="px-1.5 py-0.5 rounded-full font-mono font-bold text-[9px] text-amber-300 bg-amber-500/20 border border-amber-400/40">
                      2K27
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border border-amber-500/30 hover:border-amber-400 bg-amber-950/40 text-amber-300 hover:text-white flex items-center justify-center font-bold text-xs transition-all shadow-[0_0_10px_rgba(245,158,11,0.15)] cursor-pointer"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Live Fest Banner */}
              <div className="px-5 sm:px-6 pt-4">
                <div className="p-2.5 rounded-xl bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border border-amber-400/30 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>
                    <span className="font-cinzel text-[10px] uppercase tracking-wider text-amber-200 font-bold">
                      Registrations Live
                    </span>
                  </div>
                  <span className="font-mono text-[9px] text-amber-300/80 uppercase tracking-widest bg-amber-950/60 px-2 py-0.5 rounded-full border border-amber-500/30">
                    EDITION 2027
                  </span>
                </div>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-5 sm:p-6 space-y-6">
                {/* Main Navigation Links */}
                <div>
                  <h3 className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-amber-400/80 font-bold mb-3 flex items-center gap-2">
                    <span>✦</span>
                    <span>Festival Directory</span>
                  </h3>
                  <div className="space-y-2.5">
                    {navLinks.map((item, i) => (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
                        onClick={item.onClick}
                        className={`w-full flex items-center gap-3.5 p-3 sm:p-3.5 rounded-xl border transition-all text-left cursor-pointer group ${
                          item.active
                            ? 'bg-gradient-to-r from-amber-500/20 to-amber-950/40 border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.2)]'
                            : 'bg-[#180e07]/80 hover:bg-[#25150a] border-amber-900/40 hover:border-amber-500/40'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-lg bg-[#241308] border border-amber-500/30 flex items-center justify-center text-xl shrink-0 group-hover:scale-105 group-hover:border-amber-400 transition-transform">
                          {item.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <span className="font-cinzel font-bold text-sm sm:text-base tracking-wider text-amber-200 group-hover:text-amber-300 block mb-0.5 truncate uppercase">
                            {item.title}
                          </span>
                          <span className="font-outfit text-xs text-stone-400 group-hover:text-stone-300 block leading-tight truncate">
                            {item.subtitle}
                          </span>
                        </div>
                        <span className="text-amber-400 font-cinzel text-sm group-hover:translate-x-1 transition-transform">
                          →
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* The Four Houses Collector Cards Grid */}
                <div>
                  <h3 className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-amber-400/80 font-bold mb-3 flex items-center gap-2">
                    <span>✦</span>
                    <span>The Four Houses & 3D Collector Cards</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2.5">
                    {houseLinks.map((h, i) => (
                      <motion.button
                        key={h.id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.15 + 0.04 * i, duration: 0.3 }}
                        onClick={() => {
                          window.location.hash = `#/house/${h.id}`
                          setIsOpen(false)
                        }}
                        className="relative overflow-hidden flex flex-col p-3 rounded-xl border border-amber-900/40 hover:border-amber-400/70 bg-[#160d05]/90 hover:bg-[#201207] transition-all text-left cursor-pointer group"
                      >
                        {/* House color top accent */}
                        <div
                          className="absolute top-0 left-0 right-0 h-[2px] opacity-80"
                          style={{ backgroundColor: h.color }}
                        />
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl group-hover:scale-110 transition-transform">
                            {h.crest}
                          </span>
                          <span className="text-amber-400 font-cinzel text-xs group-hover:translate-x-0.5 transition-transform">
                            →
                          </span>
                        </div>
                        <span className="font-cinzel font-bold text-xs sm:text-sm text-stone-200 group-hover:text-amber-300 block truncate uppercase tracking-wider">
                          {h.name}
                        </span>
                        <span className="text-[10px] text-stone-400 block font-outfit truncate mt-0.5">
                          {h.motto}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Register CTA Button in Drawer */}
                <div className="pt-2">
                  <button
                    onClick={handleRegister}
                    className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-cinzel font-black text-xs sm:text-sm tracking-[0.18em] uppercase bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-stone-950 border border-amber-300 shadow-[0_0_25px_rgba(245,158,11,0.4)] transition-all cursor-pointer group"
                  >
                    <span className="text-sm group-hover:animate-bounce">⚡</span>
                    <span>Register for Events & Contests</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer Inscription */}
              <div className="p-4 sm:p-5 border-t border-amber-500/20 bg-[#080402] text-center">
                <p className="font-serif italic text-xs text-amber-300/70 mb-1">
                  "I solemnly swear that I am up to no good."
                </p>
                <div className="flex flex-col items-center gap-1.5 mt-2">
                  <span className="font-cinzel text-[10px] tracking-[0.25em] uppercase text-amber-400/60 font-bold">
                    ✦ Hogwarts Fest Edition · 2K27 ✦
                  </span>
                  <a
                    href="#/admin"
                    onClick={() => setIsOpen(false)}
                    className="font-cinzel text-[10px] tracking-wider text-amber-400/80 hover:text-amber-200 transition-colors uppercase font-bold flex items-center gap-1 cursor-pointer pt-1"
                  >
                    <span>🏛️</span> Enter Staff & Admin Chamber Portal
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
