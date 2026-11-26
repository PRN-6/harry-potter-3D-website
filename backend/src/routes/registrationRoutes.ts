import { Router } from 'express'
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
  resendAcceptanceEmail,
} from '../controllers/registrationController.js'
import { validateBody, registrationSchema } from '../validation/schemas.js'
import { handleReceiptUpload } from '../middleware/upload.js'
import { registrationRateLimiter, antiSpamGuard } from '../middleware/rateLimiter.js'
import { authenticateAdmin, requireLevel } from '../middleware/auth.js'

const router = Router()

// Handles both multipart/form-data (with payment receipt screenshot) and standard JSON
router.post(
  '/',
  registrationRateLimiter,
  handleReceiptUpload,
  antiSpamGuard,
  validateBody(registrationSchema),
  createRegistration,
)

// Protected staff-only PII & email re-dispatch routes
router.get('/', authenticateAdmin, requireLevel(4), getRegistrations)
router.get('/:id', authenticateAdmin, requireLevel(4), getRegistrationById)
router.post('/:id/resend-email', authenticateAdmin, requireLevel(4), resendAcceptanceEmail)

export default router
