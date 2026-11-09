# ✦ AJ-ASTRIX 2K27 · Hogwarts College Festival

An immersive Harry Potter themed college festival monorepo uniting **INOVEX (MCA)** and **NEXORA (MBA)** under one enchanted roof. Features a cinematic 3D Great Hall, interactive Marauder's Map, Daily Prophet broadsheet, House Cup point system, and an Express TypeScript backend API.

---

## 🏛️ Monorepo Architecture

The project is structured into clean **Frontend** and **Backend** directories:

```
harry-potter-3D-website/
├── frontend/                   # React 19 + Three.js + Vite Frontend
│   ├── src/
│   │   ├── api/client.ts       # Backend API client with automatic proxying
│   │   ├── components/         # UI components & interactive overlays
│   │   │   ├── RegistrationModal.tsx  # Wizarding registration form
│   │   │   ├── Header.tsx             # Navbar with glass burger menu
│   │   │   ├── FestCountdown.tsx      # Time-Turner countdown timer
│   │   │   ├── HouseCardPage.tsx      # Collector house pages & lore
│   │   │   ├── TeamPage.tsx           # Faculty & Student Council directory
│   │   │   └── marauders-map/         # Interactive campus map & schedule
│   │   ├── three/              # Three.js 3D Great Hall & camera choreography
│   │   ├── data/               # Chapters, houses, and schedule data
│   │   └── context/            # HouseContext for persistent house theme
│   ├── public/                 # 3D GLTF models, audio, fonts, textures, images
│   ├── index.html              # HTML shell with Google Fonts
│   ├── vite.config.ts          # Vite configuration with API proxy
│   └── package.json
│
├── backend/                    # Express + TypeScript REST API Service
│   ├── src/
│   │   ├── controllers/        # Registration, Standings, Events, Contact logic
│   │   ├── routes/             # REST route handlers (/api/*)
│   │   ├── data/               # Live standings, events, and house data
│   │   ├── models/             # TypeScript interfaces and types
│   │   ├── middleware/         # Request logger & error handlers
│   │   └── index.ts            # Express server entry point (port 5000)
│   ├── .env.example            # Environment variables template
│   ├── tsconfig.json
│   └── package.json
│
├── package.json                # Monorepo root with unified workspace scripts
├── vercel.json                 # Automatic Vercel production build config
└── netlify.toml                # Automatic Netlify production build config
```

---

## ⚡ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Frontend & Backend Concurrently
```bash
npm run dev:all
```
- **Frontend:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Running Separately:
```bash
# Run Frontend Only
npm run dev:frontend    # or: cd frontend && npm run dev

# Run Backend Only
npm run dev:backend     # or: cd backend && npm run dev
```

---

## 📜 Backend REST API

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/health` | `GET` | Health check & uptime status |
| `/api/register` | `POST` | Register a wizard for events & awards +5 House Cup points |
| `/api/register` | `GET` | Retrieve list of registered attendees |
| `/api/register/:id` | `GET` | Inspect specific attendee registration dossier |
| `/api/standings` | `GET` | Live House Cup points & rankings |
| `/api/standings/vote` | `POST` | Cast an enchanted vote for a house (+10 pts) |
| `/api/standings/points` | `POST` | Award custom merit points to a house |
| `/api/events` | `GET` | Full list of festival competitions & symposiums |
| `/api/events/schedule` | `GET` | 2-Day schedule for INOVEX (MCA) & NEXORA (MBA) |
| `/api/contact` | `POST` | Send an "Owl Post" inquiry to fest coordinators |

---

## 🚀 Build & Production Deployment

To build both services for production:
```bash
npm run build
```

- **Frontend Build Output:** `frontend/dist/`
- **Backend Build Output:** `backend/dist/`

The project includes `vercel.json` and `netlify.toml` pre-configured to build `frontend/` seamlessly on any cloud hosting platform.
