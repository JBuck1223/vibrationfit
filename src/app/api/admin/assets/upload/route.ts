import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'
const SITE_ASSETS_PREFIX = 'site-assets/'

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
    
    // Build S3 key: site-assets/category/path/filename
    const s3Key = `${SITE_ASSETS_PREFIX}${sanitizedCategory}/${sanitizedName}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to S3
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: buffer,
      ContentType: file.type || 'application/octet-stream',
      CacheControl: 'public, max-age=31536000, immutable',
    })

    await s3Client.send(command)

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

