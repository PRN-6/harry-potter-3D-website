# [FEAT]: Digital Hogwarts Fest Entry Pass Generator (Downloadable PNG / PDF)

**Labels:** `feature`, `frontend`, `difficulty: medium`, `graphics`

---

## 📌 Overview
After registering, attendees should be able to download an authentic, vintage-styled **Hogwarts Express / Fest Entry Ticket** as an image (PNG) or PDF that they can save to their mobile wallet or print out for entry verification at the gates.

---

## 🎯 Acceptance Criteria
- [ ] Add a **"Download Official Fest Pass 🎟️"** button in `RegistrationModal.tsx` upon successful registration.
- [ ] Render an authentic Hogwarts Express ticket layout:
  - Gold foiled borders, platform 9¾ emblem, attendee name, college name, assigned House crest, and registered events.
  - Dynamically generated QR code containing the attendee's `reg_id` for on-site scanning.
- [ ] Export directly on the client side using `html-to-image` or HTML5 `<canvas>` without needing a backend rendering pipeline.
- [ ] Mobile-responsive preview before download.

---

## 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/src/components/FestTicketPass.tsx` (new component)
- `frontend/package.json`
