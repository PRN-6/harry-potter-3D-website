# ✦ Enchanthia 2026

A Harry Potter themed **college festival** website, built around a fully
procedural 3D **Great Hall** that works on both phones and desktops.

```bash
npm install
npm run dev      # http://localhost:5173
```

The dev server binds to your LAN, so a phone on the same Wi-Fi can open it at
`http://<your-pc-ip>:5173`.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| Build | Vite 6 |
| UI | React 19 + TypeScript (strict) |
| 3D | Three.js + React Three Fiber + Drei |
| Styling | Tailwind CSS v4 |
| State | React Context (`HouseProvider`) |

No external 3D model files. The Great Hall is built from procedural geometry
in code, so it loads instantly, stays small, and is editable as source.

---

## Project layout

```
src/
├── data/
│   ├── houses.ts        The four houses — colours, traits, mottos
│   └── events.ts        The festival programme
├── three/
│   ├── hallTheme.ts     Shared materials (singletons) + table layout
│   ├── GreatHall.tsx    The Hall: floor, walls, tables, candles, ceiling
│   └── HallScene.tsx    Canvas, camera rig, quality tiering
├── components/
│   ├── HouseSelector.tsx  The Sorting Hat
│   ├── Schedule.tsx       Programme + House Cup standings
│   ├── Gallery.tsx        Memory grid + lightbox
│   └── SceneErrorBoundary.tsx
├── context/
│   └── HouseContext.tsx   The visitor's house (persisted)
├── App.tsx
└── index.css
```

---

## The Great Hall

Everything below is generated in `src/three/GreatHall.tsx`:

- **Stone floor** with a runner down the central aisle
- **Four long house tables** — Gryffindor and Ravenclaw on the left,
  Slytherin and Hufflepuff on the right — each with a house-tinted cloth,
  goblets, platters and a banner
- **The High Table** on a raised dais at the far end, with nine chairs
- **Gothic windows** glowing with moonlight, and gold wall sconces
- **Floating candles** with warm point light and flickering flames
- **An enchanted ceiling** — a night sky dome with 900 drifting stars
- **Dust motes** drifting through the candlelight

### Camera

Four viewpoints, switchable from the pill bar under the canvas:

| View | What you see |
| --- | --- |
| `entrance` | Standing at the great doors |
| `aisle` | Looking down the hall from the aisle |
| `highTable` | Facing the High Table |
| `overview` | A wide shot of the whole hall |

Drag to orbit, scroll to zoom. The camera eases to each viewpoint and then
hands control back to you.

---

## Performance

`src/three/HallScene.tsx` picks a quality tier once at mount:

| Tier | When | Candles | Shadows | Max DPR |
| --- | --- | --- | --- | --- |
| `low` | ≤ 4 cores, ≤ 3 GB RAM, or a coarse pointer on ≤ 6 cores | 54 | off | 1.25 |
| `medium` | Tablet / mid-range | 90 | on | 1.75 |
| `high` | Desktop | 150 | on | 2 |

Other things that keep it smooth:

- **Shared materials.** Every material is a singleton from
  `hallTheme.ts`. Inline JSX materials would allocate one per mesh, and the
  hall has hundreds of goblets and plates.
- **Instanced flames.** All candle flames are one `InstancedMesh`, not one
  mesh per candle.
- **`AdaptiveDpr`.** Drops the pixel ratio automatically when the frame rate
  sags.
- **Lazy loading.** The canvas is only mounted when the Hall scrolls near
  the viewport, so the hero paints immediately.
- **Error boundary.** If WebGL is unavailable, the Hall section degrades to a
  message and the rest of the site keeps working.

---

## Adding a real image to the gallery

`src/components/Gallery.tsx` — give the item a `src` and it renders as an
image:

```ts
{
  id: 'feast',
  title: 'The Opening Feast',
  caption: '...',
  src: '/images/feast.jpg',   // ← put the file in public/images/
  gradient: 'from-[#2a1f4d] via-[#1b1436] to-[#0a0714]',
  emoji: '🍽️',
}
```

---

## House colours

`src/data/houses.ts` is the single source of truth. Change a house's `color`
or `accent` there and the 3D table cloth, the banner, the spotlight, the
page glow and every button update automatically.
