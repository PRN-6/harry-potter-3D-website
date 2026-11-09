# [FEAT]: Protected Admin Dashboard with JWT Authentication for Festival Coordinators

**Labels:** `backend`, `frontend`, `security`, `difficulty: hard`

---

## 📌 Overview
Faculty coordinators and student council leads need a secure internal dashboard to manage fest operations: view all attendee registrations, verify USN/roll numbers, export CSV attendance sheets for certificates, update event schedules on the fly, and manually award points for tournament winners.

---

## 🎯 Acceptance Criteria
- [ ] Backend Authentication:
  - Add `POST /api/admin/login` returning signed JWT (configured with `ADMIN_PASSWORD` in `.env`).
  - Add auth middleware `requireAdmin` protecting sensitive endpoints (`POST /api/standings/points`, `GET /api/admin/export-csv`, `PATCH /api/events/:id`).
- [ ] Frontend Admin Panel (`#/admin`):
  - Clean login screen with enchanted passphrase input.
  - Dashboard overview: Total registrations count, breakdown by house and department (MCA vs MBA).
  - Searchable, paginated table of all registered participants with single-click **"Export to CSV"** button.
  - Quick point adjustment panel to award points to houses with audit trail reasons.

---

## 🛠️ Files to Modify
- `backend/src/routes/adminRoutes.ts` (new file)
- `backend/src/controllers/adminController.ts` (new file)
- `backend/src/middleware/auth.ts` (new file)
- `frontend/src/components/admin/AdminDashboard.tsx` (new component)
- `frontend/src/App.tsx`
