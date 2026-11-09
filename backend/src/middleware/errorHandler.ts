import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  console.error('Unhandled server error:', err)

  res.status(500).json({
    error: 'A magical curse interrupted the server.',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

