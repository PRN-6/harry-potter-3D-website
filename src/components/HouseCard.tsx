import React from 'react'
import { HOUSES, type House } from '../data/houses'

interface HouseCardProps {
  house: House
  isVisible: boolean
}

export function HouseCard({ house, isVisible }: HouseCardProps) {
  return (
    <div
      className={`
        relative w-full h-96 p-6 rounded-2xl border-2 transition-all duration-1000 ease-in-out
        flex flex-col items-center justify-center text-center backdrop-blur-md
        ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90 pointer-events-none'}
      `}
      style={{
        borderColor: house.accent,
        backgroundColor: `${house.color}20`,
        boxShadow: `0 0 20px ${house.color}30`,
      }}
    >
      <div className="text-5xl mb-3 drop-shadow-lg">{house.crest}</div>
      <h3 className="font-cinzel text-xl font-bold text-stone-100 mb-2 tracking-wider">
        {house.name}
      </h3>
      <div className="flex flex-wrap justify-center gap-2 mb-3">
        {house.traits.map((trait) => (
          <span
            key={trait}
            className="text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border border-white/20 text-stone-300 bg-white/10"
          >
            {trait}
          </span>
        ))}
      </div>
      <p className="italic text-xs text-stone-300/80 leading-relaxed font-serif" style={{ fontFamily: '"Crimson Pro", serif' }}>
        "{house.motto}"
      </p>
    </div>
  )
}
