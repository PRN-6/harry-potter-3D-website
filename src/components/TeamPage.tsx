import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Header } from './Header'
import {
  HOD_DATA,
  FACULTY_DATA,
  STUDENT_COUNCIL_DATA,
  type FacultyMember,
  type StudentCouncilMember,
} from '../data/team'
import { DailyProphetSection } from './DailyProphetSection'

interface TeamPageProps {
  onBack: () => void
}

export function TeamPage({ onBack }: TeamPageProps) {
  const [activeSection, setActiveSection] = useState<'prophet' | 'faculty' | 'council'>('prophet')
  const [selectedCard, setSelectedCard] = useState<StudentCouncilMember | FacultyMember | null>(null)
  const prophetRef = useRef<HTMLDivElement>(null)
  const facultyRef = useRef<HTMLDivElement>(null)
  const councilRef = useRef<HTMLDivElement>(null)

  // Scroll to top on page mount
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [])

  // Close card detail view on Escape key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (selectedCard) {
          setSelectedCard(null)
        } else {
          onBack()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onBack, selectedCard])

  // Scroll to section helper
  const scrollTo = (section: 'prophet' | 'faculty' | 'council') => {
    setActiveSection(section)
    if (section === 'prophet') {
      prophetRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else if (section === 'faculty') {
      facultyRef.current?.scrollIntoView({ behavior: 'smooth' })
    } else {
      councilRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }

  // Update active section tab on scroll
  useEffect(() => {
    const onScroll = () => {
      if (!facultyRef.current || !councilRef.current) return
      const scrollPos = window.scrollY
      const facultyTop = facultyRef.current.offsetTop - 200
      const councilTop = councilRef.current.offsetTop - 200

      if (scrollPos >= councilTop) {
        setActiveSection('council')
      } else if (scrollPos >= facultyTop) {
        setActiveSection('faculty')
      } else {
        setActiveSection('prophet')
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Navigate to previous or next card in card detail view
  const navigateCard = (direction: 'prev' | 'next') => {
    if (!selectedCard) return
    const councilIdx = STUDENT_COUNCIL_DATA.findIndex((c) => c.id === selectedCard.id)
    if (councilIdx !== -1) {
      const nextIdx =
        direction === 'next'
          ? (councilIdx + 1) % STUDENT_COUNCIL_DATA.length
          : (councilIdx - 1 + STUDENT_COUNCIL_DATA.length) % STUDENT_COUNCIL_DATA.length
      setSelectedCard(STUDENT_COUNCIL_DATA[nextIdx])
    }
  }

  const isCouncilMember = (card: StudentCouncilMember | FacultyMember): card is StudentCouncilMember => {
    return 'responsibilities' in card
  }

  return (
    <div className="min-h-screen bg-[#0b0502] text-[#f2e2c4] selection:bg-[#c9a44c] selection:text-[#1c1107] font-serif relative overflow-x-hidden">
      {/* ── Hogwarts Atmospheric Candle Glow & Magic Embers ────────────── */}
      <div
        className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 w-[1000px] h-[550px] rounded-full blur-[200px] opacity-20 z-0"
        style={{ backgroundColor: '#c9a44c' }}
      />
      <div
        className="pointer-events-none fixed bottom-0 right-0 w-[700px] h-[450px] rounded-full blur-[180px] opacity-15 z-0"
        style={{ backgroundColor: '#8c501c' }}
      />

      {/* Floating magical golden embers */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-[#ffd700]"
            style={{
              width: `${(i % 3) + 2}px`,
              height: `${(i % 3) + 2}px`,
              left: `${(i * 8.3) + 3}%`,
              bottom: '-20px',
              opacity: 0.4,
              boxShadow: '0 0 8px #ffd700',
              animation: `magical-ember ${6 + (i % 5)}s linear infinite`,
              animationDelay: `${i * 0.7}s`,
            }}
          />
        ))}
      </div>

      {/* ══════════════════════════════════════════════════════════════
          SUB-PAGE: ENCHANTED DOSSIER / MEMBER CARD PROFILE
      ══════════════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {selectedCard && (
          <motion.div
            key="card-detail-page"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="fixed inset-0 z-[250] flex flex-col bg-[#0d0703]/95 backdrop-blur-2xl overflow-y-auto"
          >
            {/* Top Bar for Detail View */}
            <div className="flex items-center justify-between px-4 sm:px-8 py-3.5 border-b-2 border-[#6d4620] bg-[#160c05]/95 sticky top-0 z-20 shadow-xl backdrop-blur-md">
              <button
                onClick={() => setSelectedCard(null)}
                className="group flex items-center gap-2 font-cinzel text-xs uppercase tracking-[0.2em] text-[#e5c78c] hover:text-[#ffd700] transition-colors border border-[#8c6738] hover:border-[#ffd700] bg-gradient-to-b from-[#2a170b] to-[#170c05] px-4 py-2 rounded-sm cursor-pointer shadow-md"
              >
                <span className="text-[#ffd700] group-hover:-translate-x-1 transition-transform">←</span>
                <span>Return to Gallery</span>
              </button>

              {isCouncilMember(selectedCard) && (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => navigateCard('prev')}
                    className="px-3.5 py-1.5 rounded-sm border border-[#6d4620] hover:border-[#ffd700] bg-[#221308] text-[#e5c78c] hover:text-[#ffd700] font-cinzel text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                  >
                    ← Prev Wizard
                  </button>
                  <button
                    onClick={() => navigateCard('next')}
                    className="px-3.5 py-1.5 rounded-sm border border-[#6d4620] hover:border-[#ffd700] bg-[#221308] text-[#e5c78c] hover:text-[#ffd700] font-cinzel text-xs uppercase tracking-wider cursor-pointer transition-colors shadow-sm"
                  >
                    Next Wizard →
                  </button>
                </div>
              )}

              <div className="hidden sm:flex items-center gap-2 font-cinzel text-xs text-[#c9a44c] uppercase tracking-[0.25em]">
                <span>✦</span>
                <span>Ministry & Hogwarts Archives · AJ-ASTRIX2K27</span>
                <span>✦</span>
              </div>
            </div>

            {/* Dossier Body */}
            <div className="flex-1 max-w-5xl mx-auto w-full p-4 sm:p-8 py-10 flex flex-col justify-center">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-12 items-center p-6 sm:p-10 rounded-lg border-2 border-[#8c6738] bg-gradient-to-b from-[#1c1109] via-[#140b05] to-[#0c0602] shadow-[0_20px_60px_rgba(0,0,0,0.95)] relative">
                {/* Corner Fleurons */}
                <span className="absolute top-2 left-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute top-2 right-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute bottom-2 left-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute bottom-2 right-2 text-[#ffd700] text-sm select-none">⚜</span>

                {/* LEFT: Baroque Oil Portrait Frame */}
                <div className="md:col-span-5 flex flex-col items-center">
                  <div className="relative w-full max-w-xs aspect-[3/4] rounded-sm border-4 border-[#c9a44c] overflow-hidden shadow-[0_0_40px_rgba(201,164,76,0.35)] bg-black group">
                    <img
                      src={selectedCard.image}
                      alt={'title' in selectedCard ? selectedCard.title : selectedCard.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0e0703] via-[#0e0703]/25 to-transparent flex flex-col justify-end p-5 text-center">
                      <span className="font-cinzel font-bold text-lg sm:text-xl text-[#ffd700] tracking-wider block drop-shadow-md uppercase">
                        {'title' in selectedCard ? selectedCard.title : selectedCard.name}
                      </span>
                      <span className="font-cinzel text-xs text-[#e5c78c] uppercase tracking-widest block font-bold">
                        {isCouncilMember(selectedCard) ? selectedCard.member.role : selectedCard.role}
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Dossier Text */}
                <div className="md:col-span-7 flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2e190b] border border-[#a87d3b] text-[#ffd700] font-cinzel text-xs tracking-wider uppercase font-bold mb-3 w-fit shadow-sm">
                    <span>✦</span>
                    <span>{isCouncilMember(selectedCard) ? `${selectedCard.title} Domain` : selectedCard.role}</span>
                  </div>

                  <h1 className="font-cinzel font-black text-2xl sm:text-4xl text-[#ffd700] tracking-wide mb-1 drop-shadow-sm">
                    {isCouncilMember(selectedCard) ? selectedCard.member.name : selectedCard.name}
                  </h1>

                  <p className="font-cinzel text-xs sm:text-sm text-[#c9a44c] uppercase tracking-[0.2em] mb-4 font-bold">
                    {isCouncilMember(selectedCard) ? selectedCard.member.role : `${selectedCard.designation} · ${selectedCard.department}`}
                  </p>

                  {isCouncilMember(selectedCard) && (
                    <blockquote className="text-[#e2caa0] font-serif italic text-base sm:text-lg mb-4 border-l-2 border-[#ffd700] pl-4">
                      "{selectedCard.tagline}"
                    </blockquote>
                  )}

                  <p className="text-[#c7af8b] text-sm sm:text-base leading-relaxed mb-6 font-serif">
                    {isCouncilMember(selectedCard) ? selectedCard.description : selectedCard.bio ?? selectedCard.quote}
                  </p>

                  {/* Responsibilities list if council member */}
                  {isCouncilMember(selectedCard) && selectedCard.responsibilities && (
                    <div className="mb-6 p-4 rounded-sm bg-[#170d06] border border-[#6d4620]">
                      <h4 className="font-cinzel text-xs uppercase tracking-widest text-[#ffd700] mb-2.5 font-bold flex items-center gap-2">
                        <span>✦</span>
                        <span>Domain Operations & Responsibilities</span>
                      </h4>
                      <ul className="space-y-1.5">
                        {selectedCard.responsibilities.map((resp, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs sm:text-sm text-[#e0cbab]">
                            <span className="text-[#c9a44c]">✦</span>
                            <span>{resp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Quote Box */}
                  <div className="relative p-4 rounded-sm bg-[#1a0f07] border-l-2 border-[#c9a44c] pl-5">
                    <p className="font-serif italic text-xs sm:text-sm text-[#e8d2ae] leading-relaxed">
                      "{selectedCard.quote}"
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══════════════════════════════════════════════════════════════
          AUTHENTIC HOGWARTS TOP NAVIGATION BAR WITH BURGER MENU
      ══════════════════════════════════════════════════════════════ */}
      <Header
        currentView="team"
        leftSlot={
          <button
            onClick={onBack}
            className="group flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 rounded-full bg-black/40 hover:bg-black/60 border border-white/20 hover:border-amber-400/50 text-amber-200 hover:text-amber-100 transition-all duration-300 shadow-[0_0_12px_rgba(0,0,0,0.5)] cursor-pointer shrink-0 backdrop-blur-md"
          >
            <span className="text-amber-400 text-xs sm:text-sm group-hover:-translate-x-1 transition-transform">←</span>
            <span className="font-cinzel text-[10px] sm:text-xs tracking-[0.18em] uppercase font-bold">
              <span className="hidden sm:inline">Return to </span>Hall
            </span>
          </button>
        }
        centerSlot={
          <div className="flex items-center gap-1 sm:gap-1.5 p-1 rounded-full bg-black/30 backdrop-blur-md border border-white/10 shadow-inner overflow-x-auto max-w-full">
            <button
              onClick={() => scrollTo('prophet')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-cinzel text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                activeSection === 'prophet'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-black shadow-[0_0_12px_rgba(212,175,55,0.5)] border border-amber-300'
                  : 'text-amber-200/80 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs">🗞️</span>
              <span className="hidden md:inline">Daily </span>Prophet
            </button>
            <button
              onClick={() => scrollTo('faculty')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-cinzel text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                activeSection === 'faculty'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-black shadow-[0_0_12px_rgba(212,175,55,0.5)] border border-amber-300'
                  : 'text-amber-200/80 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs">📜</span>
              <span>Faculty</span>
            </button>
            <button
              onClick={() => scrollTo('council')}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full font-cinzel text-[10px] sm:text-xs tracking-wider uppercase transition-all duration-300 cursor-pointer shrink-0 ${
                activeSection === 'council'
                  ? 'bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 font-black shadow-[0_0_12px_rgba(212,175,55,0.5)] border border-amber-300'
                  : 'text-amber-200/80 hover:text-amber-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              <span className="text-xs">🪄</span>
              <span>Council</span>
            </button>
          </div>
        }
        showDesktopNav={false}
      />

      {/* ── Main Scrollable Body ──────────────────────────────────────── */}
      <main className="pt-20 pb-20 relative z-10">
        {/* ══════════════════════════════════════════════════════════════
            SECTION 0: THE DAILY PROPHET (SPECIAL FEST EDITION)
        ══════════════════════════════════════════════════════════════ */}
        <section
          ref={prophetRef}
          id="prophet-section"
          className="pb-16 border-b-2 border-[#4a2e14]"
        >
          <DailyProphetSection
            onExploreFaculty={() => scrollTo('faculty')}
            onExploreCouncil={() => scrollTo('council')}
          />
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 1: HOD & FACULTY PATRONS
            (Hogwarts Grand Portrait Gallery)
        ══════════════════════════════════════════════════════════════ */}
        <section
          ref={facultyRef}
          id="faculty-section"
          className="min-h-[calc(100vh-80px)] px-4 sm:px-8 py-16 max-w-6xl mx-auto flex flex-col justify-between"
        >
          <div>
            {/* Header Title with Ornate Filigree */}
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#221308] border border-[#8c6738] text-[#ffd700] font-cinzel text-xs uppercase tracking-[0.3em] font-bold mb-3">
                <span>✦</span>
                <span>Ministry & Academic Patrons</span>
                <span>✦</span>
              </div>
              <h2 className="font-cinzel-decorative font-bold text-2xl sm:text-4xl md:text-5xl text-[#ffd700] tracking-wider mb-3 drop-shadow-md uppercase">
                Head of Department & Faculty
              </h2>
              <p className="font-serif italic text-sm sm:text-base text-[#bda075] max-w-2xl mx-auto leading-relaxed">
                The distinguished academic patrons guiding the vision, spirit, and mastery of AJ-ASTRIX2K27. Click any portrait to inspect their official dossier.
              </p>
              <div className="flex items-center justify-center gap-3 text-[#c9a44c] text-sm mt-3">
                <span>✦</span>
                <span className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
                <span>⚜</span>
                <span className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
                <span>✦</span>
              </div>
            </div>

            {/* ── Featured HOD Baroque Oil Painting Frame ──────────────── */}
            <div className="mb-14">
              <motion.div
                onClick={() => setSelectedCard(HOD_DATA)}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
                className="relative overflow-hidden rounded-md border-2 border-[#a87d3b] hover:border-[#ffd700] bg-gradient-to-b from-[#26150b] via-[#1a0e06] to-[#100703] p-6 sm:p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.95)] cursor-pointer transition-all duration-300 group"
              >
                {/* Corner Fleurons */}
                <span className="absolute top-2 left-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute top-2 right-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute bottom-2 left-2 text-[#ffd700] text-sm select-none">⚜</span>
                <span className="absolute bottom-2 right-2 text-[#ffd700] text-sm select-none">⚜</span>

                <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-10">
                  {/* Portrait with Golden Oil Frame */}
                  <div className="relative shrink-0">
                    <div className="w-40 h-40 sm:w-48 sm:h-48 md:w-56 md:h-56 rounded-sm overflow-hidden border-4 border-[#c9a44c] shadow-[0_0_30px_rgba(201,164,76,0.35)] bg-black">
                      <img
                        src={HOD_DATA.image}
                        alt={HOD_DATA.name}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    </div>
                  </div>

                  {/* Details */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#2e190b] border border-[#a87d3b] text-[#ffd700] font-cinzel text-xs tracking-wider uppercase font-bold mb-2 shadow-sm">
                      <span>✦</span>
                      <span>{HOD_DATA.role} · Chief Patron</span>
                    </div>

                    <h3 className="font-cinzel font-bold text-xl sm:text-3xl text-[#ffd700] tracking-wide mb-1 group-hover:text-[#ffe082] transition-colors">
                      {HOD_DATA.name}
                    </h3>

                    <p className="font-cinzel text-xs sm:text-sm text-[#c9a44c] tracking-[0.2em] uppercase mb-1 font-bold">
                      {HOD_DATA.designation}
                    </p>
                    <p className="text-xs sm:text-sm text-[#bda075] mb-5 font-serif">
                      {HOD_DATA.department}
                    </p>

                    {/* Quote Box */}
                    <div className="relative p-4 rounded-sm bg-[#160d05] border-l-2 border-[#ffd700] pl-4 max-w-2xl shadow-inner">
                      <p className="font-serif italic text-sm sm:text-base text-[#e0caa4] leading-relaxed">
                        "{HOD_DATA.quote}"
                      </p>
                    </div>

                    <div className="mt-4 font-cinzel text-xs text-[#ffd700] tracking-widest uppercase flex items-center justify-center md:justify-start gap-2 font-bold group-hover:translate-x-1 transition-transform">
                      <span>Inspect HOD Portrait Dossier</span>
                      <span>→</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* ── Faculty Mentors Grid (4 Hogwarts Portraits) ─────────── */}
            <div>
              <h3 className="font-cinzel text-lg sm:text-xl font-bold text-[#f2e2c4] tracking-wider mb-6 flex items-center gap-3">
                <span className="text-[#ffd700]">✦</span>
                <span>Faculty Coordinators & Scholarly Mentors</span>
                <span className="h-[1px] flex-1 bg-gradient-to-r from-[#8c6738] to-transparent" />
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {FACULTY_DATA.map((faculty, idx) => (
                  <motion.div
                    key={faculty.id}
                    onClick={() => setSelectedCard(faculty)}
                    initial={{ opacity: 0, y: 15 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    className="group relative flex flex-col justify-between p-4 rounded-sm border border-[#7a4e23] hover:border-[#ffd700] bg-gradient-to-b from-[#1c1007] to-[#120803] hover:from-[#26150b] hover:to-[#170c05] transition-all duration-300 hover:scale-[1.02] shadow-xl cursor-pointer"
                  >
                    <div>
                      {/* Portrait Frame with Moving Picture Effect */}
                      <div className="relative aspect-[4/3] rounded-sm overflow-hidden mb-3 border-2 border-[#8c6738] group-hover:border-[#ffd700] transition-colors bg-black shadow-md">
                        <img
                          src={faculty.image}
                          alt={faculty.name}
                          loading="lazy"
                          decoding="async"
                          className="w-full h-full object-cover filter sepia-[0.3] group-hover:sepia-0 group-hover:scale-105 transition-all duration-500"
                        />
                      </div>

                      {/* Role Tag */}
                      <span className="font-cinzel text-[10px] text-[#ffd700] font-bold uppercase tracking-widest block mb-0.5">
                        {faculty.role}
                      </span>

                      {/* Name */}
                      <h4 className="font-cinzel font-bold text-sm sm:text-base text-[#f2e2c4] group-hover:text-[#ffd700] transition-colors mb-0.5 tracking-wide">
                        {faculty.name}
                      </h4>

                      {/* Designation & Dept */}
                      <p className="text-[11px] text-[#bda078] mb-0.5 font-serif">
                        {faculty.designation}
                      </p>
                      <p className="text-[10px] text-[#8c6f4b] mb-3 font-serif">
                        {faculty.department}
                      </p>
                    </div>

                    {/* Quote */}
                    <p className="font-serif italic text-xs text-[#c2aa84] border-t border-[#4a2e14] pt-2.5 mt-auto">
                      "{faculty.quote}"
                    </p>

                    <div className="mt-2 text-right">
                      <span className="font-cinzel text-[10px] text-[#ffd700] uppercase tracking-widest font-bold group-hover:underline">
                        View portrait →
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Scroll Prompt to Section 2 */}
          <div className="text-center pt-12 pb-4">
            <button
              onClick={() => scrollTo('council')}
              className="group inline-flex items-center gap-2.5 font-cinzel text-xs tracking-widest uppercase text-[#e5c78c] hover:text-[#ffd700] transition-colors px-6 py-2.5 rounded-sm border border-[#8c6738] bg-[#1e1107] hover:bg-[#2e1b0d] shadow-md cursor-pointer"
            >
              <span>🪄</span>
              <span>Explore The 12 Council Leads (Interactive Accordion)</span>
              <span className="group-hover:translate-y-0.5 transition-transform text-[#ffd700] font-black">↓</span>
            </button>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════
            SECTION 2: STUDENT COUNCIL & DOMAIN LEADS
            (Signature Expanding Accordion Slit Animation)
        ══════════════════════════════════════════════════════════════ */}
        <section
          ref={councilRef}
          id="council-section"
          className="min-h-[calc(100vh-80px)] px-3 sm:px-6 py-16 border-t-2 border-[#4a2e14] bg-gradient-to-b from-[#0b0502] via-[#140b05] to-[#0b0502] flex flex-col justify-between"
        >
          {/* Header Title */}
          <div className="text-center mb-10 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-[#221308] border border-[#8c6738] text-[#ffd700] font-cinzel text-xs uppercase tracking-[0.3em] font-bold mb-3">
              <span>✦</span>
              <span>Student Core Committee</span>
              <span>✦</span>
            </div>
            <h2 className="font-cinzel-decorative font-bold text-2xl sm:text-4xl md:text-5xl text-[#ffd700] tracking-wider mb-2 drop-shadow-md uppercase">
              The Grand Council & Domain Leads
            </h2>
            <p className="font-serif italic text-sm text-[#bda075] max-w-xl mx-auto">
              Hover across the magical slit cards to expand any domain mage. Click any card to inspect their official Hogwarts dossier.
            </p>
            <div className="flex items-center justify-center gap-3 text-[#c9a44c] text-sm mt-3">
              <span>✦</span>
              <span className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
              <span>🪄</span>
              <span className="w-16 h-[1px] bg-gradient-to-r from-transparent via-[#c9a44c] to-transparent" />
              <span>✦</span>
            </div>
          </div>

          {/* ── DESKTOP: SIGNATURE 12-CARD ACCORDION EXPAND STAGE ─────── */}
          <div className="hidden md:flex h-[580px] lg:h-[640px] w-full max-w-7xl mx-auto gap-2 p-3 rounded-lg border-2 border-[#7a4e23] bg-gradient-to-b from-[#180e06] to-[#0d0602] shadow-[0_20px_60px_rgba(0,0,0,0.95)] overflow-hidden">
            {STUDENT_COUNCIL_DATA.map((section, idx) => {
              const isEven = idx % 2 === 0
              return (
                <motion.div
                  key={section.id}
                  onClick={() => setSelectedCard(section)}
                  whileHover={{ flex: 3.2 }}
                  transition={{ duration: 0.35, ease: 'easeOut' }}
                  className="relative h-full overflow-hidden rounded-md flex-1 cursor-pointer group will-change-[flex] shadow-xl border border-[#6d4620] hover:border-[#ffd700] transition-colors"
                >
                  {/* Face Image with Spring-in and Zoom */}
                  <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden bg-black">
                    <motion.img
                      initial={{
                        y: isEven ? '40%' : '-40%',
                        filter: 'grayscale(80%) sepia(40%)',
                      }}
                      whileInView={{
                        y: 0,
                        filter: 'grayscale(20%) sepia(20%)',
                      }}
                      viewport={{ once: true }}
                      transition={{
                        y: { type: 'spring', stiffness: 90, damping: 18, delay: idx * 0.04 },
                        filter: { duration: 0.6, delay: idx * 0.04 },
                      }}
                      src={section.image}
                      alt={section.title}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full object-cover group-hover:scale-110 group-hover:filter-none transition-all duration-700 opacity-75 group-hover:opacity-100"
                    />
                  </div>

                  {/* Inner Gold Filigree Trim */}
                  <div
                    className="pointer-events-none absolute inset-1 rounded-sm border border-[#ffd700]/20 group-hover:border-[#ffd700]/80 transition-colors z-10"
                    aria-hidden="true"
                  />

                  {/* Top Corner Fleuron */}
                  <span className="absolute top-2 left-2 text-[#ffd700] text-[10px] z-20 group-hover:scale-125 transition-transform">
                    ✦
                  </span>

                  {/* Collapsed / Expanded Text Overlay */}
                  <div className="relative z-10 h-full w-full flex flex-col justify-end items-center p-3 pb-8 text-center bg-gradient-to-t from-[#0e0703] via-[#0e0703]/60 to-transparent pointer-events-none">
                    <span className="font-cinzel font-bold text-xs lg:text-sm tracking-wider uppercase text-[#ffd700] drop-shadow-md whitespace-nowrap mb-0.5">
                      {section.title}
                    </span>

                    {/* Additional details revealed on expansion */}
                    <div className="opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-32 transition-all duration-300 overflow-hidden flex flex-col items-center">
                      <span className="font-cinzel text-[11px] text-[#f2e2c4] uppercase tracking-wider font-bold block whitespace-nowrap">
                        {section.member.name}
                      </span>
                      <span className="font-cinzel text-[9px] text-[#c9a44c] uppercase tracking-widest block mb-1">
                        {section.member.role}
                      </span>
                      <span className="font-serif italic text-[10px] text-[#d4be9b] line-clamp-1 max-w-[180px] mb-2">
                        "{section.tagline}"
                      </span>
                      <span className="font-cinzel text-[9px] uppercase tracking-widest px-2.5 py-0.5 bg-[#ffd700] text-[#1a0f05] font-black rounded-sm shadow-md">
                        Open Dossier ✦
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* ── MOBILE / TABLET: 2-COLUMN COLLECTOR GRID ──────────────── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 md:hidden max-w-2xl mx-auto w-full mb-10">
            {STUDENT_COUNCIL_DATA.map((section, idx) => (
              <motion.div
                key={section.id}
                onClick={() => setSelectedCard(section)}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: (idx % 3) * 0.08 }}
                className="relative aspect-[3/4] rounded-md overflow-hidden border-2 border-[#7a4e23] hover:border-[#ffd700] bg-[#160d06] shadow-xl cursor-pointer group active:scale-95 transition-transform"
              >
                <img
                  src={section.image}
                  alt={section.title}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover filter sepia-[0.25] group-hover:sepia-0 group-hover:scale-105 transition-all duration-500"
                />
                <div className="absolute inset-x-0 bottom-0 p-2.5 pt-6 bg-gradient-to-t from-[#0e0703] via-[#0e0703]/85 to-transparent text-center flex flex-col items-center">
                  <span className="font-cinzel font-bold text-xs sm:text-sm text-[#ffd700] tracking-wider uppercase block">
                    {section.title}
                  </span>
                  <span className="font-cinzel text-[10px] text-[#f2e2c4] uppercase tracking-wider block font-bold">
                    {section.member.name}
                  </span>
                  <span className="font-cinzel text-[8px] text-[#c9a44c] uppercase tracking-widest block">
                    {section.member.role}
                  </span>
                  <span className="font-cinzel text-[8px] text-[#ffd700] uppercase tracking-widest mt-1">
                    Tap to Open →
                  </span>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Bottom Back Prompts */}
          <div className="text-center pt-8 pb-4 flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => scrollTo('prophet')}
              className="inline-flex items-center gap-2 font-cinzel text-xs tracking-widest uppercase text-[#e5c78c] hover:text-[#ffd700] transition-colors px-5 py-2.5 rounded-sm border border-[#8c6738] bg-[#1a0f07] hover:bg-[#29170b] cursor-pointer"
            >
              <span>↑</span>
              <span>Back to The Daily Prophet Cover</span>
            </button>
            <button
              onClick={onBack}
              className="group inline-flex items-center gap-2 font-cinzel text-xs tracking-widest uppercase text-[#120802] bg-gradient-to-b from-[#d4af37] via-[#b8860b] to-[#8c6516] hover:from-[#dfb564] hover:to-[#a3792c] transition-all px-6 py-2.5 rounded-sm font-black shadow-[0_4px_15px_rgba(212,175,55,0.4)] border border-[#ffe082] cursor-pointer"
            >
              <span className="group-hover:-translate-x-1 transition-transform">⚡</span>
              <span>Return to Great Hall</span>
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
