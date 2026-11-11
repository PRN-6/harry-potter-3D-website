import { Router } from 'express'
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
} from '../controllers/registrationController.js'
import { validateBody, registrationSchema } from '../validation/schemas.js'

const router = Router()

router.post('/', validateBody(registrationSchema), createRegistration)
router.get('/', getRegistrations)
router.get('/:id', getRegistrationById)

export default router
