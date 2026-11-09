import { Request, Response } from 'express'
import { getRankedStandings, voteForHouse, liveStandings } from '../data/standingsData.js'
import { HOUSES_DATA } from '../data/housesData.js'

export const getStandings = (_req: Request, res: Response): void => {
  const standings = getRankedStandings()
  const leader = standings[0]

  res.json({
    festival: 'AJ-ASTRIX 2K27',
    houseCupLeader: leader,
    standings,
    houses: HOUSES_DATA,
  })
}

export const castHouseVote = (req: Request, res: Response): void => {
  const { houseId } = req.body
  if (!houseId || typeof houseId !== 'string') {
    res.status(400).json({ error: 'Valid houseId is required (gryffindor, slytherin, ravenclaw, hufflepuff).' })
    return
  }

  const updated = voteForHouse(houseId.toLowerCase(), 10)
  if (!updated) {
    res.status(404).json({ error: `House '${houseId}' not found.` })
    return
  }

  res.json({
    success: true,
    message: `10 points awarded to ${updated.name}! The hourglass fills with gems.`,
    updatedHouse: updated,
    standings: getRankedStandings(),
  })
}

export const addHousePoints = (req: Request, res: Response): void => {
  const { houseId, points, reason } = req.body

  const pts = parseInt(points, 10)
  if (!houseId || isNaN(pts)) {
    res.status(400).json({ error: 'houseId and numeric points are required.' })
    return
  }

  const updated = voteForHouse(houseId.toLowerCase(), pts)
  if (!updated) {
    res.status(404).json({ error: `House '${houseId}' not found.` })
    return
  }

  res.json({
    success: true,
    message: `${pts > 0 ? '+' : ''}${pts} points awarded to ${updated.name} for: ${reason || 'Merit and Chivalry'}.`,
    updatedHouse: updated,
    standings: getRankedStandings(),
  })
}
