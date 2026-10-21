import { useState } from 'react'

/**
 * The gallery.
 *
 * Placeholder tiles with a Hogwarts-blue palette. Swap the `src` for a real
 * image URL and it just works — the component handles the loading state and
 * the failed-load fallback.
 */

interface GalleryItem {
  id: string
  title: string
  caption: string
  /** Replace with a real image path. */
  src?: string
  gradient: string
  emoji: string
}

const ITEMS: GalleryItem[] = [
  {
    id: 'feast',
    title: 'The Opening Feast',
    caption: 'Four long tables, a thousand floating candles, one very long speech.',
    gradient: 'from-[#2a1f4d] via-[#1b1436] to-[#0a0714]',
    emoji: '🍽️',
  },
  {
    id: 'quidditch',
    title: 'Quidditch Cup',
    caption: 'The pitch is damp, the broomsticks are unreliable, the crowd is feral.',
    gradient: 'from-[#0d3b2e] via-[#123a2c] to-[#0a0714]',
    emoji: '🧹',
  },
  {
    id: 'potion',
    title: 'Potion Lab',
    caption: 'Brew a Draught of Living Death. The cauldron is judging you.',
    gradient: 'from-[#123b4d] via-[#14293a] to-[#0a0714]',
    emoji: '⚗️',
  },
  {
    id: 'dance',
    title: 'The Yule Ball',
    caption: 'Celestial ceiling, enchanted floor, and the Hall full of stars.',
    gradient: 'from-[#3d1a4a] via-[#2a1235] to-[#0a0714]',
    emoji: '💫',
  },
  {
    id: 'forest',
    title: 'Forbidden Forest',
    caption: 'Bring a lantern. Bring a friend. Leave before the dragon wakes.',
    gradient: 'from-[#13301f] via-[#10261a] to-[#0a0714]',
    emoji: '🐉',
  },
  {
    id: 'tower',
    title: 'Astronomy Tower',
    caption: 'Chart the heavens, name a constellation, claim the sky.',
    gradient: 'from-[#161a44] via-[#101336] to-[#0a0714]',
    emoji: '🔭',
  },
]

export default function Gallery() {
  const [lightbox, setLightbox] = useState<GalleryItem | null>(null)

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
        {ITEMS.map((item) => (
          <button
            key={item.id}
            onClick={() => setLightbox(item)}
            className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${item.gradient} text-left transition-all duration-300 hover:-translate-y-1 hover:border-amber-300/40`}
          >
            {item.src ? (
              <img
                src={item.src}
                alt={item.title}
                loading="lazy"
                decoding="async"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                  // Fall back to the gradient if the image file is missing.
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-40 transition-transform duration-500 group-hover:scale-110 sm:text-7xl">
                {item.emoji}
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-4 sm:p-5">
              <h3 className="font-cinzel text-base font-bold text-white sm:text-lg">{item.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-white/60 sm:text-sm">{item.caption}</p>
            </div>
          </button>
        ))}
      </div>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className={`relative aspect-[4/3] w-full max-w-2xl overflow-hidden rounded-2xl bg-gradient-to-br ${lightbox.gradient}`}
            onClick={(e) => e.stopPropagation()}
          >
            {lightbox.src ? (
              <img
                src={lightbox.src}
                alt={lightbox.title}
                className="absolute inset-0 h-full w-full object-cover"
              />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-50">
                {lightbox.emoji}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6">
              <h3 className="font-cinzel text-xl font-bold text-white sm:text-2xl">{lightbox.title}</h3>
              <p className="mt-2 text-sm text-white/70">{lightbox.caption}</p>
            </div>
            <button
              onClick={() => setLightbox(null)}
              className="absolute top-4 right-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}
