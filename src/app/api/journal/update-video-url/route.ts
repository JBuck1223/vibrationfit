// /src/app/api/journal/update-video-url/route.ts
// API endpoint to update journal entry video URLs

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { originalUrl, processedUrl, entryId } = body
    
    if (!originalUrl || !processedUrl || !entryId) {
      return NextResponse.json(
        { error: 'Missing required fields: originalUrl, processedUrl, entryId' },
        { status: 400 }
      )
    }

    console.log('🔄 Updating journal entry video URL:', {
      entryId,
      originalUrl,
      processedUrl
    })

    const supabase = await createClient()
    
    // Get the current journal entry
    const { data: entry, error: fetchError } = await supabase
      .from('journal_entries')
      .select('image_urls')
      .eq('id', entryId)
      .single()

    if (fetchError || !entry) {
      return NextResponse.json(
        { error: 'Journal entry not found' },
        { status: 404 }
      )
    }

    // Update the image_urls array to replace the original URL with processed URL
    const updatedImageUrls = entry.image_urls.map((url: string) => 
      url === originalUrl ? processedUrl : url
    )

    // Update the journal entry
    const { data: updatedEntry, error: updateError } = await supabase
      .from('journal_entries')
      .update({ 
        image_urls: updatedImageUrls,
        updated_at: new Date().toISOString()
      })
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      throw updateError
    }

    console.log('✅ Journal entry updated successfully')

    return NextResponse.json({
      success: true,
      entryId,
      originalUrl,
      processedUrl,
      updatedImageUrls,
      updatedAt: updatedEntry.updated_at
    })

  } catch (error) {
    console.error('❌ Failed to update journal entry:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Update failed',
        details: error
      },
      { status: 500 }
    )
  }
}
