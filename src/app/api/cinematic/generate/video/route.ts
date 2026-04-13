import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { generateClip } from '@/lib/cinematic/generate-clip'
import type { KeyframeWithMedia } from '@/lib/cinematic/types'

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { clip_id } = await request.json()
  if (!clip_id) {
    return NextResponse.json({ error: 'clip_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: clip, error: clipError } = await supabase
    .from('cu_clips')
    .select('*')
    .eq('id', clip_id)
    .single()

  if (clipError || !clip) {
    return NextResponse.json({ error: 'Clip not found' }, { status: 404 })
  }

  const { data: episode } = await supabase
    .from('cu_episodes')
    .select('target_aspect_ratio')
    .eq('id', clip.episode_id)
    .single()

  const [firstRes, lastRes] = await Promise.all([
    supabase
      .from('cu_keyframes')
      .select('*, generated_media:cu_media(*)')
      .eq('id', clip.first_frame_keyframe_id)
      .single(),
    supabase
      .from('cu_keyframes')
      .select('*, generated_media:cu_media(*)')
      .eq('id', clip.last_frame_keyframe_id)
      .single(),
  ])

  if (!firstRes.data || !lastRes.data) {
    return NextResponse.json({ error: 'Keyframes not found for this clip' }, { status: 404 })
  }

  const result = await generateClip(
    clip,
    firstRes.data as unknown as KeyframeWithMedia,
    lastRes.data as unknown as KeyframeWithMedia,
    episode?.target_aspect_ratio || 'landscape_16_9'
  )

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, media_id: result.mediaId, media_url: result.mediaUrl })
}
