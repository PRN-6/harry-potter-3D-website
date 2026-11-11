import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MapPin } from 'lucide-react'
import { HOUSES, HOUSE_BY_ID, type HouseId } from '../data/houses'
import { EVENTS, DAYS, STANDINGS, TRACK_META, type EventTrack } from '../data/events'

interface HouseEventsOverlayProps {
  initialHouseId: HouseId | null
  isOpen: boolean
  onClose: () => void
}

export function HouseEventsOverlay({ initialHouseId, isOpen, onClose }: HouseEventsOverlayProps) {
  const [selectedHouseId, setSelectedHouseId] = useState<HouseId>(initialHouseId ?? 'gryffindor')
  const [selectedDay, setSelectedDay] = useState<number | 'all'>('all')
  const [selectedTrack, setSelectedTrack] = useState<EventTrack | 'all'>('all')
  const [registeredEvents, setRegisteredEvents] = useState<Set<string>>(new Set())

  // Sync initial house when opened
  useEffect(() => {
    if (initialHouseId) {
      setSelectedHouseId(initialHouseId)
    }
  }, [initialHouseId])

  // Close on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isOpen, onClose])

  const house = HOUSE_BY_ID[selectedHouseId]

  const houseStanding = useMemo(() => {
    const standing = STANDINGS.find((s) => s.house === selectedHouseId)
    const rank = STANDINGS.slice().sort((a, b) => b.points - a.points).findIndex((s) => s.house === selectedHouseId) + 1
    const suffix = rank === 1 ? 'st' : rank === 2 ? 'nd' : rank === 3 ? 'rd' : 'th'
    return {
      points: standing?.points ?? 0,
      rank: `${rank}${suffix} Place`,
    }
  }, [selectedHouseId])

  // Filter events by day and track
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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          key="house-events-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          className="fixed inset-0 z-[250] flex flex-col bg-[#0a0714]/95 backdrop-blur-xl overflow-hidden select-none"
        >
          {/* Ambient house color glow background */}
          <div
            className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full blur-[140px] opacity-25 transition-colors duration-700"
            style={{ backgroundColor: house.glow }}
          />

          {/* ── Top Bar ──────────────────────────────────────────────────────── */}
          <div className="relative z-10 flex items-center justify-between px-4 sm:px-8 py-4 border-b border-white/10 bg-black/40">
            <button
              onClick={onClose}
              className="flex items-center gap-2 font-cinzel text-xs uppercase tracking-widest text-stone-300 hover:text-amber-300 transition-colors bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-1.5 rounded-full backdrop-blur-md cursor-pointer"
            >
              ← Back to Hall
            </button>

            {/* House Switcher Tabs */}
            <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto py-1">
              {HOUSES.map((h) => {
                const active = h.id === selectedHouseId
                return (
                  <button
                    key={h.id}
                    onClick={() => setSelectedHouseId(h.id)}
                    className={`flex items-center gap-1.5 px-3 py-1 sm:px-4 sm:py-1.5 rounded-full font-cinzel text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer ${
                      active
                        ? 'text-stone-900 font-bold shadow-lg scale-105'
                        : 'text-stone-400 hover:text-stone-200 bg-white/5 hover:bg-white/10'
                    }`}
                    style={{
                      backgroundColor: active ? h.accent : undefined,
                      boxShadow: active ? `0 0 15px ${h.color}80` : undefined,
                    }}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: h.color }} />
                    <span className="hidden sm:inline">{h.name}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Scrollable Content Area ───────────────────────────────────────── */}
          <div className="relative z-10 flex-1 overflow-y-auto px-4 sm:px-8 py-6 max-w-6xl mx-auto w-full">
            {/* House Hero Header */}
            <motion.div
              key={house.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-center mb-8"
            >
              <div
                className="w-10 h-10 rounded-full mx-auto mb-2 border border-amber-400/50 flex items-center justify-center font-cinzel font-bold text-sm text-white shadow-md"
                style={{ backgroundColor: house.color }}
              >
                {house.name[0]}
              </div>
              <h1
                className="font-cinzel text-3xl sm:text-5xl font-bold tracking-wider mb-2"
                style={{
                  color: house.accent,
                  textShadow: `0 0 30px ${house.color}90`,
                }}
              >
                {house.name} Programme & Events
              </h1>
              <p className="font-cinzel text-xs sm:text-sm text-stone-300 tracking-[0.2em] uppercase mb-1">
                {house.traits.join(' · ')}
              </p>
              <p className="italic text-xs sm:text-sm text-stone-400 mb-4 font-serif">
                "{house.motto}"
              </p>

              {/* Standings Badge */}
              <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full border border-white/15 bg-black/50 text-xs sm:text-sm text-amber-200">
                <span className="font-bold text-amber-300">{houseStanding.points} House Points</span>
                <span className="text-white/30">•</span>
                <span className="text-stone-300">{houseStanding.rank}</span>
              </div>
            </motion.div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 pb-4 border-b border-white/10">
              {/* Day Filter */}
              <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10">
                <button
                  onClick={() => setSelectedDay('all')}
                  className={`px-3 py-1 rounded-lg font-cinzel text-xs tracking-wider uppercase transition-colors cursor-pointer ${
                    selectedDay === 'all'
                      ? 'bg-amber-500 text-stone-950 font-bold'
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
                        ? 'bg-amber-500 text-stone-950 font-bold'
                        : 'text-stone-400 hover:text-white'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              {/* Track Filter */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button
                  onClick={() => setSelectedTrack('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-cinzel tracking-wider uppercase transition-colors cursor-pointer ${
                    selectedTrack === 'all'
                      ? 'border border-amber-400/80 text-amber-200 bg-amber-950/40'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  All Tracks
                </button>
                {(Object.keys(TRACK_META) as EventTrack[]).map((t) => {
                  const meta = TRACK_META[t]
                  const active = selectedTrack === t
                  return (
                    <button
                      key={t}
                      onClick={() => setSelectedTrack(t)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-cinzel tracking-wider uppercase transition-colors cursor-pointer ${
                        active
                          ? 'border border-amber-400/80 text-amber-200 bg-amber-950/40'
                          : 'text-stone-400 hover:text-stone-200'
                      }`}
                    >
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
                      <span className="hidden sm:inline">{meta.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* ── Events Grid ─────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-12">
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
                    className="relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 bg-black/40 hover:bg-black/60 shadow-lg backdrop-blur-sm"
                    style={{
                      borderColor: `${house.accent}40`,
                      boxShadow: isRegistered ? `0 0 20px ${house.color}40` : undefined,
                    }}
                  >
                    <div>
                      {/* Header: Track & Timing */}
                      <div className="flex items-center justify-between gap-2 mb-2 text-xs">
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
                      <h3 className="font-cinzel text-lg sm:text-xl font-bold text-stone-100 mb-1">
                        {event.title}
                      </h3>
                      <p className="font-cinzel text-xs text-amber-300/80 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-amber-400" />
                        <span>{event.venue}</span>
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
                        {isRegistered ? 'Registered' : 'Attend Event'}
                      </button>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
