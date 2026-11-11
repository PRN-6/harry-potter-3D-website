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

router.get('/', getRegistrations)
router.get('/:id', getRegistrationById)
router.post('/:id/resend-email', resendAcceptanceEmail)

export default router
