import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'
import { detectReceiptFileType } from '../middleware/upload.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const LOCAL_UPLOADS_DIR = path.resolve(__dirname, '../../data/uploads/receipts')

const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim()
const apiKey = process.env.CLOUDINARY_API_KEY?.trim()
const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim()

const isCloudinaryConfigured = Boolean(cloudName && apiKey && apiSecret)

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  })
  console.log('[Cloudinary Service] Cloudinary storage configured successfully.')
} else {
  console.log('[Uploads Service] Cloudinary keys not provided in .env; utilizing local storage in data/uploads/receipts.')
}

export interface UploadReceiptResult {
  url: string
  publicId: string
  provider: 'cloudinary' | 'local'
}

/**
 * Uploads a verified payment receipt buffer to Cloudinary (or falls back to safe local storage).
 */
export async function uploadPaymentReceipt(
  fileBuffer: Buffer,
): Promise<UploadReceiptResult> {
  const detected = detectReceiptFileType(fileBuffer)
  if (!detected) {
    throw new Error('Invalid or corrupted receipt content. Only JPEG, PNG, WEBP, and PDF files are supported.')
  }

  // 1. Attempt Cloudinary upload if configured
  if (isCloudinaryConfigured) {
    try {
      return await new Promise<UploadReceiptResult>((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder: 'aj-astrix-2k27/receipts',
            resource_type: 'auto',
            tags: ['aj-astrix-2k27', 'payment-receipt'],
          },
          (error, result) => {
            if (error || !result) {
              return reject(error || new Error('Cloudinary upload stream returned no result.'))
            }
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              provider: 'cloudinary',
            })
          },
        )
        uploadStream.end(fileBuffer)
      })
    } catch (err) {
      console.warn('[Cloudinary Warning] Upload failed, falling back to local storage:', err)
    }
  }

  // 2. Local fallback storage using strictly magic-byte-verified extension & CSPRNG filename
  await fs.promises.mkdir(LOCAL_UPLOADS_DIR, { recursive: true })

  const randomHex = crypto.randomBytes(16).toString('hex')
  const uniqueName = `receipt_${Date.now()}_${randomHex}${detected.ext}`
  const targetPath = path.join(LOCAL_UPLOADS_DIR, uniqueName)

  await fs.promises.writeFile(targetPath, fileBuffer)

  return {
    url: `/api/uploads/receipts/${uniqueName}`,
    publicId: uniqueName,
    provider: 'local',
  }
}

/**
 * Deletes a payment receipt from Cloudinary or local storage safely (prevents path traversal).
 */
export async function deletePaymentReceipt(publicId: string, provider: 'cloudinary' | 'local'): Promise<void> {
  if (!publicId || publicId.startsWith('demo_')) return

  if (provider === 'cloudinary' && isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err)
    }
  } else {
    try {
      const safeFilename = path.basename(publicId)
      const resolvedBase = path.resolve(LOCAL_UPLOADS_DIR)
      const resolvedTarget = path.resolve(LOCAL_UPLOADS_DIR, safeFilename)
      if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
        return
      }
      await fs.promises.unlink(resolvedTarget).catch((err: NodeJS.ErrnoException) => {
        if (err.code !== 'ENOENT') throw err
      })
    } catch (err) {
      console.error('Failed to delete local receipt file:', err)
    }
  }
}

export function getLocalUploadsPath(): string {
  return LOCAL_UPLOADS_DIR
}

