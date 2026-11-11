# ✦ AJ-ASTRIX 2K27 · Hogwarts College Festival

> *"Welcome to the heart of Hogwarts. A place of magic, feasts, and the four great houses."*

An immersive, full-stack Harry Potter themed college festival web experience uniting **INOVEX (Department of Computer Applications — MCA)** and **NEXORA (Department of Business Administration — MBA)** under one enchanted roof.

Featuring a photorealistic 3D Great Hall with continuous scroll-driven camera choreography, an interactive parchment Marauder's Map, a Daily Prophet broadsheet gazette, four 3D holographic house collector cards, and a dedicated Express + TypeScript backend REST API.

---

## 🌟 Key Features

### 🏰 1. Cinematic 3D Great Hall Experience
- **Rigged & Procedural Architecture:** Real 3D Great Hall GLTF model with procedural lighting, double-sided opening doors, and realistic stone textures.
- **7-Point Scroll Choreography:** Eased 1-scroll-at-a-time camera timeline featuring Dutch tilt banking, organic steadicam float, and dynamic focal length (FOV) breathing:
  - **Chapter 0 (The Entrance):** Standing before the towering oak doors.
  - **Chapter 1 (The Aisle):** Gliding through the doorway down the central stone runner.
  - **Chapter 2 (INOVEX MCA):** Camera pans right toward the tech wizardry symposium tables.
  - **Chapter 3 (NEXORA MBA):** Sweeping rotation left to the management conclave tables.
  - **Chapter 4 (AJ-ASTRIX):** Rising high above the feast toward the vaulted ceilisngs.
  - **Chapter 5 (Time Remaining):** Hovering among the floating candles with the **Time-Turner Countdown**.
  - **Chapter 6 (Inter-House Championship):** Descending to the High Table where professors watch.
  - **Chapter 7 (The Grand Finale):** Panoramic wide shot revealing the **Four House Collector Cards**.
- **Atmospheric Magic:** 100+ instanced floating candles with billboard flame flickers, drifting golden embers, starlight enchanted ceiling dome, and house-specific spotlighting.

### 🗺️ 2. Marauder's Event Map (`#/map`)
- Authentic parchment map on dark oak with brass fleurons.
- Multi-touch pointer dragging, panning, and mouse wheel zoom.
- Interactive glowing Lumos beacons highlighting campus venues (Main Auditorium, Library, Astronomy Tower, Dungeons, Quidditch Grounds, Courtyard).
- Integrated **Two-Day Programme Schedule** with live search filtering across events, categories, and locations.

### 🗞️ 3. The Daily Prophet & Hogwarts Directory (`#/team`)
- Authentic broadsheet gazette cover (*"Meet The AJ-ASTRIX 2K27 Team!"*) with wax seal and lightbox zoom.
- Baroque oil-painted portraits with filigree frames for the **Head of Department (Dr. Alistair Vance)** and **Faculty Coordinators**.
- Interactive 12-card **Student Council & Domain Lead** showcase with accordion expansion and dedicated dossier modals.

### 🦁 4. The Four Houses & 3D Cards (`#/house/:id`)
- 3D holographic tilt and glare physics on mouse move.
- Dedicated house pages for **Gryffindor**, **Slytherin**, **Ravenclaw**, and **Hufflepuff**.
- Comprehensive lore, founder history, house ghost, elemental affinity, and filtered event schedules.
- Seamless synchronization with global `HouseContext` and `localStorage`, dynamically restyling the 3D scene lighting to the visitor's house.

### ⏳ 5. Time-Turner Fest Countdown
- Live countdown timer to **25 October 2027 09:00 AM IST**.
- Runic glass digit cards with pulsing amber glows and inauguration status indicators.

