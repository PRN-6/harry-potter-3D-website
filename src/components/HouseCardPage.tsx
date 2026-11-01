import { useState, useMemo, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Header } from './Header'
import { HOUSES, HOUSE_BY_ID, type HouseId } from '../data/houses'
import { EVENTS, DAYS, STANDINGS, TRACK_META, type EventTrack } from '../data/events'

export const HOUSE_LORE: Record<HouseId, {
  founder: string
  element: string
  ghost: string
  commonRoom: string
  headOfHouse: string
  description: string
}> = {
  gryffindor: {
    founder: 'Godric Gryffindor',
    element: 'Fire 🔥',
    ghost: 'Nearly Headless Nick',
    commonRoom: 'Gryffindor Tower (7th Floor)',
    headOfHouse: 'Prof. Minerva McGonagall',
    description: 'Founded by the bravest of the four, Gryffindor prizes daring, nerve, and chivalry. Its witches and wizards champion honor and justice, boldly stepping forward when courage is called upon.',
  },
  slytherin: {
    founder: 'Salazar Slytherin',
    element: 'Water 💧',
    ghost: 'The Bloody Baron',
    commonRoom: 'Slytherin Dungeon (Beneath the Black Lake)',
    headOfHouse: 'Prof. Severus Snape',
    description: 'Slytherin values ambition, resourcefulness, cunning, and determination. Its members achieve greatness through calculating intellect, unyielding willpower, and steadfast loyalty to their house.',
  },
  ravenclaw: {
    founder: 'Rowena Ravenclaw',
    element: 'Air 💨',
    ghost: 'The Grey Lady (Helena Ravenclaw)',
    commonRoom: 'Ravenclaw Tower (West Wing)',
    headOfHouse: 'Prof. Filius Flitwick',
    description: 'Home of the intellectually sharp and endlessly curious, Ravenclaw prizes wit, wisdom, learning, and artistic originality. Here, intellect is celebrated above all earthly treasures.',
  },
  hufflepuff: {
    founder: 'Helga Hufflepuff',
    element: 'Earth 🌿',
    ghost: 'The Fat Friar',
    commonRoom: 'Basement Corridor (Near the Kitchens)',
    headOfHouse: 'Prof. Pomona Sprout',
    description: 'The most steadfast and inclusive of the houses, Hufflepuff champions dedication, hard work, patience, and fierce fair play. Its students are dependable allies whose quiet strength endures.',
  },
}

interface HouseCardPageProps {
  houseId: HouseId
  onBack: () => void
}

