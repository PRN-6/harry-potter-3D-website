import { Router } from 'express'
import {
  getStats,
  getRegistrations,
  toggleRegistrationAttendance,
  removeRegistration,
  exportRegistrationsCsv,
  getAdmins,
  createAdmin,
  updateAdminAccount,
  removeAdmin,
  adjustPoints,
  getPointLogs,
  getAuditLogs,
  createEvent,
  updateEvent,
  deleteEvent,
} from '../controllers/adminController.js'
import { authenticateAdmin, requireLevel } from '../middleware/auth.js'
import {
  validateBody,
  createAdminSchema,
  updateAdminSchema,
  pointAdjustmentSchema,
  eventSchema,
} from '../validation/schemas.js'

const router = Router()

// All admin endpoints require authentication
router.use(authenticateAdmin)

// System overview stats (All admin levels 0-6)
router.get('/stats', getStats)

// Registrations management
router.get('/registrations', getRegistrations)
router.get('/registrations/export/csv', requireLevel(4), exportRegistrationsCsv)
router.patch('/registrations/:id/checkin', requireLevel(4), toggleRegistrationAttendance)
router.delete('/registrations/:id', requireLevel(0), removeRegistration)

// Staff and Admin accounts management (Level 0 Super Admin & Level 1 Deputy)
router.get('/users', requireLevel(1), getAdmins)
router.post('/users', requireLevel(0), validateBody(createAdminSchema), createAdmin)
router.patch('/users/:id', requireLevel(0), validateBody(updateAdminSchema), updateAdminAccount)
router.delete('/users/:id', requireLevel(0), removeAdmin)

// House Cup points adjustment
router.post('/standings/adjust', requireLevel(5), validateBody(pointAdjustmentSchema), adjustPoints)
router.get('/standings/logs', getPointLogs)

// Events management (Super Admin, Deputy, Event Coordinator)
router.post('/events', requireLevel(3), validateBody(eventSchema), createEvent)
router.put('/events/:id', requireLevel(3), validateBody(eventSchema), updateEvent)
router.delete('/events/:id', requireLevel(3), deleteEvent)

// Audit logs (Super Admin Level 0 only)
router.get('/logs', requireLevel(0), getAuditLogs)

export default router
