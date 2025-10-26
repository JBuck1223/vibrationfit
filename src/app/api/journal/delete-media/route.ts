import { NextRequest, NextResponse } from 'next/server'
import { S3Client, DeleteObjectsCommand } from '@aws-sdk/client-s3'

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
    const { urls } = await request.json()

    if (!urls || !Array.isArray(urls)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }

    console.log(`🗑️  Deleting ${urls.length} media files from S3...`)

    // Extract S3 keys from URLs
    const keysToDelete: string[] = []

    for (const url of urls) {
      // Extract S3 key from URL
      // Format: https://media.vibrationfit.com/user-uploads/{path}/{filename}
      const match = url.match(/media\.vibrationfit\.com\/(.+)/)
      if (match) {
        const key = match[1]
        keysToDelete.push(key)
        
        // Also delete thumbnail if it exists
        if (key.includes('.jpg') || key.includes('.png') || key.includes('.webp')) {
          const thumbKey = key.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.webp')
          keysToDelete.push(thumbKey)
        } else if (key.includes('.mp4') || key.includes('.mov')) {
          const thumbKey = key.replace(/\.(mp4|mov|webm|avi)$/i, '-thumb.jpg')
          keysToDelete.push(thumbKey)
          
          // Also delete processed video if it exists
          const processedKey = key.replace(/\/uploads\/([^/]+)$/, '/uploads/processed/$1-720p.mp4')
          keysToDelete.push(processedKey)
        }
      }
    }

    if (keysToDelete.length === 0) {
      console.log('No files to delete')
      return NextResponse.json({ success: true, deleted: 0 })
    }

    console.log(`Deleting keys:`, keysToDelete)

    // Delete all objects in batch
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: keysToDelete.map(key => ({ Key: key })),
        Quiet: false
      }
    })

    const response = await s3Client.send(command)
    
    const deletedCount = response.Deleted?.length || 0
    const errors = response.Errors || []
    
    if (errors.length > 0) {
      console.error('Some deletions failed:', errors)
    }

    console.log(`✅ Deleted ${deletedCount}/${keysToDelete.length} files`)

    return NextResponse.json({ 
      success: true, 
      deleted: deletedCount,
      errors: errors.length
    })
  } catch (error) {
    console.error('Error deleting media files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete files' },
      { status: 500 }
    )
  }
}

