import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getWonderWall } from '@/lib/life-explorer/context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const expeditionId = request.nextUrl.searchParams.get('expedition_id')
  if (!expeditionId) {
    return NextResponse.json({ error: 'expedition_id required' }, { status: 400 })
  }

  const wall = await getWonderWall(supabase, expeditionId)
  return NextResponse.json({ wonder_wall: wall })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.expedition_id || !body.kind || !body.statement) {
    return NextResponse.json(
      { error: 'expedition_id, kind, and statement are required' },
      { status: 400 }
    )
  }

  const { data: expedition } = await supabase
    .from('le_expeditions')
    .select('household_id')
    .eq('id', body.expedition_id)
    .single()

  const { data, error } = await supabase
    .from('le_wonder_items')
    .insert({
      expedition_id: body.expedition_id,
      created_by: user.id,
      household_id: expedition?.household_id || null,
      kind: body.kind,
      statement: body.statement,
      interest_level: body.interest_level ?? (body.kind === 'wonder' ? 3 : null),
      status: body.status || (body.kind === 'learned' ? 'answered' : 'unexplored'),
      source: body.source || 'parent',
      original_language: body.original_language !== false,
      recorded_at: new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['statement', 'interest_level', 'status', 'kind']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('le_wonder_items')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}
