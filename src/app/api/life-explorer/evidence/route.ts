import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id')
  const type = request.nextUrl.searchParams.get('type')
  const expeditionId = request.nextUrl.searchParams.get('expedition_id')
  const titlePrefix = request.nextUrl.searchParams.get('title_prefix')

  let query = supabase
    .from('le_learning_evidence')
    .select('*')
    .order('captured_on', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false })

  if (studentId) query = query.eq('student_id', studentId)
  if (type) query = query.eq('type', type)
  if (expeditionId) query = query.eq('expedition_id', expeditionId)
  if (titlePrefix) query = query.ilike('title', `${titlePrefix}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data || [] })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id || !body.title) {
    return NextResponse.json({ error: 'student_id and title required' }, { status: 400 })
  }

  const { data: student } = await supabase
    .from('le_students')
    .select('household_id')
    .eq('id', body.student_id)
    .single()

  const { data, error } = await supabase
    .from('le_learning_evidence')
    .insert({
      student_id: body.student_id,
      expedition_id: body.expedition_id || null,
      lesson_id: body.lesson_id || null,
      created_by: user.id,
      household_id: student?.household_id || null,
      type: body.type || 'other',
      title: body.title,
      file_url: body.file_url || null,
      photo_url: body.photo_url || null,
      student_explanation: body.student_explanation || null,
      parent_observation: body.parent_observation || null,
      academic_tags: body.academic_tags || [],
      captured_on: body.captured_on || new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data })
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
  for (const key of ['captured_on', 'title', 'student_explanation', 'parent_observation']) {
    if (body[key] !== undefined) updates[key] = body[key]
  }

  const { data, error } = await supabase
    .from('le_learning_evidence')
    .update(updates)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ evidence: data })
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = request.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { error } = await supabase.from('le_learning_evidence').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
