import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { registerWizard } from '../api/client'
import { HOUSES, type HouseId } from '../data/houses'

interface RegistrationModalProps {
  isOpen: boolean
  onClose: () => void
  defaultHouseId?: HouseId
}

interface FormErrors {
  fullName?: string
  email?: string
  phone?: string
  college?: string
  general?: string
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

  // Form Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FormErrors>({})

  // Sync defaultHouseId when changed
  useEffect(() => {
    if (defaultHouseId) setHouseId(defaultHouseId)
  }, [defaultHouseId])

  const availableEvents = [
    { id: 'quidditch-cup', name: 'Quidditch Tournament' },
    { id: 'hackathon-hex', name: 'INOVEX MCA Hackathon' },
    { id: 'management-triwizard', name: 'NEXORA MBA Conclave' },
    { id: 'potions-mastery', name: 'Potions & Mixology' },
    { id: 'dueling-club', name: 'Dueling Club LAN Gaming' },
    { id: 'yule-ball', name: 'Yule Ball Cultural Night' },
  ]

  // Real-time Field Validator
  const validateField = (field: string, value: string): string | undefined => {
    switch (field) {
      case 'fullName':
        if (!value.trim()) return 'Wizarding name is required.'
        if (value.trim().length < 2) return 'Name must be at least 2 characters.'
        if (!/^[a-zA-Z\s.'-]+$/.test(value)) return 'Name should contain letters and spaces only.'
        return undefined

      case 'email':
        if (!value.trim()) return 'Owl address (email) is required.'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
          return 'Please enter a valid owl address (e.g. name@college.edu).'
        return undefined

      case 'phone':
        if (!value.trim()) return 'Contact wand frequency (phone) is required.'
        if (!/^[+]?[0-9\s-]{8,16}$/.test(value.trim()))
          return 'Enter a valid phone number (8–15 digits, optional +).'
        return undefined

      case 'college':
        if (!value.trim()) return 'Academy / College name is required.'
        if (value.trim().length < 2) return 'College name must be at least 2 characters.'
        return undefined

      default:
        return undefined
    }
  }

  // Validate entire form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}
    const nameErr = validateField('fullName', fullName)
    const emailErr = validateField('email', email)
    const phoneErr = validateField('phone', phone)
    const collegeErr = validateField('college', college)

    if (nameErr) newErrors.fullName = nameErr
    if (emailErr) newErrors.email = emailErr
    if (phoneErr) newErrors.phone = phoneErr
    if (collegeErr) newErrors.college = collegeErr

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, email: true, phone: true, college: true })

    if (!validateForm()) {
      setStatus('error')
      setStatusMessage('Please correct the highlighted parchment inscriptions before proceeding.')
      return
    }

    setStatus('loading')
    setStatusMessage('')

