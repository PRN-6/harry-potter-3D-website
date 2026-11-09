# [PERF]: 3D Great Hall Dynamic Level of Detail (LOD) & WebGL Context Resilience

**Labels:** `performance`, `3d`, `three.js`, `difficulty: hard`

---

## 📌 Overview
The 3D Great Hall model is a detailed 36MB GLTF file containing dozens of individual meshes and hundreds of table dinnerware items. On budget mobile GPUs or integrated Intel graphics, high fillrate and draw calls can cause frame drops. Implement dynamic Level of Detail (LOD), frustum culling, and WebGL context restoration to guarantee a locked 60 FPS across all devices.

---

## 🎯 Acceptance Criteria
- [ ] Implement distance-based Level of Detail (LOD) for table props (goblets, platters, benches):
  - When camera is far (Chapter 0, 4, 5, 7), swap out high-poly dinnerware for low-poly proxies or billboard textures.
- [ ] Enforce strict frustum culling on table geometries not currently in camera frustum.
- [ ] Add an automatic FPS monitor: if frame rate drops below 30 FPS for >2 seconds, automatically switch quality tier (`detectQualityTier()`) from `high` to `medium` or `low`.
- [ ] Handle WebGL Context Loss (`webglcontextlost` and `webglcontextrestored`) gracefully without requiring a page refresh.

---

## 🛠️ Files to Modify
- `frontend/src/three/HallScene.tsx`
- `frontend/src/three/DiningHallModel.tsx`
- `frontend/src/three/Atmosphere.tsx`
