# [FEAT]: Social Share & Copy Registration Link in Registration Modal

**Labels:** `enhancement`, `good first issue`, `difficulty: easy`, `frontend`, `ui/ux`

---

## 📌 Overview
When a visitor completes their registration for AJ-ASTRIX 2K27, they should be able to celebrate and invite their friends by copying their registration link or sharing directly to WhatsApp, X (Twitter), or LinkedIn with a pre-formatted wizarding message.

---

## 🎯 Acceptance Criteria
- [ ] On the success screen in `frontend/src/components/RegistrationModal.tsx`, display:
  - *"Share with fellow wizards"* section.
  - One-click **"Copy Link"** button with a brief *"Copied to Clipboard! ✨"* tooltip.
  - Direct **WhatsApp Share** button: `https://api.whatsapp.com/send?text=...`
  - Direct **X (Twitter) Share** button: `https://twitter.com/intent/tweet?text=...`
- [ ] Pre-formatted message should mention:
  - *"I just registered for AJ-ASTRIX 2K27 (INOVEX & NEXORA) sorted into [HOUSE]! Join me at Hogwarts: [URL]"*

---

## 🛠️ Files to Modify
- `frontend/src/components/RegistrationModal.tsx`

---

## 💡 Implementation Hints
```tsx
const shareText = `I have been sorted into ${houseId.toUpperCase()} for AJ-ASTRIX 2K27! Join the festival: ${window.location.origin}`
const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`
```
