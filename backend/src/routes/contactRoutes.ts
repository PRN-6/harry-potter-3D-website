import { Router } from 'express'
import { submitOwlPost, getOwlMessages } from '../controllers/contactController.js'
import { authenticateAdmin, requireLevel } from '../middleware/auth.js'
import { contactRateLimiter } from '../middleware/rateLimiter.js'
import { validateBody, contactSchema } from '../validation/schemas.js'

const router = Router()

router.post('/', contactRateLimiter, validateBody(contactSchema), submitOwlPost)
router.get('/', authenticateAdmin, requireLevel(4), getOwlMessages)

export default router

