/**
 * API client for communicating with the AJ-ASTRIX 2K27 backend.
 * Uses relative `/api` paths which Vite automatically proxies during dev,
 * and points to the production backend in deployment.
 */

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface RegistrationPayload {
  fullName: string
  email: string
  phone: string
  college: string
  usnOrRollNo?: string
  department?: string
  houseId: string
  eventIds?: string[]
  notes?: string
}

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
    throw new Error(data.error || 'Failed to submit registration')
  }
  return data
}

