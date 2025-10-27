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
    console.log('URLs received:', urls)

    // Extract S3 keys from URLs
    const keysToDelete: string[] = []

    for (const url of urls) {
      console.log('Processing URL:', url)
      
      // Extract S3 key from URL
      // Format: https://media.vibrationfit.com/user-uploads/{path}/{filename}
      const match = url.match(/media\.vibrationfit\.com\/(.+)/)
      if (match) {
        const key = decodeURIComponent(match[1]) // Decode URL-encoded characters
        console.log('Extracted key:', key)
        
        // Check if this is already a processed file (in /processed/ folder)
        if (key.includes('/processed/')) {
          // This is a processed file, need to extract base filename
          const filename = key.split('/').pop() || ''
          
          // Extract the base filename before any quality suffix
          // Examples: 
          // - "myvideo-1080p.mp4" -> "myvideo"
          // - "myvideo-720p.mp4" -> "myvideo"
          // - "myvideo-original.mp4" -> "myvideo"
          // - "myvideo-thumb.0000000.jpg" -> "myvideo"
          let baseFilename = filename
            .replace(/-1080p\.mp4$/i, '')
            .replace(/-720p\.mp4$/i, '')
            .replace(/-original\.(mp4|mov)$/i, '')
            .replace(/-thumb\.\d+\.(jpg|png|webp)$/i, '')  // Handle -thumb.0000000.jpg
            .replace(/-thumb$/i, '')
          
          // If no suffix was found, try removing extension
          if (baseFilename === filename) {
            baseFilename = filename.replace(/\.[^/.]+$/, '')
          }
          
          // Get path up to the uploads folder
          const pathParts = key.split('/')
          const uploadsIndex = pathParts.findIndex(part => part === 'uploads')
          const path = pathParts.slice(0, uploadsIndex + 1).join('/')
          
          console.log('🔍 Processing processed file:', key)
          console.log('🔍 Filename from key:', filename)
          console.log('🔍 Base filename:', baseFilename)
          console.log('🔍 Path:', path)
          
          // Delete all processed versions
          const processedVersions = [
            `${path}/processed/${baseFilename}-1080p.mp4`,
            `${path}/processed/${baseFilename}-720p.mp4`,
            `${path}/processed/${baseFilename}-original.mp4`,
            `${path}/processed/${baseFilename}-thumb.0000000.jpg`  // Actual thumbnail file
          ]
          
          console.log('🔍 Will delete processed versions:', processedVersions)
          keysToDelete.push(...processedVersions)
          
          // Also delete the original file (if it exists)
          const possibleExtensions = ['.mp4', '.mov', '.webm', '.avi']
          possibleExtensions.forEach(ext => {
            keysToDelete.push(`${path}/${baseFilename}${ext}`)
          })
          
          console.log('🔍 Will also try to delete original:', `${path}/${baseFilename}`)
        } else {
          // This is NOT a processed file
          keysToDelete.push(key)
          
          console.log('🔍 Processing original file:', key)
          
          // Also delete thumbnail if it exists
          if (key.includes('.jpg') || key.includes('.png') || key.includes('.webp')) {
            const thumbKey = key.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.webp')
            keysToDelete.push(thumbKey)
          } else if (key.includes('.mp4') || key.includes('.mov') || key.includes('.webm') || key.includes('.avi')) {
            // Delete processed video versions (multiple resolutions)
            const filename = key.split('/').pop() || ''
            const baseFilename = filename.replace(/\.[^/.]+$/, '')  // Remove extension
            const path = key.split('/').slice(0, -1).join('/')
            
            console.log('🔍 Video detected, base filename:', baseFilename)
            console.log('🔍 Path:', path)
            
            // Delete all processed versions: -1080p.mp4, -720p.mp4, -original.mp4
            const processedVersions = [
              `${path}/processed/${baseFilename}-1080p.mp4`,
              `${path}/processed/${baseFilename}-720p.mp4`,
              `${path}/processed/${baseFilename}-original.mp4`,
              `${path}/processed/${baseFilename}-thumb.0000000.jpg` // Thumbnail from MediaConvert
            ]
            
            console.log('🔍 Will delete processed versions:', processedVersions)
            keysToDelete.push(...processedVersions)
          }
        }
      }
    }

    if (keysToDelete.length === 0) {
      console.log('No files to delete')
      return NextResponse.json({ success: true, deleted: 0 })
    }

    // Remove duplicates
    const uniqueKeysToDelete = [...new Set(keysToDelete)]
    
    console.log('═══════════════════════════════════════')
    console.log(`🗑️  DELETION SUMMARY`)
    console.log(`Total URLs received: ${urls.length}`)
    console.log(`Total keys to delete: ${keysToDelete.length}`)
    console.log(`Unique keys to delete: ${uniqueKeysToDelete.length}`)
    console.log('═══════════════════════════════════════')
    console.log('Files to delete:')
    uniqueKeysToDelete.forEach(key => console.log(`   - ${key}`))
    console.log('═══════════════════════════════════════')

    // Delete all objects in batch (use unique keys)
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: uniqueKeysToDelete.map(key => ({ Key: key })),
        Quiet: false
      }
    })

    try {
      const response = await s3Client.send(command)
      
      const deletedCount = response.Deleted?.length || 0
      const errors = response.Errors || []
      
      if (errors.length > 0) {
        console.error('Some deletions failed:', JSON.stringify(errors, null, 2))
        errors.forEach(err => {
          console.error(`Failed to delete ${err.Key}: ${err.Code} - ${err.Message}`)
        })
      }

      console.log(`✅ Deleted ${deletedCount}/${uniqueKeysToDelete.length} files`)
      
      if (deletedCount < uniqueKeysToDelete.length) {
        console.log(`⚠️  Warning: Only deleted ${deletedCount} out of ${uniqueKeysToDelete.length} files`)
      }

      return NextResponse.json({ 
        success: true, 
        deleted: deletedCount,
        total: uniqueKeysToDelete.length,
        errors: errors.length,
        errorDetails: errors
      })
    } catch (deleteError) {
      console.error('S3 delete error:', deleteError)
      throw deleteError
    }
  } catch (error) {
    console.error('Error deleting media files:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to delete files' },
      { status: 500 }
    )
  }
}

