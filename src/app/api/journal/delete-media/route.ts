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
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
      console.log('Processing URL:', url)
      
      // Extract S3 key from URL
      // Format: https://media.vibrationfit.com/user-uploads/{path}/{filename}
      const match = url.match(/media\.vibrationfit\.com\/(.+)/)
      if (match) {
        const key = decodeURIComponent(match[1]) // Decode URL-encoded characters
        console.log('Extracted S3 key:', key)
        
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
          
          console.log('🔍 Processing processed file:', key)
          console.log('🔍 Filename from key:', filename)
          console.log('🔍 Extracted base filename:', baseFilename)
          
          // Get path up to the processed folder (include processed folder in path)
          const pathParts = key.split('/')
          const processedIndex = pathParts.findIndex(part => part === 'processed')
          
          // Build path: include everything up to the processed folder
          const path = processedIndex >= 0 
            ? pathParts.slice(0, processedIndex).join('/')
            : pathParts.slice(0, -1).join('/')
          
          console.log('🔍 PathParts:', pathParts)
          console.log('🔍 ProcessedIndex:', processedIndex)
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
          console.log('🔍 Processing original file:', key)
          keysToDelete.push(key)
          console.log('✅ Added original file to deletion list:', key)
          
          // Also delete thumbnail if it exists
          if (key.includes('.jpg') || key.includes('.png') || key.includes('.webp')) {
            const thumbKey = key.replace(/\.(jpg|jpeg|png|webp)$/i, '-thumb.webp')
            keysToDelete.push(thumbKey)
          } else if (key.includes('.mp4') || key.includes('.mov') || key.includes('.webm') || key.includes('.avi')) {
            // Delete processed video versions (multiple resolutions)
            const filename = key.split('/').pop() || ''
            const baseFilename = filename.replace(/\.[^/.]+$/, '')  // Remove extension
            
            // Check if filename already has a quality suffix
            const hasQualitySuffix = /-(1080p|720p|original)$/.test(baseFilename)
            
            // If it has a quality suffix, remove it to get the true base filename
            const trueBaseFilename = hasQualitySuffix 
              ? baseFilename.replace(/-(1080p|720p|original)$/, '')
              : baseFilename
            
            const path = key.split('/').slice(0, -1).join('/')
            
            console.log('🔍 Video detected, filename:', filename)
            console.log('🔍 Base filename:', baseFilename)
            console.log('🔍 Has quality suffix:', hasQualitySuffix)
            console.log('🔍 True base filename:', trueBaseFilename)
            console.log('🔍 Path:', path)
            
            // Delete all processed versions: -1080p.mp4, -720p.mp4, -original.mp4
            const processedVersions = [
              `${path}/processed/${trueBaseFilename}-1080p.mp4`,
              `${path}/processed/${trueBaseFilename}-720p.mp4`,
              `${path}/processed/${trueBaseFilename}-original.mp4`,
              `${path}/processed/${trueBaseFilename}-thumb.0000000.jpg` // Thumbnail from MediaConvert
            ]
            
            console.log('🔍 Will delete processed versions:', processedVersions)
            keysToDelete.push(...processedVersions)
            
            // Note: The original key was already added above with `keysToDelete.push(key)`
          }
        }
      } else {
        console.log('⚠️  URL does not match expected pattern:', url)
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
    console.log('🔨 Creating DeleteObjectsCommand...')
    const command = new DeleteObjectsCommand({
      Bucket: BUCKET_NAME,
      Delete: {
        Objects: uniqueKeysToDelete.map(key => ({ Key: key })),
        Quiet: false
      }
    })
    console.log('✅ DeleteObjectsCommand created successfully')

    try {
      console.log('📤 Sending delete request to S3...')
      console.log(`   Bucket: ${BUCKET_NAME}`)
      console.log(`   Keys to delete: ${uniqueKeysToDelete.length}`)
      
      const response = await s3Client.send(command)
      
      const deletedCount = response.Deleted?.length || 0
      const errors = response.Errors || []
      
      console.log('📥 S3 Response received:')
      console.log(`   Deleted: ${deletedCount}`)
      console.log(`   Errors: ${errors.length}`)
      
      if (errors.length > 0) {
        console.error('❌ Some deletions failed:')
        errors.forEach(err => {
          console.error(`   - ${err.Key}: ${err.Code} - ${err.Message}`)
        })
      }

      if (deletedCount > 0) {
        console.log('✅ Successfully deleted files:')
        response.Deleted?.forEach(item => {
          console.log(`   ✓ ${item.Key}`)
        })
      }
      
      console.log(`📊 Summary: Deleted ${deletedCount}/${uniqueKeysToDelete.length} files`)
      
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
    } catch (deleteError: any) {
      console.error('❌ S3 delete error:', deleteError)
      console.error('   Error message:', deleteError.message)
      console.error('   Error code:', deleteError.code)
      console.error('   Request ID:', deleteError.requestId)
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

