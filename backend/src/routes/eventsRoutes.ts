import { Router } from 'express'
import { getAllEvents, getEventById, getSchedule } from '../controllers/eventsController.js'

const router = Router()

router.get('/', getAllEvents)
router.get('/schedule', getSchedule)
router.get('/:id', getEventById)

export default router

