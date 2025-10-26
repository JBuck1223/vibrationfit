import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { 
      entryId, 
      originalUrl, 
      processedUrl 
    } = await request.json()

    console.log('📝 Updating journal entry with processed video:', {
      entryId,
      originalUrl,
      processedUrl
    })

    // Get the current entry
    const { data: entry, error: fetchError } = await supabase
      .from('journal')
      .select('image_urls')
      .eq('id', entryId)
      .single()

    if (fetchError || !entry) {
      console.error('❌ Failed to fetch entry:', fetchError)
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 })
    }

    // Replace original URL with processed URL
    const updatedUrls = entry.image_urls.map((url: string) => 
      url === originalUrl ? processedUrl : url
    )

    // Update the entry
    const { error: updateError } = await supabase
      .from('journal')
      .update({ image_urls: updatedUrls })
      .eq('id', entryId)

    if (updateError) {
      console.error('❌ Failed to update entry:', updateError)
      return NextResponse.json({ error: 'Failed to update entry' }, { status: 500 })
    }

    console.log('✅ Successfully updated journal entry')

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('❌ Error updating processed URL:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

