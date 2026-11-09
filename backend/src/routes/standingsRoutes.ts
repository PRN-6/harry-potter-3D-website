import { Router } from 'express'
import { getStandings, castHouseVote, addHousePoints } from '../controllers/standingsController.js'

const router = Router()

router.get('/', getStandings)
router.post('/vote', castHouseVote)
router.post('/points', addHousePoints)

export default router

