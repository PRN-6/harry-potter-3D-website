# [TEST]: Automated End-to-End (Playwright) & API Integration (Supertest) Test Suite

**Labels:** `testing`, `ci/cd`, `quality-assurance`, `difficulty: hard`

---

## 📌 Overview
Ensure zero regressions as new contributors join the festival project by creating an automated end-to-end testing suite for the 3D scroll choreography, navigation routes, and backend REST API endpoints, automated via GitHub Actions CI.

---

## 🎯 Acceptance Criteria
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

---

## 🛠️ Files to Modify
- `backend/tests/api.test.ts` (new file)
- `e2e/fest.spec.ts` (new file)
- `.github/workflows/ci.yml` (new file)
- `package.json`
