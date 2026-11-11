import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Users,
  Trophy,
  Calendar,
  CheckCircle,
  Search,
  Download,
  Trash2,
  LogOut,
  ArrowLeft,
  Key,
  Clock,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Activity,
  Eye,
  Mail,
  CreditCard,
  X,
  Check,
} from 'lucide-react'
import {
  loginAdminApi,
  fetchAdminMeApi,
  fetchDemoCredentialsApi,
  fetchAdminStatsApi,
  fetchAdminRegistrationsApi,
  toggleAdminCheckInApi,
  updateAdminPaymentStatusApi,
  resendAdminRegistrationEmailApi,
  deleteAdminRegistrationApi,
  exportAdminRegistrationsCsvApi,
  adjustAdminPointsApi,
  fetchAdminPointLogsApi,
  fetchAdminUsersApi,
  createAdminUserApi,
  deleteAdminUserApi,
  fetchAdminAuditLogsApi,
  createAdminEventApi,
  deleteAdminEventApi,
  type AdminProfile,
  type AdminPermissions,
  type AdminStats,
  type RegistrationItem,
  type AdminUserItem,
  type PointLogItem,
  type AuditLogItem,
  type DemoCredential,
  type AdminLevel,
  type PaymentStatus,
} from '../../api/client'

const LEVEL_BADGES: Record<
  AdminLevel,
  { label: string; color: string; border: string; bg: string }
> = {
  0: { label: 'Level 0 · Super Admin (Headmaster)', color: 'text-amber-300', border: 'border-amber-400', bg: 'bg-amber-950/60' },
  1: { label: 'Level 1 · Deputy Headmaster', color: 'text-purple-300', border: 'border-purple-400', bg: 'bg-purple-950/60' },
  2: { label: 'Level 2 · Head of House', color: 'text-emerald-300', border: 'border-emerald-400', bg: 'bg-emerald-950/60' },
  3: { label: 'Level 3 · Chief Event Coordinator', color: 'text-blue-300', border: 'border-blue-400', bg: 'bg-blue-950/60' },
  4: { label: 'Level 4 · Gatekeeper & Desk', color: 'text-orange-300', border: 'border-orange-400', bg: 'bg-orange-950/60' },
  5: { label: 'Level 5 · House Cup Scorekeeper', color: 'text-yellow-300', border: 'border-yellow-400', bg: 'bg-yellow-950/60' },
  6: { label: 'Level 6 · Prefect Observer', color: 'text-stone-300', border: 'border-stone-500', bg: 'bg-stone-900/60' },
}

