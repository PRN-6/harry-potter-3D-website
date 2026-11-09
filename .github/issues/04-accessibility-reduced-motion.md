# [FEAT]: Accessibility & Motion Preference Controls (Toggle Camera Smoothing)

**Labels:** `accessibility`, `good first issue`, `difficulty: easy`, `frontend`, `a11y`

---

## 📌 Overview
Some visitors may experience motion sensitivity from dynamic 3D camera dollies, Dutch tilt banking, or floating candle drifts. Improve web accessibility by adding an accessible "Reduced Motion / Simple View" toggle that disables camera tilting, slows lerps, and provides discrete step jumping.

---

## 🎯 Acceptance Criteria
- [ ] Honor the user's OS-level preference `window.matchMedia('(prefers-reduced-motion: reduce)')`.
- [ ] Add an accessible toggle switch in the mobile/desktop menu: *"Reduced 3D Motion"*.
- [ ] When enabled:
  - Set camera roll / Dutch tilt to 0.
  - Disable candle bobbing and star rotation in `Atmosphere.tsx`.
  - Transition chapter captions instantly without blur/scaling effects.
- [ ] Ensure all buttons have explicit `aria-label` attributes and focus visible outlines.

---

## 🛠️ Files to Modify
- `frontend/src/three/HallScene.tsx`
- `frontend/src/three/Atmosphere.tsx`
- `frontend/src/components/Header.tsx`
