import rateLimit from 'express-rate-limit'
import { Request, Response, NextFunction } from 'express'

/**
 * Global API rate limiter protecting the server against volumetric flooding.
 * High threshold allows 200+ legitimate concurrent users while blocking denial-of-service attempts.
 */
export const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: Number(process.env.GLOBAL_RATE_LIMIT_MAX) || 600, // 600 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too Many Requests',
    message: 'The Great Hall magical conduits are experiencing overwhelming traffic. Please hold for a moment.',
  },
})

/**
 * Strict rate limiter for registration endpoint preventing automated spamming.
 */
export const registrationRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: Number(process.env.REGISTRATION_RATE_LIMIT_MAX) || 25, // Max 25 registrations per IP per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Registration Rate Limit Exceeded',
    message: 'Too many registration scrolls submitted from your network. Please wait 5 minutes before submitting another.',
  },
})

/**
 * Rate limiter for administrative staff authentication preventing brute-force attacks.
 */
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || 25, // Max 25 failed attempts per 15 minutes
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Chamber Temporarily Sealed',
    message: 'Too many unverified staff login attempts. Access is locked for 15 minutes for Hogwarts security.',
  },
})

/**
 * Rate limiter for Owl Post public contact submissions.
 */
export const contactRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: Number(process.env.CONTACT_RATE_LIMIT_MAX) || 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Owl Post Rate Limit Exceeded',
    message: 'Too many Owl Post messages dispatched recently. Please wait a few minutes before sending another.',
  },
})

/**
 * Rate limiter for public house applause/voting endpoint.
 */
export const voteRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: Number(process.env.VOTE_RATE_LIMIT_MAX) || 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Vote Rate Limit Exceeded',
    message: 'Too many house votes cast from this network. Please pause before cheering again.',
  },
})

/**
 * Anti-spam Honeypot & Time-lock validation middleware.
 * Checks for:
 * 1. Invisible honeypot field (`incantation_trap`) - if bots fill this, rejection triggers.
 * 2. Time-lock velocity check: Humans take at least 1.2 seconds to fill forms.
 */
export function antiSpamGuard(req: Request, res: Response, next: NextFunction): void {
  const honeypot = req.body?.incantation_trap
  if (honeypot && typeof honeypot === 'string' && honeypot.trim().length > 0) {
    console.warn(`[Bot Trap Triggered] Automated bot detected from IP ${req.ip}.`)
    res.status(400).json({
      error: 'Bot Detected',
      message: 'Automated incantations detected by Great Hall wards.',
    })
    return
  }

  // Velocity check if client timestamp is provided
  const renderTime = req.body?._formRenderTime
  if (renderTime !== undefined && renderTime !== '') {
    const parsedRenderTime = Number(renderTime)
    if (!Number.isFinite(parsedRenderTime)) {
      res.status(400).json({
        error: 'Invalid Submission',
        message: 'Invalid form timing metadata. Please refresh and try again.',
      })
      return
    }

    const elapsedMs = Date.now() - parsedRenderTime
    // Only flag realistic non-negative fast elapsed times to avoid false positives from device clock skew
    if (elapsedMs >= 0 && elapsedMs < 1200) {
      console.warn(`[Velocity Spam Detected] Form submitted in ${elapsedMs}ms from IP ${req.ip}`)
      res.status(400).json({
        error: 'Submission Too Fast',
        message: 'Registration scroll inscribed suspiciously fast. Please review your details and submit normally.',
      })
      return
    }
  }

  next()
}