export function AdminPanel() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('aj_astrix_admin_token'))
  const [admin, setAdmin] = useState<AdminProfile | null>(null)
  const [permissions, setPermissions] = useState<AdminPermissions | null>(null)

  // Login Form States
  const [usernameInput, setUsernameInput] = useState('')
  const [passwordInput, setPasswordInput] = useState('')
  const [loginError, setLoginError] = useState('')
  const [isLoggingIn, setIsLoggingIn] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoCredential[]>([])

  // Dashboard Tab Navigation
  type TabKey = 'overview' | 'registrations' | 'points' | 'events' | 'staff' | 'logs'
  const [activeTab, setActiveTab] = useState<TabKey>('overview')

  // Data States
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [registrations, setRegistrations] = useState<RegistrationItem[]>([])
  const [totalRegCount, setTotalRegCount] = useState(0)
  const [staffList, setStaffList] = useState<AdminUserItem[]>([])
  const [pointLogs, setPointLogs] = useState<PointLogItem[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([])
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [actionFeedback, setActionFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  // Receipt Modal State
  const [viewingReceipt, setViewingReceipt] = useState<RegistrationItem | null>(null)

  // Registration Filter States
  const [regSearch, setRegSearch] = useState('')
  const [regHouseFilter, setRegHouseFilter] = useState<string>('all')
  const [regCheckinFilter, setRegCheckinFilter] = useState<'all' | 'true' | 'false'>('all')
  const [regPaymentFilter, setRegPaymentFilter] = useState<'all' | 'verified' | 'pending' | 'rejected'>('all')

  // Award Points Form State
  const [pointTargetHouse, setPointTargetHouse] = useState<'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'>('gryffindor')
  const [pointDelta, setPointDelta] = useState<number>(20)
  const [pointReason, setPointReason] = useState<string>('')
  const [isSubmittingPoints, setIsSubmittingPoints] = useState(false)

  // Create Staff Form State
  const [newStaffName, setNewStaffName] = useState('')
  const [newStaffUsername, setNewStaffUsername] = useState('')
  const [newStaffEmail, setNewStaffEmail] = useState('')
  const [newStaffPassword, setNewStaffPassword] = useState('')
  const [newStaffLevel, setNewStaffLevel] = useState<AdminLevel>(4)
  const [newStaffHouse, setNewStaffHouse] = useState<'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'>('gryffindor')
  const [isCreatingStaff, setIsCreatingStaff] = useState(false)

  // Create Event Form State
  const [newEventTitle, setNewEventTitle] = useState('')
  const [newEventCategory, setNewEventCategory] = useState('Technical Symposium')
  const [newEventTrack, setNewEventTrack] = useState('tech')
  const [newEventDay, setNewEventDay] = useState<1 | 2>(1)
  const [newEventTime, setNewEventTime] = useState('11:00 AM – 01:00 PM')
  const [newEventVenue, setNewEventVenue] = useState('Auditorium / Great Hall')
  const [newEventPoints, setNewEventPoints] = useState(100)
  const [newEventDesc, setNewEventDesc] = useState('')
  const [isCreatingEvent, setIsCreatingEvent] = useState(false)

  // Auto-dismiss action feedback
  useEffect(() => {
    if (actionFeedback) {
      const timer = setTimeout(() => setActionFeedback(null), 4500)
      return () => clearTimeout(timer)
    }
  }, [actionFeedback])

  // Load demo accounts on initial render
  useEffect(() => {
    fetchDemoCredentialsApi()
      .then((res) => setDemoAccounts(res.accounts))
      .catch(() => {})
  }, [])

  // Verify session on token change
  useEffect(() => {
    if (token) {
      fetchAdminMeApi(token)
        .then((res) => {
          setAdmin(res.admin)
          setPermissions(res.permissions)
          if (res.admin.level === 2 && res.admin.houseId) {
            setPointTargetHouse(res.admin.houseId)
          }
          loadDashboardData(token)
        })
        .catch(() => {
          handleLogout()
        })
    }
  }, [token])

  const loadDashboardData = async (activeToken: string) => {
    setIsLoadingData(true)
    try {
      const [statsRes, regsRes, pointsRes] = await Promise.all([
        fetchAdminStatsApi(activeToken).catch(() => null),
        fetchAdminRegistrationsApi(activeToken, {
          houseId: regHouseFilter,
          checkedIn: regCheckinFilter === 'all' ? undefined : regCheckinFilter === 'true',
          paymentStatus: regPaymentFilter !== 'all' ? regPaymentFilter : undefined,
          search: regSearch,
        }).catch(() => null),
        fetchAdminPointLogsApi(activeToken).catch(() => null),
      ])

      if (statsRes) setStats(statsRes)
      if (regsRes) {
        setRegistrations(regsRes.registrations)
        setTotalRegCount(regsRes.totalCount)
      }
      if (pointsRes) setPointLogs(pointsRes.logs)

      fetchAdminUsersApi(activeToken)
        .then((uRes) => setStaffList(uRes.admins))
        .catch(() => {})

      fetchAdminAuditLogsApi(activeToken)
        .then((lRes) => setAuditLogs(lRes.logs))
        .catch(() => {})
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!usernameInput || !passwordInput) {
      setLoginError('Please enter username/email and password.')
      return
    }

    setIsLoggingIn(true)
    setLoginError('')

    try {
      const res = await loginAdminApi(usernameInput.trim(), passwordInput)
      localStorage.setItem('aj_astrix_admin_token', res.token)
      setToken(res.token)
      setAdmin(res.admin)
      setActionFeedback({ type: 'success', message: `Welcome to Hogwarts Staff Portal, ${res.admin.fullName}!` })
    } catch (err: any) {
      setLoginError(err.message || 'Authentication failed. Please verify credentials.')
    } finally {
      setIsLoggingIn(false)
    }
  }

  const handleQuickLogin = (acc: DemoCredential) => {
    setUsernameInput(acc.username)
    setPasswordInput(acc.password)
    setIsLoggingIn(true)
    setLoginError('')

    loginAdminApi(acc.username, acc.password)
      .then((res) => {
        localStorage.setItem('aj_astrix_admin_token', res.token)
        setToken(res.token)
        setAdmin(res.admin)
        setActionFeedback({
          type: 'success',
          message: `Logged in as ${res.admin.fullName} (${acc.role})`,
        })
      })
      .catch((err) => {
        setLoginError(err.message || 'Quick login failed')
      })
      .finally(() => setIsLoggingIn(false))
  }

  const handleLogout = () => {
    localStorage.removeItem('aj_astrix_admin_token')
    setToken(null)
    setAdmin(null)
    setPermissions(null)
    setUsernameInput('')
    setPasswordInput('')
  }

  // Refresh Registrations when filters change
  const handleFilterRegistrations = async () => {
    if (!token) return
    setIsLoadingData(true)
    try {
      const res = await fetchAdminRegistrationsApi(token, {
        houseId: regHouseFilter,
        checkedIn: regCheckinFilter === 'all' ? undefined : regCheckinFilter === 'true',
        paymentStatus: regPaymentFilter !== 'all' ? regPaymentFilter : undefined,
        search: regSearch,
      })
      setRegistrations(res.registrations)
      setTotalRegCount(res.totalCount)
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to filter registrations' })
    } finally {
      setIsLoadingData(false)
    }
  }

  const handleToggleCheckin = async (id: string) => {
    if (!token) return
    try {
      const res = await toggleAdminCheckInApi(token, id)
      setRegistrations((prev) =>
        prev.map((r) => (r.id === id ? res.registration : r)),
      )
      setActionFeedback({ type: 'success', message: res.message })
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Could not update check-in status' })
    }
  }

  const handleUpdatePaymentStatus = async (id: string, newStatus: PaymentStatus) => {
    if (!token) return
    try {
      const res = await updateAdminPaymentStatusApi(token, id, newStatus)
      setRegistrations((prev) => prev.map((r) => (r.id === id ? res.registration : r)))
      if (viewingReceipt?.id === id) {
        setViewingReceipt(res.registration)
      }
      setActionFeedback({ type: 'success', message: res.message })
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Payment status update failed' })
    }
  }

  const handleResendEmail = async (id: string, attendeeName: string) => {
    if (!token) return
    try {
      const res = await resendAdminRegistrationEmailApi(token, id)
      setActionFeedback({
        type: 'success',
        message: res.message || `Acceptance letter re-sent to ${attendeeName}.`,
      })
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to dispatch acceptance email' })
    }
  }

  const handleDeleteRegistration = async (id: string, name: string) => {
    if (!token) return
    if (!window.confirm(`Are you certain you want to permanently delete the registration for ${name}?`)) return

    try {
      await deleteAdminRegistrationApi(token, id)
      setRegistrations((prev) => prev.filter((r) => r.id !== id))
      setTotalRegCount((prev) => Math.max(0, prev - 1))
      setActionFeedback({ type: 'success', message: `Registration for ${name} removed.` })
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Delete failed' })
    }
  }

  const handleExportCsv = async () => {
    if (!token) return
    try {
      const blob = await exportAdminRegistrationsCsvApi(token)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `AJ-ASTRIX-2K27-Registrations-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(a)
      a.click()
      a.remove()
      window.URL.revokeObjectURL(url)
      setActionFeedback({ type: 'success', message: 'Registrations parchment exported to CSV.' })
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'CSV export failed' })
    }
  }

  const handleAdjustPoints = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!pointReason.trim()) {
      setActionFeedback({ type: 'error', message: 'A reason for awarding/deducting points is mandatory.' })
      return
    }

    setIsSubmittingPoints(true)
    try {
      const res = await adjustAdminPointsApi(token, {
        houseId: pointTargetHouse,
        points: pointDelta,
        reason: pointReason.trim(),
      })
      setActionFeedback({ type: 'success', message: res.message })
      setPointReason('')
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
      fetchAdminPointLogsApi(token).then((l) => setPointLogs(l.logs)).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Could not adjust points.' })
    } finally {
      setIsSubmittingPoints(false)
    }
  }

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!newStaffName || !newStaffUsername || !newStaffEmail || !newStaffPassword) {
      setActionFeedback({ type: 'error', message: 'Please fill out all staff fields.' })
      return
    }

    setIsCreatingStaff(true)
    try {
      const res = await createAdminUserApi(token, {
        fullName: newStaffName.trim(),
        username: newStaffUsername.trim(),
        email: newStaffEmail.trim(),
        password: newStaffPassword,
        level: newStaffLevel,
        houseId: newStaffLevel === 2 ? newStaffHouse : undefined,
      })

      setActionFeedback({ type: 'success', message: res.message })
      setNewStaffName('')
      setNewStaffUsername('')
      setNewStaffEmail('')
      setNewStaffPassword('')
      fetchAdminUsersApi(token).then((u) => setStaffList(u.admins)).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to appoint staff member.' })
    } finally {
      setIsCreatingStaff(false)
    }
  }

  const handleDeleteStaff = async (id: string, name: string) => {
    if (!token) return
    if (!window.confirm(`Revoke all administrative access and banish staff account for ${name}?`)) return

    try {
      await deleteAdminUserApi(token, id)
      setStaffList((prev) => prev.filter((s) => s.id !== id))
      setActionFeedback({ type: 'success', message: `Staff account for ${name} banished.` })
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to remove staff account.' })
    }
  }

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return
    if (!newEventTitle.trim() || !newEventDesc.trim()) {
      setActionFeedback({ type: 'error', message: 'Event title and description are required.' })
      return
    }

    setIsCreatingEvent(true)
    try {
      const res = await createAdminEventApi(token, {
        title: newEventTitle.trim(),
        category: newEventCategory,
        track: newEventTrack,
        day: newEventDay,
        time: newEventTime,
        venue: newEventVenue,
        points: newEventPoints,
        description: newEventDesc.trim(),
      })
      setActionFeedback({ type: 'success', message: res.message })
      setNewEventTitle('')
      setNewEventDesc('')
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to create event.' })
    } finally {
      setIsCreatingEvent(false)
    }
  }

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!token) return
    if (!window.confirm(`Are you sure you want to remove the event "${title}" from the festival schedule?`)) return

    try {
      await deleteAdminEventApi(token, id)
      setActionFeedback({ type: 'success', message: `Event "${title}" removed.` })
      fetchAdminStatsApi(token).then(setStats).catch(() => {})
    } catch (err: any) {
      setActionFeedback({ type: 'error', message: err.message || 'Failed to delete event.' })
    }
  }

  // ==========================================
  // VIEW: LOGIN SCREEN (UNAUTHENTICATED)
  // ==========================================
  if (!token || !admin) {
    return (
      <div className="min-h-screen bg-[#090503] text-stone-200 flex flex-col items-center justify-center p-4 selection:bg-amber-500/30">
        <div className="fixed inset-0 pointer-events-none opacity-20 bg-[radial-gradient(#c9a44c_1px,transparent_1px)] [background-size:24px_24px]" />

        <div className="w-full max-w-xl z-10 my-6">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-xs font-cinzel text-amber-400/80 hover:text-amber-300 transition-colors mb-6 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Return to Great Hall
          </a>

          <div className="bg-gradient-to-b from-[#180e07] via-[#120803] to-[#0a0402] border-2 border-amber-500/40 rounded-2xl p-6 sm:p-8 shadow-[0_0_60px_rgba(245,158,11,0.2)]">
            <div className="text-center mb-6">
              <div className="w-14 h-14 mx-auto rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.3)] mb-3">
                <Shield className="w-7 h-7 text-amber-300" />
              </div>
              <span className="font-cinzel text-[11px] uppercase tracking-[0.3em] text-amber-400 font-bold block">
                ✦ Ministry of Magic Portal ✦
              </span>
              <h1 className="font-cinzel-decorative font-black text-2xl sm:text-3xl text-transparent bg-clip-text bg-gradient-to-r from-[#fff3b0] via-[#ffd700] to-[#c9a44c] uppercase">
                Staff & Admin Chamber
              </h1>
              <p className="font-serif italic text-xs text-stone-400 mt-1">
                Authorized entry for Headmaster, Faculty, Gatekeepers, and Prefects.
              </p>
            </div>

            {loginError && (
              <div className="mb-4 p-3 rounded-lg bg-red-950/70 border border-red-500/50 text-red-200 text-xs font-sans flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                  Staff Username or Owl Email
                </label>
                <input
                  type="text"
                  required
                  value={usernameInput}
                  onChange={(e) => setUsernameInput(e.target.value)}
                  placeholder="e.g. headmaster or mcgonagall"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                  Secret Spell Password
                </label>
                <input
                  type="password"
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-sm focus:border-amber-400 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 text-stone-950 shadow-[0_0_20px_rgba(245,158,11,0.3)] hover:brightness-110 cursor-pointer transition-all flex items-center justify-center gap-2"
              >
                {isLoggingIn ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-stone-950" />
                    <span>Unsealing Chamber...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4 text-stone-950" />
                    <span>Enter Staff Chamber</span>
                  </>
                )}
              </button>
            </form>

            {/* Quick Demo Switcher */}
            <div className="mt-8 pt-6 border-t border-amber-500/20">
              <div className="flex items-center justify-between mb-3">
                <span className="font-cinzel text-[10px] tracking-wider text-amber-400 uppercase font-bold flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  1-Click Role Switcher (Test Levels 0 to 6)
                </span>
                <span className="text-[10px] text-stone-500 font-mono">Instant Auth</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {demoAccounts.map((acc) => {
                  const badge = LEVEL_BADGES[acc.level]
                  return (
                    <button
                      key={acc.username}
                      type="button"
                      onClick={() => handleQuickLogin(acc)}
                      className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all hover:brightness-125 ${badge.bg} ${badge.border}`}
                    >
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-cinzel font-bold text-amber-200">
                          {acc.name}
                        </span>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${badge.color} bg-black/40`}>
                          L{acc.level}
                        </span>
                      </div>
                      <p className="text-[10px] text-stone-400 line-clamp-1">{acc.role}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ==========================================
  // VIEW: AUTHENTICATED ADMIN DASHBOARD
  // ==========================================
  const currentBadge = LEVEL_BADGES[admin.level]

  return (
    <div className="min-h-screen bg-[#0a0502] text-stone-200 selection:bg-amber-500/30 pb-16">
      {/* Toast Feedback Notification */}
      <AnimatePresence>
        {actionFeedback && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={`fixed top-4 right-4 z-[400] max-w-md p-4 rounded-xl border shadow-2xl flex items-center gap-3 ${
              actionFeedback.type === 'success'
                ? 'bg-emerald-950/90 border-emerald-500/60 text-emerald-200'
                : 'bg-red-950/90 border-red-500/60 text-red-200'
            }`}
          >
            {actionFeedback.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
            )}
            <span className="text-xs font-sans">{actionFeedback.message}</span>
            <button
              onClick={() => setActionFeedback(null)}
              className="ml-auto text-stone-400 hover:text-white text-xs cursor-pointer"
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Top Navbar */}
      <header className="sticky top-0 z-50 bg-[#120803]/95 backdrop-blur-md border-b border-amber-500/30 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <a
            href="#"
            className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-400/60 flex items-center justify-center hover:scale-105 transition-transform cursor-pointer text-amber-300"
            title="Return to Great Hall"
          >
            <ArrowLeft className="w-4 h-4" />
          </a>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-cinzel-decorative font-black text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-amber-200 to-amber-500">
                AJ-ASTRIX 2K27
              </h2>
              <span className="text-[10px] font-cinzel uppercase px-2 py-0.5 rounded-full bg-amber-950 border border-amber-500/40 text-amber-300 font-bold">
                Staff Chamber
              </span>
            </div>
            <p className="font-serif italic text-[11px] text-stone-400 hidden sm:block">
              Supreme Festival Administrative Console
            </p>
          </div>
        </div>

        {/* User Info & Controls */}
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="font-cinzel text-xs font-bold text-amber-200 flex items-center justify-end gap-1.5">
              <span>{admin.fullName}</span>
            </div>
            <div className={`text-[10px] font-mono ${currentBadge.color}`}>{admin.roleTitle}</div>
          </div>

          <a
            href="#"
            className="px-3 py-1.5 rounded-lg border border-amber-500/30 text-[11px] font-cinzel text-amber-300 hover:bg-amber-950/40 transition-colors flex items-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> <span className="hidden md:inline">Great Hall</span>
          </a>

          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg border border-red-500/40 bg-red-950/30 hover:bg-red-950/70 text-red-300 text-[11px] font-cinzel font-bold transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" /> <span className="hidden md:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Role Clearance Notice Banner */}
      <div className="bg-[#180e07] border-b border-amber-500/20 px-4 sm:px-8 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${currentBadge.bg} ${currentBadge.border} ${currentBadge.color}`}>
            {currentBadge.label}
          </span>
          <span className="text-stone-300 font-serif italic">
            {admin.level === 0 && 'Supreme Dominion: Complete access to all data, payments, staff accounts, house points, and audit logs.'}
            {admin.level === 1 && 'High Council Dominion: Manage registrations, verified payments, events schedule, and house point awards.'}
            {admin.level === 2 && `House Head Dominion: Jurisdiction over ${admin.houseId?.toUpperCase()} registrations and points.`}
            {admin.level === 3 && 'Event Lead Dominion: Manage festival competitions, venues, and schedule.'}
            {admin.level === 4 && 'Gatekeeper Desk: Verify attendee payment receipts, UPI UTR numbers, and entry passes.'}
            {admin.level === 5 && 'House Cup Scorekeeper: Authorized to award/deduct house points with mandatory reasons.'}
            {admin.level === 6 && 'Prefect Observer: Read-only access to attendee lists, standings, and events.'}
          </span>
          {permissions?.canManageAdmins && (
            <span className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 border border-amber-500/30 text-[10px] text-amber-300 font-cinzel">
              Staff Admin
            </span>
          )}
        </div>

        <button
          onClick={() => token && loadDashboardData(token)}
          disabled={isLoadingData}
          className="text-[11px] font-cinzel text-amber-400 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Dashboard Navigation Tabs */}
      <main className="max-w-7xl mx-auto px-4 sm:px-8 mt-6">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-amber-500/20">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'overview'
                ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Activity className="w-4 h-4" /> Overview & Revenue
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'registrations'
                ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Users className="w-4 h-4" /> Registrations & Payments ({totalRegCount})
          </button>

          <button
            onClick={() => setActiveTab('points')}
            className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'points'
                ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Trophy className="w-4 h-4" /> House Cup Ledger
          </button>

          <button
            onClick={() => setActiveTab('events')}
            className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
              activeTab === 'events'
                ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            <Calendar className="w-4 h-4" /> Events & Schedule
          </button>

          {(admin.level === 0 || admin.level === 1) && (
            <button
              onClick={() => setActiveTab('staff')}
              className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'staff'
                  ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Shield className="w-4 h-4" /> Staff & Admins (L0–L6)
            </button>
          )}

          {admin.level === 0 && (
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-t-lg font-cinzel text-xs font-bold uppercase tracking-wider flex items-center gap-2 cursor-pointer transition-all ${
                activeTab === 'logs'
                  ? 'bg-amber-500/20 text-amber-200 border-b-2 border-amber-400'
                  : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Clock className="w-4 h-4" /> Ministry Audit Trail
            </button>
          )}
        </div>

        {/* ========================================== */}
        {/* TAB 1: OVERVIEW & STATS                    */}
        {/* ========================================== */}
        {activeTab === 'overview' && (
          <div className="mt-6 space-y-6">
            {/* KPI Cards: Registration & Attendance */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="font-cinzel text-xs uppercase font-bold text-amber-300">Total Registered</span>
                  <Users className="w-5 h-5 text-amber-400" />
                </div>
                <div className="font-cinzel-decorative font-black text-3xl text-amber-100">
                  {stats?.totalRegistrations ?? totalRegCount}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 font-serif italic">
                  Wizards and witches sorted into houses
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="font-cinzel text-xs uppercase font-bold text-emerald-300">Checked In (Attended)</span>
                  <CheckCircle className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="font-cinzel-decorative font-black text-3xl text-emerald-300">
                  {stats?.checkedInCount ?? 0}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 font-serif italic">
                  {stats?.attendanceRate ?? 0}% overall attendance rate
                </div>
              </div>

              {/* Payment Revenue KPI */}
              <div className="p-5 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="font-cinzel text-xs uppercase font-bold text-emerald-400">Total Fest Revenue</span>
                  <CreditCard className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="font-cinzel-decorative font-black text-3xl text-emerald-300">
                  ₹{(stats?.totalRevenue ?? 0).toLocaleString()}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 font-serif italic">
                  {stats?.paidCount ?? 0} verified fees collected
                </div>
              </div>

              <div className="p-5 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <div className="flex items-center justify-between text-stone-400 mb-2">
                  <span className="font-cinzel text-xs uppercase font-bold text-yellow-300">House Cup Leader</span>
                  <Trophy className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="font-cinzel-decorative font-black text-2xl text-yellow-200">
                  {stats?.standings[0]?.name || 'Gryffindor'}
                </div>
                <div className="text-[11px] text-stone-400 mt-1 font-serif italic">
                  Leading with {stats?.standings[0]?.points || 0} points
                </div>
              </div>
            </div>

            {/* House Standings & Registration Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* House Standings Progress */}
              <div className="p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-4 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-amber-400" /> Live House Cup Standings
                </h3>
                <div className="space-y-4">
                  {(stats?.standings || []).map((h) => {
                    const maxPoints = Math.max(...(stats?.standings || []).map((s) => s.points), 500)
                    const percent = Math.min(100, Math.round((h.points / maxPoints) * 100))
                    return (
                      <div key={h.house}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="font-cinzel font-bold flex items-center gap-1.5">
                            <span>{h.crest}</span> {h.name}
                          </span>
                          <span className="font-mono font-bold text-amber-300">{h.points} pts</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-black/60 overflow-hidden border border-white/5">
                          <div
                            className="h-full rounded-full transition-all duration-700"
                            style={{ width: `${percent}%`, backgroundColor: h.color }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Payment & House Registration Distribution */}
              <div className="p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
                <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-amber-400" /> Registrations by House & Fee Status
                </h3>
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {Object.entries(stats?.houseBreakdown || {}).map(([house, count]) => (
                    <div key={house} className="p-3 rounded-lg bg-black/40 border border-amber-500/20">
                      <div className="font-cinzel text-xs uppercase text-amber-400 capitalize">{house}</div>
                      <div className="font-cinzel-decorative font-black text-2xl text-stone-100">{count}</div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30">
                    <div className="font-cinzel text-[11px] uppercase text-emerald-400 font-bold">Verified Paid</div>
                    <div className="font-mono font-black text-xl text-emerald-300">{stats?.paidCount ?? 0}</div>
                  </div>
                  <div className="p-3 rounded-lg bg-yellow-950/40 border border-yellow-500/30">
                    <div className="font-cinzel text-[11px] uppercase text-yellow-400 font-bold">Pending Review</div>
                    <div className="font-mono font-black text-xl text-yellow-300">{stats?.pendingPaymentCount ?? 0}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 2: REGISTRATIONS & PAYMENTS (L0-L6)    */}
        {/* ========================================== */}
        {activeTab === 'registrations' && (
          <div className="mt-6 space-y-4">
            {/* Control Bar: Search, Filters, CSV Export */}
            <div className="p-4 rounded-xl bg-[#140b05] border border-amber-500/30 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-amber-400" />
                <input
                  type="text"
                  value={regSearch}
                  onChange={(e) => setRegSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFilterRegistrations()}
                  placeholder="Search by name, email, college, USN, UTR..."
                  className="w-full px-3 py-1.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs focus:border-amber-400 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <select
                  value={regHouseFilter}
                  onChange={(e) => setRegHouseFilter(e.target.value)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs outline-none"
                >
                  <option value="all">All Houses</option>
                  <option value="gryffindor">Gryffindor</option>
                  <option value="slytherin">Slytherin</option>
                  <option value="ravenclaw">Ravenclaw</option>
                  <option value="hufflepuff">Hufflepuff</option>
                </select>

                <select
                  value={regPaymentFilter}
                  onChange={(e) => setRegPaymentFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs outline-none"
                >
                  <option value="all">All Payments</option>
                  <option value="verified">Verified Paid</option>
                  <option value="pending">Pending Review</option>
                  <option value="rejected">Payment Rejected</option>
                </select>

                <select
                  value={regCheckinFilter}
                  onChange={(e) => setRegCheckinFilter(e.target.value as any)}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs outline-none"
                >
                  <option value="all">All Attendance</option>
                  <option value="true">Checked In</option>
                  <option value="false">Not Attended</option>
                </select>

                <button
                  type="button"
                  onClick={handleFilterRegistrations}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-cinzel font-bold text-xs hover:brightness-110 cursor-pointer"
                >
                  Filter
                </button>

                {admin.level <= 4 && (
                  <button
                    type="button"
                    onClick={handleExportCsv}
                    className="px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 font-cinzel font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" /> CSV Export
                  </button>
                )}
              </div>
            </div>

            {/* Registrations Table */}
            <div className="rounded-xl border border-amber-500/30 overflow-hidden bg-[#140b05] shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b0f07] border-b border-amber-500/30 font-cinzel uppercase text-amber-300">
                    <tr>
                      <th className="p-3">Attendee</th>
                      <th className="p-3">College & USN</th>
                      <th className="p-3">House</th>
                      <th className="p-3">Payment & UTR</th>
                      <th className="p-3">Receipt</th>
                      <th className="p-3">Check-In</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 font-sans">
                    {registrations.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-stone-400 font-serif italic">
                          No matching student registrations found in Hogwarts archives.
                        </td>
                      </tr>
                    ) : (
                      registrations.map((r) => (
                        <tr key={r.id} className="hover:bg-amber-950/20 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-stone-100">{r.fullName}</div>
                            <div className="text-[11px] text-stone-400">{r.email}</div>
                            <div className="text-[10px] text-stone-500">{r.phone}</div>
                          </td>
                          <td className="p-3">
                            <div className="text-stone-200">{r.college}</div>
                            <div className="text-[11px] text-stone-400">
                              {r.department} {r.usnOrRollNo && `• ${r.usnOrRollNo}`}
                            </div>
                          </td>
                          <td className="p-3 font-cinzel uppercase font-bold text-amber-300">
                            {r.houseId}
                          </td>

                          {/* Payment & UTR */}
                          <td className="p-3">
                            <div className="font-mono font-bold text-stone-200">
                              ₹{r.amount || 250}
                            </div>
                            <div className="my-1">
                              {r.paymentStatus === 'verified' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-[10px] font-bold">
                                  ✓ Verified
                                </span>
                              ) : r.paymentStatus === 'rejected' ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-950/60 border border-red-500/60 text-red-300 text-[10px] font-bold">
                                  ✕ Rejected
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-yellow-950/60 border border-yellow-500/60 text-yellow-300 text-[10px] font-bold">
                                  ⏳ Under Review
                                </span>
                              )}
                            </div>
                            {r.transactionId && (
                              <div className="font-mono text-[10px] text-amber-300/80 truncate max-w-[120px]" title={r.transactionId}>
                                UTR: {r.transactionId}
                              </div>
                            )}
                          </td>

                          {/* Receipt View Button */}
                          <td className="p-3">
                            {r.receiptUrl ? (
                              <button
                                type="button"
                                onClick={() => setViewingReceipt(r)}
                                className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/40 border border-amber-500/40 text-amber-300 text-[10px] font-cinzel font-bold flex items-center gap-1 cursor-pointer transition-colors"
                              >
                                <Eye className="w-3 h-3" /> View
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-500 italic">No receipt</span>
                            )}
                          </td>

                          {/* Check-In Attendance */}
                          <td className="p-3">
                            {r.checkedIn ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-500/60 text-emerald-300 text-[11px] font-bold">
                                <CheckCircle className="w-3 h-3" /> Attended
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-900 border border-stone-600 text-stone-400 text-[11px]">
                                <Clock className="w-3 h-3" /> Pending
                              </span>
                            )}
                          </td>

                          {/* Row Actions */}
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Check-In Toggle */}
                              {admin.level <= 4 && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleCheckin(r.id)}
                                  className={`px-2 py-1 rounded text-[10px] font-cinzel font-bold cursor-pointer transition-colors ${
                                    r.checkedIn
                                      ? 'border border-stone-600 text-stone-300 hover:bg-stone-800'
                                      : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                  }`}
                                >
                                  {r.checkedIn ? 'Revert' : 'Check In'}
                                </button>
                              )}

                              {/* Resend Owl Pass Email */}
                              {admin.level <= 4 && (
                                <button
                                  type="button"
                                  onClick={() => handleResendEmail(r.id, r.fullName)}
                                  className="p-1 rounded bg-amber-950/50 hover:bg-amber-900/60 border border-amber-500/30 text-amber-300 cursor-pointer transition-colors"
                                  title="Resend Hogwarts Acceptance Owl Letter"
                                >
                                  <Mail className="w-3.5 h-3.5" />
                                </button>
                              )}

                              {/* Super Admin Delete */}
                              {admin.level === 0 && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteRegistration(r.id, r.fullName)}
                                  className="p-1 rounded text-red-400 hover:text-red-300 hover:bg-red-950/40 cursor-pointer transition-colors"
                                  title="Permanently remove registration (Super Admin)"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 3: HOUSE CUP & POINTS LEDGER           */}
        {/* ========================================== */}
        {activeTab === 'points' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" /> Award or Deduct Points
              </h3>
              <p className="font-serif italic text-xs text-stone-400 mb-4">
                Changes immediately alter the great hourglasses and notify all houses.
              </p>

              {admin.level > 5 && admin.level !== 2 ? (
                <div className="p-4 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 text-xs font-serif italic">
                  Prefect clearance is read-only. House Cup scoring requires Level 5 (Scorekeeper) or higher.
                </div>
              ) : (
                <form onSubmit={handleAdjustPoints} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      House
                    </label>
                    <select
                      value={pointTargetHouse}
                      disabled={admin.level === 2}
                      onChange={(e) => setPointTargetHouse(e.target.value as any)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs focus:border-amber-400 outline-none"
                    >
                      <option value="gryffindor">Gryffindor</option>
                      <option value="slytherin">Slytherin</option>
                      <option value="ravenclaw">Ravenclaw</option>
                      <option value="hufflepuff">Hufflepuff</option>
                    </select>
                    {admin.level === 2 && (
                      <p className="text-[10px] text-amber-400 mt-1">
                        Locked to {admin.houseId?.toUpperCase()} as Head of House.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Points Adjustment
                    </label>
                    <div className="grid grid-cols-4 gap-2 mb-2">
                      {[10, 25, 50, -10].map((val) => (
                        <button
                          key={val}
                          type="button"
                          onClick={() => setPointDelta(val)}
                          className={`py-1.5 rounded text-xs font-mono font-bold cursor-pointer transition-colors ${
                            pointDelta === val
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-black/40 border border-amber-500/30 text-amber-200'
                          }`}
                        >
                          {val > 0 ? `+${val}` : val}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={pointDelta}
                      onChange={(e) => setPointDelta(parseInt(e.target.value, 10) || 0)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs focus:border-amber-400 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Reason / Justification *
                    </label>
                    <input
                      type="text"
                      required
                      value={pointReason}
                      onChange={(e) => setPointReason(e.target.value)}
                      placeholder="e.g. First place in INOVEX Code Hex"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 text-xs focus:border-amber-400 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmittingPoints}
                    className="w-full py-2.5 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 hover:brightness-110 cursor-pointer shadow-lg transition-all"
                  >
                    {isSubmittingPoints ? 'Inscribing Ledger...' : 'Commit Points to Ledger'}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" /> Chronological Scoring Ledger
              </h3>
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                {pointLogs.length === 0 ? (
                  <p className="text-stone-400 text-xs font-serif italic">No points history logged yet.</p>
                ) : (
                  pointLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-3 rounded-lg bg-black/40 border border-amber-500/20 flex items-center justify-between gap-3 text-xs"
                    >
                      <div>
                        <div className="font-bold text-stone-100 flex items-center gap-2">
                          <span
                            className={`font-mono font-bold ${
                              log.points >= 0 ? 'text-emerald-400' : 'text-red-400'
                            }`}
                          >
                            {log.points >= 0 ? `+${log.points}` : log.points}
                          </span>
                          <span className="font-cinzel uppercase text-amber-300">
                            to {log.houseId.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-stone-300 font-serif italic mt-0.5">"{log.reason}"</p>
                        <p className="text-[10px] text-stone-500 mt-1">
                          By {log.awardedBy} • {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 4: EVENTS & SCHEDULE                   */}
        {/* ========================================== */}
        {activeTab === 'events' && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Add Festival Event
              </h3>
              <p className="font-serif italic text-xs text-stone-400 mb-4">
                Adds a new competition or spectacle to the festival calendar.
              </p>

              {admin.level !== 0 && admin.level !== 1 && admin.level !== 3 ? (
                <div className="p-4 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 text-xs font-serif italic">
                  Event creation requires Level 3 (Chief Event Coordinator) or higher clearance.
                </div>
              ) : (
                <form onSubmit={handleCreateEvent} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Event Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={newEventTitle}
                      onChange={(e) => setNewEventTitle(e.target.value)}
                      placeholder="e.g. Algorithmic Wand Duel"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Category
                      </label>
                      <input
                        type="text"
                        value={newEventCategory}
                        onChange={(e) => setNewEventCategory(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Track
                      </label>
                      <select
                        value={newEventTrack}
                        onChange={(e) => setNewEventTrack(e.target.value)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      >
                        <option value="tech">Tech (INOVEX)</option>
                        <option value="management">Management (NEXORA)</option>
                        <option value="sports">Sports & Quidditch</option>
                        <option value="gaming">Gaming & Duels</option>
                        <option value="arts">Cultural & Arts</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Day
                      </label>
                      <select
                        value={newEventDay}
                        onChange={(e) => setNewEventDay(Number(e.target.value) as 1 | 2)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      >
                        <option value={1}>Day 1 (25 Oct)</option>
                        <option value={2}>Day 2 (26 Oct)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        House Points
                      </label>
                      <input
                        type="number"
                        value={newEventPoints}
                        onChange={(e) => setNewEventPoints(Number(e.target.value) || 0)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Time Slot
                    </label>
                    <input
                      type="text"
                      value={newEventTime}
                      onChange={(e) => setNewEventTime(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Venue
                    </label>
                    <input
                      type="text"
                      value={newEventVenue}
                      onChange={(e) => setNewEventVenue(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Description *
                    </label>
                    <textarea
                      rows={3}
                      required
                      value={newEventDesc}
                      onChange={(e) => setNewEventDesc(e.target.value)}
                      placeholder="Competition summary, rules, or guidelines..."
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingEvent}
                    className="w-full py-2.5 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 hover:brightness-110 cursor-pointer shadow-lg transition-all"
                  >
                    {isCreatingEvent ? 'Adding Event...' : 'Inscribe Event in Schedule'}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" /> Live Schedule Roster
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'quidditch-cup', title: 'Inter-House Quidditch Cup', venue: 'Quidditch Pitch', time: 'Day 1 • 11:00 AM', pts: 100 },
                    { id: 'hackathon-hex', title: 'Spellbound Hackathon (INOVEX MCA)', venue: 'Ada Lovelace Tech Lab', time: 'Day 1 • 10:00 AM', pts: 120 },
                    { id: 'management-triwizard', title: 'Triwizard Business Conclave (NEXORA MBA)', venue: 'Strategy Chamber', time: 'Day 2 • 10:30 AM', pts: 110 },
                    { id: 'potions-mastery', title: 'Potions & Mixology Conclave', venue: 'Alchemy Dungeons', time: 'Day 1 • 02:30 PM', pts: 80 },
                    { id: 'dueling-club', title: 'The Great Dueling Club', venue: 'Central Courtyard', time: 'Day 2 • 02:00 PM', pts: 90 },
                    { id: 'yule-ball', title: 'The Yule Ball & Cultural Night', venue: 'The Great Hall', time: 'Day 2 • 06:00 PM', pts: 50 },
                  ].map((evt) => (
                    <div key={evt.id} className="p-3.5 rounded-lg bg-black/40 border border-amber-500/20 text-xs flex flex-col justify-between">
                      <div>
                        <div className="font-cinzel font-bold text-amber-200 text-sm">{evt.title}</div>
                        <div className="text-[11px] text-stone-400 mt-1">{evt.venue} • {evt.time}</div>
                      </div>
                      <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                        <span className="font-mono text-amber-400 font-bold">+{evt.pts} pts</span>
                        {(admin.level === 0 || admin.level === 1 || admin.level === 3) && (
                          <button
                            type="button"
                            onClick={() => handleDeleteEvent(evt.id, evt.title)}
                            className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 5: STAFF & ADMINS (LEVEL 0 & 1)        */}
        {/* ========================================== */}
        {activeTab === 'staff' && (admin.level === 0 || admin.level === 1) && (
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-2 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Appoint Staff Member
              </h3>
              <p className="font-serif italic text-xs text-stone-400 mb-4">
                Issue magical credentials with tiered clearance from Level 1 to Level 6.
              </p>

              {admin.level !== 0 ? (
                <div className="p-4 rounded-lg bg-stone-900 border border-stone-700 text-stone-400 text-xs font-serif italic">
                  Only the Super Admin (Headmaster) holds the authority to create or banish staff accounts.
                </div>
              ) : (
                <form onSubmit={handleCreateStaff} className="space-y-3 font-sans text-xs">
                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={newStaffName}
                      onChange={(e) => setNewStaffName(e.target.value)}
                      placeholder="e.g. Prof. Remus Lupin"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Username *
                      </label>
                      <input
                        type="text"
                        required
                        value={newStaffUsername}
                        onChange={(e) => setNewStaffUsername(e.target.value)}
                        placeholder="lupin"
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Clearance Level *
                      </label>
                      <select
                        value={newStaffLevel}
                        onChange={(e) => setNewStaffLevel(Number(e.target.value) as AdminLevel)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      >
                        <option value={1}>Level 1 (Deputy)</option>
                        <option value={2}>Level 2 (House Head)</option>
                        <option value={3}>Level 3 (Event Lead)</option>
                        <option value={4}>Level 4 (Gatekeeper)</option>
                        <option value={5}>Level 5 (Scorekeeper)</option>
                        <option value={6}>Level 6 (Prefect)</option>
                      </select>
                    </div>
                  </div>

                  {newStaffLevel === 2 && (
                    <div>
                      <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                        Assigned House (Level 2)
                      </label>
                      <select
                        value={newStaffHouse}
                        onChange={(e) => setNewStaffHouse(e.target.value as any)}
                        className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                      >
                        <option value="gryffindor">Gryffindor</option>
                        <option value="slytherin">Slytherin</option>
                        <option value="ravenclaw">Ravenclaw</option>
                        <option value="hufflepuff">Hufflepuff</option>
                      </select>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Owl Email *
                    </label>
                    <input
                      type="email"
                      required
                      value={newStaffEmail}
                      onChange={(e) => setNewStaffEmail(e.target.value)}
                      placeholder="lupin@hogwarts.edu"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-cinzel uppercase text-amber-300 font-bold mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      required
                      value={newStaffPassword}
                      onChange={(e) => setNewStaffPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full px-3 py-2 rounded-lg bg-[#1a0f07] border border-amber-500/30 text-stone-200 outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingStaff}
                    className="w-full py-2.5 rounded-xl font-cinzel font-black text-xs uppercase tracking-widest bg-gradient-to-r from-amber-400 to-amber-600 text-stone-950 hover:brightness-110 cursor-pointer shadow-lg transition-all"
                  >
                    {isCreatingStaff ? 'Appointing...' : 'Grant Staff Warrant'}
                  </button>
                </form>
              )}
            </div>

            <div className="lg:col-span-2 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" /> Staff Roster & Clearance (Levels 0–6)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#1b0f07] border-b border-amber-500/30 font-cinzel uppercase text-amber-300">
                    <tr>
                      <th className="p-3">Staff Member</th>
                      <th className="p-3">Clearance Rank</th>
                      <th className="p-3">Email & User</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-amber-500/10 font-sans">
                    {staffList.map((s) => {
                      const badge = LEVEL_BADGES[s.level]
                      return (
                        <tr key={s.id} className="hover:bg-amber-950/20 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-stone-100">
                              {s.fullName}
                            </div>
                            {s.houseId && (
                              <div className="text-[10px] text-amber-400 uppercase font-mono">
                                House: {s.houseId}
                              </div>
                            )}
                          </td>
                          <td className="p-3">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${badge.bg} ${badge.color} border ${badge.border}`}>
                              {badge.label}
                            </span>
                          </td>
                          <td className="p-3 text-stone-300">
                            <div>{s.email}</div>
                            <div className="text-[10px] text-stone-500 font-mono">@{s.username}</div>
                          </td>
                          <td className="p-3 text-right">
                            {admin.level === 0 && s.id !== admin.id ? (
                              <button
                                type="button"
                                onClick={() => handleDeleteStaff(s.id, s.fullName)}
                                className="text-red-400 hover:text-red-300 text-[11px] cursor-pointer"
                              >
                                Revoke
                              </button>
                            ) : (
                              <span className="text-[10px] text-stone-500 italic">Protected</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================== */}
        {/* TAB 6: AUDIT LOGS (SUPER ADMIN LEVEL 0)    */}
        {/* ========================================== */}
        {activeTab === 'logs' && admin.level === 0 && (
          <div className="mt-6 p-6 rounded-xl bg-[#140b05] border border-amber-500/30 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-cinzel font-bold text-sm uppercase text-amber-300 flex items-center gap-2">
                <Shield className="w-4 h-4 text-amber-400" /> Ministry Security Audit Trail
              </h3>
              <span className="text-xs text-stone-400 font-mono">Showing {auditLogs.length} events</span>
            </div>

            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-2">
              {auditLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg bg-black/40 border border-amber-500/20 text-xs font-mono flex items-start justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-bold text-[10px]">
                        {log.action}
                      </span>
                      <span className="text-stone-300">{log.performedBy} (L{log.adminLevel})</span>
                    </div>
                    <p className="text-stone-400 font-sans text-xs mt-1">{log.details}</p>
                  </div>
                  <div className="text-[10px] text-stone-500 text-right shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                    <div className="text-[9px]">{new Date(log.timestamp).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* ========================================== */}
      {/* LIGHTBOX MODAL: PAYMENT RECEIPT VIEWER     */}
      {/* ========================================== */}
      <AnimatePresence>
        {viewingReceipt && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewingReceipt(null)}
              className="fixed inset-0 bg-black/85 backdrop-blur-md"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-xl bg-gradient-to-b from-[#180e07] via-[#120803] to-[#070301] border-2 border-amber-500/50 rounded-2xl shadow-[0_0_60px_rgba(245,158,11,0.3)] p-5 z-10 overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 border-b border-amber-500/30 mb-4">
                <div>
                  <span className="font-cinzel text-[10px] text-amber-400 font-bold uppercase tracking-widest block">
                    ✦ Payment Verification ✦
                  </span>
                  <h3 className="font-cinzel font-bold text-base text-amber-200">
                    Receipt for {viewingReceipt.fullName}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setViewingReceipt(null)}
                  className="p-1 rounded-full text-stone-400 hover:text-white cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Receipt Image / PDF */}
              <div className="bg-black/80 rounded-xl p-2 border border-amber-500/20 max-h-[360px] flex items-center justify-center overflow-hidden mb-4">
                {viewingReceipt.receiptUrl ? (
                  viewingReceipt.receiptUrl.endsWith('.pdf') ? (
                    <div className="py-12 text-center">
                      <CreditCard className="w-12 h-12 text-amber-400 mx-auto mb-2" />
                      <p className="text-xs text-stone-300 mb-3">PDF Payment Document Attached</p>
                      <a
                        href={viewingReceipt.receiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-1.5 rounded-lg bg-amber-500 text-stone-950 font-cinzel text-xs font-bold"
                      >
                        Open PDF in New Tab
                      </a>
                    </div>
                  ) : (
                    <img
                      src={viewingReceipt.receiptUrl}
                      alt="Uploaded Payment Receipt"
                      className="max-h-[340px] max-w-full object-contain rounded-lg"
                    />
                  )
                ) : (
                  <div className="py-12 text-stone-500 text-xs italic">No receipt file uploaded.</div>
                )}
              </div>

              {/* Payment Details Metadata */}
              <div className="p-3 rounded-lg bg-black/50 border border-amber-500/20 text-xs grid grid-cols-2 gap-2 mb-4 font-sans">
                <div>
                  <span className="text-stone-400">Pass Amount:</span>{' '}
                  <strong className="text-stone-100 font-mono">₹{viewingReceipt.amount || 250}</strong>
                </div>
                <div>
                  <span className="text-stone-400">House:</span>{' '}
                  <strong className="text-amber-300 font-cinzel uppercase">{viewingReceipt.houseId}</strong>
                </div>
                <div className="col-span-2">
                  <span className="text-stone-400">Transaction Ref (UTR):</span>{' '}
                  <strong className="text-amber-200 font-mono text-[11px]">{viewingReceipt.transactionId || 'None Provided'}</strong>
                </div>
                <div>
                  <span className="text-stone-400">Current Status:</span>{' '}
                  <strong className={`uppercase ${viewingReceipt.paymentStatus === 'verified' ? 'text-emerald-400' : viewingReceipt.paymentStatus === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                    {viewingReceipt.paymentStatus}
                  </strong>
                </div>
                <div>
                  <span className="text-stone-400">Email Dispatched:</span>{' '}
                  <strong className={viewingReceipt.emailDispatched ? 'text-emerald-400' : 'text-stone-500'}>
                    {viewingReceipt.emailDispatched ? '✓ Yes' : 'Pending'}
                  </strong>
                </div>
              </div>

              {/* Admin Actions for Verification (Level 4 and above) */}
              {admin.level <= 4 && (
                <div className="flex items-center gap-2 pt-1 border-t border-amber-500/20">
                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(viewingReceipt.id, 'verified')}
                    className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-cinzel text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" /> Approve & Mark Verified (+10 Pts)
                  </button>

                  <button
                    type="button"
                    onClick={() => handleUpdatePaymentStatus(viewingReceipt.id, 'rejected')}
                    className="py-2 px-3 rounded-xl border border-red-500/40 bg-red-950/40 hover:bg-red-950/80 text-red-300 font-cinzel text-xs font-bold transition-colors cursor-pointer"
                    title="Reject Payment Receipt"
                  >
                    Reject
                  </button>

                  <button
                    type="button"
                    onClick={() => handleResendEmail(viewingReceipt.id, viewingReceipt.fullName)}
                    className="p-2 rounded-xl border border-amber-500/30 bg-amber-950/40 hover:bg-amber-900/60 text-amber-300 cursor-pointer"
                    title="Resend Hogwarts Acceptance Owl Letter"
                  >
                    <Mail className="w-4 h-4" />
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
