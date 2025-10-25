// /src/app/api/journal/find-by-url/route.ts
// API endpoint to find journal entry by video URL

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { videoUrl } = body
    
    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Missing required field: videoUrl' },
        { status: 400 }
      )
    }

    console.log('🔍 Finding journal entry by video URL:', videoUrl)

    const supabase = await createClient()
    
    // Find journal entry that contains this video URL
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('*')
      .contains('image_urls', [videoUrl])

    if (error) {
      throw error
    }

    if (!entries || entries.length === 0) {
      return NextResponse.json({
        success: true,
        entry: null,
        message: 'No journal entry found with this video URL'
      })
    }

    const entry = entries[0] // Take the first match
    console.log('✅ Found journal entry:', entry.id)

    return NextResponse.json({
      success: true,
      entry: {
        id: entry.id,
        title: entry.title,
        image_urls: entry.image_urls,
        created_at: entry.created_at
      }
    })

  } catch (error) {
    console.error('❌ Failed to find journal entry:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Find failed',
        details: error
      },
      { status: 500 }
    )
  }
}
