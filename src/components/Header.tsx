import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export interface HeaderProps {
  onTeamClick?: () => void
  currentView?: string
  leftSlot?: React.ReactNode
  centerSlot?: React.ReactNode
  showDesktopNav?: boolean
  className?: string
  isVisible?: boolean
}

export function Header({
  onTeamClick,
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

  const navLinks = [
    {
      title: 'The Great Hall',
      subtitle: 'Atmospheric 3D Entrance & Floating Candles',
      href: '#/',
      icon: '🏰',
      active: currentView === 'home',
      onClick: () => {
        window.location.hash = '#/'
        setIsOpen(false)
      },
    },
    {
      title: 'The Team & Gazette',
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
      title: "Marauder's Event Map",
      subtitle: 'Interactive Castle Grounds & 2-Day Schedule',
      href: '#/map',
      icon: '🗺️',
      active: currentView === 'map',
      onClick: () => {
        window.location.hash = '#/map'
        setIsOpen(false)
      },
    },
  ]

  const houseLinks = [
    { name: 'Gryffindor', id: 'gryffindor', crest: '🦁', color: '#ae0001', glow: '#d3a625' },
    { name: 'Slytherin', id: 'slytherin', crest: '🐍', color: '#1a472a', glow: '#5d5d5d' },
    { name: 'Ravenclaw', id: 'ravenclaw', crest: '🦅', color: '#0e1a40', glow: '#946b2d' },
    { name: 'Hufflepuff', id: 'hufflepuff', crest: '🦡', color: '#ecb939', glow: '#372e29' },
  ]

  return (
    <>
      <header
        className={`fixed top-0 left-0 w-full z-50 px-3 sm:px-6 md:px-8 py-2.5 sm:py-3.5 flex justify-between items-center bg-[#0d0703]/90 sm:bg-[#0d0703]/80 border-b border-[#6d4620]/60 backdrop-blur-xl shadow-[0_4px_25px_rgba(0,0,0,0.8)] transition-all duration-1000 ease-[cubic-bezier(0.16,1,0.3,1)] ${
          isVisible ? 'translate-y-0 opacity-100 pointer-events-auto' : '-translate-y-full opacity-0 pointer-events-none'
        } ${className}`}
      >
        {/* Left Section (Custom slot or wordmark) */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {leftSlot ? (
            leftSlot
          ) : (
            <a
              href="#/"
              onClick={(e) => {
                e.preventDefault()
                window.location.hash = '#/'
              }}
              className="flex items-center gap-1.5 sm:gap-2 group cursor-pointer"
            >
              <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
              <span className="font-harry text-lg sm:text-xl md:text-2xl tracking-widest text-[#f2e2c4] group-hover:text-[#ffd700] transition-colors drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
                AJ-ASTRIX <span className="text-[#ffd700]">2K27</span>
              </span>
            </a>
          )}
        </div>

        {/* Center Section (Custom slot if provided, e.g. section tabs or house pills) */}
        {centerSlot && (
          <div className="flex-1 flex justify-center items-center px-1 sm:px-4 max-w-full overflow-hidden">
            {centerSlot}
          </div>
        )}

        {/* Right Section (Nav links + CTA + Burger Button) */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {/* Desktop Navigation Links (when showDesktopNav is enabled) */}
          {showDesktopNav && (
            <nav className="hidden lg:flex items-center gap-5 sm:gap-6">
              <a
                href="#/"
                className={`group flex items-center gap-1.5 font-cinzel text-xs uppercase tracking-widest transition-colors cursor-pointer ${
                  currentView === 'home' ? 'text-[#ffd700] font-bold' : 'text-[#d4be9b] hover:text-[#ffd700]'
                }`}
              >
                <span className="text-[#c9a44c] group-hover:rotate-45 transition-transform text-[10px]">✦</span>
                <span>Great Hall</span>
              </a>
              <a
                href="#/team"
                onClick={(e) => {
                  if (onTeamClick) {
                    e.preventDefault()
                    onTeamClick()
                  }
                }}
                className={`group flex items-center gap-1.5 font-cinzel text-xs uppercase tracking-widest transition-colors cursor-pointer ${
                  currentView === 'team' ? 'text-[#ffd700] font-bold' : 'text-[#d4be9b] hover:text-[#ffd700]'
                }`}
              >
                <span className="text-[#c9a44c] group-hover:rotate-45 transition-transform text-[10px]">✦</span>
                <span>The Team</span>
              </a>
              <a
                href="#/map"
                className={`group flex items-center gap-1.5 font-cinzel text-xs uppercase tracking-widest transition-colors cursor-pointer ${
                  currentView === 'map' ? 'text-[#ffd700] font-bold' : 'text-[#d4be9b] hover:text-[#ffd700]'
                }`}
              >
                <span className="text-[#c9a44c] group-hover:rotate-45 transition-transform text-[10px]">✦</span>
                <span>Event Map</span>
              </a>
            </nav>
          )}

          {/* Desktop Register Button */}
          <button
            className="hidden md:inline-flex items-center gap-1.5 font-cinzel text-[11px] sm:text-xs uppercase tracking-[0.18em] font-bold px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-sm border border-[#ffd700]/70 text-[#ffd700] bg-gradient-to-b from-[#2a170b] via-[#1c0f06] to-[#120803] hover:from-[#d4af37] hover:via-[#b8860b] hover:to-[#8c6516] hover:text-[#120802] transition-all duration-300 shadow-[0_0_15px_rgba(201,164,76,0.25)] hover:shadow-[0_0_22px_rgba(255,215,0,0.5)] cursor-pointer"
            onClick={() => window.open('https://google.com', '_blank')}
          >
            <span>⚡ Register</span>
          </button>

          {/* Enchanted Harry Potter Burger Button (Responsive for all screen sizes) */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close Magical Menu' : 'Open Magical Menu'}
            className="group relative flex flex-col justify-center items-center w-9 h-9 sm:w-10 sm:h-10 rounded-sm border border-[#a87d3b] hover:border-[#ffd700] bg-gradient-to-b from-[#241308] via-[#180d05] to-[#0e0703] text-[#ffd700] shadow-[0_0_12px_rgba(201,164,76,0.25)] transition-all cursor-pointer backdrop-blur-md"
          >
            <div className="w-4 sm:w-5 h-3.5 sm:h-4 flex flex-col justify-between items-center relative">
              <span
                className={`w-full h-[2px] bg-[#ffd700] rounded-full transition-all duration-300 transform origin-center ${
                  isOpen ? 'rotate-45 translate-y-[6px] sm:translate-y-[7px]' : ''
                }`}
              />
              <span
                className={`w-full h-[2px] bg-[#e5c78c] rounded-full transition-all duration-300 ${
                  isOpen ? 'opacity-0 scale-0' : 'opacity-100'
                }`}
              />
              <span
                className={`w-full h-[2px] bg-[#ffd700] rounded-full transition-all duration-300 transform origin-center ${
                  isOpen ? '-rotate-45 -translate-y-[6px] sm:-translate-y-[7px]' : ''
                }`}
              />
            </div>
            {/* Ambient hover aura */}
            <span className="absolute inset-0 rounded-sm bg-[#ffd700]/10 opacity-0 group-hover:opacity-100 transition-opacity" />
          </button>
        </div>
      </header>

      {/* ════════════════════════════════════════════════════════════════════
          FULL-SCREEN / SLIDE-IN ENCHANTED MOBILE BURGER DRAWER
      ════════════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[200] overflow-hidden">
            {/* Dark Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl"
            />

            {/* Slide-over Parchment Drawer */}
            <motion.div
              initial={{ x: '100%', opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: '100%', opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 260 }}
              className="absolute top-0 right-0 h-full w-full max-w-sm sm:max-w-md bg-gradient-to-b from-[#1c1007] via-[#120803] to-[#0a0502] border-l-2 border-[#8c6738] shadow-[0_0_60px_rgba(0,0,0,0.95)] flex flex-col overflow-y-auto"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 sm:py-5 border-b border-[#5c3c1e] bg-[#140b05]/95 sticky top-0 z-10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="text-[#ffd700] text-sm animate-pulse">✦</span>
                  <span className="font-harry text-xl sm:text-2xl tracking-widest text-[#f2e2c4]">
                    AJ-ASTRIX <span className="text-[#ffd700]">2K27</span>
                  </span>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-sm border border-[#8c6738] hover:border-[#ffd700] bg-[#221308] text-[#e5c78c] hover:text-[#ffd700] flex items-center justify-center font-cinzel text-xs font-bold transition-colors cursor-pointer"
                  aria-label="Close menu"
                >
                  ✕
                </button>
              </div>

              {/* Drawer Content */}
              <div className="flex-1 p-4 sm:p-6 space-y-5 sm:space-y-6">
                {/* Main Navigation Links */}
                <div>
                  <h3 className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#a8824f] font-bold mb-2.5 sm:mb-3 flex items-center gap-2">
                    <span>✦</span>
                    <span>Hogwarts Fest Directory</span>
                  </h3>
                  <div className="space-y-2">
                    {navLinks.map((item, i) => (
                      <motion.button
                        key={item.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * i, duration: 0.3 }}
                        onClick={item.onClick}
                        className={`w-full flex items-start gap-3 p-3 sm:p-3.5 rounded-sm border transition-all text-left cursor-pointer ${
                          item.active
                            ? 'bg-[#2f1c0d] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                            : 'bg-[#180e06]/80 hover:bg-[#25150a] border-[#5c3c1e] hover:border-[#a87d3b]'
                        }`}
                      >
                        <span className="text-xl sm:text-2xl mt-0.5">{item.icon}</span>
                        <div className="flex-1 min-w-0">
                          <span className="font-harry text-lg sm:text-xl tracking-wide text-[#ffd700] block mb-0.5 truncate">
                            {item.title}
                          </span>
                          <span className="font-serif italic text-[11px] sm:text-xs text-[#c2a272] block leading-tight truncate">
                            {item.subtitle}
                          </span>
                        </div>
                        <span className="text-[#c9a44c] font-cinzel text-xs mt-1">→</span>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* The Four Houses Grid */}
                <div>
                  <h3 className="font-cinzel text-[10px] sm:text-[11px] uppercase tracking-[0.25em] text-[#a8824f] font-bold mb-2.5 sm:mb-3 flex items-center gap-2">
                    <span>✦</span>
                    <span>The Four Houses & Collector Cards</span>
                  </h3>
                  <div className="grid grid-cols-2 gap-2 sm:gap-2.5">
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
                        className="flex items-center gap-2 p-2 sm:p-2.5 rounded-sm border border-[#5c3c1e] hover:border-[#ffd700] bg-[#160d05] hover:bg-[#221307] transition-all text-left cursor-pointer group"
                      >
                        <span className="text-lg sm:text-xl group-hover:scale-110 transition-transform">{h.crest}</span>
                        <div className="min-w-0">
                          <span className="font-harry text-base sm:text-lg font-bold text-[#e5c78c] group-hover:text-[#ffd700] block truncate">
                            {h.name}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-[#8c6738] block font-cinzel uppercase tracking-wider">
                            Explore →
                          </span>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Register CTA Button */}
                <div className="pt-1">
                  <button
                    onClick={() => {
                      window.open('https://google.com', '_blank')
                      setIsOpen(false)
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 sm:py-3 px-4 rounded-sm font-harry text-lg sm:text-xl tracking-widest bg-gradient-to-b from-[#d4af37] via-[#b8860b] to-[#8c6516] hover:from-[#f3cf65] hover:to-[#a37822] text-[#120802] border border-[#ffe082] shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all cursor-pointer"
                  >
                    <span>⚡</span>
                    <span>Register for Events & Competitions</span>
                  </button>
                </div>
              </div>

              {/* Drawer Footer Parchment Inscription */}
              <div className="p-4 sm:p-5 border-t border-[#4a2e14] bg-[#0c0602] text-center">
                <p className="font-serif italic text-xs text-[#a37f4e] mb-1">
                  "I solemnly swear that I am up to no good."
                </p>
                <span className="font-cinzel text-[10px] tracking-[0.2em] uppercase text-[#ffd700]/70">
                  ✦ Hogwarts Fest Edition ✦
                </span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
