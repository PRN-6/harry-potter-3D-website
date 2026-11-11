import { Request, Response } from 'express'
import { getRankedStandings, adjustHousePoints, getPointLogs } from '../db/store.js'
import { HOUSES_DATA } from '../data/housesData.js'
import { HouseId } from '../models/types.js'

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

  const result = adjustHousePoints(
    houseId.toLowerCase() as HouseId,
    10,
    'Student Cheer / Public Vote',
    'Great Hall Spectators',
    6,
  )

  if (!result) {
    res.status(404).json({ error: `House '${houseId}' not found.` })
    return
  }

  res.json({
    success: true,
    message: `10 points awarded to ${result.standing.name}! The hourglass fills with gems.`,
    updatedHouse: result.standing,
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

  const result = adjustHousePoints(
    houseId.toLowerCase() as HouseId,
    pts,
    reason || 'Manual Adjustment',
    'Hogwarts Faculty',
    1,
  )

  if (!result) {
    res.status(404).json({ error: `House '${houseId}' not found.` })
    return
  }

  res.json({
    success: true,
    message: `${pts >= 0 ? '+' : ''}${pts} points awarded to ${result.standing.name}!`,
    updatedHouse: result.standing,
    standings: getRankedStandings(),
  })
}

export const getHousePointsLedger = (_req: Request, res: Response): void => {
  const logs = getPointLogs(30)
  res.json({ logs })
}
