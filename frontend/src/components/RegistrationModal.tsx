import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { registerWizard } from '../api/client'
import { HOUSES, type HouseId } from '../data/houses'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  defaultHouseId?: HouseId
}

export function RegistrationModal({
  isOpen,
  onClose,
  defaultHouseId = 'gryffindor',
}: RegistrationModalProps) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [department, setDepartment] = useState<'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'>('MCA')
  const [usn, setUsn] = useState('')
  const [houseId, setHouseId] = useState<HouseId>(defaultHouseId)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')

  const availableEvents = [
    { id: 'quidditch-cup', name: 'Quidditch Tournament' },
    { id: 'hackathon-hex', name: 'INOVEX MCA Hackathon' },
    { id: 'management-triwizard', name: 'NEXORA MBA Conclave' },
    { id: 'potions-mastery', name: 'Potions & Mixology' },
    { id: 'dueling-club', name: 'Dueling Club LAN Gaming' },
    { id: 'yule-ball', name: 'Yule Ball Cultural Night' },
  ]

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    setStatusMessage('')

    try {
      const res = await registerWizard({
        fullName,
        email,
        phone,
        college,
        department,
        usnOrRollNo: usn,
        houseId,
        eventIds: selectedEvents,
      })

      setStatus('success')
      setStatusMessage(res.message || 'You are officially registered for AJ-ASTRIX 2K27!')
    } catch (err: any) {
      setStatus('error')
      setStatusMessage(err.message || 'Failed to submit registration. Please check your details.')
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setCollege('')
    setUsn('')
    setSelectedEvents([])
    setStatus('idle')
    setStatusMessage('')
  }

  const handleClose = () => {
    resetForm()
    onClose()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/80 backdrop-blur-xl"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 280 }}
            className="relative w-full max-w-lg sm:max-w-xl bg-gradient-to-b from-[#180e07] via-[#100803] to-[#070301] border-2 border-amber-500/50 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.25)] p-5 sm:p-7 z-10 my-8 overflow-hidden select-none"
          >
            {/* Corner Runic Ornaments */}
            <span className="absolute top-2 left-2.5 text-xs text-amber-500/40">⚜</span>
            <span className="absolute top-2 right-2.5 text-xs text-amber-500/40">⚜</span>
            <span className="absolute bottom-2 left-2.5 text-xs text-amber-500/40">⚜</span>
            <span className="absolute bottom-2 right-2.5 text-xs text-amber-500/40">⚜</span>

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-amber-500/25 mb-4">
              <div>
                <span className="font-cinzel text-[10px] tracking-[0.25em] text-amber-400 font-bold uppercase block">
                  ✦ Hogwarts Festival Registry ✦
                </span>
                <h3 className="font-cinzel-decorative font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#c9a44c] uppercase">
                  Register for AJ-ASTRIX 2K27
                </h3>
              </div>
              <button
                onClick={handleClose}
                className="w-8 h-8 rounded-full border border-amber-500/30 hover:border-amber-400 bg-amber-950/40 text-amber-300 hover:text-white flex items-center justify-center font-bold text-xs transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {status === 'success' ? (
              <div className="py-8 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-4 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  ⚡
                </div>
                <h4 className="font-cinzel font-bold text-lg text-amber-200 mb-2 uppercase tracking-wider">
                  Registration Confirmed!
                </h4>
                <p className="font-serif italic text-sm text-stone-300 max-w-sm mb-6 leading-relaxed">
                  {statusMessage}
                </p>
                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-300 font-cinzel mb-6">
                  +5 Points added to your House in the House Cup! 🏆
                </div>
                <button
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 cursor-pointer shadow-lg hover:brightness-110"
                >
                  Return to Festival
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4 font-serif">
                {status === 'error' && (
                  <div className="p-2.5 rounded-lg bg-red-950/60 border border-red-500/40 text-red-200 text-xs font-sans">
                    ⚠️ {statusMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="e.g. Harry Potter"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="wizard@hogwarts.edu"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      College / University *
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => setCollege(e.target.value)}
                      placeholder="College Name"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Department / Stream
                    </label>
                    <select
                      value={department}
                      onChange={(e) => setDepartment(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    >
                      <option value="MCA">MCA (INOVEX)</option>
                      <option value="MBA">MBA (NEXORA)</option>
                      <option value="BTech">B.Tech / BE</option>
                      <option value="BCA">BCA / BSc</option>
                      <option value="Other">Other Disciplines</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Roll Number / USN
                    </label>
                    <input
                      type="text"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      placeholder="Optional"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                {/* House Sorting Choice */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1.5">
                    Select Your House
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {HOUSES.map((h) => (
                      <button
                        type="button"
                        key={h.id}
                        onClick={() => setHouseId(h.id)}
                        className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                          houseId === h.id
                            ? 'bg-amber-500/25 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                            : 'bg-black/40 border-amber-900/30 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="text-xl block mb-0.5">{h.crest}</span>
                        <span className="font-cinzel text-[10px] uppercase font-bold text-stone-200 block truncate">
                          {h.name}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Event Selection */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1.5">
                    Participating Events
                  </label>
                  <div className="grid grid-cols-2 gap-1.5 text-xs text-stone-300">
                    {availableEvents.map((ev) => (
                      <label
                        key={ev.id}
                        className="flex items-center gap-2 p-1.5 rounded-lg bg-black/30 border border-white/5 hover:border-amber-500/30 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={selectedEvents.includes(ev.id)}
                          onChange={() => toggleEvent(ev.id)}
                          className="accent-amber-500"
                        />
                        <span className="truncate">{ev.name}</span>
                      </label>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={status === 'loading'}
                  className="w-full py-3 rounded-xl font-cinzel font-black text-xs sm:text-sm tracking-[0.2em] uppercase bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-500 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:shadow-[0_0_30px_rgba(245,158,11,0.7)] transition-all cursor-pointer disabled:opacity-50 mt-2"
                >
                  {status === 'loading' ? 'Inscribing in Archives...' : 'Submit Inscription ⚡'}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

