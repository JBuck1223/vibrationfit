import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getHouseholdContext } from '@/lib/household/context'
import { buildExpeditionSequence } from '@/lib/life-explorer/sequence'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id')
  let query = supabase.from('le_expeditions').select('*').order('created_at', { ascending: false })
  if (studentId) query = query.eq('student_id', studentId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Journey-size stats per expedition for the master list: lessons,
  // uploads (lesson media + evidence), and the most recent activity date.
  const expeditions = data || []
  const ids = expeditions.map((e) => e.id)
  const lessonCounts: Record<string, { total: number; completed: number; last: string | null }> = {}
  const mediaCounts: Record<string, number> = {}
  const lessonsByExpedition: Record<
    string,
    Array<{
      id: string
      lesson_number: number
      title: string
      essential_question: string | null
      status: string
      planned_for: string | null
    }>
  > = {}
  if (ids.length > 0) {
    const { data: lessonRows } = await supabase
      .from('le_lessons')
      .select('id, expedition_id, status, planned_for, lesson_number, title, essential_question')
      .in('expedition_id', ids)
    const lessonToExpedition = new Map<string, string>()
    for (const row of lessonRows || []) {
      lessonToExpedition.set(row.id, row.expedition_id)
      const c = (lessonCounts[row.expedition_id] ||= { total: 0, completed: 0, last: null })
      c.total += 1
      if (row.status === 'completed') c.completed += 1
      if (!c.last || row.planned_for > c.last) c.last = row.planned_for
      ;(lessonsByExpedition[row.expedition_id] ||= []).push({
        id: row.id,
        lesson_number: row.lesson_number,
        title: row.title,
        essential_question: row.essential_question,
        status: row.status,
        planned_for: row.planned_for,
      })
    }

    const lessonIds = (lessonRows || []).map((l) => l.id)
    const [mediaRes, evidenceRes] = await Promise.all([
      lessonIds.length > 0
        ? supabase.from('le_lesson_media').select('lesson_id').in('lesson_id', lessonIds)
        : Promise.resolve({ data: [] as Array<{ lesson_id: string }> }),
      supabase.from('le_learning_evidence').select('expedition_id').in('expedition_id', ids),
    ])
    for (const row of mediaRes.data || []) {
      const expId = lessonToExpedition.get(row.lesson_id)
      if (expId) mediaCounts[expId] = (mediaCounts[expId] || 0) + 1
    }
    for (const row of evidenceRes.data || []) {
      if (row.expedition_id) mediaCounts[row.expedition_id] = (mediaCounts[row.expedition_id] || 0) + 1
    }
  }

  return NextResponse.json({
    expeditions: expeditions.map((e) => ({
      ...e,
      lessons_total: lessonCounts[e.id]?.total || 0,
      lessons_completed: lessonCounts[e.id]?.completed || 0,
      last_activity: lessonCounts[e.id]?.last || null,
      media_count: mediaCounts[e.id] || 0,
      sequence: buildExpeditionSequence({
        expeditionTitle: e.title,
        lessons: lessonsByExpedition[e.id] || [],
      }),
    })),
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  if (!body.student_id || !body.title) {
    return NextResponse.json({ error: 'student_id and title are required' }, { status: 400 })
  }

  const household = await getHouseholdContext(user.id)

  // Pause any currently active expedition for this student
  await supabase
    .from('le_expeditions')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('student_id', body.student_id)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('le_expeditions')
    .insert({
      student_id: body.student_id,
      created_by: user.id,
      household_id: household?.householdId || null,
      life_category: body.life_category || 'fun',
      title: body.title,
      why_this_matters: body.why_this_matters || null,
      status: 'active',
      start_date: body.start_date || new Date().toISOString().slice(0, 10),
      essential_questions: body.essential_questions || [],
      core_resources: body.core_resources || [],
      notes: body.notes || null,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ expedition: data })
}
