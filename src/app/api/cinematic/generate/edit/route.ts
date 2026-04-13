import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { generateKeyframe } from '@/lib/cinematic/generate-keyframe'
import type { KeyframeWithMedia } from '@/lib/cinematic/types'

/**
 * Image edit route -- same pipeline as generate/image but forces
 * the keyframe to use an edit model with a reference image.
 */
export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { keyframe_id, reference_image_url } = await request.json()
  if (!keyframe_id) {
    return NextResponse.json({ error: 'keyframe_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Optionally update the reference image URL before generating
  if (reference_image_url) {
    await supabase
      .from('cu_keyframes')
      .update({ reference_image_url })
      .eq('id', keyframe_id)
  }

  const { data: keyframe, error: kfError } = await supabase
    .from('cu_keyframes')
    .select('*')
    .eq('id', keyframe_id)
    .single()

  if (kfError || !keyframe) {
    return NextResponse.json({ error: 'Keyframe not found' }, { status: 404 })
  }

  const { data: allKeyframes } = await supabase
    .from('cu_keyframes')
    .select('*, generated_media:cu_media(*)')
    .eq('episode_id', keyframe.episode_id)
    .order('sort_order')

  const result = await generateKeyframe(keyframe, (allKeyframes ?? []) as KeyframeWithMedia[])

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 })
  }

  return NextResponse.json({ success: true, media_id: result.mediaId, media_url: result.mediaUrl })
}
