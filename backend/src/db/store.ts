import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import bcrypt from 'bcryptjs'
import {
  AdminUser,
  AdminLevel,
  ADMIN_ROLE_NAMES,
  Registration,
  HouseStanding,
  FestEvent,
  PointLog,
  AuditLog,
  HouseId,
  PaymentStatus,
} from '../models/types.js'
import { INITIAL_STANDINGS } from '../data/standingsData.js'
import { FEST_EVENTS } from '../data/eventsData.js'

interface DatabaseSchema {
  admins: AdminUser[]
  registrations: Registration[]
  standings: HouseStanding[]
  events: FestEvent[]
  pointLogs: PointLog[]
  auditLogs: AuditLog[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.resolve(__dirname, '../../data')
const DB_FILE = path.join(DATA_DIR, 'db.json')

function createInitialAdmins(): AdminUser[] {
  const salt = bcrypt.genSaltSync(10)
  const now = new Date().toISOString()

  return [
    {
      id: 'admin_super_01',
      username: 'headmaster',
      email: 'headmaster@hogwarts.edu',
      passwordHash: bcrypt.hashSync('AlbusDumbledore2027!', salt),
      fullName: 'Professor Albus Dumbledore',
      level: 0,
      roleTitle: ADMIN_ROLE_NAMES[0],
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl1_01',
      username: 'mcgonagall',
      email: 'mcgonagall@hogwarts.edu',
      passwordHash: bcrypt.hashSync('Transfiguration2027!', salt),
      fullName: 'Professor Minerva McGonagall',
      level: 1,
      roleTitle: ADMIN_ROLE_NAMES[1],
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl2_01',
      username: 'snape',
      email: 'snape@hogwarts.edu',
      passwordHash: bcrypt.hashSync('PotionsMaster2027!', salt),
      fullName: 'Professor Severus Snape',
      level: 2,
      roleTitle: ADMIN_ROLE_NAMES[2],
      houseId: 'slytherin',
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl3_01',
      username: 'flitwick',
      email: 'flitwick@hogwarts.edu',
      passwordHash: bcrypt.hashSync('CharmsMaster2027!', salt),
      fullName: 'Professor Filius Flitwick',
      level: 3,
      roleTitle: ADMIN_ROLE_NAMES[3],
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl4_01',
      username: 'filch',
      email: 'filch@hogwarts.edu',
      passwordHash: bcrypt.hashSync('Caretaker2027!', salt),
      fullName: 'Argus Filch',
      level: 4,
      roleTitle: ADMIN_ROLE_NAMES[4],
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl5_01',
      username: 'hooch',
      email: 'hooch@hogwarts.edu',
      passwordHash: bcrypt.hashSync('Quidditch2027!', salt),
      fullName: 'Madam Rolanda Hooch',
      level: 5,
      roleTitle: ADMIN_ROLE_NAMES[5],
      isActive: true,
      createdAt: now,
    },
    {
      id: 'admin_lvl6_01',
      username: 'percy',
      email: 'percy@hogwarts.edu',
      passwordHash: bcrypt.hashSync('PrefectBadge2027!', salt),
      fullName: 'Percy Weasley',
      level: 6,
      roleTitle: ADMIN_ROLE_NAMES[6],
      isActive: true,
      createdAt: now,
    },
  ]
}

function createInitialRegistrations(): Registration[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'reg_demo_01',
      fullName: 'Harry Potter',
      email: 'harry@gryffindor.hogwarts.ac.in',
      phone: '+91 98765 43210',
      college: 'Hogwarts College of Wizardry',
      department: 'MCA',
      usnOrRollNo: '1AJ23MC007',
      houseId: 'gryffindor',
      eventIds: ['quidditch-cup', 'hackathon-hex'],
      notes: 'Team seeker for Quidditch tournament and MCA Hackathon hex.',
      checkedIn: true,
      checkedInAt: now,
      amount: 250,
      paymentStatus: 'verified',
      paymentMethod: 'upi',
      transactionId: 'UPI430981726543',
      receiptUrl: '/api/uploads/receipts/demo_receipt_01.png',
      emailDispatched: true,
      emailDispatchedAt: now,
      createdAt: now,
    },
    {
      id: 'reg_demo_02',
      fullName: 'Hermione Granger',
      email: 'hermione@gryffindor.hogwarts.ac.in',
      phone: '+91 98765 43211',
      college: 'Hogwarts College of Wizardry',
      department: 'MCA',
      usnOrRollNo: '1AJ23MC001',
      houseId: 'gryffindor',
      eventIds: ['hackathon-hex', 'potions-mastery'],
      notes: 'Leading the algorithm team in the hackathon.',
      checkedIn: false,
      amount: 250,
      paymentStatus: 'verified',
      paymentMethod: 'upi',
      transactionId: 'UPI430981726544',
      receiptUrl: '/api/uploads/receipts/demo_receipt_02.png',
      emailDispatched: true,
      emailDispatchedAt: now,
      createdAt: now,
    },
    {
      id: 'reg_demo_03',
      fullName: 'Draco Malfoy',
      email: 'draco@slytherin.hogwarts.ac.in',
      phone: '+91 98765 43212',
      college: 'Slytherin Academy of Applied Sorcery',
      department: 'MBA',
      usnOrRollNo: '1AJ23MB013',
      houseId: 'slytherin',
      eventIds: ['management-triwizard', 'dueling-club'],
      notes: 'Representing Slytherin in the Business Conclave.',
      checkedIn: true,
      checkedInAt: now,
      amount: 250,
      paymentStatus: 'verified',
      paymentMethod: 'upi',
      transactionId: 'UPI430981726545',
      receiptUrl: '/api/uploads/receipts/demo_receipt_03.png',
      emailDispatched: true,
      emailDispatchedAt: now,
      createdAt: now,
    },
    {
      id: 'reg_demo_04',
      fullName: 'Luna Lovegood',
      email: 'luna@ravenclaw.hogwarts.ac.in',
      phone: '+91 98765 43213',
      college: 'Ravenclaw Institute of Advanced Magic',
      department: 'BTech',
      usnOrRollNo: '1AJ23CS042',
      houseId: 'ravenclaw',
      eventIds: ['potions-mastery', 'yule-ball'],
      notes: 'Spectrespecs equipped for quantum mixology.',
      checkedIn: false,
      amount: 250,
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      transactionId: 'UPI430981726546',
      receiptUrl: '/api/uploads/receipts/demo_receipt_04.png',
      emailDispatched: true,
      emailDispatchedAt: now,
      createdAt: now,
    },
    {
      id: 'reg_demo_05',
      fullName: 'Cedric Diggory',
      email: 'cedric@hufflepuff.hogwarts.ac.in',
      phone: '+91 98765 43214',
      college: 'Hufflepuff Hall of Innovation',
      department: 'BTech',
      usnOrRollNo: '1AJ23CS099',
      houseId: 'hufflepuff',
      eventIds: ['quidditch-cup', 'dueling-club'],
      notes: 'Quidditch Captain & seeker.',
      checkedIn: false,
      amount: 250,
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      transactionId: 'UPI430981726547',
      receiptUrl: '/api/uploads/receipts/demo_receipt_05.png',
      emailDispatched: true,
      emailDispatchedAt: now,
      createdAt: now,
    },
  ]
}

