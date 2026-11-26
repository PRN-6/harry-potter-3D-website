import { Request, Response, NextFunction } from 'express'

export const errorHandler = (
  err: Error & { status?: number; type?: string },
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      error: 'Invalid JSON Payload',
      message: 'Malformed JSON body in request.',
    })
    return
  }

  if (err.type === 'entity.too.large') {
    res.status(413).json({
      error: 'Payload Too Large',
      message: 'Request body exceeds allowed size limit.',
    })
    return
  }

  console.error('Unhandled server error:', err)

  const statusCode = typeof err.status === 'number' && err.status >= 400 && err.status < 600 ? err.status : 500
  res.status(statusCode).json({
    error: 'A magical curse interrupted the server.',
    message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
  })
}

