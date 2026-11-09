import { Router } from 'express'
import { submitOwlPost, getOwlMessages } from '../controllers/contactController.js'

const router = Router()

router.post('/', submitOwlPost)
router.get('/', getOwlMessages)

export default router
