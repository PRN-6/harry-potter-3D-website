import { useState, useMemo, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from '../Header'
import { MAP_LOCATIONS, FEST_SCHEDULE, type MapLocation } from '../../data/eventMapData'

export function MaraudersMapPage() {
  const [activeTab, setActiveTab] = useState<'map' | 'schedule' | 'locations'>('map')
  const [selectedLocationId, setSelectedLocationId] = useState<string>('main-auditorium')
  const [activeDay, setActiveDay] = useState<1 | 2>(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [showLocationDrawer, setShowLocationDrawer] = useState(false)

  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null)
  const mapContainerRef = useRef<HTMLDivElement>(null)

  const selectedLocation = useMemo<MapLocation>(
    () => MAP_LOCATIONS.find((loc) => loc.id === selectedLocationId) ?? MAP_LOCATIONS[0],
    [selectedLocationId],
  )

  // Filtered locations and events based on search query
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return null

    const matchedLocations = MAP_LOCATIONS.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.subtitle.toLowerCase().includes(q) ||
        loc.description.toLowerCase().includes(q),
    )

    const matchedEvents = FEST_SCHEDULE.flatMap((day) =>
      day.events.filter(
        (ev) =>
          ev.title.toLowerCase().includes(q) ||
          ev.locationName.toLowerCase().includes(q) ||
          ev.category.toLowerCase().includes(q) ||
          ev.blurb.toLowerCase().includes(q),
      ).map((ev) => ({ ...ev, dayNumber: day.dayNumber })),
    )

    return { locations: matchedLocations, events: matchedEvents }
  }, [searchQuery])

  // Center map around a target location
  const focusLocation = (locId: string) => {
    setSelectedLocationId(locId)
    setShowLocationDrawer(true)
    const loc = MAP_LOCATIONS.find((l) => l.id === locId)
    if (!loc) return

    if (mapContainerRef.current) {
      const containerWidth = mapContainerRef.current.clientWidth
      const containerHeight = mapContainerRef.current.clientHeight
      const offsetX = (50 - loc.x) * (containerWidth / 100) * 0.85
      const offsetY = (50 - loc.y) * (containerHeight / 100) * 0.85
      setZoom(1.5)
      setPan({ x: offsetX, y: offsetY })
    }
  }

  // Zoom helpers
  const clampZoom = (z: number) => Math.min(2.8, Math.max(0.85, z))

  const handleZoomIn = () => setZoom((z) => clampZoom(z + 0.25))
  const handleZoomOut = () => setZoom((z) => clampZoom(z - 0.25))
  const handleResetView = () => {
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

  // Pointer drag for panning with touch support
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return
    setIsDragging(true)
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    }
    try {
      ;(e.target as HTMLElement).setPointerCapture?.(e.pointerId)
    } catch {
      // Ignore
    }
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (!isDragging || !dragStartRef.current) return
    const dx = e.clientX - dragStartRef.current.x
    const dy = e.clientY - dragStartRef.current.y
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    })
  }

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDragging(false)
    dragStartRef.current = null
    try {
      ;(e.target as HTMLElement).releasePointerCapture?.(e.pointerId)
    } catch {
      // Ignore
    }
  }

  // Mouse wheel zoom
  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY < 0 ? 0.15 : -0.15
    setZoom((z) => clampZoom(z + delta))
  }

  return (
    <div className="min-h-screen bg-[#0e0703] text-[#f2e2c4] font-serif selection:bg-[#c9a44c] selection:text-[#1c1107] overflow-x-hidden flex flex-col">
      {/* ── Top Atmospheric Navigation Bar with Burger Menu ─────────────── */}
      <Header
        currentView="map"
        leftSlot={
          <button
            onClick={() => {
              window.location.hash = '#/'
            }}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400/50 text-amber-200 hover:text-amber-100 transition-all duration-300 shadow-[0_0_12px_rgba(0,0,0,0.5)] cursor-pointer shrink-0 backdrop-blur-md"
          >
            <span className="text-amber-400 text-xs sm:text-sm group-hover:-translate-x-1 transition-transform">←</span>
            <span className="font-cinzel text-[10px] sm:text-xs tracking-[0.18em] uppercase font-bold">
              <span className="hidden sm:inline">Return to </span>Hall
            </span>
          </button>
        }
        centerSlot={
          <div className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10">
            <span className="text-amber-400 text-xs select-none animate-pulse">✦</span>
            <h1 className="font-cinzel font-bold text-xs sm:text-base md:text-lg tracking-[0.2em] text-amber-200 uppercase truncate drop-shadow-md">
              AJ-ASTRIX 2K27 · Event Map
            </h1>
            <span className="text-amber-400 text-xs select-none animate-pulse">✦</span>
          </div>
        }
        showDesktopNav={false}
      />

      {/* ── Mobile View Switcher Tabs (Under Header on Mobile) ─────────── */}
      <div className="lg:hidden fixed top-14 sm:top-16 left-0 w-full z-40 bg-black/60 backdrop-blur-md border-b border-white/10 px-2 py-1.5 flex items-center justify-around shadow-lg">
        <button
          onClick={() => setActiveTab('map')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-cinzel text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'map'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-md border border-amber-300'
              : 'text-amber-200/80 hover:text-amber-200'
          }`}
        >
          <span>🗺️</span>
          <span>Fest Map</span>
        </button>
        <button
          onClick={() => setActiveTab('schedule')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-cinzel text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'schedule'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-md border border-amber-300'
              : 'text-amber-200/80 hover:text-amber-200'
          }`}
        >
          <span>📜</span>
          <span>Schedule Scroll</span>
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-cinzel text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
            activeTab === 'locations'
              ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-md border border-amber-300'
              : 'text-amber-200/80 hover:text-amber-200'
          }`}
        >
          <span>📍</span>
          <span>All Venues</span>
        </button>
      </div>

      {/* ── Main Workspace ────────────────────────────────────────────── */}
      <main className="flex-1 pt-24 sm:pt-20 pb-10 px-2 sm:px-6 max-w-[1700px] mx-auto w-full flex flex-col">
        {/* ── 2-Column Responsive Layout: Map + Schedule Scroll ────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 flex-1 items-start">
          {/* ════════════════════════════════════════════════════════════
              LEFT: THE AUTHENTIC MARAUDER'S EVENT MAP STAGE
          ════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-8 flex flex-col gap-4 ${
              activeTab === 'map' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Quick-Jump Venue Chips on Mobile & Tablet */}
            <div className="overflow-x-auto py-1 scrollbar-none flex items-center gap-2 -mx-1 px-1">
              {MAP_LOCATIONS.map((loc) => {
                const isSelected = selectedLocationId === loc.id
                return (
                  <button
                    key={loc.id}
                    onClick={() => {
                      focusLocation(loc.id)
                    }}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-sm border font-cinzel text-[11px] uppercase tracking-wider font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-b from-[#ffd700] to-[#c9a44c] text-[#120802] border-[#ffe082] shadow-[0_0_12px_rgba(255,215,0,0.35)] scale-105'
                        : 'bg-[#1e1107] text-[#e5c78c] border-[#6d4620] hover:border-[#ffd700]'
                    }`}
                  >
                    <span>{loc.icon}</span>
                    <span className="font-cinzel font-bold tracking-wider text-[11px] uppercase">{loc.name}</span>
                  </button>
                )
              })}
            </div>

            {/* Map Frame on Dark Oak Table with Brass Fleurons */}
            <div className="relative rounded-lg overflow-hidden border-2 border-[#7a4e23] bg-[#1a1007] shadow-[0_20px_60px_rgba(0,0,0,0.95)]">
              {/* Brass Corner Fleurons */}
              <div className="absolute top-1.5 left-1.5 text-[#ffd700] text-xs z-30 select-none">⚜</div>
              <div className="absolute top-1.5 right-1.5 text-[#ffd700] text-xs z-30 select-none">⚜</div>
              <div className="absolute bottom-1.5 left-1.5 text-[#ffd700] text-xs z-30 select-none">⚜</div>
              <div className="absolute bottom-1.5 right-1.5 text-[#ffd700] text-xs z-30 select-none">⚜</div>

              {/* Map Interactive Canvas Container */}
              <div
                ref={mapContainerRef}
                onWheel={onWheel}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                style={{ touchAction: 'none' }}
                className="relative h-[48vh] sm:h-[54vh] lg:aspect-[16/10.5] lg:h-auto w-full select-none cursor-grab active:cursor-grabbing overflow-hidden bg-[#d8c097]"
              >
                {/* Transform Wrapper for Pan and Zoom */}
                <div
                  style={{
                    transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                    transformOrigin: 'center center',
                    transition: isDragging ? 'none' : 'transform 200ms cubic-bezier(0.2, 0.8, 0.2, 1)',
                  }}
                  className="relative w-full h-full"
                >
                  {/* The Authentic Hand-Drawn Event Map Artwork */}
                  <img
                    src="/images/event-map.jpg"
                    alt="AJ-ASTRIX2K27 Born From Fire Event Map"
                    className="w-full h-full object-contain pointer-events-none select-none block"
                    loading="lazy"
                    decoding="async"
                  />

                  {/* ── Enchanted Hotspot Beacons Overlaid on Artwork ───────── */}
                  {MAP_LOCATIONS.map((loc) => {
                    const isSelected = selectedLocationId === loc.id
                    return (
                      <div
                        key={loc.id}
                        style={{
                          left: `${loc.x}%`,
                          top: `${loc.y}%`,
                        }}
                        onClick={(e) => {
                          e.stopPropagation()
                          focusLocation(loc.id)
                        }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer z-25 group"
                      >
                        {/* Golden magical pulse aura */}
                        {isSelected && (
                          <div className="absolute -inset-3 rounded-full bg-[#ffd700]/40 animate-ping pointer-events-none" />
                        )}

                        {/* Magical Lumos Spark Beacon */}
                        <div
                          className={`relative flex items-center justify-center rounded-full transition-all duration-300 shadow-xl ${
                            isSelected
                              ? 'w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-[#ffd700] via-[#c9a44c] to-[#8c6721] border-2 border-white text-black scale-125 shadow-[0_0_20px_#ffd700]'
                              : 'w-5 h-5 sm:w-6 sm:h-6 bg-[#1e1006]/85 border border-[#ffd700] text-[#ffd700] hover:scale-125 hover:bg-[#ffd700] hover:text-[#120802]'
                          }`}
                        >
                          <span className="text-[10px] sm:text-xs">✦</span>
                        </div>

                        {/* Parchment Ribbon Label on Hover or Active */}
                        <div
                          className={`absolute top-full left-1/2 -translate-x-1/2 mt-1 px-2.5 py-0.5 rounded-sm whitespace-nowrap font-cinzel text-[10px] uppercase font-bold tracking-wider transition-all duration-200 pointer-events-none shadow-lg ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#ffd700] to-[#c9a44c] text-[#120802] opacity-100 scale-105 border border-[#8c6738]'
                              : 'bg-[#180e06]/95 text-[#f2e2c4] border border-[#6d4620] opacity-0 group-hover:opacity-100 group-hover:scale-100'
                          }`}
                        >
                          <span>{loc.name}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Floating Map HUD Controls (Zoom In, Zoom Out, Reset) */}
                <div className="absolute bottom-3 right-3 flex items-center gap-1.5 z-30 pointer-events-auto bg-[#180e07]/90 p-1.5 rounded-md border border-[#8c6738] shadow-lg backdrop-blur-sm">
                  <button
                    onClick={handleZoomIn}
                    title="Zoom In"
                    className="w-8 h-8 rounded-sm bg-[#29170c] hover:bg-[#ffd700] text-[#f2e2c4] hover:text-[#120802] font-black text-sm border border-[#6d4620] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    +
                  </button>
                  <button
                    onClick={handleZoomOut}
                    title="Zoom Out"
                    className="w-8 h-8 rounded-sm bg-[#29170c] hover:bg-[#ffd700] text-[#f2e2c4] hover:text-[#120802] font-black text-sm border border-[#6d4620] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    −
                  </button>
                  <button
                    onClick={handleResetView}
                    title="Reset View"
                    className="w-8 h-8 rounded-sm bg-[#29170c] hover:bg-[#ffd700] text-[#f2e2c4] hover:text-[#120802] font-cinzel text-xs border border-[#6d4620] transition-colors cursor-pointer flex items-center justify-center shadow-sm"
                  >
                    ⊙
                  </button>
                </div>

                {/* Map Legend Overlay at Top Left */}
                <div className="absolute top-3 left-3 z-30 pointer-events-none hidden sm:flex items-center gap-2 bg-[#180e07]/90 px-3 py-1.5 rounded-md border border-[#8c6738]/80 text-[#e5c78c] shadow-md backdrop-blur-sm">
                  <span className="text-[#ffd700] text-xs">✦</span>
                  <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#ffd700]">
                    Interactive Fest Map · Tap Any Building
                  </span>
                </div>
              </div>
            </div>

            {/* Selected Location Feature Spotlight Bar */}
            <div className="rounded-md border border-[#7a4e23] bg-gradient-to-b from-[#1c1109] via-[#140b05] to-[#0c0602] p-4 sm:p-5 shadow-xl">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#4a2e14] pb-3 mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl p-2 rounded-md bg-[#2a170b] border border-[#8c6738] shadow-sm">
                    {selectedLocation.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="font-cinzel-decorative font-bold text-xl sm:text-2xl text-[#ffd700] tracking-wider uppercase">
                        {selectedLocation.name}
                      </h2>
                      <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-sm bg-[#2a170b] border border-[#a87d3b] text-[#e5c78c]">
                        {selectedLocation.category}
                      </span>
                    </div>
                    <p className="font-serif italic text-xs text-[#bda075]">
                      {selectedLocation.subtitle}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs font-cinzel">
                  <button
                    onClick={() => focusLocation(selectedLocation.id)}
                    className="px-3.5 py-1.5 rounded-sm bg-gradient-to-b from-[#ffd700] to-[#c9a44c] hover:brightness-110 text-[#120802] font-bold transition-all cursor-pointer shadow-md"
                  >
                    Focus On Map ⊙
                  </button>
                </div>
              </div>

              <p className="font-serif text-xs sm:text-sm text-[#d4be9b] leading-relaxed mb-4">
                {selectedLocation.description}
              </p>

              {/* Day 1 & Day 2 Events Grid for Selected Location */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {/* Day 1 */}
                <div className="rounded-sm bg-[#170e06] border border-[#5c3c1e] p-3">
                  <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#ffd700] block mb-2 border-b border-[#4a2e14] pb-1">
                    Day 1 — The Beginning
                  </span>
                  {selectedLocation.day1Events.length === 0 ? (
                    <p className="text-xs text-[#8c6f4b] italic font-serif">Open venue / general fest activities.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedLocation.day1Events.map((ev) => (
                        <li key={ev.id} className="text-xs">
                          <div className="flex items-center justify-between text-[#e5c78c] font-bold font-cinzel">
                            <span>{ev.title}</span>
                            <span className="text-[#ffd700] text-[10px] font-mono">{ev.time}</span>
                          </div>
                          <p className="text-[11px] text-[#bda075] font-serif italic mt-0.5">{ev.blurb}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Day 2 */}
                <div className="rounded-sm bg-[#170e06] border border-[#5c3c1e] p-3">
                  <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#ffd700] block mb-2 border-b border-[#4a2e14] pb-1">
                    Day 2 — The Grand Finale
                  </span>
                  {selectedLocation.day2Events.length === 0 ? (
                    <p className="text-xs text-[#8c6f4b] italic font-serif">Open venue / general fest activities.</p>
                  ) : (
                    <ul className="space-y-2">
                      {selectedLocation.day2Events.map((ev) => (
                        <li key={ev.id} className="text-xs">
                          <div className="flex items-center justify-between text-[#e5c78c] font-bold font-cinzel">
                            <span>{ev.title}</span>
                            <span className="text-[#ffd700] text-[10px] font-mono">{ev.time}</span>
                          </div>
                          <p className="text-[11px] text-[#bda075] font-serif italic mt-0.5">{ev.blurb}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              RIGHT: THE TWO-DAY SCHEDULE SCROLL (MATCHES UPLOADED ARTWORK)
          ════════════════════════════════════════════════════════════ */}
          <div
            className={`lg:col-span-4 flex flex-col gap-4 ${
              activeTab === 'schedule' ? 'flex' : 'hidden lg:flex'
            }`}
          >
            {/* Search Box */}
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search events, venues, gaming, talks..."
                className="w-full px-3.5 py-2.5 rounded-md bg-[#180e07] border-2 border-[#6d4620] focus:border-[#ffd700] text-[#f2e2c4] placeholder:text-[#8c6f4b] font-serif text-xs sm:text-sm outline-none transition-colors shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[#c9a44c] hover:text-[#ffd700]"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Search Results Dropdown / Panel if searching */}
            {searchResults && (
              <div className="rounded-md border-2 border-[#ffd700]/70 bg-[#160c05] p-3 shadow-xl">
                <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#ffd700] block mb-2">
                  Search Results ({searchResults.events.length + searchResults.locations.length})
                </span>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.locations.map((loc) => (
                    <div
                      key={loc.id}
                      onClick={() => {
                        focusLocation(loc.id)
                        setActiveTab('map')
                      }}
                      className="p-2 rounded-sm bg-[#221308] hover:bg-[#331c0b] border border-[#6d4620] cursor-pointer"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-cinzel font-bold text-[#ffd700]">
                        <span>{loc.icon}</span>
                        <span className="font-cinzel font-bold text-xs uppercase tracking-wider">{loc.name}</span>
                      </div>
                      <p className="text-[11px] text-[#bda075] font-serif">{loc.subtitle}</p>
                    </div>
                  ))}
                  {searchResults.events.map((ev) => (
                    <div
                      key={ev.id}
                      onClick={() => {
                        focusLocation(ev.locationId)
                        setActiveTab('map')
                      }}
                      className="p-2 rounded-sm bg-[#221308] hover:bg-[#331c0b] border border-[#6d4620] cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs font-cinzel font-bold text-[#e5c78c]">
                        <span>{ev.title}</span>
                        <span className="text-[#ffd700] text-[10px]">Day {ev.dayNumber}</span>
                      </div>
                      <p className="text-[11px] text-[#bda075] font-serif">📍 {ev.locationName}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Authentic Parchment Scroll Schedule Card */}
            <div className="rounded-lg border-2 border-[#7a4e23] bg-gradient-to-b from-[#1a1007] via-[#140b05] to-[#0c0602] shadow-[0_20px_50px_rgba(0,0,0,0.95)] overflow-hidden">
              {/* Parchment Scroll Header with Fleurons */}
              <div className="p-4 bg-[#201309] border-b-2 border-[#5c3c1e] text-center relative">
                <div className="flex items-center justify-center gap-2 text-[#ffd700] text-xs mb-1">
                  <span>✦</span>
                  <span className="font-cinzel uppercase tracking-[0.25em] font-bold text-[#e5c78c]">
                    Hogwarts Fest Schedule
                  </span>
                  <span>✦</span>
                </div>
                <h3 className="font-cinzel-decorative font-bold text-2xl sm:text-3xl text-[#ffd700] tracking-wide uppercase">
                  Two-Day Programme
                </h3>

                {/* Day 1 & Day 2 Switcher Tabs (Matches Uploaded Artwork) */}
                <div className="mt-3 inline-flex p-1 rounded-sm bg-[#120803] border border-[#6d4620]">
                  <button
                    onClick={() => setActiveDay(1)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-sm font-cinzel text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeDay === 1
                        ? 'bg-gradient-to-b from-[#ffd700] to-[#c9a44c] text-[#120802] shadow-md font-bold'
                        : 'text-[#c2a272] hover:text-[#ffd700]'
                    }`}
                  >
                    Day 1 — The Beginning
                  </button>
                  <button
                    onClick={() => setActiveDay(2)}
                    className={`px-3.5 sm:px-4 py-1.5 rounded-sm font-cinzel text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      activeDay === 2
                        ? 'bg-gradient-to-b from-[#ffd700] to-[#c9a44c] text-[#120802] shadow-md font-bold'
                        : 'text-[#c2a272] hover:text-[#ffd700]'
                    }`}
                  >
                    Day 2 — The Grand Finale
                  </button>
                </div>
              </div>

              {/* Events List on Scroll Parchment */}
              <div className="p-4 sm:p-5 space-y-3 max-h-[560px] overflow-y-auto">
                {FEST_SCHEDULE.find((s) => s.dayNumber === activeDay)?.events.map((ev) => (
                  <motion.div
                    key={ev.id}
                    whileHover={{ scale: 1.015 }}
                    onClick={() => {
                      focusLocation(ev.locationId)
                      setActiveTab('map')
                    }}
                    className={`p-3 rounded-sm border transition-all duration-200 cursor-pointer ${
                      selectedLocationId === ev.locationId
                        ? 'bg-[#2b170a] border-[#ffd700] shadow-[0_0_15px_rgba(255,215,0,0.2)]'
                        : 'bg-[#180e06] border-[#5c3c1e] hover:border-[#a87d3b]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[#ffd700] text-xs">✦</span>
                        <h4 className="font-cinzel text-xs sm:text-sm font-bold text-[#f2e2c4]">
                          {ev.title}
                        </h4>
                      </div>
                      <span className="font-mono text-[10px] text-[#ffd700] shrink-0 font-bold">
                        {ev.time}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#bda075] font-serif pt-1">
                      <span>📍 {ev.locationName}</span>
                      <span className="text-[#c9a44c] font-cinzel uppercase text-[9px] font-bold">
                        Locate on Map →
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Bottom Quote Banner (Matches Uploaded Artwork) */}
              <div className="p-4 bg-[#180e07] border-t border-[#4a2e14] text-center">
                <p className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] uppercase tracking-[0.25em] mb-0.5">
                  Explore ✦ Participate ✦ Celebrate
                </p>
                <p className="font-serif italic text-xs text-[#bda075]">
                  Two Days. Countless Memories.
                </p>
              </div>
            </div>
          </div>

          {/* ════════════════════════════════════════════════════════════
              TAB 3 (MOBILE ONLY): ALL VENUES & LANDMARKS DIRECTORY
          ════════════════════════════════════════════════════════════ */}
          {activeTab === 'locations' && (
            <div className="lg:hidden col-span-1 flex flex-col gap-3">
              <div className="text-center pb-2">
                <h3 className="font-cinzel-decorative font-bold text-lg sm:text-xl text-[#ffd700] tracking-wider uppercase">
                  Campus Landmarks & Venues
                </h3>
                <p className="font-serif italic text-xs text-[#bda075]">
                  Tap any venue to jump directly to its location on the parchment map.
                </p>
              </div>

              <div className="space-y-3">
                {MAP_LOCATIONS.map((loc) => (
                  <div
                    key={loc.id}
                    onClick={() => {
                      focusLocation(loc.id)
                      setActiveTab('map')
                    }}
                    className={`p-3.5 rounded-md border transition-all cursor-pointer ${
                      selectedLocationId === loc.id
                        ? 'bg-[#2a170b] border-[#ffd700] shadow-md'
                        : 'bg-[#180e06] border-[#6d4620] hover:border-[#ffd700]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{loc.icon}</span>
                        <h4 className="font-cinzel font-bold text-sm sm:text-base text-[#ffd700] uppercase tracking-wider">{loc.name}</h4>
                      </div>
                      <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-sm bg-[#221308] border border-[#8c6738] text-[#e5c78c]">
                        {loc.category}
                      </span>
                    </div>
                    <p className="text-xs text-[#bda075] font-serif italic mb-2">
                      {loc.subtitle}
                    </p>
                    <p className="text-xs text-[#d4be9b] font-serif line-clamp-2 mb-2">
                      {loc.description}
                    </p>
                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#4a2e14]">
                      <span className="text-[#a87d3b] font-cinzel text-[10px]">
                        {loc.day1Events.length + loc.day2Events.length} Events Scheduled
                      </span>
                      <span className="text-[#ffd700] font-cinzel font-bold text-[10px] uppercase">
                        View on Map →
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* ── Mobile Slide-Up Location Bottom Sheet ──────────────────────── */}
      <AnimatePresence>
        {showLocationDrawer && (
          <motion.div
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100 }}
            className="lg:hidden fixed bottom-0 left-0 w-full z-50 bg-[#160c05] border-t-2 border-[#ffd700] p-4 max-h-[75vh] overflow-y-auto shadow-2xl rounded-t-xl"
          >
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#5c3c1e]">
              <div className="flex items-center gap-2">
                <span className="text-xl">{selectedLocation.icon}</span>
                <div>
                  <h3 className="font-cinzel-decorative font-bold text-base sm:text-lg text-[#ffd700] tracking-wider uppercase">
                    {selectedLocation.name}
                  </h3>
                  <span className="font-serif italic text-xs text-[#bda075]">
                    {selectedLocation.subtitle}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setShowLocationDrawer(false)}
                className="w-7 h-7 rounded-full bg-[#24150b] border border-[#8c6738] text-[#ffd700] flex items-center justify-center font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-[#d4be9b] font-serif mb-3 leading-relaxed">
              {selectedLocation.description}
            </p>

            {/* Quick Events in Drawer */}
            <div className="space-y-2">
              <span className="font-cinzel font-bold text-xs uppercase tracking-wider text-[#ffd700] block">
                Events at this Venue:
              </span>
              {[...selectedLocation.day1Events, ...selectedLocation.day2Events].map((ev) => (
                <div key={ev.id} className="p-2 rounded-sm bg-[#1e1107] border border-[#5c3c1e] text-xs">
                  <div className="flex justify-between font-cinzel font-bold text-[#e5c78c]">
                    <span>{ev.title}</span>
                    <span className="text-[#ffd700] text-[10px]">{ev.time}</span>
                  </div>
                  <p className="text-[10px] text-[#bda075] font-serif italic mt-0.5">{ev.blurb}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
