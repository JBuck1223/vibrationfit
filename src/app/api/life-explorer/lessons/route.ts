import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'

export const dynamic = 'force-dynamic'

/**
 * Lesson Log — every lesson of the (active) expedition in order, with the
 * record stats the parent sees at a glance: date, start/end time, time spent,
 * checklist progress, and how many documents/notes/links live in the bucket.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let expeditionId = request.nextUrl.searchParams.get('expedition_id')
  let expedition = null

  if (!expeditionId) {
    const ctx = await loadActiveContext(
      supabase,
      request.nextUrl.searchParams.get('student_id') || undefined
    )
    if (!ctx?.expedition) {
      return NextResponse.json({ expedition: null, lessons: [] })
    }
    expedition = ctx.expedition
    expeditionId = ctx.expedition.id
  } else {
    const { data } = await supabase
      .from('le_expeditions')
      .select('*')
      .eq('id', expeditionId)
      .single()
    expedition = data
  }

  const { data: lessons, error } = await supabase
    .from('le_lessons')
    .select(
      'id, lesson_number, title, essential_question, status, estimated_total_minutes, planned_for, started_at, completed_at, created_at'
    )
    .eq('expedition_id', expeditionId)
    .order('lesson_number', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const lessonIds = (lessons || []).map((l) => l.id)
  const counts: Record<
    string,
    { items_total: number; items_done: number; media: number; notes: number; links: number }
  > = {}
  for (const lid of lessonIds) {
    counts[lid] = { items_total: 0, items_done: 0, media: 0, notes: 0, links: 0 }
  }

  if (lessonIds.length > 0) {
    const [itemsRes, mediaRes, notesRes, linksRes] = await Promise.all([
      supabase
        .from('le_lesson_items')
        .select('lesson_id, is_complete')
        .in('lesson_id', lessonIds),
      supabase.from('le_lesson_media').select('lesson_id').in('lesson_id', lessonIds),
      supabase.from('le_lesson_notes').select('lesson_id').in('lesson_id', lessonIds),
      supabase.from('le_lesson_links').select('lesson_id').in('lesson_id', lessonIds),
    ])
    for (const row of itemsRes.data || []) {
      const c = counts[row.lesson_id]
      if (!c) continue
      c.items_total += 1
      if (row.is_complete) c.items_done += 1
    }
    for (const row of mediaRes.data || []) {
      if (counts[row.lesson_id]) counts[row.lesson_id].media += 1
    }
    for (const row of notesRes.data || []) {
      if (counts[row.lesson_id]) counts[row.lesson_id].notes += 1
    }
    for (const row of linksRes.data || []) {
      if (counts[row.lesson_id]) counts[row.lesson_id].links += 1
    }
  }

  return NextResponse.json({
    expedition,
    lessons: (lessons || []).map((l) => ({ ...l, ...counts[l.id] })),
  })
}
