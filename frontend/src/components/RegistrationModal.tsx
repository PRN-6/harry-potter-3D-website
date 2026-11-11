import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import QRCode from 'qrcode'
import {
  QrCode,
  Upload,
  Copy,
  Check,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  X,
  CreditCard,
} from 'lucide-react'
import { registerWizard, fetchPaymentInfo, type PaymentGatewayInfo } from '../api/client'
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
  transactionId?: string
  receipt?: string
  general?: string
}

export function RegistrationModal({
  isOpen,
  onClose,
  defaultHouseId = 'gryffindor',
}: RegistrationModalProps) {
  // Wizard Details
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [college, setCollege] = useState('')
  const [department, setDepartment] = useState<'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'>('MCA')
  const [usn, setUsn] = useState('')
  const [houseId, setHouseId] = useState<HouseId>(defaultHouseId)
  const [selectedEvents, setSelectedEvents] = useState<string[]>([])

  // Payment Details
  const [transactionId, setTransactionId] = useState('')
  const [receiptFile, setReceiptFile] = useState<File | null>(null)
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')
  const [paymentInfo, setPaymentInfo] = useState<PaymentGatewayInfo | null>(null)
  const [copiedUpi, setCopiedUpi] = useState(false)

  // Anti-Spam Honeypot & Timing
  const [incantationTrap, setIncantationTrap] = useState('')
  const [formRenderTime, setFormRenderTime] = useState<number>(Date.now())

  // Navigation Steps: 1 = Details & House, 2 = Payment Scanner & Receipt
  const [step, setStep] = useState<1 | 2>(1)

  // Submission States
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [statusMessage, setStatusMessage] = useState('')
  const [confirmedRegId, setConfirmedRegId] = useState('')

  // Validation States
  const [touched, setTouched] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<FormErrors>({})

  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // Sync defaultHouseId and record render timestamp
  useEffect(() => {
    if (defaultHouseId) setHouseId(defaultHouseId)
    if (isOpen) {
      setFormRenderTime(Date.now())
    }
  }, [defaultHouseId, isOpen])

  // Load payment config & generate QR code on mount
  useEffect(() => {
    if (isOpen) {
      fetchPaymentInfo()
        .then((info) => {
          setPaymentInfo(info)
          QRCode.toDataURL(info.upiIntentUri, {
            width: 280,
            margin: 2,
            color: {
              dark: '#000000',
              light: '#f5eedc',
            },
          })
            .then(setQrCodeDataUrl)
            .catch(() => {})
        })
        .catch(() => {
          // Fallback static UPI intent
          const fallbackUri = 'upi://pay?pa=ajastrix2027@okhdfcbank&pn=AJ-ASTRIX%202K27&am=250&cu=INR&tn=Fest-Pass'
          QRCode.toDataURL(fallbackUri, { width: 280, margin: 2 })
            .then(setQrCodeDataUrl)
            .catch(() => {})
        })
    }
  }, [isOpen])

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

      case 'transactionId':
        if (!value.trim()) return 'UPI Transaction Reference / UTR number is required.'
        if (value.trim().length < 6) return 'Transaction UTR must be at least 6 characters.'
        return undefined

      default:
        return undefined
    }
  }

  // Validate Step 1
  const validateStep1 = (): boolean => {
    const newErrors: FormErrors = {}
    const nameErr = validateField('fullName', fullName)
    const emailErr = validateField('email', email)
    const phoneErr = validateField('phone', phone)
    const collegeErr = validateField('college', college)

    if (nameErr) newErrors.fullName = nameErr
    if (emailErr) newErrors.email = emailErr
    if (phoneErr) newErrors.phone = phoneErr
    if (collegeErr) newErrors.college = collegeErr

    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  // Validate Step 2
  const validateStep2 = (): boolean => {
    const newErrors: FormErrors = {}
    const txErr = validateField('transactionId', transactionId)
    if (txErr) newErrors.transactionId = txErr

    if (!receiptFile) {
      newErrors.receipt = 'Please upload your UPI payment receipt screenshot.'
    }

    setErrors((prev) => ({ ...prev, ...newErrors }))
    return Object.keys(newErrors).length === 0
  }

  const handleBlur = (field: string, value: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }))
    const error = validateField(field, value)
    setErrors((prev) => ({ ...prev, [field]: error }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.size > 5 * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, receipt: 'Receipt file size must be under 5MB.' }))
      return
    }

    setReceiptFile(file)
    setErrors((prev) => {
      const next = { ...prev }
      delete next.receipt
      return next
    })

    const reader = new FileReader()
    reader.onload = (ev) => {
      setReceiptPreview(ev.target?.result as string)
    }
    reader.readAsDataURL(file)
  }

  const removeReceipt = () => {
    setReceiptFile(null)
    setReceiptPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const copyUpiId = () => {
    const upi = paymentInfo?.upiId || 'ajastrix2027@okhdfcbank'
    navigator.clipboard.writeText(upi)
    setCopiedUpi(true)
    setTimeout(() => setCopiedUpi(false), 2000)
  }

  const toggleEvent = (id: string) => {
    setSelectedEvents((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id],
    )
  }

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ fullName: true, email: true, phone: true, college: true })
    if (validateStep1()) {
      setStep(2)
      setStatus('idle')
      setStatusMessage('')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched({ transactionId: true })

    if (!validateStep2()) {
      setStatus('error')
      setStatusMessage('Please enter your transaction UTR number and upload your receipt screenshot.')
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
        amount: paymentInfo?.amount || 250,
        paymentMethod: 'upi',
        transactionId: transactionId.trim(),
        receiptFile: receiptFile || undefined,
        incantation_trap: incantationTrap || undefined,
        _formRenderTime: formRenderTime,
      })

      setStatus('success')
      setConfirmedRegId(res.registration?.id || '')
      setStatusMessage(res.message || 'You are officially registered for AJ-ASTRIX 2K27! An owl acceptance dispatch is on its way.')
    } catch (err: any) {
      setStatus('error')
      if (err.details && Array.isArray(err.details)) {
        const fieldErrors: FormErrors = {}
        err.details.forEach((d: { field: string; message: string }) => {
          if (d.field.includes('fullName')) fieldErrors.fullName = d.message
          else if (d.field.includes('email')) fieldErrors.email = d.message
          else if (d.field.includes('phone')) fieldErrors.phone = d.message
          else if (d.field.includes('college')) fieldErrors.college = d.message
          else if (d.field.includes('transactionId')) fieldErrors.transactionId = d.message
        })
        setErrors((prev) => ({ ...prev, ...fieldErrors }))
        setStatusMessage(err.message || 'Validation failed on submitted parchment.')
      } else {
        setStatusMessage(err.message || 'Failed to submit registration. Please check your network.')
      }
    }
  }

  const resetForm = () => {
    setFullName('')
    setEmail('')
    setPhone('')
    setCollege('')
    setUsn('')
    setTransactionId('')
    setReceiptFile(null)
    setReceiptPreview(null)
    setSelectedEvents([])
    setStep(1)
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
                  AJ-ASTRIX 2K27 Registration
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

            {/* Step Progress Pill */}
            {status !== 'success' && (
              <div className="flex items-center justify-between mb-4 px-2 py-1.5 rounded-lg bg-black/40 border border-amber-500/20 text-[11px] font-cinzel uppercase font-bold">
                <span className={`flex items-center gap-1.5 ${step === 1 ? 'text-amber-300' : 'text-stone-400'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 1 ? 'bg-amber-500 text-stone-950' : 'bg-stone-800'}`}>1</span>
                  Wizard Details
                </span>
                <span className="text-stone-600">➔</span>
                <span className={`flex items-center gap-1.5 ${step === 2 ? 'text-amber-300' : 'text-stone-400'}`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] ${step === 2 ? 'bg-amber-500 text-stone-950' : 'bg-stone-800'}`}>2</span>
                  Payment Scanner & Receipt
                </span>
              </div>
            )}

            {/* Honeypot Bot Trap (Invisible to real users) */}
            <input
              type="text"
              name="incantation_trap"
              value={incantationTrap}
              onChange={(e) => setIncantationTrap(e.target.value)}
              style={{ display: 'none', position: 'absolute', left: '-9999px' }}
              tabIndex={-1}
              autoComplete="off"
              aria-hidden="true"
            />

            {/* ========================================== */}
            {/* VIEW: SUCCESS CONFIRMATION                 */}
            {/* ========================================== */}
            {status === 'success' ? (
              <div className="py-6 text-center flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center text-3xl mb-3 shadow-[0_0_25px_rgba(245,158,11,0.4)]">
                  ⚡
                </div>
                <h4 className="font-cinzel font-bold text-lg text-amber-200 mb-1 uppercase tracking-wider">
                  Registration & Payment Confirmed!
                </h4>
                <div className="font-mono text-xs text-amber-400 bg-black/60 px-3 py-1 rounded-full border border-amber-500/30 mb-3">
                  Pass ID: {confirmedRegId}
                </div>
                <p className="font-serif italic text-xs text-stone-300 max-w-sm mb-4 leading-relaxed">
                  {statusMessage}
                </p>

                <div className="p-3 rounded-xl bg-black/60 border border-amber-500/30 text-xs text-amber-300 font-cinzel mb-5 flex flex-col gap-1 w-full max-w-sm">
                  <div className="flex items-center justify-center gap-2 text-emerald-400 font-bold">
                    <span>✓</span> Payment Receipt Uploaded to Cloudinary
                  </div>
                  <div className="text-[11px] text-stone-400">
                    +5 Points added to your House in the House Cup! 🏆
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleClose}
                  className="px-6 py-2.5 rounded-full font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 cursor-pointer shadow-lg hover:brightness-110 transition-all"
                >
                  Return to Great Hall
                </button>
              </div>
            ) : step === 1 ? (
              /* ========================================== */
              /* STEP 1: WIZARD DETAILS & HOUSE SORTING    */
              /* ========================================== */
              <form onSubmit={handleProceedToPayment} noValidate className="space-y-4 font-serif">
                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-sans flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
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
                      <p className="mt-1 text-[11px] text-red-400 font-sans">
                        • {errors.fullName}
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
                      <p className="mt-1 text-[11px] text-red-400 font-sans">
                        • {errors.email}
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
                      <p className="mt-1 text-[11px] text-red-400 font-sans">
                        • {errors.phone}
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
                      <p className="mt-1 text-[11px] text-red-400 font-sans">
                        • {errors.college}
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

                {/* House Selection */}
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-32 overflow-y-auto pr-1">
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

                {/* Next Step Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span>Proceed to Payment Scanner (₹250)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            ) : (
              /* ========================================== */
              /* STEP 2: PAYMENT SCANNER & RECEIPT UPLOAD   */
              /* ========================================== */
              <form onSubmit={handleSubmit} noValidate className="space-y-4 font-serif">
                {status === 'error' && (
                  <div className="p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-sans flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <span>{statusMessage}</span>
                  </div>
                )}

                {/* UPI Scanner Display Card */}
                <div className="p-4 rounded-xl bg-black/60 border border-amber-500/40 flex flex-col sm:flex-row items-center gap-4">
                  {/* QR Canvas */}
                  <div className="bg-[#f5eedc] p-2 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.2)] shrink-0 flex flex-col items-center">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="UPI Payment QR Scanner"
                        className="w-36 h-36 object-contain rounded"
                      />
                    ) : (
                      <div className="w-36 h-36 flex items-center justify-center text-stone-600">
                        <QrCode className="w-8 h-8 animate-pulse" />
                      </div>
                    )}
                    <span className="font-cinzel text-[9px] uppercase tracking-wider text-stone-800 font-bold mt-1">
                      Scan with any UPI App
                    </span>
                  </div>

                  {/* Payment Details */}
                  <div className="flex-1 text-center sm:text-left space-y-2">
                    <div className="flex items-center justify-center sm:justify-start gap-2">
                      <CreditCard className="w-4 h-4 text-amber-400" />
                      <span className="font-cinzel uppercase text-xs font-bold text-amber-300">
                        Festival Entry Pass
                      </span>
                    </div>

                    <div className="font-cinzel-decorative font-black text-2xl text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                      ₹{paymentInfo?.amount || 250} <span className="text-xs font-sans text-stone-400 font-normal">INR</span>
                    </div>

                    <div className="flex items-center justify-center sm:justify-start gap-1.5 text-xs text-stone-300">
                      <span className="font-mono text-[11px] bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                        {paymentInfo?.upiId || 'ajastrix2027@okhdfcbank'}
                      </span>
                      <button
                        type="button"
                        onClick={copyUpiId}
                        className="p-1 rounded bg-amber-500/20 hover:bg-amber-500/40 text-amber-300 cursor-pointer transition-colors"
                        title="Copy UPI ID"
                      >
                        {copiedUpi ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>

                    <p className="text-[10px] text-stone-400 leading-tight">
                      Supported: Google Pay, PhonePe, Paytm, BHIM, Cred & all UPI banking apps.
                    </p>
                  </div>
                </div>

                {/* Transaction Ref (UTR) Input */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                    UPI Transaction Reference / UTR Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={transactionId}
                    onChange={(e) => {
                      setTransactionId(e.target.value)
                      if (touched.transactionId) handleBlur('transactionId', e.target.value)
                    }}
                    onBlur={() => handleBlur('transactionId', transactionId)}
                    placeholder="e.g. 430987123456 (12-digit UPI Ref)"
                    className={`w-full px-3 py-2 rounded-lg bg-[#1a0f07] text-stone-200 text-sm outline-none font-mono transition-colors ${
                      touched.transactionId && errors.transactionId
                        ? 'border-2 border-red-500 bg-red-950/20'
                        : 'border border-amber-500/30 focus:border-amber-400'
                    }`}
                  />
                  {touched.transactionId && errors.transactionId && (
                    <p className="mt-1 text-[11px] text-red-400 font-sans">
                      • {errors.transactionId}
                    </p>
                  )}
                </div>

                {/* Payment Receipt Upload Box */}
                <div>
                  <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                    Upload Payment Receipt Screenshot * (Cloudinary Storage)
                  </label>

                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png,image/jpeg,image/webp,application/pdf"
                    className="hidden"
                  />

                  {receiptPreview ? (
                    <div className="relative p-3 rounded-xl bg-black/60 border border-emerald-500/50 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={receiptPreview}
                          alt="Receipt Preview"
                          className="w-12 h-12 object-cover rounded-lg border border-amber-500/30"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-stone-200 truncate max-w-[200px]">
                            {receiptFile?.name}
                          </div>
                          <div className="text-[10px] text-stone-400">
                            {receiptFile ? `${Math.round(receiptFile.size / 1024)} KB` : ''} • Ready to upload
                          </div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeReceipt}
                        className="p-1 rounded-full bg-red-950/60 hover:bg-red-900/60 text-red-300 cursor-pointer"
                        title="Remove Receipt"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className={`p-4 rounded-xl border-2 border-dashed cursor-pointer text-center transition-all ${
                        errors.receipt
                          ? 'border-red-500 bg-red-950/20'
                          : 'border-amber-500/40 hover:border-amber-400 bg-black/30 hover:bg-amber-950/20'
                      }`}
                    >
                      <Upload className="w-6 h-6 mx-auto text-amber-400 mb-1" />
                      <div className="font-cinzel text-xs font-bold text-amber-200">
                        Click or Drop Payment Screenshot
                      </div>
                      <div className="text-[10px] text-stone-400 mt-0.5">
                        PNG, JPG, WEBP, or PDF up to 5MB
                      </div>
                    </div>
                  )}

                  {errors.receipt && (
                    <p className="mt-1 text-[11px] text-red-400 font-sans">
                      • {errors.receipt}
                    </p>
                  )}
                </div>

                {/* Back & Submit Actions */}
                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={status === 'loading'}
                    className="px-4 py-3 rounded-xl border border-amber-500/30 text-stone-300 font-cinzel text-xs font-bold uppercase tracking-wider hover:bg-amber-950/40 cursor-pointer transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Back
                  </button>

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className={`flex-1 py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                      status === 'loading'
                        ? 'bg-amber-700/60 text-stone-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 hover:brightness-110 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
                    }`}
                  >
                    {status === 'loading' ? (
                      <>
                        <span className="w-4 h-4 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
                        <span>Uploading Receipt & Inscribing Pass...</span>
                      </>
                    ) : (
                      <>
                        <span>⚡</span>
                        <span>Complete Registration & Claim Pass</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
