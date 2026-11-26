import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

const storage = multer.memoryStorage()

const ALLOWED_MIMES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf'])

/**
 * Inspects leading magic bytes of an uploaded buffer to ensure it truly matches
 * an allowed receipt format (JPEG, PNG, WEBP, or PDF) regardless of client MIME/filename.
 */
export function detectReceiptFileType(buffer: Buffer): { mime: string; ext: '.jpg' | '.png' | '.webp' | '.pdf' } | null {
  if (!buffer || buffer.length < 5) return null

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: 'image/jpeg', ext: '.jpg' }
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return { mime: 'image/png', ext: '.png' }
  }

  // WEBP: RIFF....WEBP
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mime: 'image/webp', ext: '.webp' }
  }

  // PDF: %PDF-
  if (buffer.toString('ascii', 0, 5) === '%PDF-') {
    return { mime: 'application/pdf', ext: '.pdf' }
  }

  return null
}

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  if (ALLOWED_MIMES.has(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, and PDF receipts are permitted.'))
  }
}

export const receiptUpload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB max
  },
  fileFilter,
})

/**
 * Custom wrapper to handle multer & magic-byte validation cleanly with 400 Bad Request
 */
export function handleReceiptUpload(req: Request, res: Response, next: NextFunction) {
  receiptUpload.single('receipt')(req, res, (err: unknown) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          error: 'File Too Large',
          message: 'Payment receipt screenshot exceeds the 5MB limit. Please upload a smaller image.',
        })
        return
      }
      res.status(400).json({ error: 'Upload Error', message: err.message })
      return
    } else if (err instanceof Error) {
      res.status(400).json({ error: 'Invalid File', message: err.message })
      return
    }

    if (req.file) {
      const detected = detectReceiptFileType(req.file.buffer)
      if (!detected) {
        res.status(400).json({
          error: 'Invalid File Content',
          message: 'Receipt file content does not match a valid JPEG, PNG, WEBP, or PDF file.',
        })
        return
      }
      req.file.mimetype = detected.mime
    }

    next()
  })
}

