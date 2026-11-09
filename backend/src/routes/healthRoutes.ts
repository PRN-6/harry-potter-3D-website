import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'online',
    spell: 'Lumos Maxima',
    festival: 'AJ-ASTRIX 2K27',
    edition: 'Grand College Festival',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  })
})

export default router