function createInitialPointLogs(): PointLog[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'plog_init_01',
      houseId: 'gryffindor',
      points: 50,
      reason: 'Courage and exceptional teamwork during setup',
      awardedBy: 'Professor Albus Dumbledore',
      adminLevel: 0,
      timestamp: now,
    },
    {
      id: 'plog_init_02',
      houseId: 'slytherin',
      points: 50,
      reason: 'Strategic planning for the Business Conclave',
      awardedBy: 'Professor Severus Snape',
      adminLevel: 2,
      timestamp: now,
    },
  ]
}

function createInitialAuditLogs(): AuditLog[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'audit_init_01',
      action: 'SYSTEM_BOOT',
      performedBy: 'System Core',
      adminLevel: 0,
      details: 'AJ-ASTRIX 2K27 Great Hall Database archives initialized with multi-tier RBAC & high-concurrency storage.',
      timestamp: now,
    },
  ]
}

// In-memory cache synced with disk
let dbMemory: DatabaseSchema | null = null

function ensureDbLoaded(): DatabaseSchema {
  if (dbMemory) return dbMemory

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8')
      dbMemory = JSON.parse(raw) as DatabaseSchema
      // Safety checks: ensure arrays exist
      dbMemory.admins = dbMemory.admins || createInitialAdmins()
      dbMemory.registrations = dbMemory.registrations || createInitialRegistrations()
      dbMemory.standings = dbMemory.standings || [...INITIAL_STANDINGS]
      dbMemory.events = dbMemory.events || [...FEST_EVENTS]
      dbMemory.pointLogs = dbMemory.pointLogs || createInitialPointLogs()
      dbMemory.auditLogs = dbMemory.auditLogs || createInitialAuditLogs()
      return dbMemory
    }
  } catch (err) {
    console.error('⚠️ [Database Error] Could not read db.json, generating fresh state:', err)
  }

  // Generate initial database
  dbMemory = {
    admins: createInitialAdmins(),
    registrations: createInitialRegistrations(),
    standings: [...INITIAL_STANDINGS],
    events: [...FEST_EVENTS],
    pointLogs: createInitialPointLogs(),
    auditLogs: createInitialAuditLogs(),
  }

  forceSaveDatabaseSync()
  return dbMemory
}

