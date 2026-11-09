# [FEAT]: 3-Question Sorting Hat Mini-Quiz for House Selection

**Labels:** `feature`, `good first issue`, `difficulty: easy`, `frontend`, `gamification`

---

## 📌 Overview
Some attendees aren't sure which of the 4 houses (Gryffindor, Slytherin, Ravenclaw, Hufflepuff) they belong to. Add a simple, fun 3-question "Sorting Hat Quiz" option in the House selection step of `RegistrationModal.tsx` and `HouseCardPage.tsx` to automatically suggest their house!

---

## 🎯 Acceptance Criteria
- [ ] Add a *"Not sure? Let the Sorting Hat decide 🧙‍♂️"* button next to house cards.
- [ ] Present 3 quick scenario questions, e.g.:
  1. *"Faced with a locked chamber door, you:"*
     - A) Kick it down boldly (Gryffindor)
     - B) Pick the lock with cunning strategy (Slytherin)
     - C) Solve the ancient riddle carved into the stone (Ravenclaw)
     - D) Search for the friendly keymaker or knock patiently (Hufflepuff)
  2. *"In a hackathon team, your primary strength is:"*
  3. *"When victory is near, you value most:"*
- [ ] Calculate the highest scored house and automatically select it with an enchanted sound / badge.
- [ ] Option to retake or manually override if the user prefers another house.

---

## 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`
- `frontend/src/data/quizQuestions.ts` (new helper file)
