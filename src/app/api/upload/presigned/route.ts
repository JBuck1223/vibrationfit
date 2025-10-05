import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

// Configure runtime for presigned URL generation
export const runtime = 'nodejs'
export const maxDuration = 30 // 30 seconds for URL generation

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function POST(request: NextRequest) {
  try {
    const { key, fileType } = await request.json()

    if (!key || !fileType) {
      return NextResponse.json({ error: 'Missing key or fileType' }, { status: 400 })
    }

    // Generate presigned URL for PUT operation
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
      CacheControl: 'max-age=31536000',
    })

    // Generate presigned URL (valid for 1 hour)
    const uploadUrl = await getSignedUrl(s3Client, command, { 
      expiresIn: 3600 // 1 hour
    })

    console.log(`Generated presigned URL for ${key}`)

    return NextResponse.json({ uploadUrl })
  } catch (error) {
    console.error('Presigned URL generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate presigned URL' },
      { status: 500 }
    )
  }
}
