import crypto from 'crypto'
import { Request, Response } from 'express'
import { OwlPostMessage } from '../models/types.js'

const owlMessages: OwlPostMessage[] = []
const MAX_OWL_MESSAGES = 500

export const submitOwlPost = (req: Request, res: Response): void => {
  const { senderName, email, subject, message } = req.body

  const post: OwlPostMessage = {
    id: `owl_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
    senderName: String(senderName).trim(),
    email: String(email).trim().toLowerCase(),
    subject: subject ? String(subject).trim() : 'Inquiry for Hogwarts Fest Committee',
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  }

  owlMessages.unshift(post)
  if (owlMessages.length > MAX_OWL_MESSAGES) {
    owlMessages.length = MAX_OWL_MESSAGES
  }

  res.status(201).json({
    success: true,
    message: 'Your Owl Post has taken flight to the Head of Department and Fest Coordinators!',
    owlId: post.id,
  })
}

export const getOwlMessages = (_req: Request, res: Response): void => {
  res.json({
    count: owlMessages.length,
    messages: owlMessages,
  })
}

