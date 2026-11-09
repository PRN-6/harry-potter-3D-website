# [FEAT]: Real-Time WebSocket / SSE Broadcast for Live House Points & Event Alerts

**Labels:** `backend`, `frontend`, `websockets`, `difficulty: hard`

---

## 📌 Overview
During the live festival days, house points fluctuate continuously as teams win hackathons, sports matches, and quizzes. Implement a real-time WebSocket or Server-Sent Events (SSE) synchronization layer between the Express backend and the React frontend so point changes and flash event announcements update live without requiring a page refresh.

---

## 🎯 Acceptance Criteria
- [ ] Add WebSocket / SSE server in `backend/src/` (e.g. `ws` or Express SSE stream `/api/standings/live-stream`).
- [ ] Broadcast events whenever:
  - An attendee registers (+5 house points).
  - An admin awards points for an event win (`POST /api/standings/points`).
  - An urgent flash broadcast is issued (e.g., *"Quidditch semi-finals starting in 10 minutes at the Pitch"*).
- [ ] On the frontend, create a `useLiveStandings` hook that subscribes to the stream with automatic reconnect logic.
- [ ] Trigger an on-screen magical toast notification when points are awarded in real time.

---

## 🛠️ Files to Modify
- `backend/src/index.ts`
- `backend/src/services/websocketService.ts` (new file)
- `frontend/src/api/client.ts`
- `frontend/src/hooks/useLiveStandings.ts` (new file)
