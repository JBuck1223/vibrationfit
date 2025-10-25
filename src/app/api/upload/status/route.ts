import { NextRequest, NextResponse } from 'next/server'
import { S3Client, HeadObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (!key) {
      return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 })
    }

    const command = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
    })

    const response = await s3Client.send(command)
    const metadata = response.Metadata || {}

    return NextResponse.json({
      status: metadata.status || 'unknown',
      compressed: metadata.compressed === 'true',
      compressionRatio: metadata['compression-ratio'] ? parseFloat(metadata['compression-ratio']) : null,
      originalSize: metadata['original-size'] ? parseInt(metadata['original-size']) : null,
      compressedSize: metadata['compressed-size'] ? parseInt(metadata['compressed-size']) : null,
      compressedUrl: metadata['compressed-url'] || null,
      error: metadata.error || null
    })

  } catch (error) {
    console.error('Error checking compression status:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to check status' },
      { status: 500 }
    )
  }
}
