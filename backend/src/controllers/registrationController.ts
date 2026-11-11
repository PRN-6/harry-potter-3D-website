import { Request, Response } from 'express'
import {
  insertRegistration,
  findRegistrationByEmail,
  getRegistrationsList,
  getRegistrationById as dbGetRegistrationById,
} from '../db/store.js'

export const createRegistration = (req: Request, res: Response): void => {
  try {
    const { fullName, email, phone, college, department, usnOrRollNo, houseId, eventIds, notes } = req.body

    // Check if email already registered
    const existing = findRegistrationByEmail(email)
    if (existing) {
      res.status(409).json({
        error: 'Already Registered',
        message: 'This magical owl address is already registered for AJ-ASTRIX 2K27.',
        registrationId: existing.id,
      })
      return
    }

    const newRegistration = insertRegistration({
      fullName,
      email,
      phone,
      college,
      department: department || 'Other',
      usnOrRollNo: usnOrRollNo || undefined,
      houseId,
      eventIds: Array.isArray(eventIds) ? eventIds : [],
      notes: notes || undefined,
    })

    res.status(201).json({
      success: true,
      message: `Welcome to AJ-ASTRIX 2K27, ${newRegistration.fullName}! You have been sorted into ${newRegistration.houseId.toUpperCase()}.`,
      registration: newRegistration,
    })
  } catch (err) {
    console.error('Registration creation error:', err)
    res.status(500).json({ error: 'Internal magical failure while saving registration.' })
  }
}

export const getRegistrations = (_req: Request, res: Response): void => {
  try {
    const list = getRegistrationsList()
    res.json({
      count: list.length,
      registrations: list,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve registrations archives.' })
  }
}

export const getRegistrationById = (req: Request, res: Response): void => {
  try {
    const { id } = req.params
    const found = dbGetRegistrationById(id)
    if (!found) {
      res.status(404).json({ error: 'Registration not found in Hogwarts archives.' })
      return
    }
    res.json(found)
  } catch (err) {
    res.status(500).json({ error: 'Failed to find registration.' })
  }
}
