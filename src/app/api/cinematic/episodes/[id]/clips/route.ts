import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const supabase = createAdminClient()

  const { data, error } = await supabase
    .from('cu_clips')
    .select('*, generated_media:cu_media(*)')
    .eq('episode_id', id)
    .order('sort_order')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clips: data })
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { id } = await params
  const body = await req.json()
  const supabase = createAdminClient()

  const clips = Array.isArray(body) ? body : [body]
  const rows = clips.map((c: Record<string, unknown>, i: number) => ({
    episode_id: id,
    sort_order: c.sort_order ?? i,
    first_frame_keyframe_id: c.first_frame_keyframe_id,
    last_frame_keyframe_id: c.last_frame_keyframe_id,
    prompt: c.prompt ?? null,
    fal_model: c.fal_model ?? null,
    duration_seconds: c.duration_seconds ?? 6,
  }))

  const { data, error } = await supabase.from('cu_clips').insert(rows).select()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clips: data }, { status: 201 })
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await req.json()
  if (!body.clip_id) {
    return NextResponse.json({ error: 'clip_id is required' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {}
  const allowed = [
    'prompt', 'fal_model', 'duration_seconds', 'status',
    'first_frame_keyframe_id', 'last_frame_keyframe_id', 'sort_order',
  ]
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('cu_clips')
    .update(updates)
    .eq('id', body.clip_id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ clip: data })
}
