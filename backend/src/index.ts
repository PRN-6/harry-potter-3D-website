import express, { Request, Response } from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import { requestLogger } from './middleware/logger.js'
import { errorHandler } from './middleware/errorHandler.js'
import healthRoutes from './routes/healthRoutes.js'
import registrationRoutes from './routes/registrationRoutes.js'
import standingsRoutes from './routes/standingsRoutes.js'
import eventsRoutes from './routes/eventsRoutes.js'
import contactRoutes from './routes/contactRoutes.js'
import authRoutes from './routes/authRoutes.js'
import adminRoutes from './routes/adminRoutes.js'

dotenv.config()

const app = express()
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
    tagline: 'Hogwarts College Festival API Service with Multi-Tier RBAC & Persistence',
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
      authLogin: 'POST /api/auth/login (body: { usernameOrEmail, password })',
      authMe: 'GET /api/auth/me (Bearer token required)',
      demoCredentials: 'GET /api/auth/demo-credentials',
      adminStats: 'GET /api/admin/stats (Bearer token required)',
      adminRegistrations: 'GET /api/admin/registrations (Bearer token required)',
      adminCheckIn: 'PATCH /api/admin/registrations/:id/checkin (Bearer token required)',
      adminUsers: 'GET/POST /api/admin/users (Bearer token required)',
      adminPoints: 'POST /api/admin/standings/adjust (Bearer token required)',
      adminEvents: 'POST/PUT/DELETE /api/admin/events (Bearer token required)',
      adminAuditLogs: 'GET /api/admin/logs (Super Admin only)',
      register: 'POST /api/register (body: { fullName, email, phone, college, houseId, eventIds })',
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
