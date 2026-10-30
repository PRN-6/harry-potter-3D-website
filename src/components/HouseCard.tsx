import { type House } from '../data/houses'

interface HouseCardProps {
  house: House
  isVisible: boolean
}

export function HouseCard({ house, isVisible }: HouseCardProps) {
  return (
    <div
      className={`
        relative w-full h-96 p-6 rounded-2xl border-2 transition-all duration-1000 ease-in-out
        flex flex-col items-center justify-center text-center backdrop-blur-md overflow-hidden
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
      `}
      style={{
        borderColor: house.accent,
        backgroundColor: `${house.color}20`,
        boxShadow: `0 0 20px ${house.color}30`,
      }}
    >
      <img
        src={house.image}
        alt={house.name}
        className="absolute inset-0 w-full h-full object-cover opacity-30 pointer-events-none"
      />
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <h3 className="font-cinzel text-xl font-bold text-stone-100 mb-2 tracking-wider">
          {house.name}
        </h3>
      </div>
    </div>
  )
}
