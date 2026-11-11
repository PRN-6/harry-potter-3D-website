/**
 * API client for communicating with the AJ-ASTRIX 2K27 backend.
 * Provides public visitor endpoints and authenticated administrative RBAC endpoints.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface RegistrationPayload {
  fullName: string
  email: string
  phone: string
  college: string
  usnOrRollNo?: string
  department?: 'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'
  houseId: string
  eventIds?: string[]
  notes?: string
}

export interface RegistrationItem {
  id: string
  fullName: string
  email: string
  phone: string
  college: string
  usnOrRollNo?: string
  department?: 'MCA' | 'MBA' | 'BTech' | 'BCA' | 'Other'
  houseId: 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
  eventIds: string[]
  notes?: string
  checkedIn: boolean
  checkedInAt?: string
  createdAt: string
}

export type AdminLevel = 0 | 1 | 2 | 3 | 4 | 5 | 6

export interface AdminProfile {
  id: string
  username: string
  email: string
  fullName: string
  level: AdminLevel
  roleTitle: string
  houseId?: 'gryffindor' | 'slytherin' | 'ravenclaw' | 'hufflepuff'
}

export interface AdminPermissions {
  canManageAdmins: boolean
  canDeleteRegistrations: boolean
  canCheckInAttendees: boolean
  canAdjustHousePoints: boolean
  canManageEvents: boolean
  canViewAuditLogs: boolean
  canExportRegistrations: boolean
  isReadOnly: boolean
}

export interface AdminStats {
  totalRegistrations: number
  checkedInCount: number
  attendanceRate: number
  totalEvents: number
  totalAdmins: number
  standings: Array<{
    house: string
    name: string
    crest: string
    points: number
    color: string
    accent: string
    rank?: number
  }>
  houseBreakdown: Record<string, number>
  departmentBreakdown: Record<string, number>
  recentRegistrations: RegistrationItem[]
  recentPointLogs: PointLogItem[]
  recentAuditLogs: AuditLogItem[]
}

export interface PointLogItem {
  id: string
  houseId: string
  points: number
  reason: string
  awardedBy: string
  adminLevel: AdminLevel
  timestamp: string
}

export interface AuditLogItem {
  id: string
  action: string
  performedBy: string
  adminLevel: AdminLevel
  details: string
  ipAddress?: string
  timestamp: string
}

export interface AdminUserItem {
  id: string
  username: string
  email: string
  fullName: string
  level: AdminLevel
  roleTitle: string
  houseId?: string
  isActive: boolean
  createdAt: string
  lastLoginAt?: string
}

export interface FestEventItem {
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

export interface DemoCredential {
  level: AdminLevel
  role: string
  name: string
  username: string
  password: string
  house?: string
  description: string
}

// ==========================================
// PUBLIC FESTIVAL ENDPOINTS
// ==========================================

export async function checkBackendHealth() {
  const res = await fetch(`${API_BASE}/health`)
  if (!res.ok) throw new Error(`Health check failed: ${res.statusText}`)
  return res.json()
}

export async function fetchStandings() {
  const res = await fetch(`${API_BASE}/standings`)
  if (!res.ok) throw new Error(`Failed to load standings: ${res.statusText}`)
  return res.json()
}

export async function castHouseVote(houseId: string) {
  const res = await fetch(`${API_BASE}/standings/vote`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ houseId }),
  })
  if (!res.ok) throw new Error(`Failed to cast vote: ${res.statusText}`)
  return res.json()
}

export async function fetchSchedule() {
  const res = await fetch(`${API_BASE}/events/schedule`)
  if (!res.ok) throw new Error(`Failed to fetch schedule: ${res.statusText}`)
  return res.json()
}

export async function registerWizard(payload: RegistrationPayload) {
  const res = await fetch(`${API_BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) {
    const errorMsg = data.details?.[0]?.message || data.message || data.error || 'Failed to submit registration'
    const error = new Error(errorMsg) as Error & { details?: any[] }
    error.details = data.details
    throw error
  }
  return data
}

// ==========================================
// ADMIN AUTHENTICATION
// ==========================================

export async function loginAdminApi(usernameOrEmail: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ usernameOrEmail, password }),
  })
  const data = await res.json()
  if (!res.ok) {
    throw new Error(data.message || data.error || 'Failed to log in')
  }
  return data as { success: boolean; token: string; admin: AdminProfile }
}

export async function fetchAdminMeApi(token: string) {
  const res = await fetch(`${API_BASE}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Session invalid or expired')
  return res.json() as Promise<{
    admin: AdminProfile
    roleTitle: string
    permissions: AdminPermissions
  }>
}

export async function fetchDemoCredentialsApi(): Promise<{ accounts: DemoCredential[] }> {
  const res = await fetch(`${API_BASE}/auth/demo-credentials`)
  if (!res.ok) throw new Error('Failed to load demo accounts')
  return res.json()
}

// ==========================================
// ADMIN DASHBOARD & STATS
// ==========================================

export async function fetchAdminStatsApi(token: string): Promise<AdminStats> {
  const res = await fetch(`${API_BASE}/admin/stats`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load dashboard statistics')
  return res.json()
}

// ==========================================
// REGISTRATIONS MANAGEMENT
// ==========================================

export async function fetchAdminRegistrationsApi(
  token: string,
  params?: { houseId?: string; checkedIn?: boolean; search?: string; page?: number; limit?: number },
): Promise<{
  registrations: RegistrationItem[]
  totalCount: number
  totalPages: number
  currentPage: number
}> {
  const query = new URLSearchParams()
  if (params?.houseId && params.houseId !== 'all') query.set('houseId', params.houseId)
  if (params?.checkedIn !== undefined) query.set('checkedIn', String(params.checkedIn))
  if (params?.search) query.set('search', params.search)
  if (params?.page) query.set('page', String(params.page))
  if (params?.limit) query.set('limit', String(params.limit))

  const res = await fetch(`${API_BASE}/admin/registrations?${query.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load registrations')
  return res.json()
}

export async function toggleAdminCheckInApi(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/registrations/${id}/checkin`, {
    method: 'PATCH',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update check-in status')
  return data as { success: boolean; message: string; registration: RegistrationItem }
}

export async function deleteAdminRegistrationApi(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/registrations/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete registration')
  return data
}

export function getExportRegistrationsUrl(token: string): string {
  return `${API_BASE}/admin/registrations/export/csv?token=${encodeURIComponent(token)}`
}

export async function exportAdminRegistrationsCsvApi(token: string): Promise<Blob> {
  const res = await fetch(`${API_BASE}/admin/registrations/export/csv`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to download CSV export')
  return res.blob()
}

// ==========================================
// HOUSE CUP POINTS
// ==========================================

export async function adjustAdminPointsApi(
  token: string,
  payload: { houseId: string; points: number; reason: string },
) {
  const res = await fetch(`${API_BASE}/admin/standings/adjust`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to adjust points')
  return data
}

export async function fetchAdminPointLogsApi(token: string): Promise<{ count: number; logs: PointLogItem[] }> {
  const res = await fetch(`${API_BASE}/admin/standings/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load point ledger')
  return res.json()
}

// ==========================================
// EVENTS MANAGEMENT
// ==========================================

export async function createAdminEventApi(token: string, eventData: Partial<FestEventItem>) {
  const res = await fetch(`${API_BASE}/admin/events`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventData),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to create event')
  return data
}

export async function updateAdminEventApi(token: string, id: string, updates: Partial<FestEventItem>) {
  const res = await fetch(`${API_BASE}/admin/events/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to update event')
  return data
}

export async function deleteAdminEventApi(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/events/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to delete event')
  return data
}

// ==========================================
// STAFF & ADMIN ACCOUNTS (LEVEL 0 & 1)
// ==========================================

export async function fetchAdminUsersApi(token: string): Promise<{ count: number; admins: AdminUserItem[] }> {
  const res = await fetch(`${API_BASE}/admin/users`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load staff roster')
  return res.json()
}

export async function createAdminUserApi(
  token: string,
  data: {
    username: string
    email: string
    password: string
    fullName: string
    level: AdminLevel
    houseId?: string
  },
) {
  const res = await fetch(`${API_BASE}/admin/users`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.message || result.error || 'Failed to create staff member')
  return result
}

export async function updateAdminUserApi(
  token: string,
  id: string,
  data: Partial<AdminUserItem> & { password?: string },
) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  })
  const result = await res.json()
  if (!res.ok) throw new Error(result.message || result.error || 'Failed to update staff member')
  return result
}

export async function deleteAdminUserApi(token: string, id: string) {
  const res = await fetch(`${API_BASE}/admin/users/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.message || data.error || 'Failed to remove staff member')
  return data
}

// ==========================================
// AUDIT LOGS (SUPER ADMIN ONLY)
// ==========================================

export async function fetchAdminAuditLogsApi(token: string): Promise<{ count: number; logs: AuditLogItem[] }> {
  const res = await fetch(`${API_BASE}/admin/logs`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to load audit logs')
  return res.json()
}
