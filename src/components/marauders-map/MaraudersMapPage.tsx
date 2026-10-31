import React, { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { buildMapLocations } from '../../data/mapLocations'
import type { FestEvent } from '../../data/events'
import { TRACK_META } from '../../data/events'

const LOCATIONS = buildMapLocations()

export function MaraudersMapPage() {
  const [entered, setEntered] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showFootprints, setShowFootprints] = useState(true)
  const [showLabels, setShowLabels] = useState(true)
  const [query, setQuery] = useState('')
  const [detailEvent, setDetailEvent] = useState<FestEvent | null>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const drag = useRef<{ x: number; y: number; px: number; py: number } | null>(null)

  const locations = LOCATIONS
  const selected = locations.find((l) => l.id === selectedId) ?? null

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return null
    return locations.flatMap((l) =>
      l.events
        .filter((e) => e.title.toLowerCase().includes(q))
        .map((e) => ({ loc: l, event: e })),
    )
  }, [query])

  const searchResults = filtered ?? []

  useEffect(() => {
    if (!filtered || filtered.length === 0) return
    setSelectedId(filtered[0].loc.id)
    setZoom(1.6)
    setPan({ x: 0, y: 0 })
  }, [query])

  const clampZoom = (z: number) => Math.min(2.5, Math.max(0.7, z))

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    setZoom((z) => clampZoom(z + (e.deltaY < 0 ? 0.15 : -0.15)))
  }
  const onPointerDown = (e: React.PointerEvent) => {
    ;(e.target as Element).setPointerCapture?.(e.pointerId)
    drag.current = { x: e.clientX, y: e.clientY, px: pan.x, py: pan.y }
  }
  const onPointerMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    setPan({ x: drag.current.px + (e.clientX - drag.current.x), y: drag.current.py + (e.clientY - drag.current.y) })
  }
  const onPointerUp = () => {
    drag.current = null
  }

  if (!entered) {
    return (
      <div className="fixed inset-0 bg-[#24180F] flex flex-col items-center justify-center text-center p-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="max-w-xl">
          <p className="text-[#D6BE91] font-serif italic text-2xl mb-8">“I solemnly swear that I am up to no good.”</p>
          <button
            onClick={() => setEntered(true)}
            className="px-8 py-3 rounded border border-[#C9A44C] bg-[#33251C] text-[#E5C78C] font-cinzel tracking-widest hover:bg-[#C9A44C] hover:text-[#24180F] transition-colors"
          >
            REVEAL THE MAP
          </button>
          <button onClick={() => setEntered(true)} className="block mt-4 text-xs text-[#A98A60] underline">
            Skip
          </button>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#24180F] text-[#33251C] font-serif overflow-hidden">
      {/* Navigation */}
      <header className="fixed top-0 left-0 w-full z-50 p-4 flex items-center justify-between pointer-events-none">
        <div className="font-cinzel text-[#E5C78C] text-lg pointer-events-auto">✦ Marauder's Map <span className="text-xs opacity-70">2026</span></div>
        <nav className="hidden md:flex gap-6 pointer-events-auto">
          {['MAP', 'EVENTS', 'ABOUT', 'TEAM', 'REGISTER NOW'].map((n) => (
            <a key={n} href="#" className="font-cinzel text-xs tracking-widest text-[#D6BE91] hover:text-[#C9A44C] transition-colors">
              {n}
            </a>
          ))}
        </nav>
      </header>

      <main className="pt-16 px-3 sm:px-6 pb-6 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-4 min-h-screen">
        {/* Map */}
        <div
          className="relative rounded-xl overflow-hidden border border-[#68462D]/60 bg-[#A98A60]/30 touch-none"
          style={{ minHeight: 420 }}
          onWheel={onWheel}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
        >
          <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 30% 30%, #D6BE91 0%, transparent 60%)' }} />
          <div
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
              transformOrigin: 'center center',
              transition: drag.current ? 'none' : 'transform 120ms ease-out',
            }}
            className="w-full h-full"
          >
            <svg viewBox="0 0 100 100" className="w-full h-full">
              {/* Parchment-ish paths */}
              <g stroke="#33251C" strokeWidth="0.4" fill="none" opacity="0.7">
                <path d="M10 90 Q 30 70, 50 80 T 90 70" />
                <path d="M20 20 Q 40 35, 50 42 T 80 30" />
                <path d="M18 72 Q 30 60, 46 74" />
                <path d="M50 42 Q 60 50, 54 52" />
              </g>
              {/* Castle blocks */}
              <g opacity="0.18" fill="#33251C">
                <rect x="42" y="36" width="16" height="12" rx="1" />
                <rect x="24" y="18" width="12" height="8" rx="1" />
              </g>

              {locations.map((loc) => {
                const isActive = selectedId === loc.id
                const isMatched = searchResults.some((r) => r.loc.id === loc.id)
                return (
                  <g key={loc.id} transform={`translate(${loc.mapPosition.x}, ${loc.mapPosition.y})`}>
                    <circle
                      r={isActive ? 3.2 : 2.2}
                      fill={isMatched ? '#C9A44C' : '#33251C'}
                      stroke="#E5C78C"
                      strokeWidth="0.4"
                      onClick={() => setSelectedId(loc.id)}
                      className="cursor-pointer"
                    />
                    {showLabels && (
                      <text x="0" y="-4" textAnchor="middle" fontSize="2.6" fill="#33251C" className="pointer-events-none select-none">
                        {loc.name}
                      </text>
                    )}
                  </g>
                )
              })}
            </svg>
            {showFootprints && <Footprints />}
          </div>

          {/* Controls */}
          <div className="absolute bottom-3 right-3 flex flex-col gap-2 pointer-events-auto">
            <button onClick={() => setZoom((z) => clampZoom(z + 0.15))} className="w-9 h-9 rounded bg-[#33251C]/80 text-[#E5C78C] border border-[#C9A44C]/40">+</button>
            <button onClick={() => setZoom((z) => clampZoom(z - 0.15))} className="w-9 h-9 rounded bg-[#33251C]/80 text-[#E5C78C] border border-[#C9A44C]/40">−</button>
            <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} className="w-9 h-9 rounded bg-[#33251C]/80 text-[#E5C78C] border border-[#C9A44C]/40 text-xs">⟳</button>
          </div>
        </div>

        {/* Side panel */}
        <aside className="rounded-xl border border-[#68462D]/60 bg-[#D6BE91]/90 p-4 overflow-y-auto max-h-[70vh] lg:max-h-none">
          <h2 className="font-cinzel text-xl text-[#33251C] mb-2">{selected ? selected.name : 'Explore the Map'}</h2>
          {selected && <p className="text-sm mb-3 opacity-80">{selected.description}</p>}
          {!selected && <p className="text-sm opacity-70 mb-3">Select a location to reveal its events.</p>}

          {/* Search */}
          <div className="mb-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search events..."
              className="w-full px-3 py-2 rounded border border-[#68462D]/60 bg-[#F4E8C1] text-[#33251C] placeholder:text-[#68462D]/60"
            />
            {searchResults.length > 0 && (
              <ul className="mt-2 text-sm space-y-1">
                {searchResults.map((r) => (
                  <li key={r.event.id}>
                    <button onClick={() => { setSelectedId(r.loc.id); setDetailEvent(r.event) }} className="text-left underline text-[#68462D] hover:text-[#33251C]">
                      {r.event.title} — {r.loc.name}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Toggles */}
          <div className="flex gap-3 text-xs mb-3">
            <button onClick={() => setShowFootprints((v) => !v)} className="underline">{showFootprints ? 'Hide' : 'Show'} footprints</button>
            <button onClick={() => setShowLabels((v) => !v)} className="underline">{showLabels ? 'Hide' : 'Show'} labels</button>
          </div>

          {/* Events */}
          <div className="space-y-3">
            {(selected ? selected.events : locations.flatMap((l) => l.events)).map((ev) => (
              <EventCard key={ev.id} event={ev} onView={() => setDetailEvent(ev)} />
            ))}
          </div>
        </aside>
      </main>

      <AnimatePresence>
        {detailEvent && <EventDetailsModal event={detailEvent} onClose={() => setDetailEvent(null)} />}
      </AnimatePresence>
    </div>
  )
}

function EventCard({ event, onView }: { event: FestEvent; onView: () => void }) {
  const meta = TRACK_META[event.track]
  return (
    <div className="rounded-lg border border-[#68462D]/40 bg-[#F4E8C1] p-3 shadow-sm">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-sm">{meta.icon}</span>
        <h3 className="font-cinzel text-sm text-[#33251C] font-semibold">{event.title}</h3>
      </div>
      <p className="text-xs opacity-80 mb-2">{event.blurb}</p>
      <div className="text-xs opacity-70 mb-2">
        {event.start}–{event.end} · {event.venue} · Day {event.day}
      </div>
      <button onClick={onView} className="text-xs underline text-[#68462D] hover:text-[#33251C]">
        View details
      </button>
    </div>
  )
}

function EventDetailsModal({ event, onClose }: { event: FestEvent; onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-xl bg-[#D6BE91] border border-[#68462D] p-5 text-[#33251C]"
      >
        <h3 className="font-cinzel text-xl mb-2">{event.title}</h3>
        <p className="text-sm mb-3">{event.blurb}</p>
        <div className="text-sm space-y-1">
          <div><strong>Category:</strong> {TRACK_META[event.track].label}</div>
          <div><strong>Date:</strong> Day {event.day}</div>
          <div><strong>Time:</strong> {event.start}–{event.end}</div>
          <div><strong>Venue:</strong> {event.venue}</div>
          <div><strong>Points:</strong> {event.points}</div>
        </div>
        <div className="mt-4 flex gap-3">
          <button className="px-4 py-2 rounded bg-[#33251C] text-[#E5C78C] text-sm">Register Now</button>
          <button onClick={onClose} className="px-4 py-2 rounded border border-[#68462D] text-sm">Close</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

function Footprints() {
  const paths = ['M20 70 Q 32 60, 46 74', 'M50 42 Q 60 50, 54 52', 'M20 20 Q 40 35, 50 42']
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full pointer-events-none">
      {paths.map((p, i) => (
        <g key={i} opacity="0.35">
          <circle r="0.6" fill="#33251C">
            <animateMotion dur={`${4 + i}s`} repeatCount="indefinite" path={p} />
          </circle>
        </g>
      ))}
    </svg>
  )
}