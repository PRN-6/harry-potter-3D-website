import { useHouse } from '../context/HouseContext'
import { HOUSES } from '../data/houses'

/**
 * The Sorting Hat.
 *
 * On first visit this is a full-screen sorting experience: pick a house and
 * the Hat "sorts" you into it. Afterwards it collapses into a compact
 * selector in the header.
 */
export default function HouseSelector({ variant = 'full' }: { variant?: 'full' | 'compact' }) {
  const { house, setHouse, sorted } = useHouse()

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1.5">
        {HOUSES.map((h) => (
          <button
            key={h.id}
            onClick={() => setHouse(h.id)}
            aria-label={h.name}
            aria-pressed={house === h.id}
            title={h.name}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-base transition-all duration-300 sm:h-9 sm:w-9 sm:text-lg ${
              house === h.id
                ? 'scale-110'
                : 'opacity-50 grayscale hover:opacity-100 hover:grayscale-0'
            }`}
            style={{
              backgroundColor: h.color,
              // The ring is drawn with a box-shadow so the house accent
              // colour can be applied without a CSS custom property.
              boxShadow: house === h.id ? `0 0 0 2px ${h.accent}, 0 0 0 4px #0a0714` : undefined,
            }}
          >
            <span aria-hidden>{h.crest}</span>
          </button>
        ))}
      </div>
    )
  }

  if (sorted) {
    // Already sorted — a short confirmation instead of the full ritual.
    const current = HOUSES.find((h) => h.id === house)!
    return (
      <div className="mx-auto max-w-2xl px-5 text-center">
        <p className="font-cinzel text-sm tracking-[0.35em] text-amber-200/70 uppercase">Sorted into</p>
        <h2
          className="mt-3 font-cinzel text-4xl font-bold sm:text-5xl"
          style={{ color: current.accent, textShadow: `0 0 40px ${current.color}` }}
        >
          {current.crest} {current.name}
        </h2>
        <p className="mt-4 text-sm text-stone-400 sm:text-base">
          {current.traits.join(' · ')} — {current.motto}
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {HOUSES.map((h) => (
            <button
              key={h.id}
              onClick={() => setHouse(h.id)}
              className={`rounded-full border px-4 py-2 text-sm transition-all ${
                house === h.id
                  ? 'border-amber-300/60 bg-amber-300/10 text-amber-200'
                  : 'border-white/10 text-stone-400 hover:border-white/25 hover:text-stone-200'
              }`}
            >
              {h.crest} {h.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-3xl px-5 text-center">
      <p className="font-cinzel text-xs tracking-[0.4em] text-amber-200/60 uppercase sm:text-sm">
        The Sorting Hat awaits
      </p>
      <h2 className="mt-4 font-cinzel text-3xl font-bold text-stone-100 sm:text-5xl">
        Choose your house
      </h2>
      <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-stone-400 sm:text-base">
        Four houses, one Hall. Your house decides your table, your colour and
        your chances of taking the Cup.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4">
        {HOUSES.map((h) => (
          <button
            key={h.id}
            onClick={() => setHouse(h.id)}
            className="group relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03] p-5 text-left transition-all duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[0.06] sm:p-6"
          >
            <div
              className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{ background: `radial-gradient(circle at 20% 0%, ${h.color}55, transparent 60%)` }}
            />
            <div className="relative flex items-start gap-4">
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-2xl sm:h-14 sm:w-14 sm:text-3xl"
                style={{ backgroundColor: `${h.color}33`, border: `1px solid ${h.color}66` }}
              >
                {h.crest}
              </span>
              <div className="min-w-0">
                <h3 className="font-cinzel text-lg font-bold sm:text-xl" style={{ color: h.accent }}>
                  {h.name}
                </h3>
                <p className="mt-1 text-xs text-stone-400 sm:text-sm">{h.traits.join(' · ')}</p>
                <p className="mt-2 text-xs italic text-stone-500 sm:text-sm">{h.motto}</p>
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
