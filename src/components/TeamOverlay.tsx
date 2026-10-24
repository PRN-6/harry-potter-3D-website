import React from 'react'
import { motion } from 'framer-motion'

interface TeamSection {
  title: string;
  image: string;
  member: {
    name: string;
    role: string;
  };
}

const TEAM_DATA: TeamSection[] = [
  {
    title: 'Council',
    image: '/characters/char1.jpg',
    member: { name: 'Alaric', role: 'Lead' },
  },
  {
    title: 'Arts',
    image: '/characters/char2.jpg',
    member: { name: 'Julian', role: 'Art' },
  },
  {
    title: 'Eng',
    image: '/characters/char3.jpg',
    member: { name: 'Kaelen', role: 'Arch' },
  },
  {
    title: 'Ops',
    image: '/characters/char1.jpg',
    member: { name: 'Soren', role: 'Ops' },
  },
  {
    title: 'Lore',
    image: '/characters/char2.jpg',
    member: { name: 'Thistle', role: 'Hist' },
  },
  {
    title: 'Guard',
    image: '/characters/char3.jpg',
    member: { name: 'Bane', role: 'Sec' },
  },
  {
    title: 'Magic',
    image: '/characters/char1.jpg',
    member: { name: 'Lyra', role: 'Mage' },
  },
  {
    title: 'Void',
    image: '/characters/char2.jpg',
    member: { name: 'Xylon', role: 'Void' },
  },
  {
    title: 'Light',
    image: '/characters/char3.jpg',
    member: { name: 'Aurelius', role: 'Sun' },
  },
  {
    title: 'Dark',
    image: '/characters/char1.jpg',
    member: { name: 'Nyx', role: 'Night' },
  },
  {
    title: 'Wind',
    image: '/characters/char2.jpg',
    member: { name: 'Zephyr', role: 'Air' },
  },
  {
    title: 'Fire',
    image: '/characters/char3.jpg',
    member: { name: 'Ignis', role: 'Flame' },
  },
];

export function TeamOverlay({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 1.1 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed inset-0 z-[200] overflow-hidden bg-black"
    >
      {/* Close Button */}
      <motion.button
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.5 }}
        onClick={onClose}
        className="fixed top-4 right-4 z-[210] font-cinzel text-stone-400 hover:text-white transition-colors text-xs uppercase tracking-widest pointer-events-auto bg-black/40 px-3 py-1 rounded-full border border-white/20 backdrop-blur-md shadow-md"
      >
        Close ✕
      </motion.button>

      {/* Responsive Layout Container */}
      <div className="flex h-full w-full p-4 gap-2 overflow-y-auto md:overflow-y-hidden">
        <div className="grid grid-cols-2 md:flex md:flex-row h-full w-full gap-4 md:gap-2">
          {TEAM_DATA.map((section, idx) => {
            const isEven = idx % 2 === 0;

            return (
              <motion.div
                key={idx}
                layout
                // Use a simpler, faster spring for the flex shift to reduce lag when moving mouse
                whileHover={{ flex: 2.5 }}
                transition={{
                  layout: {
                    type: 'spring',
                    stiffness: 500, // Higher stiffness = faster response
                    damping: 45,    // Higher damping = less oscillation (no bounce-back)
                    mass: 0.5       // Lower mass = lighter, faster movement
                  }
                }}
                className="relative aspect-[3/4] md:aspect-auto md:h-full overflow-hidden rounded-lg md:rounded-sm flex-1 cursor-pointer group will-change-transform shadow-xl"
              >
                {/* Full-Block Face Image */}
                <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  <motion.img
                    layout
                    initial={{
                      y: isEven ? '100%' : '-100%',
                      filter: 'grayscale(100%) blur(10px)'
                    }}
                    animate={{
                      y: 0,
                      filter: 'grayscale(0%) blur(0px)'
                    }}
                    transition={{
                      y: { type: 'spring', stiffness: 100, damping: 20, delay: idx * 0.05 },
                      filter: { duration: 0.8, delay: idx * 0.05 },
                      opacity: { delay: (idx * 0.05) + 0.2 }
                    }}
                    whileHover={{ scale: 1.05 }}
                    src={section.image}
                    alt={section.title}
                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-500"
                  />
                </div>

                {/* Text Overlay */}
                <div className="relative z-10 h-full w-full flex flex-col justify-end items-center p-4 pb-6 md:pb-12 text-center bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none">
                  <motion.h2
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (idx * 0.05) + 0.5 }}
                    className={`font-cinzel text-xs md:text-xs font-bold mb-1 uppercase tracking-tighter text-white drop-shadow-md`}
                  >
                    {section.title}
                  </motion.h2>
                  <motion.p
                    layout
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: (idx * 0.05) + 0.6 }}
                    className={`text-[10px] md:text-[8px] uppercase tracking-tighter font-bold text-white/80 drop-shadow-sm`}
                  >
                    {section.member.role}
                  </motion.p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
