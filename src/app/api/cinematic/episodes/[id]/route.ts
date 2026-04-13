import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const [episodeRes, keyframesRes, clipsRes] = await Promise.all([
    supabase
      .from('cu_episodes')
      .select('*, cu_series(id, title, style_guide, tone)')
      .eq('id', id)
      .single(),
    supabase
      .from('cu_keyframes')
      .select('*, generated_media:cu_media(*)')
      .eq('episode_id', id)
      .order('sort_order'),
    supabase
      .from('cu_clips')
      .select(
        '*, generated_media:cu_media(*), first_frame_kf:cu_keyframes!cu_clips_first_frame_keyframe_id_fkey(id, sort_order, status, generated_media:cu_media(*)), last_frame_kf:cu_keyframes!cu_clips_last_frame_keyframe_id_fkey(id, sort_order, status, generated_media:cu_media(*))'
      )
      .eq('episode_id', id)
      .order('sort_order'),
  ])

  if (episodeRes.error) {
    return NextResponse.json({ error: episodeRes.error.message }, { status: 404 })
  }

  return NextResponse.json({
    episode: episodeRes.data,
    keyframes: keyframesRes.data ?? [],
    clips: clipsRes.data ?? [],
  })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  const updates: Record<string, unknown> = {}
  const allowed = [
    'title', 'concept', 'status', 'execution_plan', 'caption',
    'hashtags', 'call_to_action', 'final_video_url', 'target_aspect_ratio', 'sort_order',
  ]
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('cu_episodes')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episode: data })
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { error } = await supabase.from('cu_episodes').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
