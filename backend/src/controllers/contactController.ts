import { Request, Response } from 'express'
import { OwlPostMessage } from '../models/types.js'

const owlMessages: OwlPostMessage[] = []

export const submitOwlPost = (req: Request, res: Response): void => {
  const { senderName, email, subject, message } = req.body

  if (!senderName || !email || !message) {
    res.status(400).json({ error: 'senderName, email, and message are required for Owl Post dispatch.' })
    return
  }

  const post: OwlPostMessage = {
    id: `owl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    senderName: String(senderName).trim(),
    email: String(email).trim().toLowerCase(),
    subject: subject ? String(subject).trim() : 'Inquiry for Hogwarts Fest Committee',
    message: String(message).trim(),
    createdAt: new Date().toISOString(),
  }

  owlMessages.push(post)

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
