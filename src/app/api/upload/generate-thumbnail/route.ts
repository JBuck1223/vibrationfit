import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { generateThumbnail } from '@/lib/utils/imageOptimization'
import { generateVideoThumbnail } from '@/lib/utils/videoOptimization'

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
    const { s3Key, fileType, fileName } = await request.json()

    if (!s3Key || !fileType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    console.log(`📸 Generating thumbnail for: ${s3Key}`)

    // Download the original file from S3
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key
    })

    const response = await s3Client.send(getCommand)
    
    if (!response.Body) {
      throw new Error('No body in S3 response')
    }

    // Handle streaming body
    const chunks: Uint8Array[] = []
    const body = response.Body as ReadableStream
    const reader = body.getReader()
    
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      chunks.push(value)
    }
    
    const buffer = Buffer.concat(chunks)

    let thumbnailBuffer: Buffer | null = null
    let thumbKey: string
    let contentType: string

    // Generate thumbnail based on file type
    if (fileType.startsWith('image/')) {
      console.log('📸 Generating image thumbnail...')
      thumbnailBuffer = await generateThumbnail(buffer, 400, 300)
      thumbKey = s3Key.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.webp')
      contentType = 'image/webp'
    } else if (fileType.startsWith('video/')) {
      console.log('🎬 Generating video thumbnail...')
      thumbnailBuffer = await generateVideoThumbnail(buffer, fileName || 'video')
      thumbKey = s3Key.replace(/\.(mp4|mov|webm|avi)$/i, '-thumb.jpg')
      contentType = 'image/jpeg'
    } else {
      return NextResponse.json({ error: 'Unsupported file type' }, { status: 400 })
    }

    if (!thumbnailBuffer) {
      throw new Error('Failed to generate thumbnail')
    }

    // Upload thumbnail to S3
    console.log(`📤 Uploading thumbnail: ${thumbKey}`)
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbKey,
      Body: thumbnailBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'is-thumbnail': 'true',
        'original-s3-key': s3Key,
        'original-filename': fileName || 'unknown'
      }
    })

    await s3Client.send(putCommand)

    const thumbnailUrl = `https://media.vibrationfit.com/${thumbKey}`
    console.log(`✅ Thumbnail uploaded: ${thumbKey}`)

    return NextResponse.json({
      success: true,
      thumbnailUrl
    })
  } catch (error) {
    console.error('Error generating thumbnail:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate thumbnail' },
      { status: 500 }
    )
  }
}

