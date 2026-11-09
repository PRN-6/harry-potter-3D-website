import { Request, Response } from 'express'
import { Registration, HouseId } from '../models/types.js'
import { voteForHouse } from '../data/standingsData.js'

// In-memory registrations list (seeded with early registrants)
const registrations: Registration[] = [
  {
    id: 'reg_demo_01',
    fullName: 'Harry Potter',
    email: 'harry@gryffindor.hogwarts.ac.in',
    phone: '+91 98765 43210',
    college: 'Hogwarts College of Wizardry',
    department: 'MCA',
    usnOrRollNo: '1AJ23MC007',
    houseId: 'gryffindor',
    eventIds: ['quidditch-cup', 'hackathon-hex'],
    notes: 'Looking forward to the hackathon and Quidditch tournament.',
    createdAt: new Date().toISOString(),
  },
]

export const createRegistration = (req: Request, res: Response): void => {
  try {
    const { fullName, email, phone, college, department, usnOrRollNo, houseId, eventIds, notes } = req.body

    // Basic Validation
    if (!fullName || typeof fullName !== 'string' || fullName.trim().length < 2) {
      res.status(400).json({ error: 'Full name is required (minimum 2 characters).' })
      return
    }

    if (!email || typeof email !== 'string' || !/^\S+@\S+\.\S+$/.test(email)) {
      res.status(400).json({ error: 'A valid email address is required.' })
      return
    }

    if (!phone || typeof phone !== 'string' || phone.trim().length < 8) {
      res.status(400).json({ error: 'A valid phone number is required.' })
      return
    }

    if (!college || typeof college !== 'string') {
      res.status(400).json({ error: 'College / Institution name is required.' })
      return
    }

    const validHouses: HouseId[] = ['gryffindor', 'slytherin', 'ravenclaw', 'hufflepuff']
    const assignedHouse: HouseId = validHouses.includes(houseId) ? houseId : 'gryffindor'

    // Check if email already registered
    const existing = registrations.find((r) => r.email.toLowerCase() === email.trim().toLowerCase())
    if (existing) {
      res.status(409).json({
        error: 'This email is already registered for AJ-ASTRIX 2K27.',
        registrationId: existing.id,
      })
      return
    }

    const newRegistration: Registration = {
      id: `reg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      fullName: fullName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      college: college.trim(),
      department: department || 'Other',
      usnOrRollNo: usnOrRollNo ? String(usnOrRollNo).trim() : undefined,
      houseId: assignedHouse,
      eventIds: Array.isArray(eventIds) ? eventIds : [],
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date().toISOString(),
    }

    registrations.push(newRegistration)

    // Award 5 bonus points to the registrant's house in the House Cup!
    voteForHouse(assignedHouse, 5)

    res.status(201).json({
      success: true,
      message: `Welcome to AJ-ASTRIX 2K27, ${newRegistration.fullName}! You have been sorted into ${assignedHouse.toUpperCase()}.`,
      registration: newRegistration,
    })
  } catch (err) {
    res.status(500).json({ error: 'Internal magical failure while saving registration.' })
  }
}

export const getRegistrations = (_req: Request, res: Response): void => {
  res.json({
    count: registrations.length,
    registrations,
  })
}

export const getRegistrationById = (req: Request, res: Response): void => {
  const { id } = req.params
  const found = registrations.find((r) => r.id === id)
  if (!found) {
    res.status(404).json({ error: 'Registration not found in Hogwarts archives.' })
    return
  }
  res.json(found)
}

