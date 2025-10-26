/**
 * Batch generate thumbnails for old images that don't have them
 * Run: node scripts/generate-missing-thumbnails.js
 */

import sharp from 'sharp'
import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function downloadFromS3(key) {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: key })
    const response = await s3Client.send(command)
    
    const chunks = []
    for await (const chunk of response.Body) {
      chunks.push(chunk)
    }
    return Buffer.concat(chunks)
  } catch (error) {
    console.error(`Failed to download ${key}:`, error)
    return null
  }
}

async function generateThumbnail(imageBuffer) {
  try {
    const thumbnailBuffer = await sharp(imageBuffer)
      .resize(400, 300, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer()
    
    return thumbnailBuffer
  } catch (error) {
    console.error('Thumbnail generation failed:', error)
    return null
  }
}

async function uploadThumbnail(key, thumbnailBuffer) {
  const thumbKey = key.replace(/\.(jpg|jpeg|png)$/i, '-thumb.webp')
  
  try {
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: thumbKey,
      Body: thumbnailBuffer,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'is-thumbnail': 'true',
        'original-s3-key': key
      }
    })
    
    await s3Client.send(command)
    console.log(`✅ Uploaded thumbnail: ${thumbKey}`)
    return `https://media.vibrationfit.com/${thumbKey}`
  } catch (error) {
    console.error(`Failed to upload thumbnail ${thumbKey}:`, error)
    return null
  }
}

async function checkIfThumbnailExists(key) {
  const thumbKey = key.replace(/\.(jpg|jpeg|png)$/i, '-thumb.webp')
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET_NAME, Key: thumbKey })
    await s3Client.send(command)
    return true
  } catch {
    return false
  }
}

async function main() {
  console.log('🔍 Finding images without thumbnails...')
  
  // Query Supabase for all journal entries with images
  const response = await fetch(`${SUPABASE_URL}/rest/v1/journal_entries?select=id,image_urls&order=created_at.desc`, {
    headers: {
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`
    }
  })
  
  const entries = await response.json()
  console.log(`Found ${entries.length} journal entries`)
  
  let totalImages = 0
  let processedImages = 0
  let skippedImages = 0
  
  for (const entry of entries) {
    if (!entry.image_urls || entry.image_urls.length === 0) continue
    
    for (const url of entry.image_urls) {
      const ext = url.split('.').pop()?.toLowerCase()
      if (!['jpg', 'jpeg', 'png'].includes(ext)) continue
      
      totalImages++
      const s3Key = url.replace('https://media.vibrationfit.com/', '')
      
      // Check if thumbnail already exists
      const hasThumb = await checkIfThumbnailExists(s3Key)
      if (hasThumb) {
        console.log(`⏭️  Skipping ${s3Key} (thumbnail already exists)`)
        skippedImages++
        continue
      }
      
      console.log(`📸 Processing: ${s3Key}`)
      
      // Download original image
      const imageBuffer = await downloadFromS3(s3Key)
      if (!imageBuffer) continue
      
      // Generate thumbnail
      const thumbnailBuffer = await generateThumbnail(imageBuffer)
      if (!thumbnailBuffer) continue
      
      // Upload thumbnail
      await uploadThumbnail(s3Key, thumbnailBuffer)
      processedImages++
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 100))
    }
  }
  
  console.log('\n✅ Batch processing complete!')
  console.log(`📊 Total images: ${totalImages}`)
  console.log(`📸 Processed: ${processedImages}`)
  console.log(`⏭️  Skipped: ${skippedImages}`)
}

main().catch(console.error)

