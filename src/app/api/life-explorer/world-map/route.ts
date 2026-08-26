import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { parseJsonObject, vivaComplete } from '@/lib/life-explorer/viva-complete'
import { profileSummaryForPrompt } from '@/lib/life-explorer/life-profile'
import {
  WORLD_MAP_DRAFT_SYSTEM_PROMPT,
  buildWorldMapDraftPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'
import type { WorldCluster } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id') || undefined
  const student = await getActiveStudent(supabase, studentId)
  if (!student) return NextResponse.json({ student: null, items: [] })

  const { data, error } = await supabase
    .from('le_world_map_items')
    .select('*')
    .eq('student_id', student.id)
    .order('cluster', { ascending: true })
    .order('sort_order', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ student, items: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  if (body.action === 'draft') {
    const { data: existing } = await supabase
      .from('le_world_map_items')
      .select('cluster, name')
      .eq('student_id', student.id)

    const { data: profile } = await supabase
      .from('le_student_profiles')
      .select('*')
      .eq('student_id', student.id)
      .maybeSingle()

    const { text } = await vivaComplete({
      supabase,
      userId: user.id,
      system: WORLD_MAP_DRAFT_SYSTEM_PROMPT,
      user: buildWorldMapDraftPrompt({
        studentName: student.name,
        gradeLevel: student.grade_level,
        lifeIChoose: student.life_i_choose || null,
        profileSummary: profileSummaryForPrompt(profile),
        parentWorldsDump: body.parent_worlds_dump || '',
        existing: existing || [],
      }),
      actionType: 'life_explorer_compose',
      metadata: { kind: 'world_map', student_id: student.id },
    })

    const parsed = parseJsonObject<{
      items: Array<{ cluster: WorldCluster; name: string; taste_looks_like: string }>
    }>(text)

    const rows = (parsed.items || []).map((item, i) => ({
      student_id: student.id,
      created_by: user.id,
      household_id: student.household_id,
      cluster: item.cluster,
      name: item.name,
      taste_looks_like: item.taste_looks_like || null,
      status: 'unvisited',
      sort_order: i,
    }))

    if (rows.length > 0) {
      const { error } = await supabase.from('le_world_map_items').insert(rows)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const { data: items } = await supabase
      .from('le_world_map_items')
      .select('*')
      .eq('student_id', student.id)
      .order('sort_order', { ascending: true })

    return NextResponse.json({ student, items: items || [], drafted: rows.length })
  }

  if (!body.cluster || !body.name) {
    return NextResponse.json({ error: 'cluster and name required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('le_world_map_items')
    .insert({
      student_id: student.id,
      created_by: user.id,
      household_id: student.household_id,
      cluster: body.cluster,
      name: body.name,
      taste_looks_like: body.taste_looks_like || null,
      status: body.status || 'unvisited',
      sort_order: body.sort_order ?? 0,
      notes: body.notes || null,
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

  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() }
  for (const key of ['name', 'taste_looks_like', 'status', 'notes', 'cluster', 'sort_order'] as const) {
    if (body[key] !== undefined) patch[key] = body[key]
  }

  const { data, error } = await supabase
    .from('le_world_map_items')
    .update(patch)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ item: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('le_world_map_items').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
