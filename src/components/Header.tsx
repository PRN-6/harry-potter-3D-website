import { motion } from 'framer-motion'

export function Header({ onTeamClick }: { onTeamClick?: () => void }) {
  return (
    <header className="fixed top-0 left-0 w-full z-[100] p-6 flex justify-end items-center pointer-events-none">
      {/* Nav and Button - Right Side */}
      <div className="flex items-center gap-8">
        <nav className="hidden md:flex items-center gap-6">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              onTeamClick?.();
            }}
            className="font-cinzel text-xs uppercase tracking-widest text-stone-300 hover:text-amber-400 transition-colors pointer-events-auto"
          >
            Team
          </a>
          <a href="#about" className="font-cinzel text-xs uppercase tracking-widest text-stone-300 hover:text-amber-400 transition-colors pointer-events-auto">
            About
          </a>
        </nav>

        <button
          className="font-cinzel text-xs uppercase tracking-widest px-6 py-2 rounded-full border border-amber-500/50 text-amber-200 bg-amber-900/20 backdrop-blur-sm hover:bg-amber-500 hover:text-stone-900 transition-all duration-300 pointer-events-auto shadow-[0_0_15px_rgba(245,158,11,0.2)]"
          onClick={() => window.open('https://google.com', '_blank')} // Placeholder link
        >
          Register Now
        </button>
      </div>
    </header>
  )
}
