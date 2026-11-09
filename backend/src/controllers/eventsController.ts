import { Request, Response } from 'express'
import { FEST_EVENTS } from '../data/eventsData.js'

export const getAllEvents = (_req: Request, res: Response): void => {
  res.json({
    festival: 'AJ-ASTRIX 2K27',
    totalEvents: FEST_EVENTS.length,
    events: FEST_EVENTS,
  })
}

export const getEventById = (req: Request, res: Response): void => {
  const { id } = req.params
  const event = FEST_EVENTS.find((e) => e.id === id)
  if (!event) {
    res.status(404).json({ error: 'Event not found in the Hogwarts schedule.' })
    return
  }
  res.json(event)
}

export const getSchedule = (_req: Request, res: Response): void => {
  const day1 = FEST_EVENTS.filter((e) => e.day === 1)
  const day2 = FEST_EVENTS.filter((e) => e.day === 2)

  res.json({
    festival: 'AJ-ASTRIX 2K27',
    schedule: [
      {
        day: 1,
        title: 'Day 1 — The Grand Opening & INOVEX Technical Symposium',
        date: '25 October 2027',
        events: day1,
      },
      {
        day: 2,
        title: 'Day 2 — NEXORA Management Conclave & Yule Ball Finale',
        date: '26 October 2027',
        events: day2,
      },
    ],
  })
}

