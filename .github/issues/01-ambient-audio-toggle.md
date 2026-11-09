# [FEAT]: Ambient Hogwarts Great Hall Soundtrack & Floating Audio Mute Toggle

**Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `audio`

---

## 📌 Overview
Add an atmospheric background audio track (soft crackling fireplace, gentle orchestral harp or choral Hogwarts ambient melody) to immerse visitors when entering the 3D Great Hall, along with a discreet floating mute/unmute audio control button in the navbar.

---

## 🎯 Acceptance Criteria
- [ ] Add a royalty-free ambient wizarding audio loop (`.mp3` or `.ogg` under 1.5MB) to `frontend/public/audio/great-hall-ambient.mp3`.
- [ ] Create a floating speaker button in `frontend/src/components/Header.tsx` (next to the burger menu or live badge) with sound-wave animation when unmuted.
- [ ] Respect browser autoplay policies (start muted by default or prompt with a subtle toast: *"Click to awaken Great Hall sound 🔊"*).
- [ ] Persist audio preference (`muted: true/false`) in `localStorage`.
- [ ] Provide smooth volume fade-in and fade-out transitions instead of abrupt cuts.

---

## 🛠️ Files to Modify
- `frontend/src/components/Header.tsx`
- `frontend/src/App.tsx`
- `frontend/public/audio/great-hall-ambient.mp3`

---

## 💡 Implementation Hints
```tsx
const [isMuted, setIsMuted] = useState(true)
const audioRef = useRef<HTMLAudioElement | null>(null)

const toggleAudio = () => {
  if (!audioRef.current) return
  if (isMuted) {
    audioRef.current.play()
    setIsMuted(false)
  } else {
    audioRef.current.pause()
    setIsMuted(true)
  }
}
```
