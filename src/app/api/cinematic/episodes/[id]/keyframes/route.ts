import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cu_keyframes')
    .select('*, generated_media:cu_media(*)')
    .eq('episode_id', id)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keyframes: data })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  const keyframes = Array.isArray(body) ? body : [body]
  const rows = keyframes.map((kf: Record<string, unknown>, i: number) => ({
    episode_id: id,
    sort_order: kf.sort_order ?? i,
    description: kf.description ?? '',
    prompt: kf.prompt ?? null,
    negative_prompt: kf.negative_prompt ?? null,
    fal_model: kf.fal_model ?? null,
    target_size: kf.target_size ?? 'landscape_16_9',
    character_ids: kf.character_ids ?? [],
    style_reference_keyframe_id: kf.style_reference_keyframe_id ?? null,
    reference_image_url: kf.reference_image_url ?? null,
  }))

  const { data, error } = await supabase.from('cu_keyframes').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keyframes: data }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  if (!body.keyframe_id) {
    return NextResponse.json({ error: 'keyframe_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // Revert to a previous version
  if (body.revert_to_media_id) {
    const { data: kf } = await supabase
      .from('cu_keyframes')
      .select('generated_media_id, generation_metadata')
      .eq('id', body.keyframe_id)
      .single()

    if (!kf) return NextResponse.json({ error: 'Keyframe not found' }, { status: 404 })

    const meta = (kf.generation_metadata as Record<string, unknown>) || {}
    const prevVersions = (meta.previous_versions as Array<Record<string, unknown>>) || []

    const targetIdx = prevVersions.findIndex(
      (v: Record<string, unknown>) => v.media_id === body.revert_to_media_id
    )
    if (targetIdx === -1) {
      return NextResponse.json({ error: 'Version not found in history' }, { status: 404 })
    }

    // Move current version into history and remove the target from the list
    const currentMediaId = kf.generated_media_id
    const target = prevVersions[targetIdx]
    const updatedVersions = prevVersions.filter((_: unknown, i: number) => i !== targetIdx)

    if (currentMediaId && currentMediaId !== body.revert_to_media_id) {
      const { data: currentMedia } = await supabase
        .from('cu_media')
        .select('id, url, fal_model, fal_request_id, created_at')
        .eq('id', currentMediaId)
        .single()

      if (currentMedia) {
        updatedVersions.push({
          media_id: currentMedia.id,
          media_url: currentMedia.url,
          fal_model: currentMedia.fal_model,
          fal_request_id: currentMedia.fal_request_id,
          generated_at: currentMedia.created_at,
        })
      }
    }

    const { data, error } = await supabase
      .from('cu_keyframes')
      .update({
        generated_media_id: body.revert_to_media_id,
        status: 'complete',
        generation_metadata: {
          ...meta,
          previous_versions: updatedVersions.length > 0 ? updatedVersions : undefined,
          reverted_at: new Date().toISOString(),
          reverted_from: currentMediaId,
          fal_request_id: target.fal_request_id,
        },
      })
      .eq('id', body.keyframe_id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ keyframe: data })
  }

  // Standard field updates
  const updates: Record<string, unknown> = {}
  const allowed = [
    'description', 'prompt', 'negative_prompt', 'fal_model', 'target_size',
    'character_ids', 'style_reference_keyframe_id', 'reference_image_url',
    'status', 'sort_order',
  ]
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('cu_keyframes')
    .update(updates)
    .eq('id', body.keyframe_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ keyframe: data })
}
