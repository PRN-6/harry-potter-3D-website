import { Router } from 'express'
import {
  createRegistration,
  getRegistrations,
  getRegistrationById,
} from '../controllers/registrationController.js'

const router = Router()

router.post('/', createRegistration)
router.get('/', getRegistrations)
router.get('/:id', getRegistrationById)

export default router