export function HouseCardPage({ houseId, onBack }: HouseCardPageProps) {
  const [selectedHouseId, setSelectedHouseId] = useState<HouseId>(houseId)
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all')
  const [selectedTrack, setSelectedTrack] = useState<EventTrack | 'all'>('all')
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set())

  // Card 3D tilt state
  const cardRef = useRef<HTMLDivElement>(null)
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, glareX: 50, glareY: 50 })

  // Keep local state in sync if prop changes
  useEffect(() => {
    setSelectedHouseId(houseId)
  }, [houseId])

  // Scroll to top when switching houses
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [selectedHouseId])

  // Handle card 3D mouse move
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = cardRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const px = (x / rect.width) * 2 - 1
    const py = (y / rect.height) * 2 - 1
    setTilt({
      rx: -py * 12,
      ry: px * 12,
      glareX: (x / rect.width) * 100,
      glareY: (y / rect.height) * 100,
    })
  }

  const handleCardMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, glareX: 50, glareY: 50 })
  }

  const house = HOUSE_BY_ID[selectedHouseId]
  const lore = HOUSE_LORE[selectedHouseId]

  const houseStanding = useMemo(() => {
    const standing = STANDINGS.find((s) => s.house === selectedHouseId)
    const rank = STANDINGS.slice().sort((a, b) => b.points - a.points).findIndex((s) => s.house === selectedHouseId) + 1
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'
    return {
      points: standing?.points ?? 0,
      rank: `${rank}${suffix} Place`,
    }
  }, [selectedHouseId])

  const filteredEvents = useMemo(() => {
    return EVENTS.filter((e) => {
      const matchDay = selectedDay === 'all' || e.day === selectedDay
      const matchTrack = selectedTrack === 'all' || e.track === selectedTrack
      return matchDay && matchTrack
    })
  }, [selectedDay, selectedTrack])

  const toggleRegister = (eventId: string) => {
    setRegisteredEvents((prev) => {
      const next = new Set(prev)
      if (next.has(eventId)) {
        next.delete(eventId)
      } else {
        next.add(eventId)
      }
      return next
    })
  }

  const navigateHouse = (id: HouseId) => {
    setSelectedHouseId(id)
    window.location.hash = `#/house/${id}`
  }

  return (
    <div className="min-h-screen bg-[#07050e] text-stone-100 selection:bg-amber-400 selection:text-black">
      {/* Dynamic ambient house glow in top background */}
      <div
        className="pointer-events-none fixed -top-48 left-1/2 -translate-x-1/2 w-[900px] h-[600px] rounded-full blur-[180px] opacity-25 transition-colors duration-1000 z-0"
        style={{ backgroundColor: house.glow }}
      />

      {/* ── Fixed Top Navigation with Burger Menu ────────────────────────── */}
      <Header
        currentView="house"
        leftSlot={
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-sm bg-gradient-to-b from-[#2c170b] via-[#1d1007] to-[#130903] border border-[#a87d3b] hover:border-[#ffd700] text-[#e8d2a6] hover:text-[#ffd700] transition-all duration-300 shadow-[0_4px_12px_rgba(0,0,0,0.8)] cursor-pointer shrink-0"
          >
            <span className="text-[#ffd700] text-xs sm:text-sm group-hover:-translate-x-1 transition-transform">⚡</span>
            <span className="font-cinzel text-[10px] sm:text-xs tracking-[0.15em] sm:tracking-[0.2em] uppercase font-bold">
              <span className="hidden sm:inline">Return to </span>Hall
            </span>
          </button>
        }
        centerSlot={
          <div className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-0.5 max-w-full">
            {HOUSES.map((h) => {
              const active = h.id === selectedHouseId
              return (
                <button
                  key={h.id}
                  onClick={() => navigateHouse(h.id)}
                  className={`flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1 rounded-full font-cinzel text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                    active
                      ? 'text-stone-900 font-bold shadow-lg scale-105'
                      : 'text-stone-400 hover:text-stone-200 bg-white/5 hover:bg-white/10'
                  }`}
                  style={{
                    backgroundColor: active ? h.accent : undefined,
                    boxShadow: active ? `0 0 12px ${h.color}80` : undefined,
                  }}
                >
                  <span>{h.crest}</span>
                  <span className="hidden sm:inline">{h.name}</span>
                </button>
              )
            })}
          </div>
        }
        showDesktopNav={false}
      />

      {/* ── Main Content Area ────────────────────────────────────────────── */}
      <main className="relative z-10 pt-20 px-4 sm:px-8 pb-16 max-w-7xl mx-auto">
        {/* ════════════════════════════════════════════════════════════════
            HERO: THE CARD SPOTLIGHT & HOUSE OVERVIEW
        ════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center py-8 md:py-12 border-b border-white/10">
          {/* LEFT: 3D Holographic Interactive Collector Card */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center">
            <div
              ref={cardRef}
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              className="relative w-full max-w-xs sm:max-w-sm aspect-[2/3] rounded-3xl border-2 transition-transform duration-200 ease-out cursor-pointer shadow-2xl group overflow-hidden select-none"
              style={{
                borderColor: house.accent,
                boxShadow: `0 0 40px ${house.color}60, 0 20px 40px rgba(0,0,0,0.9)`,
                transform: `perspective(1000px) rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) scale3d(1.02, 1.02, 1.02)`,
              }}
            >
              {/* Card Image */}
              <img
                src={house.image}
                alt={house.name}
                loading="lazy"
                decoding="async"
                className="w-full h-full object-cover pointer-events-none group-hover:scale-105 transition-transform duration-700"
              />

              {/* Holographic light sheen glare on hover */}
              <div
                className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-40 transition-opacity duration-300"
                style={{
                  background: `radial-gradient(circle at ${tilt.glareX}% ${tilt.glareY}%, rgba(255,255,255,0.8) 0%, transparent 60%)`,
                }}
              />

              {/* Gold border inner filigree */}
              <div
                className="pointer-events-none absolute inset-2 rounded-2xl border border-white/30"
                aria-hidden="true"
              />

              {/* Bottom Card Title Banner */}
              <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col items-center text-center">
                <span className="text-2xl mb-1">{house.crest}</span>
                <span
                  className="font-harry text-2xl sm:text-3xl tracking-widest uppercase drop-shadow-md"
                  style={{ color: house.accent }}
                >
                  {house.name}
                </span>
                <span className="font-serif italic text-xs text-stone-300">
                  "{house.motto}"
                </span>
              </div>
            </div>

            <p className="mt-4 font-cinzel text-[11px] text-stone-400 tracking-widest uppercase flex items-center gap-1.5">
              <span>✦</span> Interactive Collector Card · Move cursor to tilt
            </p>
          </div>

          {/* RIGHT: House Details & Lore */}
          <div className="lg:col-span-7 flex flex-col justify-center">
            {/* Crest & House Cup Badge */}
            <div className="flex flex-wrap items-center gap-3 mb-3">
              <span className="text-3xl">{house.crest}</span>
              <div className="inline-flex items-center gap-2.5 px-4 py-1 rounded-full border border-white/15 bg-black/50 text-xs sm:text-sm text-amber-200">
                <span className="font-bold text-amber-300">{houseStanding.points} House Points</span>
                <span className="text-white/30">•</span>
                <span className="text-stone-300">{houseStanding.rank}</span>
              </div>
            </div>

            {/* Monumental Title */}
            <h1
              className="font-harry text-5xl sm:text-7xl md:text-8xl tracking-wider mb-2"
              style={{
                color: house.accent,
                textShadow: `0 0 35px ${house.color}90`,
              }}
            >
              House of {house.name}
            </h1>

            {/* Traits */}
            <div className="flex flex-wrap gap-2 mb-4">
              {house.traits.map((trait) => (
                <span
                  key={trait}
                  className="px-3 py-1 rounded-lg text-xs font-cinzel font-bold uppercase tracking-wider border"
                  style={{
                    borderColor: `${house.accent}60`,
                    backgroundColor: `${house.color}25`,
                    color: house.accent,
                  }}
                >
                  ✦ {trait}
                </span>
              ))}
            </div>

            {/* Motto */}
            <blockquote className="font-serif italic text-base sm:text-lg text-stone-300 mb-6 border-l-2 pl-4" style={{ borderColor: house.accent }}>
              "{house.motto}"
            </blockquote>

            {/* House Lore Description */}
            <p className="text-sm sm:text-base text-stone-300/90 leading-relaxed font-sans mb-6">
              {lore.description}
            </p>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-2xl bg-black/40 border border-white/10 backdrop-blur-md">
              <div>
                <span className="font-cinzel text-[10px] text-amber-300 uppercase tracking-widest block mb-0.5">Founder</span>
                <span className="text-xs sm:text-sm font-semibold text-stone-200">{lore.founder}</span>
              </div>
              <div>
                <span className="font-cinzel text-[10px] text-amber-300 uppercase tracking-widest block mb-0.5">Element</span>
                <span className="text-xs sm:text-sm font-semibold text-stone-200">{lore.element}</span>
              </div>
              <div>
                <span className="font-cinzel text-[10px] text-amber-300 uppercase tracking-widest block mb-0.5">House Ghost</span>
                <span className="text-xs sm:text-sm font-semibold text-stone-200">{lore.ghost}</span>
              </div>
              <div>
                <span className="font-cinzel text-[10px] text-amber-300 uppercase tracking-widest block mb-0.5">Common Room</span>
                <span className="text-xs sm:text-sm font-semibold text-stone-200">{lore.commonRoom}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2: EVENTS & FESTIVAL PROGRAMME
        ════════════════════════════════════════════════════════════════ */}
        <div className="pt-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
            <div>
              <span className="font-cinzel text-xs uppercase tracking-[0.25em] text-amber-300/80 block mb-1">
                Festival Programme
              </span>
              <h2 className="font-harry text-4xl sm:text-5xl text-[#ffd700] tracking-wider">
                {house.name} Schedule & Events
              </h2>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Day Filter */}
              <div className="flex items-center gap-1 bg-black/50 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSelectedDay('all')}
                  className={`px-3 py-1 rounded-lg font-cinzel text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                    selectedDay === 'all'
                      ? 'bg-amber-400 text-stone-950 font-bold'
                      : 'text-stone-400 hover:text-white'
                  }`}
                >
                  All Days
                </button>
                {DAYS.map((d) => (
                  <button
                    key={d.day}
                    onClick={() => setSelectedDay(d.day)}
                    className={`px-3 py-1 rounded-lg font-cinzel text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                      selectedDay === d.day
                        ? 'bg-amber-400 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Track Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap mb-8">
            <button
              onClick={() => setSelectedTrack('all')}
              className={`px-3 py-1 rounded-lg text-xs font-cinzel tracking-wider uppercase transition-colors cursor-pointer ${
                selectedTrack === 'all'
                  ? 'border border-amber-400/80 text-amber-200 bg-amber-950/40'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              All Categories
            </button>
            {(Object.keys(TRACK_META) as EventTrack[]).map((t) => {
              const meta = TRACK_META[t]
              const active = selectedTrack === t
              return (
                <button
                  key={t}
                  onClick={() => setSelectedTrack(t)}
                  className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-cinzel tracking-wider uppercase transition-colors cursor-pointer ${
                    active
                      ? 'border border-amber-400/80 text-amber-200 bg-amber-950/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  <span>{meta.icon}</span>
                  <span>{meta.label}</span>
                </button>
              )
            })}
          </div>

          {/* ── Events Grid ─────────────────────────────────────────────── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredEvents.map((event) => {
              const meta = TRACK_META[event.track]
              const dayObj = DAYS.find((d) => d.day === event.day)
              const isRegistered = registeredEvents.has(event.id)

              return (
                <motion.div
                  key={event.id}
                  layout
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 bg-black/40 hover:bg-black/60 shadow-xl backdrop-blur-md"
                  style={{
                    borderColor: `${house.accent}40`,
                    boxShadow: isRegistered ? `0 0 25px ${house.color}40` : undefined,
                  }}
                >
                  <div>
                    {/* Header: Track & Timing */}
                    <div className="flex items-center justify-between gap-2 mb-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="px-2.5 py-0.5 rounded-full font-cinzel text-[10px] tracking-wider uppercase font-bold text-white shadow-sm"
                          style={{ backgroundColor: meta.color }}
                        >
                          {meta.icon} {meta.label}
                        </span>
                        <span className="text-stone-400 font-cinzel text-[11px]">
                          {dayObj?.label} · {event.start}–{event.end}
                        </span>
                      </div>

                      {event.points > 0 && (
                        <span className="font-cinzel text-[11px] text-amber-300 font-bold tracking-wider">
                          +{event.points} Pts
                        </span>
                      )}
                    </div>

                    {/* Title & Venue */}
                    <h3 className="font-harry text-xl sm:text-2xl text-[#ffd700] tracking-wide mb-1">
                      {event.title}
                    </h3>
                    <p className="font-cinzel text-xs text-amber-300/80 uppercase tracking-widest mb-3">
                      📍 {event.venue}
                    </p>

                    {/* Blurb */}
                    <p className="text-xs sm:text-sm text-stone-300 leading-relaxed font-serif italic mb-4">
                      "{event.blurb}"
                    </p>
                  </div>

                  {/* Action Button */}
                  <div className="flex items-center justify-between pt-3 border-t border-white/10 mt-auto">
                    <span className="text-[11px] font-cinzel text-stone-400">
                      {isRegistered ? '✓ Spot Reserved' : 'Open Entry'}
                    </span>
                    <button
                      onClick={() => toggleRegister(event.id)}
                      className={`px-4 py-1.5 rounded-full font-cinzel text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                        isRegistered
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-[0_0_15px_rgba(251,191,36,0.5)]'
                          : 'border border-amber-500/50 text-amber-200 hover:bg-amber-500 hover:text-stone-900 bg-amber-950/20'
                      }`}
                    >
                      {isRegistered ? 'Registered ✨' : 'Attend Event'}
                    </button>
                  </div>
                </motion.div>
              )
            })}
          </div>
        </div>

        {/* ── Bottom Navigation to Other Houses & Hall ──────────────────── */}
        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 font-cinzel text-xs uppercase tracking-widest text-stone-300 hover:text-amber-300 transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-2.5 rounded-full backdrop-blur-md cursor-pointer"
          >
            ← Return to Great Hall
          </button>

          <div className="flex items-center gap-2">
            <span className="font-cinzel text-xs text-stone-400 uppercase tracking-wider mr-2">
              Browse Other Houses:
            </span>
            {HOUSES.filter((h) => h.id !== selectedHouseId).map((h) => (
              <button
                key={h.id}
                onClick={() => navigateHouse(h.id)}
                className="font-cinzel text-xs uppercase tracking-wider px-3 py-1 rounded-full border border-white/10 hover:border-amber-400 bg-black/40 text-stone-300 hover:text-white transition-all cursor-pointer"
              >
                {h.crest} {h.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}