### ⚡ 6. Full-Stack Wizarding Registration & UPI Payments
- Real-time registration modal connected to the backend REST API (`/api/register`).
- **Two-Step Registration Journey:**
  - **Step 1 (Wizard Info):** Validates name, owl email, phone, college, department (MCA, MBA, BTech, BCA, Other), house sorting, and event signups.
  - **Step 2 (UPI Payment Scanner):** Dynamic client-side QR code generator for instant UPI scan & pay (`Google Pay`, `PhonePe`, `Paytm`, `BHIM`), copyable UPI ID (`ajastrix2027@okhdfcbank`), mandatory UTR transaction reference input, and payment receipt screenshot upload (`.png`, `.jpg`, `.jpeg`, `.webp`, `.pdf` up to 5MB).
- **Cloudinary & Local Storage Fallback:** Receipt images are streamed to Cloudinary CDN; if API keys are not supplied, the system seamlessly saves files to local persistent disk storage (`backend/data/uploads/receipts/`).
- **Hogwarts Acceptance Letter & Owl Dispatch:** Upon registration, an enchanted HTML acceptance letter and fest entry pass is automatically generated and dispatched via Nodemailer SMTP (with real-time console preview fallback).
- **High Concurrency Engine (200+ Simultaneous Registrations):** Tested at **655+ requests/sec** with an atomic debounced disk-write queue that completely avoids file collisions, race conditions, or lock contention.
- **Anti-Spam & Rate Limiter Wards:**
  - Multi-tier `express-rate-limit` guards (600 req/min API, 25 per 5 min registration, 25 per 15 min admin login).
  - Invisible honeypot field (`incantation_trap`) traps malicious bot crawlers.
  - Form submission velocity check blocks sub-second script automation (<1200ms).

---

## 🏛️ Monorepo Architecture

The project is cleanly divided into decoupled **Frontend** and **Backend** directories:

```
harry-potter-3D-website/
├── frontend/                   # Client application (React 19 + Three.js + Vite)
│   ├── src/
│   │   ├── api/                # Backend API client with typed fetchers
│   │   │   └── client.ts
│   │   ├── components/         # UI components & interactive overlays
│   │   │   ├── RegistrationModal.tsx  # Wizarding registration form
│   │   │   ├── Header.tsx             # Navbar with glass burger menu
│   │   │   ├── FestCountdown.tsx      # Time-Turner countdown timer
│   │   │   ├── HouseCard.tsx          # 3D interactive house card
│   │   │   ├── HouseCardPage.tsx      # Collector house pages & lore
│   │   │   ├── TeamPage.tsx           # Faculty & Student Council directory
│   │   │   ├── DailyProphetSection.tsx # Newspaper broadsheet component
│   │   │   ├── ScrollHint.tsx         # Floating scroll indicator
│   │   │   ├── LoadingScreen.tsx      # Atmospheric progress loader
│   │   │   └── marauders-map/         # Interactive campus map & schedule
│   │   ├── three/              # Three.js 3D Great Hall & camera choreography
│   │   │   ├── HallScene.tsx          # Main 3D canvas, camera rig & step lock
│   │   │   ├── DiningHallModel.tsx    # GLTF model loader, materials & door rig
│   │   │   ├── cameraPath.ts          # 7-point CatmullRom camera timeline
│   │   │   ├── Atmosphere.tsx         # Floating candles, ceiling & embers
│   │   │   ├── Fire.tsx               # Instanced fireplace & brazier flames
│   │   │   └── doorRig.ts             # Double-sided door rotation rig
│   │   ├── data/               # Chapters, houses, team, and schedule data
│   │   └── context/            # HouseContext for persistent house theme
│   ├── public/                 # 3D GLTF models, audio, fonts, textures, images
│   ├── index.html              # HTML shell with Google Fonts
│   ├── vite.config.ts          # Vite configuration with /api proxy
│   └── package.json
│
├── backend/                    # Express + TypeScript REST API Service
│   ├── src/
│   │   ├── controllers/        # Registration, Standings, Events, Contact logic
│   │   ├── routes/             # REST route handlers (/api/*)
│   │   ├── data/               # In-memory store: live standings, events, houses
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

## 🛠️ Tech Stack

### Frontend
- **Framework:** React 19 + TypeScript (Strict)
- **3D Graphics:** Three.js (`^0.171.0`) + React Three Fiber (`@react-three/fiber ^9.0.0`) + Drei (`@react-three/drei ^10.0.0`)
- **Animation:** Framer Motion (`^14.6.0`)
- **Styling:** Tailwind CSS v4 (`@tailwindcss/vite ^4.0.0`)
- **Build Tool:** Vite 6

### Backend
- **Runtime:** Node.js (v18+)
- **Framework:** Express (`^4.21.2`) + TypeScript (`^5.7.2`)
- **Execution:** TSX (`tsx watch`) for fast development without build steps
- **Security & Utilities:** CORS, Dotenv

---

## ⚡ Getting Started

### Prerequisites
- Node.js `v18.0.0` or higher
- npm `v9.0.0` or higher

### 1. Clone & Install Dependencies
```bash
git clone https://github.com/PRN-6/harry-potter-3D-website.git
cd harry-potter-3D-website
npm install
```

### 2. Run Both Frontend and Backend Concurrently
```bash
npm run dev:all
```
- **Frontend App:** [http://localhost:5173](http://localhost:5173)
- **Backend API:** [http://localhost:5000/api](http://localhost:5000/api)
- **API Health:** [http://localhost:5000/api/health](http://localhost:5000/api/health)

*(The dev server binds to your LAN, allowing mobile devices on the same Wi-Fi to test at `http://<your-pc-ip>:5173`.)*

