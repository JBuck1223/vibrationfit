import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')

  const supabase = createAdminClient()
  let query = supabase
    .from('cu_scheduled_posts')
    .select('*, cu_episodes(id, title, series_id, cu_series(id, title))')
    .order('scheduled_at')

  if (status) {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ posts: data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  const { episode_id, media_ids, platforms, title, caption, hashtags, link_url, call_to_action, scheduled_at } = body

  if (!episode_id || !scheduled_at) {
    return NextResponse.json({ error: 'episode_id and scheduled_at are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: maxOrder } = await supabase
    .from('cu_scheduled_posts')
    .select('sort_order')
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase
    .from('cu_scheduled_posts')
    .insert({
      episode_id,
      media_ids: media_ids || [],
      platforms: platforms || [],
      title: title || null,
      caption: caption || null,
      hashtags: hashtags || null,
      link_url: link_url || null,
      call_to_action: call_to_action || null,
      scheduled_at,
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data }, { status: 201 })
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const updates: Record<string, unknown> = {}
  const allowed = [
    'platforms', 'title', 'caption', 'hashtags', 'link_url',
    'call_to_action', 'scheduled_at', 'status', 'sort_order', 'media_ids',
  ]
  for (const key of allowed) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('cu_scheduled_posts')
    .update(updates)
    .eq('id', body.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ post: data })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const supabase = createAdminClient()
  const { error } = await supabase.from('cu_scheduled_posts').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
