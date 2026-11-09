# ✦ AJ-ASTRIX 2K27 · GitHub Issues Backlog (Ready to Copy & Paste)

This document contains 15 curated GitHub issues for features, bug fixes, and tasks categorized into **Beginner (Good First Issue)**, **Medium**, and **Hard** levels.

When you are ready to add them to your GitHub repository:
1. Go to your repository on GitHub: `https://github.com/PRN-6/harry-potter-3D-website/issues`
2. Click **New issue**
3. Copy the **Title**, **Labels**, and **Markdown Body** from the cards below.

---

## 📑 Issue Catalog Summary

| # | Title | Difficulty | Category | Labels |
|---|---|---|---|---|
| 01 | [Ambient Soundtrack & Audio Toggle](#issue-01-ambient-soundtrack--audio-toggle) | 🟢 Easy | Frontend | `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `audio` |
| 02 | [Social Share & Copy Registration Link](#issue-02-social-share--copy-registration-link) | 🟢 Easy | Frontend | `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `ui/ux` |
| 03 | [Sorting Hat Mini-Quiz for House Selection](#issue-03-sorting-hat-mini-quiz-for-house-selection) | 🟢 Easy | Frontend | `feature`, `good first issue`, `difficulty: easy`, `frontend`, `gamification` |
| 04 | [Reduced Motion & Accessibility Controls](#issue-04-reduced-motion--accessibility-controls) | 🟢 Easy | Frontend | `accessibility`, `good first issue`, `difficulty: easy`, `frontend`, `a11y` |
| 05 | [House-Coloured Confetti on Registration](#issue-05-house-coloured-confetti-on-registration) | 🟢 Easy | Frontend | `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `animation` |
| 06 | [SQLite / File DB Persistence for Backend](#issue-06-sqlite--file-db-persistence-for-backend) | 🟡 Medium | Backend | `backend`, `database`, `difficulty: medium`, `enhancement` |
| 07 | [Live House Cup Hourglass & Bar Chart](#issue-07-live-house-cup-hourglass--bar-chart) | 🟡 Medium | Frontend | `feature`, `frontend`, `difficulty: medium`, `gamification` |
| 08 | [Department & Category Filter Tags in Map](#issue-08-department--category-filter-tags-in-map) | 🟡 Medium | Frontend | `feature`, `frontend`, `difficulty: medium`, `ui/ux` |
| 09 | [Hogwarts Acceptance Letter Email Dispatch](#issue-09-hogwarts-acceptance-letter-email-dispatch) | 🟡 Medium | Backend | `backend`, `feature`, `difficulty: medium`, `email` |
| 10 | [Digital Hogwarts Fest Pass Generator](#issue-10-digital-hogwarts-fest-pass-generator) | 🟡 Medium | Frontend | `feature`, `frontend`, `difficulty: medium`, `graphics` |
| 11 | [3D Great Hall Dynamic LOD & Performance](#issue-11-3d-great-hall-dynamic-lod--performance) | 🔴 Hard | 3D / WebGL | `performance`, `3d`, `three.js`, `difficulty: hard` |
| 12 | [Real-Time WebSocket / SSE Point Broadcast](#issue-12-real-time-websocket--sse-point-broadcast) | 🔴 Hard | Full-Stack | `backend`, `frontend`, `websockets`, `difficulty: hard` |
| 13 | [Interactive 3D Flying Golden Snitch Mini-Game](#issue-13-interactive-3d-flying-golden-snitch-mini-game) | 🔴 Hard | 3D / Three.js | `feature`, `3d`, `three.js`, `gamification`, `difficulty: hard` |
| 14 | [Protected Admin Dashboard with JWT Auth](#issue-14-protected-admin-dashboard-with-jwt-auth) | 🔴 Hard | Full-Stack | `backend`, `frontend`, `security`, `difficulty: hard` |
| 15 | [Automated E2E Playwright & Vitest Test Suite](#issue-15-automated-e2e-playwright--vitest-test-suite) | 🔴 Hard | DevOps / QA | `testing`, `ci/cd`, `quality-assurance`, `difficulty: hard` |

---

## 🟢 Beginner Level Tasks (Good First Issues)

### Issue 01: Ambient Soundtrack & Audio Toggle
- **Title:** `[FEAT]: Ambient Hogwarts Great Hall Soundtrack & Floating Audio Mute Toggle`
- **Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `audio`
- **Body:**
```markdown
### 📌 Overview
Add an atmospheric background audio track (soft crackling fireplace, gentle orchestral harp or choral Hogwarts ambient melody) to immerse visitors when entering the 3D Great Hall, along with a discreet floating mute/unmute audio control button in the navbar.

### 🎯 Acceptance Criteria
- [ ] Add a royalty-free ambient wizarding audio loop (`.mp3` or `.ogg` under 1.5MB) to `frontend/public/audio/great-hall-ambient.mp3`.
- [ ] Create a floating speaker button in `frontend/src/components/Header.tsx` (next to the burger menu or live badge) with sound-wave animation when unmuted.
- [ ] Respect browser autoplay policies (start muted by default or prompt with a subtle toast: *"Click to awaken Great Hall sound 🔊"*).
- [ ] Persist audio preference (`muted: true/false`) in `localStorage`.
- [ ] Provide smooth volume fade-in and fade-out transitions instead of abrupt cuts.

### 🛠️ Files to Modify
- `frontend/src/components/Header.tsx`
- `frontend/src/App.tsx`
- `frontend/public/audio/great-hall-ambient.mp3`
```

---

### Issue 02: Social Share & Copy Registration Link
- **Title:** `[FEAT]: Social Share & Copy Registration Link in Registration Modal`
- **Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `ui/ux`
- **Body:**
```markdown
### 📌 Overview
When a visitor completes their registration for AJ-ASTRIX 2K27, they should be able to celebrate and invite their friends by copying their registration link or sharing directly to WhatsApp, X (Twitter), or LinkedIn with a pre-formatted wizarding message.

### 🎯 Acceptance Criteria
- [ ] On the success screen in `frontend/src/components/RegistrationModal.tsx`, display:
  - *"Share with fellow wizards"* section.
  - One-click **"Copy Link"** button with a brief *"Copied to Clipboard! ✨"* tooltip.
  - Direct **WhatsApp Share** button: `https://api.whatsapp.com/send?text=...`
  - Direct **X (Twitter) Share** button: `https://twitter.com/intent/tweet?text=...`
- [ ] Pre-formatted message should mention:
  - *"I just registered for AJ-ASTRIX 2K27 (INOVEX & NEXORA) sorted into [HOUSE]! Join me at Hogwarts: [URL]"*

### 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
```

---

### Issue 03: Sorting Hat Mini-Quiz for House Selection
- **Title:** `[FEAT]: 3-Question Sorting Hat Mini-Quiz for House Selection`
- **Labels:** `feature`, `good first issue`, `difficulty: easy`, `frontend`, `gamification`
- **Body:**
```markdown
### 📌 Overview
Some attendees aren't sure which of the 4 houses (Gryffindor, Slytherin, Ravenclaw, Hufflepuff) they belong to. Add a simple, fun 3-question "Sorting Hat Quiz" option in the House selection step of `RegistrationModal.tsx` and `HouseCardPage.tsx` to automatically suggest their house!

### 🎯 Acceptance Criteria
- [ ] Add a *"Not sure? Let the Sorting Hat decide 🧙‍♂️"* button next to house cards.
- [ ] Present 3 quick scenario questions, e.g.:
  1. *"Faced with a locked chamber door, you:"*
     - A) Kick it down boldly (Gryffindor)
     - B) Pick the lock with cunning strategy (Slytherin)
     - C) Solve the ancient riddle carved into the stone (Ravenclaw)
     - D) Search for the friendly keymaker or knock patiently (Hufflepuff)
- [ ] Calculate the highest scored house and automatically select it with an enchanted sound / badge.
- [ ] Option to retake or manually override if the user prefers another house.

### 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/src/data/quizQuestions.ts` (new helper file)
```

---

### Issue 04: Reduced Motion & Accessibility Controls
- **Title:** `[FEAT]: Accessibility & Motion Preference Controls (Toggle Camera Smoothing)`
- **Labels:** `accessibility`, `good first issue`, `difficulty: easy`, `frontend`, `a11y`
- **Body:**
```markdown
### 📌 Overview
Some visitors may experience motion sensitivity from dynamic 3D camera dollies, Dutch tilt banking, or floating candle drifts. Improve web accessibility by adding an accessible "Reduced Motion / Simple View" toggle that disables camera tilting, slows lerps, and provides discrete step jumping.

### 🎯 Acceptance Criteria
- [ ] Honor the user's OS-level preference `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- [ ] Add an accessible toggle switch in the mobile/desktop menu: *"Reduced 3D Motion"*.
- [ ] When enabled:
  - Set camera roll / Dutch tilt to 0.
  - Disable candle bobbing and star rotation in `Atmosphere.tsx`.
  - Transition chapter captions instantly without blur/scaling effects.
- [ ] Ensure all buttons have explicit `aria-label` attributes and focus visible outlines.

### 🛠️ Files to Modify
- `frontend/src/three/HallScene.tsx`
- `frontend/src/three/Atmosphere.tsx`
- `frontend/src/components/Header.tsx`
```

---

### Issue 05: House-Coloured Confetti on Registration
- **Title:** `[FEAT]: House-Coloured Confetti & Magical Sparkle Cannon on Registration`
- **Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `animation`
- **Body:**
```markdown
### 📌 Overview
Celebrate a wizard's registration by triggering a festive burst of house-themed celebratory sparkles/confetti across the screen when their registration succeeds.

### 🎯 Acceptance Criteria
- [ ] Install lightweight `canvas-confetti` (`npm i canvas-confetti && npm i -D @types/canvas-confetti` in `frontend`).
- [ ] Trigger two angled cannon blasts from bottom-left and bottom-right when the registration status switches to `'success'`.
- [ ] Use the exact colors of the registrant's selected house:
  - Gryffindor: `['#ae1c28', '#d4a017', '#ffd700']`
  - Slytherin: `['#0a5c36', '#c0c8d0', '#5ce6a0']`
  - Ravenclaw: `['#0e1a40', '#8ec9ff', '#946b2d']`
  - Hufflepuff: `['#ecb939', '#6b4a12', '#ffd75e']`
- [ ] Clean up canvas context automatically without memory leaks.

### 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/package.json`
```

---

## 🟡 Medium Level Tasks

### Issue 06: SQLite / File DB Persistence for Backend
- **Title:** `[FEAT]: SQLite / File Database Persistence for Registrations & House Standings`
- **Labels:** `backend`, `database`, `difficulty: medium`, `enhancement`
- **Body:**
```markdown
### 📌 Overview
The backend currently stores registrations and house points in memory, which resets when the server restarts or re-deploys. Replace this with a lightweight SQLite database using Prisma, Drizzle, or `better-sqlite3` to persist all registered wizards and live House Cup scores.

### 🎯 Acceptance Criteria
- [ ] Add SQLite database storage (e.g. SQLite file at `backend/data/fest.db`).
- [ ] Schema requirements:
  - `registrations`: `id`, `full_name`, `email` (unique), `phone`, `college`, `department`, `usn`, `house_id`, `event_ids` (JSON), `created_at`.
  - `house_standings`: `house_id` (PRIMARY KEY), `points`, `updated_at`.
- [ ] Ensure `POST /api/register` inserts into the DB and updates house points atomically.
- [ ] Add `.gitignore` entry for `*.db`, `*.sqlite`, `*.db-journal`.
- [ ] Provide initial database seed script (`npm --prefix backend run seed`).

### 🛠️ Files to Modify
- `backend/src/controllers/registrationController.ts`
- `backend/src/controllers/standingsController.ts`
- `backend/src/data/standingsData.ts`
- `backend/package.json`
- `.gitignore`
```

---

### Issue 07: Live House Cup Hourglass & Bar Chart
- **Title:** `[FEAT]: Interactive Live House Cup Hourglass & Standings Bar Chart`
- **Labels:** `feature`, `frontend`, `difficulty: medium`, `gamification`
- **Body:**
```markdown
### 📌 Overview
Build an interactive **House Cup Standings** visualizer on the frontend that displays the live point totals for Gryffindor, Slytherin, Ravenclaw, and Hufflepuff with authentic magical hourglass animations (falling rubies, emeralds, sapphires, and topazes).

### 🎯 Acceptance Criteria
- [ ] Fetch live points from `GET /api/standings` on mount and poll periodically.
- [ ] Render 4 ornate Gothic hourglasses filled with glowing colored gems reflecting house point proportions.
- [ ] Animate point increases using Framer Motion with floating badge labels (e.g., `+10 pts`).
- [ ] Add an interactive **"Cheer Your House"** button allowing attendees to cast 1 vote per hour (rate-limited via `localStorage` timestamp).
- [ ] Display the leading house with an enchanted golden House Cup trophy badge.

### 🛠️ Files to Modify
- `frontend/src/components/HouseCupHourglass.tsx` (new component)
- `frontend/src/components/HouseCardPage.tsx`
- `frontend/src/api/client.ts`
```

---

### Issue 08: Department & Category Filter Tags in Map
- **Title:** `[FEAT]: Department & Category Multi-Tag Filtering in Marauder's Event Map`
- **Labels:** `feature`, `frontend`, `difficulty: medium`, `ui/ux`
- **Body:**
```markdown
### 📌 Overview
In `frontend/src/components/marauders-map/MaraudersMapPage.tsx`, the 2-day schedule scroll currently displays all events in chronological order. Expand this with quick-filter pills for **INOVEX (MCA)**, **NEXORA (MBA)**, **Technical**, **Management**, **Cultural**, and **Gaming** so students can filter competitions tailored to their domain.

### 🎯 Acceptance Criteria
- [ ] Add category filter chips above the event schedule in `MaraudersMapPage.tsx`:
  - `All Events` (default)
  - `INOVEX (MCA) Tech`
  - `NEXORA (MBA) Management`
  - `Esports & Gaming`
  - `Cultural & Yule Ball`
- [ ] Allow simultaneous search query filtering + category chip selection.
- [ ] Animate list items entering/exiting with Framer Motion layout animations (`layout` prop).
- [ ] Show empty state when no events match the search/filters (*"No magical events found matching your incantation"*).

### 🛠️ Files to Modify
- `frontend/src/components/marauders-map/MaraudersMapPage.tsx`
- `frontend/src/data/eventMapData.ts`
```

---

### Issue 09: Hogwarts Acceptance Letter Email Dispatch
- **Title:** `[FEAT]: Automated Hogwarts Acceptance Letter Email Dispatch for Registrations`
- **Labels:** `backend`, `feature`, `difficulty: medium`, `email`
- **Body:**
```markdown
### 📌 Overview
When a participant successfully registers through `POST /api/register`, dispatch an authentic, beautifully styled HTML email formatted like a **Hogwarts Acceptance Letter** containing their official registration ID, sorted house crest, registered event details, and festival reporting instructions.

### 🎯 Acceptance Criteria
- [ ] Integrate an email service provider in `backend/` using `nodemailer` (SMTP) or `@resend/node` with configurable environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` or `RESEND_API_KEY`).
- [ ] Design an authentic parchment-themed HTML email template:
  - Hogwarts crest & green ink typography (*"Dear Mr./Ms. [LastName], We are pleased to inform you that you have a place at AJ-ASTRIX 2K27..."*).
  - List of registered competitions with venues and reporting times.
  - Unique QR code or Registration ID for gate check-in.
- [ ] Ensure email sending is asynchronous and does not block the HTTP response if the mail provider is slow or fails (with try/catch error logging).

### 🛠️ Files to Modify
- `backend/src/controllers/registrationController.ts`
- `backend/src/services/emailService.ts` (new service)
- `backend/.env.example`
- `backend/package.json`
```

---

### Issue 10: Digital Hogwarts Fest Pass Generator
- **Title:** `[FEAT]: Digital Hogwarts Fest Entry Pass Generator (Downloadable PNG / PDF)`
- **Labels:** `feature`, `frontend`, `difficulty: medium`, `graphics`
- **Body:**
```markdown
### 📌 Overview
After registering, attendees should be able to download an authentic, vintage-styled **Hogwarts Express / Fest Entry Ticket** as an image (PNG) or PDF that they can save to their mobile wallet or print out for entry verification at the gates.

### 🎯 Acceptance Criteria
- [ ] Add a **"Download Official Fest Pass 🎟️"** button in `RegistrationModal.tsx` upon successful registration.
- [ ] Render an authentic Hogwarts Express ticket layout:
  - Gold foiled borders, platform 9¾ emblem, attendee name, college name, assigned House crest, and registered events.
  - Dynamically generated QR code containing the attendee's `reg_id` for on-site scanning.
- [ ] Export directly on the client side using `html-to-image` or HTML5 `<canvas>` without needing a backend rendering pipeline.
- [ ] Mobile-responsive preview before download.

### 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/src/components/FestTicketPass.tsx` (new component)
- `frontend/package.json`
```

---

## 🔴 Hard / Advanced Level Tasks

### Issue 11: 3D Great Hall Dynamic LOD & Performance
- **Title:** `[PERF]: 3D Great Hall Dynamic Level of Detail (LOD) & WebGL Context Resilience`
- **Labels:** `performance`, `3d`, `three.js`, `difficulty: hard`
- **Body:**
```markdown
### 📌 Overview
The 3D Great Hall model is a detailed 36MB GLTF file containing dozens of individual meshes and hundreds of table dinnerware items. On budget mobile GPUs or integrated Intel graphics, high fillrate and draw calls can cause frame drops. Implement dynamic Level of Detail (LOD), frustum culling, and WebGL context restoration to guarantee a locked 60 FPS across all devices.

### 🎯 Acceptance Criteria
- [ ] Implement distance-based Level of Detail (LOD) for table props (goblets, platters, benches):
  - When camera is far (Chapter 0, 4, 5, 7), swap out high-poly dinnerware for low-poly proxies or billboard textures.
- [ ] Enforce strict frustum culling on table geometries not currently in camera frustum.
- [ ] Add an automatic FPS monitor: if frame rate drops below 30 FPS for >2 seconds, automatically switch quality tier (`detectQualityTier()`) from `high` to `medium` or `low`.
- [ ] Handle WebGL Context Loss (`webglcontextlost` and `webglcontextrestored`) gracefully without requiring a page refresh.

### 🛠️ Files to Modify
- `frontend/src/three/HallScene.tsx`
- `frontend/src/three/DiningHallModel.tsx`
- `frontend/src/three/Atmosphere.tsx`
```

---

### Issue 12: Real-Time WebSocket / SSE Point Broadcast
- **Title:** `[FEAT]: Real-Time WebSocket / SSE Broadcast for Live House Points & Event Alerts`
- **Labels:** `backend`, `frontend`, `websockets`, `difficulty: hard`
- **Body:**
```markdown
### 📌 Overview
During the live festival days, house points fluctuate continuously as teams win hackathons, sports matches, and quizzes. Implement a real-time WebSocket or Server-Sent Events (SSE) synchronization layer between the Express backend and the React frontend so point changes and flash event announcements update live without requiring a page refresh.

### 🎯 Acceptance Criteria
- [ ] Add WebSocket / SSE server in `backend/src/` (e.g. `ws` or Express SSE stream `/api/standings/live-stream`).
- [ ] Broadcast events whenever:
  - An attendee registers (+5 house points).
  - An admin awards points for an event win (`POST /api/standings/points`).
  - An urgent flash broadcast is issued (e.g., *"Quidditch semi-finals starting in 10 minutes at the Pitch"*).
- [ ] On the frontend, create a `useLiveStandings` hook that subscribes to the stream with automatic reconnect logic.
- [ ] Trigger an on-screen magical toast notification when points are awarded in real time.

### 🛠️ Files to Modify
- `backend/src/index.ts`
- `backend/src/services/websocketService.ts` (new file)
- `frontend/src/api/client.ts`
- `frontend/src/hooks/useLiveStandings.ts` (new file)
```

---

### Issue 13: Interactive 3D Flying Golden Snitch Mini-Game
- **Title:** `[FEAT]: Interactive 3D Flying Golden Snitch Mini-Game in the Great Hall`
- **Labels:** `feature`, `3d`, `three.js`, `gamification`, `difficulty: hard`
- **Body:**
```markdown
### 📌 Overview
Add a rare, flying 3D **Golden Snitch** that periodically zips through the rafters and around the floating candles in the 3D Great Hall. Visitors who spot and click on the Snitch catch it, triggering a celebratory animation and awarding **+50 bonus points** to their house!

### 🎯 Acceptance Criteria
- [ ] Create a lightweight procedural 3D Golden Snitch mesh with flapping wings in `frontend/src/three/Snitch.tsx`.
- [ ] Animate the Snitch along a randomized 3D Bezier curve high above the tables (Chapters 4 and 5).
- [ ] Implement Raycasting pointer interaction: when the user clicks or taps on the moving Snitch:
  - Play an enchanted capture particle effect.
  - Show a modal popup: *"You caught the Golden Snitch! +50 Points awarded to [House]!"*
  - Send an authorized point request to `POST /api/standings/points`.
  - Rate limit capture to once per user session (stored in `localStorage` & IP checked on backend).

### 🛠️ Files to Modify
- `frontend/src/three/Snitch.tsx` (new component)
- `frontend/src/three/HallScene.tsx`
- `backend/src/controllers/standingsController.ts`
```

---

### Issue 14: Protected Admin Dashboard with JWT Auth
- **Title:** `[FEAT]: Protected Admin Dashboard with JWT Authentication for Festival Coordinators`
- **Labels:** `backend`, `frontend`, `security`, `difficulty: hard`
- **Body:**
```markdown
### 📌 Overview
Faculty coordinators and student council leads need a secure internal dashboard to manage fest operations: view all attendee registrations, verify USN/roll numbers, export CSV attendance sheets for certificates, update event schedules on the fly, and manually award points for tournament winners.

### 🎯 Acceptance Criteria
- [ ] Backend Authentication:
  - Add `POST /api/admin/login` returning signed JWT (configured with `ADMIN_PASSWORD` in `.env`).
  - Add auth middleware `requireAdmin` protecting sensitive endpoints (`POST /api/standings/points`, `GET /api/admin/export-csv`, `PATCH /api/events/:id`).
- [ ] Frontend Admin Panel (`#/admin`):
  - Clean login screen with enchanted passphrase input.
  - Dashboard overview: Total registrations count, breakdown by house and department (MCA vs MBA).
  - Searchable, paginated table of all registered participants with single-click **"Export to CSV"** button.
  - Quick point adjustment panel to award points to houses with audit trail reasons.

### 🛠️ Files to Modify
- `backend/src/routes/adminRoutes.ts` (new file)
- `backend/src/controllers/adminController.ts` (new file)
- `backend/src/middleware/auth.ts` (new file)
- `frontend/src/components/admin/AdminDashboard.tsx` (new component)
- `frontend/src/App.tsx`
```

---

### Issue 15: Automated E2E Playwright & Vitest Test Suite
- **Title:** `[TEST]: Automated End-to-End (Playwright) & API Integration (Supertest) Test Suite`
- **Labels:** `testing`, `ci/cd`, `quality-assurance`, `difficulty: hard`
- **Body:**
```markdown
### 📌 Overview
Ensure zero regressions as new contributors join the festival project by creating an automated end-to-end testing suite for the 3D scroll choreography, navigation routes, and backend REST API endpoints, automated via GitHub Actions CI.

### 🎯 Acceptance Criteria
- [ ] Backend API Tests (`backend/tests/`):
  - Setup `vitest` + `supertest`.
  - Test `GET /api/health` returns status `online`.
  - Test `POST /api/register` with valid and invalid payloads (validates missing email, invalid house, duplicate email conflict).
  - Test `GET /api/standings` returns correct ranking order.
- [ ] Frontend E2E Tests (`e2e/` with Playwright):
  - Test page loads without uncaught WebGL errors.
  - Test scrolling navigates chapters 0 through 7 and reveals House Cards.
  - Test opening and submitting the Registration Modal.
  - Test navigation to `#/team` and `#/map`.
- [ ] Add `.github/workflows/ci.yml` running `npm run typecheck`, `npm run build`, and test suites on pull requests.

### 🛠️ Files to Modify
- `backend/tests/api.test.ts` (new file)
- `e2e/fest.spec.ts` (new file)
- `.github/workflows/ci.yml` (new file)
- `package.json`
```
