import { type House } from '../data/houses'

interface HouseCardProps {
  house: House
  isVisible: boolean
}

export function HouseCard({ house, isVisible }: HouseCardProps) {
  return (
    <div
      className={`
        relative w-full h-96 rounded-2xl border-2 transition-all duration-1000 ease-in-out
        overflow-hidden
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
      `}
      style={{
        borderColor: house.accent,
        boxShadow: `0 0 20px ${house.color}30`,
      }}
    >
      <img
        src={house.image}
        alt={house.name}
        className="w-full h-full object-cover pointer-events-none"
      />
    </div>
  )
}