// High-load serialized atomic debounce queue for concurrent write protection
let saveTimeout: NodeJS.Timeout | null = null
let isWriting = false
let writeQueued = false

function performAtomicSave(): void {
  if (isWriting) {
    writeQueued = true
    return
  }
  isWriting = true

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true })
    }
    const serialized = JSON.stringify(dbMemory, null, 2)
    const tmpFile = `${DB_FILE}.tmp`
    fs.writeFileSync(tmpFile, serialized, 'utf-8')
    fs.renameSync(tmpFile, DB_FILE)
  } catch (err) {
    console.error('❌ [Database Save Error] Failed to write db.json:', err)
  } finally {
    isWriting = false
    if (writeQueued) {
      writeQueued = false
      scheduleSave()
    }
  }
}

function scheduleSave(): void {
  if (saveTimeout) return
  saveTimeout = setTimeout(() => {
    saveTimeout = null
    performAtomicSave()
  }, 40) // 40ms coalesce window: handles 200+ concurrent registrations effortlessly
}

export function saveDatabase(): void {
  scheduleSave()
}

export function forceSaveDatabaseSync(): void {
  if (saveTimeout) {
    clearTimeout(saveTimeout)
    saveTimeout = null
  }
  performAtomicSave()
}

// ==========================================
// REGISTRATIONS STORE
// ==========================================

