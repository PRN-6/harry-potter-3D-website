import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { requestLogger } from './middleware/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import { globalApiLimiter } from './middleware/rateLimiter.js'
import { getLocalUploadsPath } from './services/cloudinaryService.js'
import healthRoutes from './routes/healthRoutes.js'
import registrationRoutes from './routes/registrationRoutes.js'
import standingsRoutes from './routes/standingsRoutes.js'
import eventsRoutes from './routes/eventsRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
app.set('trust proxy', 1)
const PORT = process.env.PORT || 5000
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173'

// Enable CORS for frontend development and production
app.use(
  cors({
    origin: [FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  }),
)

app.use(express.json())
app.use(requestLogger)

// Apply global API rate limiting (protects against high-concurrency DoS / flood attacks)
app.use('/api', globalApiLimiter)

// Serve local payment receipts
app.use('/api/uploads/receipts', express.static(getLocalUploadsPath()))

// Public Payment Configuration & UPI Scanner Info
app.get('/api/payment/info', (_req: Request, res: Response) => {
  const upiId = process.env.UPI_ID || 'ajastrix2027@okhdfcbank'
  const merchantName = process.env.UPI_MERCHANT_NAME || 'AJ-ASTRIX 2K27 Festival'
  const amount = parseInt(process.env.FEST_PASS_AMOUNT || '250', 10)
  const upiIntentUri = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(merchantName)}&am=${amount}&cu=INR&tn=${encodeURIComponent('AJ-ASTRIX-2K27-Pass')}`

  res.json({
    upiId,
    merchantName,
    amount,
    currency: 'INR',
    upiIntentUri,
    acceptedMethods: ['Google Pay', 'PhonePe', 'Paytm', 'BHIM', 'Any UPI App'],
    instructions: 'Scan the enchanted UPI QR code with any UPI app, complete payment, and upload your receipt screenshot.',
  })
})

// API Routes
app.use('/api/health', healthRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/register', registrationRoutes)
app.use('/api/standings', standingsRoutes)
app.use('/api/events', eventsRoutes)
app.use('/api/contact', contactRoutes)

// Root API Welcome Inscription
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    festival: 'AJ-ASTRIX 2K27',
    tagline: 'Hogwarts College Festival API Service with Multi-Tier RBAC, UPI Payments & Owl Dispatch',
    adminHierarchy: {
      0: 'Super Admin (Headmaster) — Full System & Staff Control',
      1: 'Level 1 (Deputy Headmaster) — High-Level Management',
      2: 'Level 2 (Head of House) — House Points & Roster',
      3: 'Level 3 (Chief Event Coordinator) — Event Schedule & Venues',
      4: 'Level 4 (Gatekeeper & Desk) — Attendee Check-In & Verification',
      5: 'Level 5 (Scorekeeper) — House Cup Points Adjustment',
      6: 'Level 6 (Prefect) — Read-Only Stats Observer',
    },
    docs: {
      health: 'GET /api/health',
      paymentInfo: 'GET /api/payment/info',
      authLogin: 'POST /api/auth/login (body: { usernameOrEmail, password })',
      authMe: 'GET /api/auth/me (Bearer token required)',
      demoCredentials: 'GET /api/auth/demo-credentials',
      adminStats: 'GET /api/admin/stats (Bearer token required)',
      adminRegistrations: 'GET /api/admin/registrations (Bearer token required)',
      adminCheckIn: 'PATCH /api/admin/registrations/:id/checkin (Bearer token required)',
      adminPaymentVerify: 'PATCH /api/admin/registrations/:id/payment (Bearer token required)',
      adminUsers: 'GET/POST /api/admin/users (Bearer token required)',
      adminPoints: 'POST /api/admin/standings/adjust (Bearer token required)',
      adminEvents: 'POST/PUT/DELETE /api/admin/events (Bearer token required)',
      adminAuditLogs: 'GET /api/admin/logs (Super Admin only)',
      register: 'POST /api/register (multipart/form-data or json with optional receipt image)',
      standings: 'GET /api/standings',
      vote: 'POST /api/standings/vote (body: { houseId })',
      events: 'GET /api/events',
      schedule: 'GET /api/events/schedule',
      contact: 'POST /api/contact (body: { senderName, email, message })',
    },
  })
})

// 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: 'Chamber Not Found',
    message: `The magical corridor '${req.originalUrl}' does not exist in Hogwarts.`,
  })
})

// Centralized Error Handler
app.use(errorHandler)

app.listen(PORT, () => {
  console.log(`⚡ [AJ-ASTRIX 2K27 Backend] Magic awakens on http://localhost:${PORT}`)
  console.log(`📜 [API Endpoints] Health: http://localhost:${PORT}/api/health`)
  console.log(`🗝️ [Admin Portal API] http://localhost:${PORT}/api/admin`)
})

export default app
