import type { FestEvent } from '../data/events'

export interface MapLocation {
  id: string
  name: string
  description: string
  category: string
  mapPosition: { x: number; y: number }
  events: FestEvent[]
}

export type MapView = 'intro' | 'map'