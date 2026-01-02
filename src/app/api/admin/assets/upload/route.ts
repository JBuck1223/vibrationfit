import { NextRequest, NextResponse } from 'next/server'
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  CreateMultipartUploadCommand,
  UploadPartCommand,
  CompleteMultipartUploadCommand,
  AbortMultipartUploadCommand,
} from '@aws-sdk/client-s3'

export const runtime = 'nodejs'
export const maxDuration = 300
// export const maxRequestBodySize = '500mb' // Next.js 16+ only

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3,
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'
const SITE_ASSETS_PREFIX = 'site-assets/'
const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50MB
const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    if (!category) {
      return NextResponse.json({ error: 'Category is required' }, { status: 400 })
    }

    // Sanitize category path (preserve forward slashes for nested folders)
    // Allow: lowercase letters, numbers, hyphens, and forward slashes
    const sanitizedCategory = category
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\/-]/g, '-') // Replace invalid chars but keep slashes
      .replace(/\/+/g, '/') // Replace multiple slashes with single
      .replace(/^\/|\/$/g, '') // Remove leading/trailing slashes
    
    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.-]/g, '-').toLowerCase()
    const s3Key = sanitizedCategory
      ? `${SITE_ASSETS_PREFIX}${sanitizedCategory}/${sanitizedName}`
      : `${SITE_ASSETS_PREFIX}${sanitizedName}`
    const contentType = file.type || 'application/octet-stream'

    if (file.size > MULTIPART_THRESHOLD) {
      await multipartUpload(file, s3Key, contentType)
    } else {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      })

      await s3Client.send(command)
    }

    // Return CloudFront URL instead of S3 URL
    const url = `${CDN_URL}/${s3Key}`

    return NextResponse.json({
      success: true,
      key: s3Key,
      url,
      category: sanitizedCategory,
      fileName: sanitizedName,
    })
  } catch (error) {
    console.error('Error uploading to S3:', error)
    return NextResponse.json(
      { error: 'Upload failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { s3Key } = await request.json()

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing s3Key' }, { status: 400 })
    }

    if (!s3Key.startsWith(SITE_ASSETS_PREFIX)) {
      return NextResponse.json({ error: 'Invalid key for site assets' }, { status: 400 })
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    await s3Client.send(command)

    return NextResponse.json({
      success: true,
      deletedKey: s3Key,
    })
  } catch (error) {
    console.error('Error deleting asset from S3:', error)
    return NextResponse.json(
      { error: 'Delete failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

async function multipartUpload(
  file: File,
  s3Key: string,
  contentType: string
) {
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: contentType,
    CacheControl: 'public, max-age=31536000, immutable',
  })

  const { UploadId } = await s3Client.send(createCommand)

  if (!UploadId) {
    throw new Error('Failed to initiate multipart upload')
  }

  try {
    const parts: { ETag: string; PartNumber: number }[] = []
    const totalParts = Math.ceil(file.size / CHUNK_SIZE)

    for (let i = 0; i < totalParts; i += 1) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      const arrayBuffer = await chunk.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadPartCommand = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        UploadId,
        PartNumber: i + 1,
        Body: buffer,
      })

      const { ETag } = await s3Client.send(uploadPartCommand)

      if (!ETag) {
        throw new Error(`Failed to upload part ${i + 1}`)
      }

      parts.push({ ETag, PartNumber: i + 1 })
    }

    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      UploadId,
      MultipartUpload: { Parts: parts },
    })

    await s3Client.send(completeCommand)
  } catch (error) {
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      UploadId,
    })

    await s3Client.send(abortCommand)
    throw error
  }
}

