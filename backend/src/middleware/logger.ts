import { Request, Response, NextFunction } from 'express'

export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = performance.now()
  const timestamp = new Date().toLocaleTimeString()

  res.on('finish', () => {
    const duration = (performance.now() - start).toFixed(1)
    const statusColor = res.statusCode >= 400 ? '⚠️' : '⚡'
    console.log(`[${timestamp}] ${statusColor} ${req.method} ${req.originalUrl} -> ${res.statusCode} (${duration}ms)`)
  })

  next()
}