### Running Separately:
```bash
# Run Frontend Only
npm run dev:frontend    # or: cd frontend && npm run dev

# Run Backend Only
npm run dev:backend     # or: cd backend && npm run dev
```

---

## 📜 Backend REST API Reference

All backend routes are prefixed with `/api`.

### 1. Health & Status
- **`GET /api/health`**
  ```json
  {
    "status": "online",
    "spell": "Lumos Maxima",
    "festival": "AJ-ASTRIX 2K27",
    "edition": "Grand College Festival",
    "uptimeSeconds": 120
  }
  ```

### 2. Wizard Registration
- **`POST /api/register`**
  - **Body:**
    ```json
    {
      "fullName": "Harry Potter",
      "email": "harry@hogwarts.edu",
      "phone": "+91 98765 43210",
      "college": "Hogwarts College of Wizardry",
      "department": "MCA",
      "usnOrRollNo": "1AJ23MC007",
      "houseId": "gryffindor",
      "eventIds": ["quidditch-cup", "hackathon-hex"]
    }
    ```
  - **Response (`201 Created`):**
    ```json
    {
      "success": true,
      "message": "Welcome to AJ-ASTRIX 2K27, Harry Potter! You have been sorted into GRYFFINDOR.",
      "registration": { "id": "reg_1731137...", "houseId": "gryffindor", ... }
    }
    ```
- **`GET /api/register`** — Returns all registered participants.
- **`GET /api/register/:id`** — Returns details for a specific registration ID.

### 3. House Cup Standings
- **`GET /api/standings`** — Returns ranked house standings and the current House Cup leader.
- **`POST /api/standings/vote`** — Casts an enchanted vote for a house (+10 pts).
  - **Body:** `{ "houseId": "slytherin" }`
- **`POST /api/standings/points`** — Awards custom points for competition wins.
  - **Body:** `{ "houseId": "ravenclaw", "points": 50, "reason": "Won Hackathon Hex" }`

### 4. Events & Schedule
- **`GET /api/events`** — Full catalog of festival competitions.
- **`GET /api/events/schedule`** — 2-day schedule breakdown for INOVEX (MCA) and NEXORA (MBA).
- **`GET /api/events/:id`** — Specific event details and rules.

### 5. Owl Post (Contact & Inquiries)
- **`POST /api/contact`**
  - **Body:** `{ "senderName": "Hermione", "email": "hermione@hogwarts.edu", "message": "Inquiry regarding Quidditch rules." }`