    try {
      const res = await registerWizard({
        fullName: fullName.trim(),
        email: email.trim(),
        phone: phone.trim(),
        college: college.trim(),
        department,
        usnOrRollNo: usn.trim() || undefined,
        houseId,
        eventIds: selectedEvents,
      })

      setStatus('success')
      setStatusMessage(res.message || 'You are officially registered for AJ-ASTRIX 2K27!')
    } catch (err: any) {
      setStatus('error')
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors: FormErrors = {}
        err.details.forEach((d: { field: string; message: string }) => {
          if (d.field.includes('fullName')) fieldErrors.fullName = d.message
          else if (d.field.includes('email')) fieldErrors.email = d.message
          else if (d.field.includes('phone')) fieldErrors.phone = d.message
          else if (d.field.includes('college')) fieldErrors.college = d.message
        })
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
        setStatusMessage(err.message || 'Validation failed on submitted parchment.')
      } else {
        setStatusMessage(err.message || 'Failed to submit registration. Please check your connection.')
      }
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setCollege('')
    setUsn('')
    setSelectedEvents([])
    setTouched({})
    setErrors({})
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
            className="fixed inset-0 bg-black/85 backdrop-blur-xl"
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
                type="button"
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
                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-300 font-cinzel mb-6 flex items-center gap-2">
                  <span>🏆</span>
                  <span>+5 Points officially awarded to your House in the House Cup!</span>
                </div>
                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 cursor-pointer shadow-lg hover:brightness-110 transition-all"
                >
                  Return to Great Hall
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="space-y-4 font-serif">
                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-sans flex items-start gap-2">
                    <span className="text-base">⚠️</span>
                    <span>{statusMessage}</span>
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
                      onChange={(e) => {
                        setFullName(e.target.value)
                        if (touched.fullName) handleBlur('fullName', e.target.value)
                      }}
                      onBlur={() => handleBlur('fullName', fullName)}
                      placeholder="e.g. Harry Potter"
                      className={`w-full px-3 py-2 rounded-lg bg-[#1a0f07] text-stone-200 text-sm outline-none transition-colors ${
                        touched.fullName && errors.fullName
                          ? 'border-2 border-red-500 bg-red-950/20'
                          : 'border border-amber-500/30 focus:border-amber-400'
                      }`}
                    />
                    {touched.fullName && errors.fullName && (
                      <p className="mt-1 text-[11px] text-red-400 font-sans flex items-center gap-1">
                        <span>•</span> {errors.fullName}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Owl Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value)
                        if (touched.email) handleBlur('email', e.target.value)
                      }}
                      onBlur={() => handleBlur('email', email)}
                      placeholder="wizard@hogwarts.edu"
                      className={`w-full px-3 py-2 rounded-lg bg-[#1a0f07] text-stone-200 text-sm outline-none transition-colors ${
                        touched.email && errors.email
                          ? 'border-2 border-red-500 bg-red-950/20'
                          : 'border border-amber-500/30 focus:border-amber-400'
                      }`}
                    />
                    {touched.email && errors.email && (
                      <p className="mt-1 text-[11px] text-red-400 font-sans flex items-center gap-1">
                        <span>•</span> {errors.email}
                      </p>
                    )}
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
                      onChange={(e) => {
                        setPhone(e.target.value)
                        if (touched.phone) handleBlur('phone', e.target.value)
                      }}
                      onBlur={() => handleBlur('phone', phone)}
                      placeholder="+91 98765 43210"
                      className={`w-full px-3 py-2 rounded-lg bg-[#1a0f07] text-stone-200 text-sm outline-none transition-colors ${
                        touched.phone && errors.phone
                          ? 'border-2 border-red-500 bg-red-950/20'
                          : 'border border-amber-500/30 focus:border-amber-400'
                      }`}
                    />
                    {touched.phone && errors.phone && (
                      <p className="mt-1 text-[11px] text-red-400 font-sans flex items-center gap-1">
                        <span>•</span> {errors.phone}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      College / Institution *
                    </label>
                    <input
                      type="text"
                      required
                      value={college}
                      onChange={(e) => {
                        setCollege(e.target.value)
                        if (touched.college) handleBlur('college', e.target.value)
                      }}
                      onBlur={() => handleBlur('college', college)}
                      placeholder="e.g. Hogwarts Academy of Tech"
                      className={`w-full px-3 py-2 rounded-lg bg-[#1a0f07] text-stone-200 text-sm outline-none transition-colors ${
                        touched.college && errors.college
                          ? 'border-2 border-red-500 bg-red-950/20'
                          : 'border border-amber-500/30 focus:border-amber-400'
                      }`}
                    />
                    {touched.college && errors.college && (
                      <p className="mt-1 text-[11px] text-red-400 font-sans flex items-center gap-1">
                        <span>•</span> {errors.college}
                      </p>
                    )}
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
                      USN / Roll Number (Optional)
                    </label>
                    <input
                      type="text"
                      value={usn}
                      onChange={(e) => setUsn(e.target.value)}
                      placeholder="e.g. 1AJ23MC007"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                    />
                  </div>
                </div>

                {/* House Sorting Choice */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1.5">
                    Select Your House (For House Cup Points)
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {HOUSES.map((h) => {
                      const isSelected = houseId === h.id
                      return (
                        <button
                          key={h.id}
                          type="button"
                          onClick={() => setHouseId(h.id)}
                          className={`p-2 rounded-lg border text-left cursor-pointer transition-all ${
                            isSelected
                              ? 'border-amber-400 bg-amber-950/60 shadow-[0_0_12px_rgba(245,158,11,0.3)]'
                              : 'border-amber-500/20 bg-black/40 hover:border-amber-500/40 text-stone-400'
                          }`}
                        >
                          <div className="text-base mb-0.5">{h.crest}</div>
                          <div className="font-cinzel text-xs font-bold text-amber-200">{h.name}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Event Selection */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1.5">
                    Select Events of Interest
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {availableEvents.map((ev) => {
                      const checked = selectedEvents.includes(ev.id)
                      return (
                        <label
                          key={ev.id}
                          onClick={() => toggleEvent(ev.id)}
                          className={`flex items-center gap-2 p-2 rounded-md border text-xs cursor-pointer transition-all ${
                            checked
                              ? 'border-amber-400/80 bg-amber-950/40 text-amber-200'
                              : 'border-amber-500/20 bg-black/30 text-stone-400 hover:border-amber-500/40'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={() => {}}
                            className="accent-amber-500 w-3.5 h-3.5"
                          />
                          <span className="truncate">{ev.name}</span>
                        </label>
                      )
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`w-full py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      status === 'loading'
                        ? 'bg-amber-700/60 text-stone-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {status === 'loading' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Inscribing Parchment...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Confirm Registration & Claim 5 Points</span>
                      </>
                    )}
                  </button>
                  <p className="text-center font-serif italic text-[11px] text-stone-400 mt-2">
                    Entry grants all-access pass to both festival days and House Cup scoring.
                  </p>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
