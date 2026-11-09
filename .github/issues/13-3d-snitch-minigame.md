# [FEAT]: Interactive 3D Flying Golden Snitch Mini-Game in the Great Hall

**Labels:** `feature`, `3d`, `three.js`, `gamification`, `difficulty: hard`

---

## 📌 Overview
Add a rare, flying 3D **Golden Snitch** that periodically zips through the rafters and around the floating candles in the 3D Great Hall. Visitors who spot and click on the Snitch catch it, triggering a celebratory animation and awarding **+50 bonus points** to their house!

---

## 🎯 Acceptance Criteria
- [ ] Create a lightweight procedural 3D Golden Snitch mesh with flapping wings in `frontend/src/three/Snitch.tsx`.
- [ ] Animate the Snitch along a randomized 3D Bezier curve high above the tables (Chapters 4 and 5).
- [ ] Implement Raycasting pointer interaction: when the user clicks or taps on the moving Snitch:
  - Play an enchanted capture particle effect.
  - Show a modal popup: *"You caught the Golden Snitch! +50 Points awarded to [House]!"*
  - Send an authorized point request to `POST /api/standings/points`.
  - Rate limit capture to once per user session (stored in `localStorage` & IP checked on backend).

---

## 🛠️ Files to Modify
- `frontend/src/three/Snitch.tsx` (new component)
- `frontend/src/three/HallScene.tsx`
- `backend/src/controllers/standingsController.ts`
