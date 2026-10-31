import { type House } from '../data/houses'

interface HouseCardProps {
  house: House
  isVisible: boolean
  onClick?: () => void
}

export function HouseCard({ house, isVisible, onClick }: HouseCardProps) {
  const handleClick = (e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation()
    if (isVisible && onClick) {
      onClick()
    }
  }

  return (
    <div
      onClick={handleClick}
      role="button"
      tabIndex={isVisible ? 0 : -1}
      aria-label={`View ${house.name} events`}
      className={`
        group relative w-full aspect-[2/3] md:aspect-auto md:h-96 md:flex-1 rounded-2xl border-2 transition-all duration-500 ease-out
        overflow-hidden shadow-2xl select-none
        hover:scale-105 hover:-translate-y-1.5 active:scale-95
        ${isVisible ? 'opacity-100 scale-100 pointer-events-auto cursor-pointer' : 'opacity-0 scale-90 pointer-events-none'}
      `}
      style={{
        borderColor: house.accent,
        boxShadow: `0 0 25px ${house.color}40, 0 12px 32px rgba(0,0,0,0.85)`,
      }}
    >
      <img
        src={house.image}
        alt={house.name}
        className="w-full h-full object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Card border highlight for collector card depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 transition-colors group-hover:border-amber-300/50"
        aria-hidden="true"
      />

      {/* Hover action prompt */}
      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex flex-col items-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="font-cinzel text-[10px] sm:text-xs text-amber-300 uppercase tracking-widest font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
          {house.name} Events →
        </span>
      </div>
    </div>
  )
}
