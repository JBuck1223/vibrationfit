import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { JourneyFeedItem } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'

// GET /api/life-explorer/feed?student_id=…&expedition_id=…&category=…
// The Journey Feed: every photo/video/artifact of the year, newest first.
// Merged from learning evidence + activity-log media. Capture once, reuse
// everywhere (feed, portfolio, evaluation binder, keepsake).
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const params = request.nextUrl.searchParams
  let studentId = params.get('student_id')
  const expeditionFilter = params.get('expedition_id')
  const categoryFilter = params.get('category')

  if (!studentId) {
    const { data: student } = await supabase
      .from('le_students')
      .select('id')
      .eq('active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle()
    studentId = student?.id || null
  }
  if (!studentId) return NextResponse.json({ items: [], expeditions: [] })

  const [expeditions, evidence, activityMedia, lessons] = await Promise.all([
    supabase
      .from('le_expeditions')
      .select('id, title, life_category')
      .eq('student_id', studentId),
    supabase
      .from('le_learning_evidence')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
    supabase
      .from('le_activity_media')
      .select('*, activity_log:le_activity_logs(id, title, entry_date, expedition_id)')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false }),
    supabase.from('le_lessons').select('id, title').eq('student_id', studentId),
  ])

  const expeditionById = new Map(
    (expeditions.data || []).map((e) => [e.id, e])
  )
  const lessonById = new Map((lessons.data || []).map((l) => [l.id, l]))

  const items: JourneyFeedItem[] = []

  for (const ev of evidence.data || []) {
    const exp = ev.expedition_id ? expeditionById.get(ev.expedition_id) : null
    items.push({
      id: `ev-${ev.id}`,
      kind: 'evidence',
      date: ev.created_at,
      title: ev.title,
      media_url: ev.photo_url || ev.file_url || null,
      media_type: ev.photo_url ? 'photo' : ev.file_url ? 'file' : null,
      student_explanation: ev.student_explanation,
      expedition_id: ev.expedition_id,
      expedition_title: exp?.title || null,
      life_category: exp?.life_category || null,
      lesson_title: ev.lesson_id ? lessonById.get(ev.lesson_id)?.title || null : null,
      academic_tags: ev.academic_tags || [],
    })
  }

  for (const m of activityMedia.data || []) {
    const log = m.activity_log as { id: string; title: string; entry_date: string; expedition_id: string | null } | null
    const exp = log?.expedition_id ? expeditionById.get(log.expedition_id) : null
    items.push({
      id: `am-${m.id}`,
      kind: 'activity_media',
      date: log?.entry_date ? `${log.entry_date}T12:00:00Z` : m.created_at,
      title: m.caption || log?.title || 'Learning moment',
      media_url: m.url,
      media_type: m.media_type,
      student_explanation: null,
      expedition_id: log?.expedition_id || null,
      expedition_title: exp?.title || null,
      life_category: exp?.life_category || null,
      lesson_title: null,
      academic_tags: [],
    })
  }

  let filtered = items
  if (expeditionFilter) filtered = filtered.filter((i) => i.expedition_id === expeditionFilter)
  if (categoryFilter) filtered = filtered.filter((i) => i.life_category === categoryFilter)

  filtered.sort((a, b) => b.date.localeCompare(a.date))

  return NextResponse.json({
    items: filtered,
    expeditions: expeditions.data || [],
  })
}
