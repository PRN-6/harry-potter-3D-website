import { Router } from 'express'
import { getStandings, castHouseVote, addHousePoints } from '../controllers/standingsController.js'
import { authenticateAdmin, requireLevel } from '../middleware/auth.js'
import { voteRateLimiter } from '../middleware/rateLimiter.js'
import { validateBody, voteSchema, pointAdjustmentSchema } from '../validation/schemas.js'

const router = Router()

router.get('/', getStandings)
router.post('/vote', voteRateLimiter, validateBody(voteSchema), castHouseVote)
router.post('/points', authenticateAdmin, requireLevel(5), validateBody(pointAdjustmentSchema), addHousePoints)

export default router

