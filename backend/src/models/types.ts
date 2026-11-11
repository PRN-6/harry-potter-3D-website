export type HouseId = 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'

/**
 * Multi-Tier Admin Hierarchy:
 * 0 = Super Admin (Headmaster) — Supreme control over all data, staff, and system
 * 1 = Level 1 (Deputy Headmaster) — High-level event, registrations, and standings control
 * 2 = Level 2 (Head of House) — House-specific authority (points, house registrants)
 * 3 = Level 3 (Event Coordinator) — Schedule, venue, and competition management
 * 4 = Level 4 (Gatekeeper / Desk) — Attendee check-ins and pass verification
 * 5 = Level 5 (Scorekeeper / Usher) — House points adjustment and scoring ledger
 * 6 = Level 6 (Prefect / Observer) — Read-only observation of stats & schedules
 */
export type AdminLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export const ADMIN_ROLE_NAMES: Record<AdminLevel, string> = {
  0: 'Super Admin · Headmaster',
  1: 'Level 1 · Deputy Headmaster',
  2: 'Level 2 · Head of House',
  3: 'Level 3 · Chief Event Coordinator',
  4: 'Level 4 · Gatekeeper & Desk',
  5: 'Level 5 · House Cup Scorekeeper',
  6: 'Level 6 · Prefect Observer',
}

export type PaymentStatus = 'pending' | 'verified' | 'rejected' | 'exempt'
export type PaymentMethod = 'upi' | 'cash_at_desk' | 'free_pass'

export interface AdminUser {
  id: string
  username: string
  email: string
  passwordHash: string
  fullName: string
  level: AdminLevel
  roleTitle: string
  houseId?: HouseId // relevant for Level 2 (Head of House)
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface AdminTokenPayload {
  id: string
  username: string
  email: string
  fullName: string
  level: AdminLevel
  roleTitle: string
  houseId?: HouseId
}

export interface PointLog {
  id: string
  houseId: HouseId
  points: number
  reason: string
  awardedBy: string
  adminLevel: AdminLevel
  timestamp: string
}

export interface AuditLog {
  id: string
  action: string
  performedBy: string
  adminLevel: AdminLevel
  details: string
  ipAddress?: string
  timestamp: string
}

export interface Registration {
  id: string
  fullName: string
  email: string
  phone: string
  college: string
  usnOrRollNo?: string
  department?: 'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'
  houseId: HouseId
  eventIds: string[]
  notes?: string
  checkedIn: boolean
  checkedInAt?: string
  // Payment Details
  amount: number
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  transactionId?: string
  receiptUrl?: string
  receiptPublicId?: string
  paymentVerifiedBy?: string
  paymentVerifiedAt?: string
  // Email Dispatch Tracking
  emailDispatched: boolean
  emailDispatchedAt?: string
  ipAddress?: string
  createdAt: string
}

export interface HouseStanding {
  house: HouseId
  name: string
  crest: string
  points: number
  color: string
  accent: string
  rank?: number
}

export interface FestEvent {
  id: string
  title: string
  category: string
  track: string
  day: 1 | 2
  time: string
  venue: string
  points: number
  description: string
  rules?: string[]
}

export interface OwlPostMessage {
  id: string
  senderName: string
  email: string
  subject: string
  message: string
  createdAt: string
}
