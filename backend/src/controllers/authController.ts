import { Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import {
  getAdminByUsernameOrEmail,
  updateAdminLastLogin,
  addAuditLog,
} from '../db/store.js'
import { generateToken } from '../middleware/auth.js'
import { ADMIN_ROLE_NAMES, AdminLevel } from '../models/types.js'

export const loginAdmin = (req: Request, res: Response): void => {
  try {
    const { usernameOrEmail, password } = req.body

    const admin = getAdminByUsernameOrEmail(usernameOrEmail)
    if (!admin) {
      res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid staff username or owl address.',
      })
      return
    }

    if (!admin.isActive) {
      res.status(403).json({
        error: 'Account Suspended',
        message: 'This staff account has been sealed by the Headmaster.',
      })
      return
    }

    const passwordValid = bcrypt.compareSync(password, admin.passwordHash)
    if (!passwordValid) {
      res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid magical password credentials.',
      })
      return
    }

    // Update last login
    updateAdminLastLogin(admin.id)

    // Log the successful login
    addAuditLog({
      action: 'ADMIN_LOGIN',
      performedBy: admin.fullName,
      adminLevel: admin.level,
      details: `${admin.fullName} logged into the staff portal.`,
      ipAddress: req.ip,
    })

    const token = generateToken(admin)

    const { passwordHash: _h, ...safeAdmin } = admin

    res.json({
      success: true,
      message: `Welcome to the Great Hall Staff Chamber, ${admin.fullName}!`,
      token,
      admin: safeAdmin,
    })
  } catch (err) {
    console.error('Error during admin login:', err)
    res.status(500).json({ error: 'Internal server enchantment failure.' })
  }
}

export const getCurrentAdmin = (req: Request, res: Response): void => {
  if (!req.admin) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  const permissions = {
    canManageAdmins: req.admin.level === 0,
    canDeleteRegistrations: req.admin.level === 0,
    canCheckInAttendees: req.admin.level <= 4,
    canAdjustHousePoints: req.admin.level === 0 || req.admin.level === 1 || req.admin.level === 2 || req.admin.level === 5,
    canManageEvents: req.admin.level === 0 || req.admin.level === 1 || req.admin.level === 3,
    canViewAuditLogs: req.admin.level === 0,
    canExportRegistrations: req.admin.level <= 4,
    isReadOnly: req.admin.level === 6,
  }

  res.json({
    admin: req.admin,
    roleTitle: req.admin.roleTitle || ADMIN_ROLE_NAMES[req.admin.level as AdminLevel],
    permissions,
  })
}

/**
 * Returns preset credentials for demo and evaluation purposes.
 */
export const getDemoCredentials = (_req: Request, res: Response): void => {
  res.json({
    accounts: [
      {
        level: 0,
        role: 'Super Admin · Headmaster',
        name: 'Prof. Albus Dumbledore',
        username: 'headmaster',
        password: 'AlbusDumbledore2027!',
        description: 'Supreme control: Manage staff, edit points, delete entries, view audit logs.',
      },
      {
        level: 1,
        role: 'Level 1 · Deputy Headmaster',
        name: 'Prof. Minerva McGonagall',
        username: 'mcgonagall',
        password: 'Transfiguration2027!',
        description: 'High-level administration: Events, registrations, standings & points.',
      },
      {
        level: 2,
        role: 'Level 2 · Head of House (Slytherin)',
        name: 'Prof. Severus Snape',
        username: 'snape',
        password: 'PotionsMaster2027!',
        house: 'slytherin',
        description: 'House authority: Award house points, monitor house candidates.',
      },
      {
        level: 3,
        role: 'Level 3 · Chief Event Coordinator',
        name: 'Prof. Filius Flitwick',
        username: 'flitwick',
        password: 'CharmsMaster2027!',
        description: 'Event lead: Create, update, and manage festival schedule & venues.',
      },
      {
        level: 4,
        role: 'Level 4 · Gatekeeper & Desk',
        name: 'Argus Filch',
        username: 'filch',
        password: 'Caretaker2027!',
        description: 'Ground desk: Verify attendee tickets, search USN, toggle check-in.',
      },
      {
        level: 5,
        role: 'Level 5 · House Cup Scorekeeper',
        name: 'Madam Rolanda Hooch',
        username: 'hooch',
        password: 'Quidditch2027!',
        description: 'Scorekeeper: Award and deduct house points with required reasons.',
      },
      {
        level: 6,
        role: 'Level 6 · Prefect Observer',
        name: 'Percy Weasley',
        username: 'percy',
        password: 'PrefectBadge2027!',
        description: 'Read-only observer: View live registrations, schedule, and standings.',
      },
    ],
  })
}
