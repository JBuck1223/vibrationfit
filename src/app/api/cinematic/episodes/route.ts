import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import type { CreateEpisodeInput } from '@/lib/cinematic/types'

export async function GET(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const { searchParams } = new URL(request.url)
  const seriesId = searchParams.get('series_id')

  const supabase = createAdminClient()
  let query = supabase
    .from('cu_episodes')
    .select('*, cu_series(id, title), cu_keyframes(count), cu_clips(count)')
    .order('sort_order')

  if (seriesId) {
    query = query.eq('series_id', seriesId)
  }

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episodes: data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const body: CreateEpisodeInput = await request.json()
  if (!body.series_id || !body.title?.trim()) {
    return NextResponse.json({ error: 'series_id and title are required' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: maxOrder } = await supabase
    .from('cu_episodes')
    .select('sort_order')
    .eq('series_id', body.series_id)
    .order('sort_order', { ascending: false })
    .limit(1)
    .single()

  const { data, error } = await supabase
    .from('cu_episodes')
    .insert({
      series_id: body.series_id,
      title: body.title.trim(),
      concept: body.concept ?? null,
      target_aspect_ratio: body.target_aspect_ratio ?? 'landscape_16_9',
      sort_order: (maxOrder?.sort_order ?? -1) + 1,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ episode: data }, { status: 201 })
}