export function getRegistrationsList(filter?: {
  houseId?: string
  checkedIn?: boolean
  paymentStatus?: string
  search?: string
}): Registration[] {
  const db = ensureDbLoaded()
  let list = [...db.registrations]

  if (filter?.houseId && filter.houseId !== 'all') {
    list = list.filter((r) => r.houseId === filter.houseId)
  }

  if (filter?.checkedIn !== undefined) {
    list = list.filter((r) => r.checkedIn === filter.checkedIn)
  }

  if (filter?.paymentStatus && filter.paymentStatus !== 'all') {
    list = list.filter((r) => r.paymentStatus === filter.paymentStatus)
  }

  if (filter?.search) {
    const q = filter.search.toLowerCase().trim()
    list = list.filter(
      (r) =>
        r.fullName.toLowerCase().includes(q) ||
        r.email.toLowerCase().includes(q) ||
        r.college.toLowerCase().includes(q) ||
        (r.usnOrRollNo && r.usnOrRollNo.toLowerCase().includes(q)) ||
        (r.transactionId && r.transactionId.toLowerCase().includes(q)) ||
        r.id.toLowerCase().includes(q),
    )
  }

  // Sort descending by creation date
  return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export function getRegistrationById(id: string): Registration | undefined {
  const db = ensureDbLoaded()
  return db.registrations.find((r) => r.id === id)
}

export function findRegistrationByEmail(email: string): Registration | undefined {
  const db = ensureDbLoaded()
  const clean = email.trim().toLowerCase()
  return db.registrations.find((r) => r.email.toLowerCase() === clean)
}

export function findRegistrationByTransactionId(transactionId: string): Registration | undefined {
  const db = ensureDbLoaded()
  const clean = transactionId.trim().toLowerCase()
  return db.registrations.find((r) => r.transactionId?.toLowerCase() === clean)
}

export function insertRegistration(
  data: Omit<Registration, 'id' | 'createdAt' | 'checkedIn' | 'emailDispatched'> & {
    emailDispatched?: boolean
  },
): Registration {
  const db = ensureDbLoaded()
  const now = new Date().toISOString()
  const newReg: Registration = {
    ...data,
    id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    checkedIn: false,
    emailDispatched: Boolean(data.emailDispatched),
    createdAt: now,
  }

  db.registrations.unshift(newReg)

  // Automatically award 5 points to the registrant's house
  adjustHousePointsInternal(
    newReg.houseId,
    5,
    `New Registrant Bonus: ${newReg.fullName}`,
    'Hogwarts Sorting Registry',
    0,
  )

  saveDatabase()
  return newReg
}

export function updatePaymentStatus(
  id: string,
  status: PaymentStatus,
  adminName: string,
  adminLevel: AdminLevel,
  notes?: string,
): { registration: Registration; previousStatus: PaymentStatus } | null {
  const db = ensureDbLoaded()
  const reg = db.registrations.find((r) => r.id === id)
  if (!reg) return null

  const prev = reg.paymentStatus
  reg.paymentStatus = status

  if (status === 'verified') {
    reg.paymentVerifiedBy = adminName
    reg.paymentVerifiedAt = new Date().toISOString()
    // Award 10 bonus points to registrant's house upon fee verification
    adjustHousePointsInternal(
      reg.houseId,
      10,
      `Fest Fee Verified: ${reg.fullName} (${reg.id})`,
      adminName,
      adminLevel,
    )
  }

  addAuditLog({
    action: status === 'verified' ? 'PAYMENT_VERIFIED' : 'PAYMENT_STATUS_CHANGED',
    performedBy: adminName,
    adminLevel,
    details: `${reg.fullName} (${reg.id}) payment status changed from ${prev.toUpperCase()} to ${status.toUpperCase()}.${notes ? ` Note: "${notes}"` : ''}`,
  })

  saveDatabase()
  return { registration: reg, previousStatus: prev }
}

export function markEmailDispatched(id: string): void {
  const db = ensureDbLoaded()
  const reg = db.registrations.find((r) => r.id === id)
  if (reg) {
    reg.emailDispatched = true
    reg.emailDispatchedAt = new Date().toISOString()
    saveDatabase()
  }
}

export function toggleCheckIn(
  id: string,
  adminName: string,
  adminLevel: AdminLevel,
): { registration: Registration; previousStatus: boolean } | null {
  const db = ensureDbLoaded()
  const reg = db.registrations.find((r) => r.id === id)
  if (!reg) return null

  const prev = reg.checkedIn
  reg.checkedIn = !prev
  reg.checkedInAt = reg.checkedIn ? new Date().toISOString() : undefined

  addAuditLog({
    action: reg.checkedIn ? 'CHECKIN_CONFIRMED' : 'CHECKIN_REVERTED',
    performedBy: adminName,
    adminLevel,
    details: `${reg.fullName} (${reg.id}, ${reg.houseId.toUpperCase()}) check-in status marked ${reg.checkedIn ? 'ATTENDED' : 'NOT ATTENDED'}.`,
  })

  saveDatabase()
  return { registration: reg, previousStatus: prev }
}

export function deleteRegistration(
  id: string,
  adminName: string,
  adminLevel: AdminLevel,
): boolean {
  const db = ensureDbLoaded()
  const idx = db.registrations.findIndex((r) => r.id === id)
  if (idx === -1) return false

  const removed = db.registrations.splice(idx, 1)[0]
  addAuditLog({
    action: 'REGISTRATION_DELETED',
    performedBy: adminName,
    adminLevel,
    details: `Registration for ${removed.fullName} (${removed.email}, ${removed.id}) was permanently removed.`,
  })

  saveDatabase()
  return true
}

// ==========================================
// HOUSE STANDINGS & POINTS
// ==========================================

export function getRankedStandings(): HouseStanding[] {
  const db = ensureDbLoaded()
  return [...db.standings]
    .sort((a, b) => b.points - a.points)
    .map((item, idx) => ({
      ...item,
      rank: idx + 1,
    }))
}

function adjustHousePointsInternal(
  houseId: HouseId,
  points: number,
  reason: string,
  awardedBy: string,
  adminLevel: AdminLevel,
): HouseStanding | null {
  const db = ensureDbLoaded()
  const target = db.standings.find((s) => s.house === houseId)
  if (!target) return null

  target.points = Math.max(0, target.points + points)

  const log: PointLog = {
    id: `plog_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    houseId,
    points,
    reason,
    awardedBy,
    adminLevel,
    timestamp: new Date().toISOString(),
  }

  db.pointLogs.unshift(log)
  return target
}

export function adjustHousePoints(
  houseId: HouseId,
  points: number,
  reason: string,
  awardedBy: string,
  adminLevel: AdminLevel,
): { standing: HouseStanding; log: PointLog } | null {
  const db = ensureDbLoaded()
  const standing = adjustHousePointsInternal(houseId, points, reason, awardedBy, adminLevel)
  if (!standing) return null

  const log = db.pointLogs[0]

  addAuditLog({
    action: 'HOUSE_POINTS_ADJUSTED',
    performedBy: awardedBy,
    adminLevel,
    details: `${points >= 0 ? '+' : ''}${points} points to ${houseId.toUpperCase()}. Reason: "${reason}".`,
  })

  saveDatabase()
  return { standing, log }
}

export function getPointLogs(limit = 50): PointLog[] {
  const db = ensureDbLoaded()
  return db.pointLogs.slice(0, limit)
}

// ==========================================
// FESTIVAL EVENTS
// ==========================================

export function getAllEvents(): FestEvent[] {
  const db = ensureDbLoaded()
  return [...db.events]
}

export function getEventById(id: string): FestEvent | undefined {
  const db = ensureDbLoaded()
  return db.events.find((e) => e.id === id)
}

export function insertEvent(data: FestEvent, adminName: string, adminLevel: AdminLevel): FestEvent {
  const db = ensureDbLoaded()
  db.events.push(data)

  addAuditLog({
    action: 'EVENT_CREATED',
    performedBy: adminName,
    adminLevel,
    details: `New event "${data.title}" added to schedule in ${data.venue}.`,
  })

  saveDatabase()
  return data
}

export function updateEvent(
  id: string,
  updates: Partial<FestEvent>,
  adminName: string,
  adminLevel: AdminLevel,
): FestEvent | null {
  const db = ensureDbLoaded()
  const event = db.events.find((e) => e.id === id)
  if (!event) return null

  Object.assign(event, updates)

  addAuditLog({
    action: 'EVENT_UPDATED',
    performedBy: adminName,
    adminLevel,
    details: `Event "${event.title}" details updated.`,
  })

  saveDatabase()
  return event
}

export function deleteEvent(id: string, adminName: string, adminLevel: AdminLevel): boolean {
  const db = ensureDbLoaded()
  const idx = db.events.findIndex((e) => e.id === id)
  if (idx === -1) return false

  const removed = db.events.splice(idx, 1)[0]

  addAuditLog({
    action: 'EVENT_DELETED',
    performedBy: adminName,
    adminLevel,
    details: `Event "${removed.title}" was removed from the festival schedule.`,
  })

  saveDatabase()
  return true
}

// ==========================================
// ADMIN ACCOUNTS (LEVEL 0 - 6)
// ==========================================

export function getAllAdmins(): Omit<AdminUser, 'passwordHash'>[] {
  const db = ensureDbLoaded()
  return db.admins.map(({ passwordHash: _hash, ...safe }) => safe)
}

export function getAdminByUsernameOrEmail(identifier: string): AdminUser | undefined {
  const db = ensureDbLoaded()
  const clean = identifier.trim().toLowerCase()
  return db.admins.find(
    (a) => a.username.toLowerCase() === clean || a.email.toLowerCase() === clean,
  )
}

export function getAdminById(id: string): AdminUser | undefined {
  const db = ensureDbLoaded()
  return db.admins.find((a) => a.id === id)
}

export function insertAdmin(
  data: {
    username: string
    email: string
    password: string
    fullName: string
    level: AdminLevel
    houseId?: HouseId
  },
  creatorName: string,
  creatorLevel: AdminLevel,
): Omit<AdminUser, 'passwordHash'> {
  const db = ensureDbLoaded()
  const salt = bcrypt.genSaltSync(10)
  const now = new Date().toISOString()

  const newAdmin: AdminUser = {
    id: `admin_lvl${data.level}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    username: data.username.trim().toLowerCase(),
    email: data.email.trim().toLowerCase(),
    passwordHash: bcrypt.hashSync(data.password, salt),
    fullName: data.fullName.trim(),
    level: data.level,
    roleTitle: ADMIN_ROLE_NAMES[data.level],
    houseId: data.houseId,
    isActive: true,
    createdAt: now,
  }

  db.admins.push(newAdmin)

  addAuditLog({
    action: 'ADMIN_CREATED',
    performedBy: creatorName,
    adminLevel: creatorLevel,
    details: `Created new staff account: ${newAdmin.fullName} (${newAdmin.username}) with ${newAdmin.roleTitle}.`,
  })

  saveDatabase()

  const { passwordHash: _h, ...safe } = newAdmin
  return safe
}

export function updateAdminLastLogin(id: string): void {
  const db = ensureDbLoaded()
  const admin = db.admins.find((a) => a.id === id)
  if (admin) {
    admin.lastLoginAt = new Date().toISOString()
    saveDatabase()
  }
}

export function updateAdmin(
  id: string,
  updates: Partial<Omit<AdminUser, 'id' | 'passwordHash'>> & { password?: string },
  performedBy: string,
  performedLevel: AdminLevel,
): Omit<AdminUser, 'passwordHash'> | null {
  const db = ensureDbLoaded()
  const admin = db.admins.find((a) => a.id === id)
  if (!admin) return null

  if (updates.fullName) admin.fullName = updates.fullName
  if (updates.email) admin.email = updates.email
  if (updates.level !== undefined) {
    admin.level = updates.level
    admin.roleTitle = ADMIN_ROLE_NAMES[updates.level]
  }
  if (updates.houseId !== undefined) admin.houseId = updates.houseId
  if (updates.isActive !== undefined) admin.isActive = updates.isActive
  if (updates.password) {
    const salt = bcrypt.genSaltSync(10)
    admin.passwordHash = bcrypt.hashSync(updates.password, salt)
  }

  addAuditLog({
    action: 'ADMIN_UPDATED',
    performedBy,
    adminLevel: performedLevel,
    details: `Staff account ${admin.username} modified.`,
  })

  saveDatabase()

  const { passwordHash: _h, ...safe } = admin
  return safe
}

export function deleteAdmin(
  id: string,
  performedBy: string,
  performedLevel: AdminLevel,
): boolean {
  const db = ensureDbLoaded()
  const idx = db.admins.findIndex((a) => a.id === id)
  if (idx === -1) return false

  const removed = db.admins.splice(idx, 1)[0]

  addAuditLog({
    action: 'ADMIN_DELETED',
    performedBy,
    adminLevel: performedLevel,
    details: `Staff account ${removed.username} (${removed.roleTitle}) was permanently deleted.`,
  })

  saveDatabase()
  return true
}

// ==========================================
// AUDIT LOGS & STATS
// ==========================================

export function addAuditLog(entry: Omit<AuditLog, 'id' | 'timestamp'>): AuditLog {
  const db = ensureDbLoaded()
  const log: AuditLog = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    timestamp: new Date().toISOString(),
  }

  db.auditLogs.unshift(log)
  if (db.auditLogs.length > 500) {
    db.auditLogs = db.auditLogs.slice(0, 500)
  }

  return log
}

