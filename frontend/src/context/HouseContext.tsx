import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_HOUSE, type HouseId } from '../data/houses'

/**
 * The visitor's house.
 *
 * The choice drives the 3D spotlight colour, the CSS accent variables and the
 * House Cup standings, so it is persisted to localStorage and restored on
 * the next visit.
 */

interface HouseContextValue {
  house: HouseId
  setHouse: (house: HouseId) => void
  /** True once the visitor has picked a house at least once. */
  sorted: boolean
}

const HouseContext = createContext<HouseContextValue | null>(null)

const STORAGE_KEY = 'enchanthia:house'

export function HouseProvider({ children }: { children: ReactNode }) {
  const [house, setHouseState] = useState<HouseId>(DEFAULT_HOUSE)
  const [sorted, setSorted] = useState(false)

  // Restore the saved house on mount.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY) as HouseId | null
      if (saved) {
        setHouseState(saved)
        setSorted(true)
      }
    } catch {
      // Private browsing / storage disabled — the default house is fine.
    }
  }, [])

  const setHouse = (next: HouseId) => {
    setHouseState(next)
    setSorted(true)
    try {
      window.localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // Ignore write failures.
    }
  }

  const value = useMemo(() => ({ house, setHouse, sorted }), [house, sorted])

  return <HouseContext.Provider value={value}>{children}</HouseContext.Provider>
}

export function useHouse(): HouseContextValue {
  const ctx = useContext(HouseContext)
  if (!ctx) {
    throw new Error('useHouse must be used inside a <HouseProvider>')
  }
  return ctx
}
