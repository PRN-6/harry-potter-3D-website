import { Request, Response } from 'express'
import {
  insertRegistration,
  findRegistrationByEmail,
  findRegistrationByTransactionId,
  getRegistrationsList,
  getRegistrationById as dbGetRegistrationById,
  markEmailDispatched,
  DuplicateRegistrationError,
} from '../db/store.js'
import { uploadPaymentReceipt, deletePaymentReceipt } from '../services/cloudinaryService.js'
import { sendAcceptanceEmail } from '../services/emailService.js'

function getAuthoritativePassAmount(): number {
  const parsed = parseInt(process.env.FEST_PASS_AMOUNT || '250', 10)
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 250
}

export const createRegistration = async (req: Request, res: Response): Promise<void> => {
  let receiptUrl: string | undefined
  let receiptPublicId: string | undefined
  let receiptProvider: 'cloudinary' | 'local' = 'local'

  try {
    const {
      fullName,
      email,
      phone,
      college,
      department,
      usnOrRollNo,
      houseId,
      eventIds,
      notes,
      transactionId,
    } = req.body

    // 1. Fast pre-check if email already registered
    const existingEmail = findRegistrationByEmail(email)
    if (existingEmail) {
      res.status(409).json({
        error: 'Already Registered',
        message: 'This magical owl address is already registered for AJ-ASTRIX 2K27.',
        registrationId: existingEmail.id,
      })
      return
    }

    // 2. Fast pre-check if transaction ref ID already submitted
    if (transactionId && typeof transactionId === 'string' && transactionId.trim()) {
      const existingTx = findRegistrationByTransactionId(transactionId)
      if (existingTx) {
        res.status(409).json({
          error: 'Duplicate Transaction Reference',
          message: 'This UPI transaction reference has already been submitted for another registration.',
        })
        return
      }
    }

    // 3. Handle Payment Receipt Upload (Cloudinary / Local fallback)
    if (req.file) {
      try {
        const uploadResult = await uploadPaymentReceipt(req.file.buffer)
        receiptUrl = uploadResult.url
        receiptPublicId = uploadResult.publicId
        receiptProvider = uploadResult.provider
      } catch (uploadErr) {
        console.error('Payment receipt upload error:', uploadErr)
        res.status(400).json({
          error: 'Receipt Upload Failed',
          message: 'Could not securely store your payment receipt. Please try uploading a valid JPG, PNG, WEBP, or PDF.',
        })
        return
      }
    }

    // 4. Save registration with server-authoritative amount & pending verification state
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
      amount: getAuthoritativePassAmount(),
      paymentStatus: 'pending',
      paymentMethod: 'upi',
      transactionId: transactionId ? String(transactionId).trim() : undefined,
      receiptUrl,
      receiptPublicId,
      ipAddress: req.ip,
    })

    // 5. Asynchronous Owl Email Dispatch (Hogwarts Acceptance Letter)
    sendAcceptanceEmail(newRegistration)
      .then((dispatch) => {
        if (dispatch.sent) {
          markEmailDispatched(newRegistration.id)
        }
      })
      .catch((emailErr) => {
        console.warn('Acceptance email background dispatch warning:', emailErr)
      })

    res.status(201).json({
      success: true,
      message: `Welcome to AJ-ASTRIX 2K27, ${newRegistration.fullName}! You have been sorted into ${newRegistration.houseId.toUpperCase()}. An owl acceptance letter has been dispatched to ${newRegistration.email}.`,
      registration: newRegistration,
    })
  } catch (err) {
    if (err instanceof DuplicateRegistrationError) {
      if (receiptPublicId) {
        deletePaymentReceipt(receiptPublicId, receiptProvider).catch(() => {})
      }
      res.status(409).json({
        error: err.code === 'EMAIL_EXISTS' ? 'Already Registered' : 'Duplicate Transaction Reference',
        message: err.message,
        ...(err.code === 'EMAIL_EXISTS' ? { registrationId: err.existingId } : {}),
      })
      return
    }
    console.error('Registration creation error:', err)
    res.status(500).json({ error: 'Internal magical failure while saving registration.' })
  }
}

export const getRegistrations = (req: Request, res: Response): void => {
  try {
    const { houseId, paymentStatus } = req.query
    const list = getRegistrationsList({
      houseId: typeof houseId === 'string' ? houseId : undefined,
      paymentStatus: typeof paymentStatus === 'string' ? paymentStatus : undefined,
    })
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

export const resendAcceptanceEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params
    const found = dbGetRegistrationById(id)
    if (!found) {
      res.status(404).json({ error: 'Registration not found.' })
      return
    }

    const result = await sendAcceptanceEmail(found)
    if (result.sent) {
      markEmailDispatched(found.id)
    }

    res.json({
      success: true,
      message: `Hogwarts Acceptance Letter successfully redispatched to ${found.email}.`,
      mode: result.mode,
    })
  } catch (err) {
    res.status(500).json({ error: 'Failed to resend acceptance email.' })
  }
}
