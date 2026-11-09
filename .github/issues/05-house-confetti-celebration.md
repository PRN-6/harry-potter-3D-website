# [FEAT]: House-Coloured Confetti & Magical Sparkle Cannon on Registration

**Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `animation`

---

## 📌 Overview
Celebrate a wizard's registration by triggering a festive burst of house-themed celebratory sparkles/confetti (e.g. Scarlet & Gold for Gryffindor, Emerald & Silver for Slytherin, Sapphire & Bronze for Ravenclaw, Amber & Yellow for Hufflepuff) across the screen when their registration succeeds.

---

## 🎯 Acceptance Criteria
- [ ] Install lightweight `canvas-confetti` (`npm i canvas-confetti && npm i -D @types/canvas-confetti` in `frontend`).
- [ ] Trigger two angled cannon blasts from bottom-left and bottom-right when the registration status switches to `'success'`.
- [ ] Use the exact colors of the registrant's selected house:
  - Gryffindor: `['#ae1c28', '#d4a017', '#ffd700']`
  - Slytherin: `['#0a5c36', '#c0c8d0', '#5ce6a0']`
  - Ravenclaw: `['#0e1a40', '#8ec9ff', '#946b2d']`
  - Hufflepuff: `['#ecb939', '#6b4a12', '#ffd75e']`
- [ ] Clean up canvas context automatically without memory leaks.

---

## 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/package.json`
