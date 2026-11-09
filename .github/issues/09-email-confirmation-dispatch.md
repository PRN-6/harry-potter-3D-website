# [FEAT]: Automated Hogwarts Acceptance Letter Email Dispatch for Registrations

**Labels:** `backend`, `feature`, `difficulty: medium`, `email`

---

## 📌 Overview
When a participant successfully registers through `POST /api/register`, dispatch an authentic, beautifully styled HTML email formatted like a **Hogwarts Acceptance Letter** containing their official registration ID, sorted house crest, registered event details, and festival reporting instructions.

---

## 🎯 Acceptance Criteria
- [ ] Integrate an email service provider in `backend/` using `nodemailer` (SMTP) or `@resend/node` with configurable environment variables (`SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` or `RESEND_API_KEY`).
- [ ] Design an authentic parchment-themed HTML email template:
  - Hogwarts crest & green ink typography (*"Dear Mr./Ms. [LastName], We are pleased to inform you that you have a place at AJ-ASTRIX 2K27..."*).
  - List of registered competitions with venues and reporting times.
  - Unique QR code or Registration ID for gate check-in.
- [ ] Ensure email sending is asynchronous and does not block the HTTP response if the mail provider is slow or fails (with try/catch error logging).

---

## 🛠️ Files to Modify
- `backend/src/controllers/registrationController.ts`
- `backend/src/services/emailService.ts` (new service)
- `backend/.env.example`
- `backend/package.json`
