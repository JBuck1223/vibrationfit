import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { s3Key, userId } = await request.json()

    console.log('📝 Processing completed video:', { s3Key, userId })

    // Extract the original filename from S3 key
    // Format: user-uploads/{userId}/journal/uploads/processed/{filename}-720p.mp4
    const s3Parts = s3Key.split('/')
    const filename = s3Parts[s3Parts.length - 1]
    const baseFilename = filename.replace('-720p.mp4', '')
    
    console.log('🔍 Looking for original filename:', baseFilename)

    // Build the original URL pattern
    const folder = s3Parts[2] // journal, vision-board, etc
    const processedFolder = s3Parts[3] // uploads, generated, etc
    const processedUrl = `https://media.vibrationfit.com/${s3Key}`
    const originalUrl = `https://media.vibrationfit.com/user-uploads/${userId}/${folder}/${processedFolder}/${baseFilename}`

    console.log('🔍 Searching for entry with URL:', originalUrl)

    // Find journal entry containing this URL
    const { data: entries, error: searchError } = await supabase
      .from('journal')
      .select('id, image_urls')
      .eq('user_id', userId)
      .contains('image_urls', [originalUrl])

    if (searchError || !entries || entries.length === 0) {
      console.log('⚠️ No journal entry found with this URL')
      return NextResponse.json({ success: false, message: 'Entry not found' }, { status: 404 })
    }

    // Update each entry that contains this URL
    for (const entry of entries) {
      const updatedUrls = entry.image_urls.map((url: string) => 
        url === originalUrl ? processedUrl : url
      )

      const { error: updateError } = await supabase
        .from('journal')
        .update({ image_urls: updatedUrls })
        .eq('id', entry.id)

      if (updateError) {
        console.error('❌ Failed to update entry:', updateError)
      } else {
        console.log('✅ Successfully updated journal entry:', entry.id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error processing completed video:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
