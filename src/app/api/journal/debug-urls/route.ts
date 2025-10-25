// /src/app/api/journal/debug-urls/route.ts
// Debug API to check what URLs are stored in journal entries

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debugging journal entry URLs...')

    const supabase = await createClient()
    
    // Get all journal entries with their image_urls
    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, title, image_urls, created_at')
      .order('created_at', { ascending: false })
      .limit(10)

    if (error) {
      throw error
    }

    console.log('📊 Found journal entries:', entries?.length || 0)

    return NextResponse.json({
      success: true,
      entries: entries?.map(entry => ({
        id: entry.id,
        title: entry.title,
        image_urls: entry.image_urls,
        image_count: entry.image_urls?.length || 0,
        created_at: entry.created_at
      })) || []
    })

  } catch (error) {
    console.error('❌ Failed to debug journal entries:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Debug failed',
        details: error
      },
      { status: 500 }
    )
  }
}
