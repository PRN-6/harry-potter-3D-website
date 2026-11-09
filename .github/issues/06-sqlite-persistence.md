# [FEAT]: SQLite / File Database Persistence for Registrations & House Standings

**Labels:** `backend`, `database`, `difficulty: medium`, `enhancement`

---

## 📌 Overview
The backend currently stores registrations and house points in memory (`backend/src/controllers/registrationController.ts` and `backend/src/data/standingsData.ts`), which resets when the server restarts or re-deploys. Replace this with a lightweight SQLite database using Prisma, Drizzle, or `better-sqlite3` to persist all registered wizards and live House Cup scores.

---

## 🎯 Acceptance Criteria
- [ ] Add SQLite database storage (e.g. `sqlite3` / `better-sqlite3` / Prisma with SQLite file at `backend/data/fest.db`).
- [ ] Schema requirements:
  - `registrations`: `id`, `full_name`, `email` (unique), `phone`, `college`, `department`, `usn`, `house_id`, `event_ids` (JSON), `created_at`.
  - `house_standings`: `house_id` (PRIMARY KEY), `points`, `updated_at`.
- [ ] Ensure `POST /api/register` inserts into the DB and updates house points atomically.
- [ ] Add `.gitignore` entry for `*.db`, `*.sqlite`, `*.db-journal`.
- [ ] Provide initial database seed script (`npm --prefix backend run seed`).

---

## 🛠️ Files to Modify
- `backend/src/controllers/registrationController.ts`
- `backend/src/controllers/standingsController.ts`
- `backend/src/data/standingsData.ts`
- `backend/package.json`
- `.gitignore`
