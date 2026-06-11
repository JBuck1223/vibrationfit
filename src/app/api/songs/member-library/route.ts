/**
 * GET /api/songs/member-library
 *
 * Returns the current user's member library tracks (song_tracks where in_member_library = true).
 * Uses admin client to bypass PostgREST schema cache issues with new columns.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const adminDb = createAdminClient()

    const { data: tracks, error } = await adminDb
      .from('song_tracks')
      .select('id, title, version, mp3_url, cover_url, duration_ms, metadata, song_id')
      .eq('user_id', user.id)
      .eq('in_member_library', true)
      .not('mp3_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[MemberLibrary] Error:', error)
      return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
    }

    // Get song titles
    const songIds = [...new Set((tracks || []).map(t => t.song_id))]
    let songMap: Record<string, { title: string; lyrics: string | null }> = {}
    if (songIds.length > 0) {
      const { data: songs } = await adminDb
        .from('songs')
        .select('id, title, lyrics')
        .in('id', songIds)
      if (songs) {
        songMap = Object.fromEntries(songs.map(s => [s.id, { title: s.title, lyrics: s.lyrics }]))
      }
    }

    // Check which are published
    const mp3Urls = (tracks || []).map(t => t.mp3_url).filter(Boolean) as string[]
    let publishedUrls = new Set<string>()
    if (mp3Urls.length > 0) {
      const { data: published } = await adminDb
        .from('music_catalog')
        .select('preview_url')
        .in('preview_url', mp3Urls)
        .contains('tags', ['published'])
      if (published) {
        publishedUrls = new Set(published.map(p => p.preview_url).filter(Boolean) as string[])
      }
    }

    const result = (tracks || []).map(t => ({
      ...t,
      song_title: songMap[t.song_id]?.title || 'VIVA Song',
      song_lyrics: songMap[t.song_id]?.lyrics || null,
      is_published: publishedUrls.has(t.mp3_url!),
    }))

    return NextResponse.json({ tracks: result })
  } catch (err) {
    console.error('[MemberLibrary] Error:', err)
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}
