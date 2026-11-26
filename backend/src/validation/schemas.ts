import { z } from 'zod'
import { Request, Response, NextFunction } from 'express'

const optionalTrimmed = (minLen: number, maxLen: number) =>
  z.preprocess(
    (val) => (typeof val === 'string' && val.trim() === '' ? undefined : val),
    z.string().trim().min(minLen).max(maxLen).optional()
  )

const HOUSE_ENUM = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff'] as const

export const registrationSchema = z.object({
  fullName: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(70, 'Name cannot exceed 70 characters')
    .regex(/^[a-zA-Z\s.'-]+$/, 'Name should only contain letters, spaces, and hyphens'),
  email: z
    .string({ error: 'Email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid owl address (email)'),
  phone: z
    .string({ error: 'Phone number is required' })
    .trim()
    .min(8, 'Phone number must be at least 8 digits')
    .max(16, 'Phone number cannot exceed 16 digits')
    .regex(/^[+]?[0-9\s-]{8,16}$/, 'Please enter a valid phone number (digits and optional + prefix)'),
  college: z
    .string({ error: 'College name is required' })
    .trim()
    .min(2, 'College name must be at least 2 characters')
    .max(100, 'College name cannot exceed 100 characters'),
  department: z
    .enum(['MCA', 'MBA', 'BTech', 'BCA', 'Other'], {
      error: 'Department must be MCA, MBA, BTech, BCA, or Other',
    })
    .default('Other'),
  usnOrRollNo: optionalTrimmed(1, 30),
  houseId: z.enum(HOUSE_ENUM, {
    error: 'House must be Gryffindor, Slytherin, Ravenclaw, or Hufflepuff',
  }),
  eventIds: z
    .preprocess((val) => {
      if (typeof val === 'string') {
        try {
          const parsed = JSON.parse(val)
          if (Array.isArray(parsed)) return parsed
        } catch {
          return val.split(',').map((s) => s.trim()).filter(Boolean)
        }
      }
      return val
    }, z.array(z.string().trim().min(1).max(60)).max(20).default([])),
  notes: optionalTrimmed(1, 500),

  // Optional UTR reference submitted by registrant (amount, paymentStatus & receipt are server-controlled)
  transactionId: optionalTrimmed(3, 60),

  // Anti-Spam & Honeypot Fields
  incantation_trap: z.string().max(200).optional(),
  _formRenderTime: z.union([z.string(), z.number()]).optional(),
})

export const updatePaymentStatusSchema = z.object({
  status: z.enum(['pending', 'verified', 'rejected', 'exempt'], {
    error: 'Status must be pending, verified, rejected, or exempt',
  }),
  notes: z.string().trim().max(200).optional(),
})

export const loginSchema = z.object({
  usernameOrEmail: z
    .string({ error: 'Username or email is required' })
    .trim()
    .min(3, 'Username or email must be at least 3 characters')
    .max(100, 'Identifier too long'),
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
})

export const createAdminSchema = z.object({
  username: z
    .string({ error: 'Username is required' })
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username cannot exceed 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username may only contain alphanumeric characters and underscores'),
  email: z
    .string({ error: 'Staff email is required' })
    .trim()
    .toLowerCase()
    .email('Please enter a valid staff email'),
  password: z
    .string({ error: 'Password is required' })
    .min(6, 'Password must be at least 6 characters')
    .max(128, 'Password cannot exceed 128 characters'),
  fullName: z
    .string({ error: 'Full name is required' })
    .trim()
    .min(2, 'Full name must be at least 2 characters')
    .max(60, 'Full name cannot exceed 60 characters'),
  level: z
    .number({ error: 'Admin level is required' })
    .int('Admin level must be an integer')
    .min(0, 'Admin level must be between 0 (Super Admin) and 6 (Prefect)')
    .max(6, 'Admin level must be between 0 and 6'),
  houseId: z.enum(HOUSE_ENUM).optional(),
})

export const updateAdminSchema = z.object({
  fullName: z.string().trim().min(2).max(60).optional(),
  email: z.string().trim().toLowerCase().email().optional(),
  password: z.string().min(6).max(128).optional(),
  level: z.number().int().min(0).max(6).optional(),
  houseId: z.enum(HOUSE_ENUM).optional(),
  isActive: z.boolean().optional(),
})

export const pointAdjustmentSchema = z.object({
  houseId: z.enum(HOUSE_ENUM, {
    error: 'House must be Gryffindor, Slytherin, Ravenclaw, or Hufflepuff',
  }),
  points: z
    .number({ error: 'Point value is required' })
    .int('Points must be an integer')
    .refine((val) => val !== 0, 'Point change cannot be zero')
    .refine((val) => val >= -500 && val <= 500, 'Point adjustment must be between -500 and +500'),
  reason: z
    .string({ error: 'Reason for point adjustment is required' })
    .trim()
    .min(3, 'Reason must be at least 3 characters')
    .max(200, 'Reason cannot exceed 200 characters'),
})

export const voteSchema = z.object({
  houseId: z.enum(HOUSE_ENUM, {
    error: 'Valid houseId is required',
  }),
})

export const contactSchema = z.object({
  senderName: z
    .string({ error: 'Your name is required' })
    .trim()
    .min(2, 'Name must be at least 2 characters')
    .max(80, 'Name cannot exceed 80 characters'),
  email: z
    .string({ error: 'Your email is required' })
    .trim()
    .toLowerCase()
    .email('Please provide a valid email address'),
  subject: z.string().trim().max(120, 'Subject cannot exceed 120 characters').optional(),
  message: z
    .string({ error: 'Message content is required' })
    .trim()
    .min(5, 'Message must be at least 5 characters')
    .max(2000, 'Message cannot exceed 2000 characters'),
})

export const eventSchema = z.object({
  id: z.string().trim().min(2).max(60).optional(),
  title: z.string().trim().min(3, 'Event title must be at least 3 characters').max(100),
  category: z.string().trim().min(2, 'Category must be at least 2 characters').max(50),
  track: z.string().trim().min(2, 'Track must be at least 2 characters').max(30),
  day: z.union([z.literal(1), z.literal(2)]),
  time: z.string().trim().min(2, 'Time is required').max(50),
  venue: z.string().trim().min(2, 'Venue is required').max(100),
  points: z.number().int().min(0).max(500),
  description: z.string().trim().min(10, 'Description must be at least 10 characters').max(1000),
  rules: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
})

/**
 * Higher-order middleware function to validate request bodies against any Zod schema.
 */
export function validateBody<T extends z.ZodTypeAny>(schema: T) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      const details = result.error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      }))
      res.status(400).json({
        error: 'Validation Failed',
        message: details[0]?.message || 'Input validation failed. Please check the submitted fields.',
        details,
      })
      return
    }
    req.body = result.data
    next()
  }
}
