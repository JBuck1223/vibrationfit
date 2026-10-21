import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
export async function GET() {
  const client = await createClient()
  const {
    data: { user },
  } = await client.auth.getUser()
  if (!user)
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [visions, songs, stories, batches] = await Promise.all([
    client
      .from('vision_versions')
      .select('id,title,is_draft,created_at')
      .eq('user_id', user.id)
      .is('household_id', null)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('songs')
      .select('id,title,status,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('stories')
      .select('id,title,status,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
    client
      .from('audio_generation_batches')
      .select('id,status,tracks_completed,total_tracks_expected,created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1),
  ])
  const items = [
    ...(visions.data ?? []).map((v) => ({
      id: v.id,
      title: v.title || 'Your Life Vision',
      kind: 'Life Vision',
      status: v.is_draft ? 'Draft' : 'Created',
      href: `/life-vision/${v.id}`,
      at: v.created_at,
    })),
    ...(songs.data ?? []).map((s) => ({
      id: s.id,
      title: s.title || 'Your song',
      kind: 'Song',
      status: s.status,
      href: `/audio/songwriter/${s.id}`,
      at: s.created_at,
    })),
    ...(stories.data ?? []).map((s) => ({
      id: s.id,
      title: s.title || 'Your story',
      kind: 'Story',
      status: s.status,
      href: `/story/${s.id}`,
      at: s.created_at,
    })),
    ...(batches.data ?? []).map((b) => ({
      id: b.id,
      title: 'Your audio build',
      kind: `${b.tracks_completed} of ${b.total_tracks_expected} tracks`,
      status: b.status,
      href: `/audio/queue/${b.id}`,
      at: b.created_at,
    })),
  ].sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
  return NextResponse.json(
    { items, partial: [visions, songs, stories, batches].some((r) => r.error) },
    { headers: { 'Cache-Control': 'private, no-store' } },
  )
}