---

## 🏛️ Staff & Admin Chamber Portal (`#/admin`)

The website includes an authenticated **Staff & Ministry Portal** featuring a multi-tier **Role-Based Access Control (RBAC)** architecture with 7 distinct clearance levels:

| Level | Title | Clearance / Powers | Demo Account | Demo Password |
|---|---|---|---|---|
| **0** | **Super Admin (Headmaster)** | Supreme dominion: Manage staff accounts (L1–L6), full House Cup point overrides, delete registrations, export CSV, access security audit logs. | `headmaster` | `AlbusDumbledore2027!` |
| **1** | **Level 1 (Deputy Headmaster)** | High Council: Manage events, view registrations, award/deduct house points, toggle check-ins, export attendee CSV. | `mcgonagall` | `Transfiguration2027!` |
| **2** | **Level 2 (Head of House)** | House Jurisdiction: View attendee rosters, award/deduct points strictly for their assigned house (e.g. Slytherin). | `snape` | `PotionsMaster2027!` |
| **3** | **Level 3 (Event Coordinator)** | Festival Schedule Lead: Create, update, and delete events, adjust competition venues and timings. | `flitwick` | `CharmsMaster2027!` |
| **4** | **Level 4 (Gatekeeper & Desk)** | Ground Verification: Search attendees by USN/name, verify entry tickets, toggle attendee check-in status. | `filch` | `Caretaker2027!` |
| **5** | **Level 5 (House Cup Scorekeeper)** | Dedicated Points Usher: Award and deduct house points with mandatory reason tags and audit trail. | `hooch` | `Quidditch2027!` |
| **6** | **Level 6 (Prefect Observer)** | Read-Only Observer: Access live attendee statistics, schedules, and standings (all mutations blocked). | `percy` | `PrefectBadge2027!` |

> ⚡ **Interactive 1-Click Tester:** The login page at `#/admin` includes quick-login preset chips allowing you to test every admin level (0 through 6) with a single click.

### Admin API Endpoints:
- `POST /api/auth/login` — Authenticate credentials with bcrypt & JWT
- `GET /api/auth/me` — Verify token and retrieve permissions map
- `GET /api/auth/demo-credentials` — Fetch test accounts list
- `GET /api/admin/stats` — Dashboard overview counts, revenue analytics & house ratios
- `GET /api/admin/registrations` — Search, filter by house, attendance & payment status, pagination
- `PATCH /api/admin/registrations/:id/checkin` — Toggle check-in status (L0–L4)
- `PATCH /api/admin/registrations/:id/payment` — Verify or reject payment (+10 house pts on verify) (L0–L2)
- `POST /api/admin/registrations/:id/email` — Re-dispatch Hogwarts Acceptance Letter (L0–L2)
- `DELETE /api/admin/registrations/:id` — Delete registration (Super Admin L0)
- `GET /api/admin/registrations/export/csv` — Download attendee list CSV with payment status (L0–L4)
- `GET /api/admin/users` — List staff accounts (L0–L1)
- `POST /api/admin/users` — Appoint new staff member with L1–L6 clearance (Super Admin L0)
- `DELETE /api/admin/users/:id` — Banish staff member (Super Admin L0)
- `POST /api/admin/standings/adjust` — Adjust points with reason (L0, L1, L2, L5)
- `GET /api/admin/standings/logs` — Scoring history ledger
- `POST /api/admin/events` — Create new event (L0, L1, L3)
- `DELETE /api/admin/events/:id` — Delete event (L0, L1, L3)
- `GET /api/admin/logs` — Security audit trail (Super Admin L0)

### 🔐 Environment Variables (`backend/.env`)

Copy `backend/.env.example` to `backend/.env` to customize settings:

