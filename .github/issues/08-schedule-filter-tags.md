# [FEAT]: Department & Category Multi-Tag Filtering in Marauder's Event Map

**Labels:** `feature`, `frontend`, `difficulty: medium`, `ui/ux`

---

## 📌 Overview
In `frontend/src/components/marauders-map/MaraudersMapPage.tsx`, the 2-day schedule scroll currently displays all events in chronological order. Expand this with quick-filter pills for **INOVEX (MCA)**, **NEXORA (MBA)**, **Technical**, **Management**, **Cultural**, and **Gaming** so students can filter competitions tailored to their domain.

---

## 🎯 Acceptance Criteria
- [ ] Add category filter chips above the event schedule in `MaraudersMapPage.tsx`:
  - `All Events` (default)
  - `INOVEX (MCA) Tech`
  - `NEXORA (MBA) Management`
  - `Esports & Gaming`
  - `Cultural & Yule Ball`
- [ ] Allow simultaneous search query filtering + category chip selection.
- [ ] Animate list items entering/exiting with Framer Motion layout animations (`layout` prop).
- [ ] Show empty state when no events match the search/filters (*"No magical events found matching your incantation"*).

---

## 🛠️ Files to Modify
- `frontend/src/components/marauders-map/MaraudersMapPage.tsx`
- `frontend/src/data/eventMapData.ts`
