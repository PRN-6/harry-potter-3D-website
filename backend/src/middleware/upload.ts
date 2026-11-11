import multer from 'multer'
import { Request, Response, NextFunction } from 'express'

const storage = multer.memoryStorage()

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback,
) => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'application/pdf']
  if (allowedMimes.includes(file.mimetype)) {
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
 * Custom wrapper to handle multer errors gracefully with 400 Bad Request
 */
export function handleReceiptUpload(req: Request, res: Response, next: NextFunction) {
  receiptUpload.single('receipt')(req, res, (err: any) => {
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
    } else if (err) {
      res.status(400).json({ error: 'Invalid File', message: err.message })
      return
    }
    next()
  })
}
