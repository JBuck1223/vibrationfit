import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'vibration-fit-client-storage'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { s3Key, userId } = await request.json()

    console.log('📝 Processing completed video:', { s3Key, userId })

    // Parse the S3 key to determine original and processed URLs
    // Processed: user-uploads/userId/journal/uploads/processed/filename-720p.mp4
    // Original:  user-uploads/userId/journal/uploads/filename.mov
    
    const s3KeyParts = s3Key.split('/')
    if (s3KeyParts.length < 4 || s3KeyParts[0] !== 'user-uploads') {
      return NextResponse.json({ error: 'Invalid S3 key format' }, { status: 400 })
    }

    // Extract original filename from -720p.mp4
    const filename = s3KeyParts[s3KeyParts.length - 1]
    const originalFilename = filename.replace('-720p.mp4', '').replace('.mp4', '.mov')
    
    // Reconstruct original path
    const originalKey = s3KeyParts.slice(0, -2).join('/') + '/' + originalFilename
    const originalUrl = `https://media.vibrationfit.com/${originalKey}`
    const processedUrl = `https://media.vibrationfit.com/${s3Key}`

    console.log('🔍 Looking for journal entry with original URL:', originalUrl)

    // Find journal entry containing this original video URL
    const { data: entries, error: searchError } = await supabase
      .from('journal')
      .select('id, image_urls')
      .eq('user_id', userId)
      .contains('image_urls', [originalUrl])

    if (searchError || !entries || entries.length === 0) {
      console.log('⚠️ No journal entry found with this video URL')
      return NextResponse.json({ success: false, message: 'No entry found' })
    }

    // Update the entry to use the processed URL
    for (const entry of entries) {
      const updatedUrls = entry.image_urls.map((url: string) =>
        url === originalUrl ? processedUrl : url
      )

      const { error: updateError } = await supabase
        .from('journal')
        .update({ image_urls: updatedUrls })
        .eq('id', entry.id)

      if (updateError) {
        console.error('❌ Failed to update entry:', entry.id, updateError)
      } else {
        console.log('✅ Updated journal entry:', entry.id)
      }
    }

    return NextResponse.json({ success: true, entriesUpdated: entries.length })
  } catch (error) {
    console.error('❌ Error processing completed video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

