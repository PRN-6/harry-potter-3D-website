import { Router } from 'express'
import {
  loginAdmin,
  getCurrentAdmin,
  getDemoCredentials,
} from '../controllers/authController.js'
import { authenticateAdmin } from '../middleware/auth.js'
import { validateBody, loginSchema } from '../validation/schemas.js'

const router = Router()

router.post('/login', validateBody(loginSchema), loginAdmin)
router.get('/me', authenticateAdmin, getCurrentAdmin)
router.get('/demo-credentials', getDemoCredentials)

export default router
