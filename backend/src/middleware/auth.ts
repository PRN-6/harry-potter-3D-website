import crypto from 'crypto'
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'
import { AdminTokenPayload, AdminUser, ADMIN_ROLE_NAMES } from '../models/types.js'
import { getAdminById } from '../db/store.js'

const envSecret = process.env.JWT_SECRET?.trim()
if (!envSecret && process.env.NODE_ENV === 'production') {
  console.error(
    'FATAL: JWT_SECRET environment variable must be configured in production. Generating ephemeral session key.',
  )
}

const JWT_SECRET =
  envSecret ||
  (process.env.NODE_ENV === 'production'
    ? crypto.randomBytes(32).toString('hex')
    : 'dev_only_local_hogwarts_jwt_key_astrix_2027')

declare global {
  namespace Express {
    interface Request {
      admin?: AdminTokenPayload
    }
  }
}

export function generateToken(admin: AdminUser): string {
  const payload: AdminTokenPayload = {
    id: admin.id,
    username: admin.username,
    email: admin.email,
    fullName: admin.fullName,
    level: admin.level,
    roleTitle: admin.roleTitle || ADMIN_ROLE_NAMES[admin.level],
    houseId: admin.houseId,
  }

  return jwt.sign(payload, JWT_SECRET, { algorithm: 'HS256', expiresIn: '12h' })
}

export function authenticateAdmin(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'No wizarding staff token provided. Please log in to access the Ministry portal.',
    })
    return
  }

  const token = authHeader.split(' ')[1]

  try {
    const decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AdminTokenPayload
    const liveAdmin = getAdminById(decoded.id)

    if (!liveAdmin || !liveAdmin.isActive) {
      res.status(401).json({
        error: 'Account Inactive',
        message: 'Your Ministry staff account is inactive or no longer exists. Please contact the Headmaster.',
      })
      return
    }

    req.admin = {
      id: liveAdmin.id,
      username: liveAdmin.username,
      email: liveAdmin.email,
      fullName: liveAdmin.fullName,
      level: liveAdmin.level,
      roleTitle: liveAdmin.roleTitle || ADMIN_ROLE_NAMES[liveAdmin.level],
      houseId: liveAdmin.houseId,
    }
    next()
  } catch {
    res.status(401).json({
      error: 'Invalid Token',
      message: 'Your magical token has expired or is invalid. Please sign in again.',
    })
  }
}

/**
 * Enforces admin privilege level.
 * In this hierarchy, Level 0 (Super Admin) holds supreme clearance.
 * A check for Level N permits Level 0 through Level N.
 *
 * Examples:
 * requireLevel(0) -> Super Admin only
 * requireLevel(1) -> Super Admin (0) and Level 1
 * requireLevel(3) -> Levels 0, 1, 2, 3
 * requireLevel(4) -> Levels 0, 1, 2, 3, 4
 */
export function requireLevel(maxPermittedLevel: number) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.admin) {
      res.status(401).json({ error: 'Unauthorized', message: 'Authentication required.' })
      return
    }

    // Level 0 (Super Admin) always passes all checks
    if (req.admin.level === 0 || req.admin.level <= maxPermittedLevel) {
      next()
      return
    }

    res.status(403).json({
      error: 'Forbidden Chamber',
      message: `Access denied. This spell requires Level ${maxPermittedLevel} clearance or higher. Your rank is Level ${req.admin.level} (${req.admin.roleTitle}).`,
      requiredLevel: maxPermittedLevel,
      currentLevel: req.admin.level,
    })
  }
}

