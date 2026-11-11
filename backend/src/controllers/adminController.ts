import { Request, Response } from 'express'
import {
  getDashboardStats as getDbStats,
  getRegistrationsList,
  getRegistrationById,
  toggleCheckIn as dbToggleCheckIn,
  deleteRegistration as dbDeleteRegistration,
  updatePaymentStatus as dbUpdatePaymentStatus,
  markEmailDispatched,
  getAllAdmins,
  getAdminByUsernameOrEmail,
  insertAdmin,
  updateAdmin,
  deleteAdmin as dbDeleteAdmin,
  adjustHousePoints,
  getPointLogs as dbGetPointLogs,
  getAuditLogs as dbGetAuditLogs,
  insertEvent,
  updateEvent as dbUpdateEvent,
  deleteEvent as dbDeleteEvent,
} from '../db/store.js'
import { FestEvent } from '../models/types.js'
import { sendPaymentVerifiedEmail, sendAcceptanceEmail } from '../services/emailService.js'

export const getStats = (_req: Request, res: Response): void => {
  try {
    const stats = getDbStats()
    res.json(stats)
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve Hogwarts dashboard statistics.' })
  }
}

export const getRegistrations = (req: Request, res: Response): void => {
  try {
    const { houseId, checkedIn, paymentStatus, search, page = '1', limit = '20' } = req.query

    const filter: { houseId?: string; checkedIn?: boolean; paymentStatus?: string; search?: string } = {}
    if (typeof houseId === 'string' && houseId !== 'all') filter.houseId = houseId
    if (checkedIn === 'true') filter.checkedIn = true
    if (checkedIn === 'false') filter.checkedIn = false
    if (typeof paymentStatus === 'string' && paymentStatus !== 'all') filter.paymentStatus = paymentStatus
    if (typeof search === 'string' && search.trim()) filter.search = search.trim()

    const allMatches = getRegistrationsList(filter)
    const pageNum = Math.max(1, parseInt(page as string, 10) || 1)
    const limitNum = Math.max(1, Math.min(100, parseInt(limit as string, 10) || 20))

    const totalCount = allMatches.length
    const totalPages = Math.ceil(totalCount / limitNum) || 1
    const offset = (pageNum - 1) * limitNum
    const paginated = allMatches.slice(offset, offset + limitNum)

    res.json({
      registrations: paginated,
      totalCount,
      totalPages,
      currentPage: pageNum,
      limit: limitNum,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve registrations.' })
  }
}

export const toggleRegistrationAttendance = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = dbToggleCheckIn(id, req.admin.fullName, req.admin.level)
    if (!result) {
      res.status(404).json({ error: 'Registration record not found.' })
      return
    }

    res.json({
      success: true,
      message: `${result.registration.fullName} is now ${result.registration.checkedIn ? 'CHECKED IN (Attending)' : 'MARKED NOT ATTENDED'}.`,
      registration: result.registration,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update check-in status.' })
  }
}

export const updateRegistrationPayment = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const { status, notes } = req.body
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const result = dbUpdatePaymentStatus(id, status, req.admin.fullName, req.admin.level, notes)
    if (!result) {
      res.status(404).json({ error: 'Registration record not found.' })
      return
    }

    // If verified, send verified owl notification
    if (status === 'verified') {
      sendPaymentVerifiedEmail(result.registration).catch((err) => {
        console.warn('Payment verification email dispatch warning:', err)
      })
    }

    res.json({
      success: true,
      message: `Payment status for ${result.registration.fullName} set to ${status.toUpperCase()}.`,
      registration: result.registration,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payment status.' })
  }
}

export const resendRegistrationEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const reg = getRegistrationById(id)
    if (!reg) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    const dispatch = await sendAcceptanceEmail(reg)
    if (dispatch.sent) {
      markEmailDispatched(reg.id)
    }

    res.json({
      success: true,
      message: `Hogwarts Acceptance Letter & Fest Entry Pass re-dispatched to ${reg.email}.`,
      mode: dispatch.mode,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend confirmation email.' })
  }
}

export const removeRegistration = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const reg = getRegistrationById(id)
    if (!reg) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    const success = dbDeleteRegistration(id, req.admin.fullName, req.admin.level)
    if (!success) {
      res.status(500).json({ error: 'Could not delete registration.' })
      return
    }

    res.json({
      success: true,
      message: `Registration for ${reg.fullName} (${reg.email}) permanently expunged.`,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete registration.' })
  }
}

export const exportRegistrationsCsv = (_req: Request, res: Response): void => {
  try {
    const list = getRegistrationsList()
    const headers = [
      'ID',
      'Full Name',
      'Email',
      'Phone',
      'College',
      'Department',
      'Roll No / USN',
      'House',
      'Amount (INR)',
      'Payment Status',
      'Payment Method',
      'Transaction Ref (UTR)',
      'Receipt URL',
      'Event IDs',
      'Checked In',
      'Checked In At',
      'Registered At',
    ]

    const rows = list.map((r) => [
      r.id,
      `"${r.fullName.replace(/"/g, '""')}"`,
      r.email,
      `"${r.phone}"`,
      `"${r.college.replace(/"/g, '""')}"`,
      r.department || 'Other',
      `"${r.usnOrRollNo || ''}"`,
      r.houseId.toUpperCase(),
      r.amount || 250,
      r.paymentStatus.toUpperCase(),
      r.paymentMethod.toUpperCase(),
      `"${r.transactionId || ''}"`,
      `"${r.receiptUrl || ''}"`,
      `"${(r.eventIds || []).join('; ')}"`,
      r.checkedIn ? 'YES' : 'NO',
      r.checkedInAt || '',
      r.createdAt,
    ])

    const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\r\n')

    res.setHeader('Content-Type', 'text/csv; charset=utf-8')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="AJ-ASTRIX-2K27-Registrations-${new Date().toISOString().slice(0, 10)}.csv"`,
    )
    res.send(csvContent)
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate CSV export.' })
  }
}

// ==========================================
// STAFF / ADMIN USERS MANAGEMENT
// ==========================================

export const getAdmins = (_req: Request, res: Response): void => {
  try {
    const admins = getAllAdmins()
    res.json({ count: admins.length, admins })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve staff roster.' })
  }
}

export const createAdmin = (req: Request, res: Response): void => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { username, email, password, fullName, level, houseId } = req.body

    // Check duplicate username or email
    const existing = getAdminByUsernameOrEmail(username) || getAdminByUsernameOrEmail(email)
    if (existing) {
      res.status(409).json({
        error: 'Conflict',
        message: 'A staff member with this username or email already exists.',
      })
      return
    }

    // If level 2 (Head of House), require houseId
    if (level === 2 && !houseId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Level 2 (Head of House) accounts require an assigned House (Gryffindor, Slytherin, Ravenclaw, Hufflepuff).',
      })
      return
    }

    const newStaff = insertAdmin(
      { username, email, password, fullName, level, houseId },
      req.admin.fullName,
      req.admin.level,
    )

    res.status(201).json({
      success: true,
      message: `Staff member ${newStaff.fullName} created successfully with rank ${newStaff.roleTitle}.`,
      admin: newStaff,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create staff account.' })
  }
}

export const updateAdminAccount = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const updated = updateAdmin(id, req.body, req.admin.fullName, req.admin.level)
    if (!updated) {
      res.status(404).json({ error: 'Staff account not found.' })
      return
    }

    res.json({
      success: true,
      message: `Staff account ${updated.fullName} updated.`,
      admin: updated,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update staff account.' })
  }
}

export const removeAdmin = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    // Prevent deleting own account
    if (req.admin.id === id) {
      res.status(400).json({
        error: 'Action Denied',
        message: 'You cannot banish your own staff account.',
      })
      return
    }

    const success = dbDeleteAdmin(id, req.admin.fullName, req.admin.level)
    if (!success) {
      res.status(404).json({ error: 'Staff account not found.' })
      return
    }

    res.json({ success: true, message: 'Staff account successfully banished.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete staff account.' })
  }
}

// ==========================================
// HOUSE CUP POINTS
// ==========================================

export const adjustPoints = (req: Request, res: Response): void => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const { houseId, points, reason } = req.body

    // If Level 2 (Head of House), they can only award points to their own house
    if (req.admin.level === 2 && req.admin.houseId && req.admin.houseId !== houseId) {
      res.status(403).json({
        error: 'House Jurisdiction Restricted',
        message: `As Head of ${req.admin.houseId.toUpperCase()}, you may only award or deduct points for your own house.`,
      })
      return
    }

    const result = adjustHousePoints(
      houseId,
      points,
      reason,
      req.admin.fullName,
      req.admin.level,
    )

    if (!result) {
      res.status(400).json({ error: 'Invalid house specified.' })
      return
    }

    res.json({
      success: true,
      message: `${points >= 0 ? '+' : ''}${points} points awarded to ${houseId.toUpperCase()}!`,
      standing: result.standing,
      log: result.log,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to adjust house points.' })
  }
}

export const getPointLogs = (_req: Request, res: Response): void => {
  try {
    const logs = dbGetPointLogs(100)
    res.json({ count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve point logs.' })
  }
}

// ==========================================
// AUDIT LOGS (SUPER ADMIN ONLY)
// ==========================================

export const getAuditLogs = (_req: Request, res: Response): void => {
  try {
    const logs = dbGetAuditLogs(200)
    res.json({ count: logs.length, logs })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve audit logs.' })
  }
}

// ==========================================
// FESTIVAL EVENTS
// ==========================================

export const createEvent = (req: Request, res: Response): void => {
  try {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const eventData: FestEvent = {
      ...req.body,
      id: req.body.id || `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    }

    const created = insertEvent(eventData, req.admin.fullName, req.admin.level)
    res.status(201).json({
      success: true,
      message: `Event "${created.title}" successfully added to festival schedule.`,
      event: created,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to create event.' })
  }
}

export const updateEvent = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const updated = dbUpdateEvent(id, req.body, req.admin.fullName, req.admin.level)
    if (!updated) {
      res.status(404).json({ error: 'Event not found.' })
      return
    }

    res.json({
      success: true,
      message: `Event "${updated.title}" updated.`,
      event: updated,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to update event.' })
  }
}

export const deleteEvent = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized' })
      return
    }

    const success = dbDeleteEvent(id, req.admin.fullName, req.admin.level)
    if (!success) {
      res.status(404).json({ error: 'Event not found.' })
      return
    }

    res.json({ success: true, message: 'Event successfully removed from schedule.' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete event.' })
  }
}
