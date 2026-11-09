# [FEAT]: Interactive Live House Cup Hourglass & Standings Bar Chart

**Labels:** `feature`, `frontend`, `difficulty: medium`, `gamification`

---

## 📌 Overview
Build an interactive **House Cup Standings** visualizer on the frontend (accessible via Chapter 6 in the Great Hall and from the navigation drawer) that displays the live point totals for Gryffindor, Slytherin, Ravenclaw, and Hufflepuff with authentic magical hourglass animations (falling rubies, emeralds, sapphires, and topazes).

---

## 🎯 Acceptance Criteria
- [ ] Fetch live points from `GET /api/standings` on mount and poll every 30 seconds.
- [ ] Render 4 ornate Gothic hourglasses filled with glowing colored gems reflecting house point proportions.
- [ ] Animate point increases using Framer Motion with floating badge labels (e.g., `+10 pts`).
- [ ] Add an interactive **"Cheer Your House"** button allowing attendees to cast 1 vote per hour (rate-limited via `localStorage` timestamp).
- [ ] Display the leading house with an enchanted golden House Cup trophy badge.

---

## 🛠️ Files to Modify
- `frontend/src/components/HouseCupHourglass.tsx` (new component)
- `frontend/src/components/HouseCardPage.tsx`
- `frontend/src/api/client.ts`