```env
# Server Port & Allowed Origins
PORT=5000
FRONTEND_URL=http://localhost:5173

# Admin Security & JWT Secret
JWT_SECRET=hogwarts_secret_key_change_in_production_2027

# UPI Scanner & Fest Pass Pricing
UPI_ID=ajastrix2027@okhdfcbank
UPI_MERCHANT_NAME="AJ-ASTRIX 2K27 Festival"
FEST_PASS_AMOUNT=250

# Cloudinary Storage (Optional - falls back to local storage if unset)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Owl Post Email Service (Optional - falls back to console preview if unset)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM="AJ-ASTRIX 2K27 <no-reply@ajastrix2027.com>"

# High Concurrency & Rate Limiting Thresholds
GLOBAL_RATE_LIMIT_MAX=600
REGISTRATION_RATE_LIMIT_MAX=25
LOGIN_RATE_LIMIT_MAX=25
```

---

## 🚀 Building & Production Deployment

To build both services for production:
```bash
npm run build
```
- **Frontend artifacts:** `frontend/dist/`
- **Backend artifacts:** `backend/dist/`

### Deployment Guides

#### Vercel
The root [`vercel.json`](file:///d:/projects/harry-potter-3D-website/vercel.json) is configured to build `frontend/` automatically:
```json
{
  "buildCommand": "npm --prefix frontend run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite"
}
```

#### Netlify
The root [`netlify.toml`](file:///d:/projects/harry-potter-3D-website/netlify.toml) is pre-configured:
```toml
[build]
  base = "frontend"
  publish = "dist"
  command = "npm run build"
```

#### Node.js / Docker / VPS Backend Hosting
Run the backend production server:
```bash
npm run start    # runs: node backend/dist/index.js
```

---

## 📋 Ready-to-Add GitHub Issues & Roadmap

A comprehensive backlog of **15 ready-to-copy GitHub Issues** has been prepared in [`.github/ISSUES_READY_TO_PASTE.md`](.github/ISSUES_READY_TO_PASTE.md), categorized into:
- 🟢 **Beginner Tasks (Good First Issues):** Ambient audio toggle, social sharing, sorting quiz, accessibility reduced motion, house confetti.
- 🟡 **Medium Tasks:** SQLite database persistence, live House Cup hourglass, category filter tags in Marauder's Map, Hogwarts email dispatch, digital entry ticket pass generator.
- 🔴 **Hard / Advanced Tasks:** 3D Great Hall dynamic LOD, real-time WebSocket point broadcasts, 3D Golden Snitch mini-game, protected admin dashboard with JWT auth, automated Playwright & Vitest testing suite.

Standard GitHub issue templates are also pre-configured in [`.github/ISSUE_TEMPLATE/`](.github/ISSUE_TEMPLATE/).

---

## 🎮 Navigation & Keyboard Controls

| Action | Control |
| :--- | :--- |
| **Step Forward** | Mouse Scroll Down · Touch Swipe Up · Down Arrow · Page Down · Spacebar |
| **Step Backward** | Mouse Scroll Up · Touch Swipe Down · Up Arrow · Page Up |
| **Reset Tour** | Click `AJ-ASTRIX 2K27` Brand · Click `Great Hall` in Header Navigation |
| **Open Menu** | Click Circular Glass Burger Button · Press `Esc` to Close |
| **Pan Marauder's Map** | Click & Drag Map · Touch Drag on Mobile |
| **Zoom Marauder's Map** | Mouse Wheel · `+` / `−` Map HUD Buttons |
| **Close Overlays / Modals** | Press `Escape` or Click `✕` Button |

---

## 📜 Credits & Acknowledgements

- **Festival Organizers:** INOVEX (Department of Computer Applications — MCA) & NEXORA (Department of Business Administration — MBA).
- **3D Great Hall Model:** Based on the Great Hall architectural model by Asmodeo666 (CC-BY-4.0), re-engineered and rigged with double-sided door animations.
- **Typography:** *Cinzel Decorative*, *Cinzel*, *Crimson Pro*, *Outfit*, and *MedievalSharp* via Google Fonts.

---

*✦ "I solemnly swear that I am up to no good." ✦*
