import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const uid = user.id

    const [
      visionsRes,
      audioRes,
      boardRes,
      journalRes,
      vibePostsRes,
      abundanceRes,
      focusRes,
    ] = await Promise.all([
      supabase
        .from('vision_versions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('is_active', true),
      supabase
        .from('audio_tracks')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid),
      supabase
        .from('vision_board_items')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('status', 'active'),
      supabase
        .from('journal_entries')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid),
      supabase
        .from('vibe_posts')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('is_deleted', false),
      supabase
        .from('abundance_events')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid),
      supabase
        .from('vision_focus')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', uid)
        .eq('status', 'completed'),
    ])

    return NextResponse.json({
      visions: visionsRes.count ?? 0,
      audioTracks: audioRes.count ?? 0,
      boardImages: boardRes.count ?? 0,
      journalEntries: journalRes.count ?? 0,
      vibePosts: vibePostsRes.count ?? 0,
      abundanceEvents: abundanceRes.count ?? 0,
      focusStories: focusRes.count ?? 0,
    })
  } catch (error) {
    console.error('Asset counts error:', error)
    return NextResponse.json({ error: 'Failed to fetch asset counts' }, { status: 500 })
  }
}
