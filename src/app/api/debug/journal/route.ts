// /src/app/api/debug/journal/route.ts
// Debug API to check journal entry data

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { data: entries, error } = await supabase
      .from('journal_entries')
      .select('id, title, image_urls, audio_recordings, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      entries: entries?.map(entry => ({
        id: entry.id,
        title: entry.title,
        image_urls: entry.image_urls,
        audio_recordings: entry.audio_recordings,
        created_at: entry.created_at,
        image_count: entry.image_urls?.length || 0,
        audio_count: entry.audio_recordings?.length || 0
      }))
    })
  } catch (error) {
    console.error('Debug API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
