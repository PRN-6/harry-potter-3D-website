import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { v2 as cloudinary } from 'cloudinary'

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
  console.log('☁️ [Cloudinary Service] Cloudinary storage configured successfully.')
} else {
  console.log('📁 [Uploads Service] Cloudinary keys not provided in .env; utilizing high-speed local storage in data/uploads/receipts.')
}

export interface UploadReceiptResult {
  url: string
  publicId: string
  provider: 'cloudinary' | 'local'
}

/**
 * Uploads a payment receipt buffer to Cloudinary (or falls back cleanly to local uploads).
 */
export async function uploadPaymentReceipt(
  fileBuffer: Buffer,
  originalFilename: string,
  mimeType: string,
): Promise<UploadReceiptResult> {
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
      console.warn('⚠️ [Cloudinary Warning] Upload failed, falling back to local storage:', err)
    }
  }

  // 2. Local fallback storage
  if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
    fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true })
  }

  const ext = path.extname(originalFilename) || (mimeType.includes('png') ? '.png' : '.jpg')
  const uniqueName = `receipt_${Date.now()}_${Math.random().toString(36).substring(2, 8)}${ext}`
  const targetPath = path.join(LOCAL_UPLOADS_DIR, uniqueName)

  fs.writeFileSync(targetPath, fileBuffer)

  return {
    url: `/api/uploads/receipts/${uniqueName}`,
    publicId: uniqueName,
    provider: 'local',
  }
}

/**
 * Deletes a payment receipt from Cloudinary or local storage.
 */
export async function deletePaymentReceipt(publicId: string, provider: 'cloudinary' | 'local'): Promise<void> {
  if (provider === 'cloudinary' && isCloudinaryConfigured) {
    try {
      await cloudinary.uploader.destroy(publicId)
    } catch (err) {
      console.error('Failed to delete from Cloudinary:', err)
    }
  } else {
    try {
      const localPath = path.join(LOCAL_UPLOADS_DIR, publicId)
      if (fs.existsSync(localPath)) {
        fs.unlinkSync(localPath)
      }
    } catch (err) {
      console.error('Failed to delete local receipt file:', err)
    }
  }
}

export function getLocalUploadsPath(): string {
  return LOCAL_UPLOADS_DIR
}