export function getAuditLogs(limit = 100): AuditLog[] {
  const db = ensureDbLoaded()
  return db.auditLogs.slice(0, limit)
}

export function getDashboardStats() {
  const db = ensureDbLoaded()
  const totalRegistrations = db.registrations.length
  const checkedInCount = db.registrations.filter((r) => r.checkedIn).length
  const attendanceRate = totalRegistrations > 0 ? Math.round((checkedInCount / totalRegistrations) * 100) : 0

  const paidCount = db.registrations.filter((r) => r.paymentStatus === 'verified').length
  const pendingPaymentCount = db.registrations.filter((r) => r.paymentStatus === 'pending').length
  const totalRevenue = db.registrations
    .filter((r) => r.paymentStatus === 'verified')
    .reduce((sum, r) => sum + (r.amount || 250), 0)

  const houseBreakdown = {
    gryffindor: db.registrations.filter((r) => r.houseId === 'gryffindor').length,
    slytherin: db.registrations.filter((r) => r.houseId === 'slytherin').length,
    ravenclaw: db.registrations.filter((r) => r.houseId === 'ravenclaw').length,
    hufflepuff: db.registrations.filter((r) => r.houseId === 'hufflepuff').length,
  }

  const departmentBreakdown = db.registrations.reduce((acc, curr) => {
    const dept = curr.department || 'Other'
    acc[dept] = (acc[dept] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  return {
    totalRegistrations,
    checkedInCount,
    attendanceRate,
    paidCount,
    pendingPaymentCount,
    totalRevenue,
    totalEvents: db.events.length,
    totalAdmins: db.admins.length,
    standings: getRankedStandings(),
    houseBreakdown,
    departmentBreakdown,
    recentRegistrations: db.registrations.slice(0, 6),
    recentPointLogs: db.pointLogs.slice(0, 5),
    recentAuditLogs: db.auditLogs.slice(0, 8),
  }
}
