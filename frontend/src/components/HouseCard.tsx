import { motion } from 'framer-motion'
import { type House } from '../data/houses'

interface HouseCardProps {
  house: House
  isVisible: boolean
  index?: number
  onClick?: () => void
}

export function HouseCard({ house, isVisible, index = 0, onClick }: HouseCardProps) {
  const handleClick = () => {
    if (onClick) {
      onClick()
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && onClick) {
      e.preventDefault()
      onClick()
    }
  }

  return (
    <motion.a
      href={`#/house/${house.id}`}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={isVisible ? 0 : -1}
      aria-label={`View ${house.name} card and events`}
      initial={{ opacity: 0, y: 50, scale: 0.9, rotateY: -10 }}
      animate={
        isVisible
          ? { opacity: 1, y: 0, scale: 1, rotateY: 0 }
          : { opacity: 0, y: 30, scale: 0.9, rotateY: 0 }
      }
      transition={{
        duration: 0.7,
        delay: isVisible ? 0.15 + index * 0.12 : 0,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{
        scale: 1.06,
        y: -10,
        transition: { duration: 0.35, ease: 'easeOut' },
      }}
      whileTap={{ scale: 0.96 }}
      className={`
        group relative w-full aspect-[2/3] md:aspect-auto md:h-96 md:flex-1 rounded-2xl border-2
        overflow-hidden select-none block cursor-pointer
      `}
      style={{
        borderColor: house.accent,
        boxShadow: `0 0 30px ${house.color}45, 0 16px 36px rgba(0,0,0,0.85)`,
      }}
    >
      <img
        src={house.image}
        alt={house.name}
        loading="lazy"
        decoding="async"
        className="w-full h-full object-cover pointer-events-none transition-transform duration-700 ease-out group-hover:scale-110"
      />

      {/* Shimmer light sweep beam across card on hover */}
      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/25 to-transparent pointer-events-none" />

      {/* Card border highlight for collector card depth */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl border border-white/20 transition-colors duration-300 group-hover:border-amber-300/60"
        aria-hidden="true"
      />

      {/* House Name Tag Header on Card */}
      <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
        <span className="px-2.5 py-0.5 rounded-full text-[9px] sm:text-[10px] font-cinzel font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md text-amber-200 border border-white/15">
          {house.name}
        </span>
        <span
          className="w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]"
          style={{ color: house.accent, backgroundColor: house.accent }}
        />
      </div>

      {/* Hover action prompt */}
      <div className="absolute inset-x-0 bottom-0 p-2.5 sm:p-3.5 bg-gradient-to-t from-black/95 via-black/70 to-transparent flex flex-col items-center opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <span className="font-cinzel text-[11px] sm:text-xs md:text-sm font-bold uppercase tracking-[0.2em] text-amber-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)] flex items-center gap-1.5">
          <span>Explore {house.name}</span>
          <span className="group-hover:translate-x-1 transition-transform">→</span>
        </span>
      </div>
    </motion.a>
  )
}
