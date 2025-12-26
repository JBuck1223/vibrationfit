import { NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const SITE_ASSETS_PREFIX = 'site-assets/'

export async function POST(request: Request) {
  try {
    const { targetFolder } = await request.json()

    if (!targetFolder) {
      return NextResponse.json(
        { error: 'No target folder provided', message: 'targetFolder is required (e.g., "audio")' },
        { status: 400 }
      )
    }

    // List all files in the incorrectly placed folder (without site-assets prefix)
    const listCommand = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: `${targetFolder}/`,
    })

    const listResponse = await s3Client.send(listCommand)

    if (!listResponse.Contents || listResponse.Contents.length === 0) {
      return NextResponse.json({
        message: 'No files found to recover',
        recovered: [],
      })
    }

    const recovered: string[] = []
    const errors: string[] = []

    for (const obj of listResponse.Contents) {
      if (!obj.Key || obj.Key.endsWith('/')) continue

      try {
        // The current (wrong) key: e.g., "audio/file.mp3"
        const wrongKey = obj.Key
        
        // The correct key should be: "site-assets/audio/file.mp3"
        const correctKey = `${SITE_ASSETS_PREFIX}${wrongKey}`

        // Skip if already in the correct location
        if (wrongKey.startsWith(SITE_ASSETS_PREFIX)) {
          console.log(`File already in correct location: ${wrongKey}`)
          continue
        }

        console.log(`Moving ${wrongKey} to ${correctKey}`)

        // Copy to correct location
        await s3Client.send(
          new CopyObjectCommand({
            Bucket: BUCKET_NAME,
            CopySource: `${BUCKET_NAME}/${wrongKey}`,
            Key: correctKey,
          })
        )

        // Delete from wrong location
        await s3Client.send(
          new DeleteObjectCommand({
            Bucket: BUCKET_NAME,
            Key: wrongKey,
          })
        )

        recovered.push(`${wrongKey} → ${correctKey}`)
      } catch (error) {
        console.error(`Error recovering ${obj.Key}:`, error)
        errors.push(`${obj.Key}: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json({
      success: true,
      recovered,
      recoveredCount: recovered.length,
      errors: errors.length > 0 ? errors : undefined,
    })
  } catch (error) {
    console.error('Recovery error:', error)
    return NextResponse.json(
      {
        error: 'Failed to recover files',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    )
  }
}

