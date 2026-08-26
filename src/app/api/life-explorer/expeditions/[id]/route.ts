import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type {
  LeActivityLog,
  LeBook,
  LeLearningEvidence,
  LeLessonMedia,
  LeLessonRecord,
  LeWonderItem,
  LessonPayload,
} from '@/lib/life-explorer/types'
import { buildExpeditionSequence } from '@/lib/life-explorer/sequence'
import { materializePackLessons } from '@/lib/life-explorer/generate'

export const dynamic = 'force-dynamic'

export interface GalleryItem {
  id: string
  url: string
  media_type: 'photo' | 'video' | 'file'
  caption: string | null
  /** The child's own words, when the item came from check-in evidence. */
  explanation: string | null
  file_name: string | null
  source: 'lesson' | 'evidence' | 'calendar'
  lesson_id: string | null
  lesson_title: string | null
  date: string
}

/**
 * The full record of one expedition in one round trip: chapters merged with
 * their check-ins, the Wonder Wall, every upload from every lesson rolled up
 * into a single gallery, storybooks, logged days, and totals.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await params
  const { data: expedition, error } = await supabase
    .from('le_expeditions')
    .select('*')
    .eq('id', id)
    .single()
  if (error || !expedition) {
    return NextResponse.json({ error: error?.message || 'Expedition not found' }, { status: 404 })
  }

  if (expedition.status === 'active') {
    try {
      await materializePackLessons(supabase, user.id, expedition.student_id)
    } catch (err) {
      console.error('le materialize pack', err)
    }
  }

  const [lessonsRes, recordsRes, wondersRes, evidenceRes, booksRes, daysRes] = await Promise.all([
    supabase
      .from('le_lessons')
      .select(
        'id, lesson_number, title, essential_question, status, estimated_total_minutes, planned_for, started_at, completed_at, payload'
      )
      .eq('expedition_id', id)
      .order('lesson_number', { ascending: true }),
    supabase.from('le_lesson_records').select('*').eq('expedition_id', id),
    supabase
      .from('le_wonder_items')
      .select('*')
      .eq('expedition_id', id)
      .order('recorded_at', { ascending: true }),
    supabase
      .from('le_learning_evidence')
      .select('*')
      .eq('expedition_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('le_books')
      .select('id, title, premise, status, cover_url, page_count, reading_mode, created_at')
      .eq('expedition_id', id)
      .order('created_at', { ascending: false }),
    supabase
      .from('le_activity_logs')
      .select('*, media:le_activity_media(*)')
      .eq('expedition_id', id)
      .order('entry_date', { ascending: false }),
  ])

  const lessons = lessonsRes.data || []
  const lessonIds = lessons.map((l) => l.id)
  const lessonTitles = new Map(lessons.map((l) => [l.id, l.title as string]))

  // Uploads made on the lessons themselves (journal + checklist attachments).
  let lessonMedia: LeLessonMedia[] = []
  if (lessonIds.length > 0) {
    const { data } = await supabase
      .from('le_lesson_media')
      .select('*')
      .in('lesson_id', lessonIds)
      .order('created_at', { ascending: false })
    lessonMedia = (data || []) as LeLessonMedia[]
  }

  // Chapters: lesson + its check-in record + story extracts from the payload.
  const recordByLesson = new Map(
    ((recordsRes.data || []) as LeLessonRecord[]).map((r) => [r.lesson_id, r])
  )
  const mediaByLesson = new Map<string, LeLessonMedia[]>()
  for (const m of lessonMedia) {
    const list = mediaByLesson.get(m.lesson_id) || []
    list.push(m)
    mediaByLesson.set(m.lesson_id, list)
  }

  const chapters = lessons.map((l) => {
    const payload = (l.payload || null) as LessonPayload | null
    const record = recordByLesson.get(l.id) || null
    return {
      id: l.id,
      lesson_number: l.lesson_number,
      title: l.title,
      essential_question: l.essential_question,
      status: l.status,
      planned_for: l.planned_for,
      started_at: l.started_at,
      completed_at: l.completed_at,
      estimated_total_minutes: l.estimated_total_minutes,
      story_mission: payload?.fun_contract?.story_mission || null,
      celebration_close: payload?.fun_contract?.celebration_close || null,
      child_output: payload?.child_output?.description || null,
      check_in: record
        ? {
            enjoyed_most: record.enjoyed_most,
            created_said_demonstrated: record.created_said_demonstrated,
            easy_or_difficult: record.easy_or_difficult,
            new_questions: record.new_questions,
            direction: record.direction,
          }
        : null,
      media: (mediaByLesson.get(l.id) || []).map((m) => ({
        id: m.id,
        url: m.url,
        media_type: m.media_type,
        caption: m.caption,
      })),
    }
  })

  // Wonder Wall, split by kind.
  const wonders = (wondersRes.data || []) as LeWonderItem[]
  const wonderWall = {
    know: wonders.filter((w) => w.kind === 'know'),
    wonder: wonders.filter((w) => w.kind === 'wonder'),
    learned: wonders.filter((w) => w.kind === 'learned'),
  }

  // Unified gallery: lesson uploads + check-in evidence + calendar photos.
  const evidence = (evidenceRes.data || []) as LeLearningEvidence[]
  const days = (daysRes.data || []) as LeActivityLog[]
  const gallery: GalleryItem[] = []

  for (const m of lessonMedia) {
    gallery.push({
      id: `lesson-${m.id}`,
      url: m.url,
      media_type: m.media_type,
      caption: m.caption,
      explanation: null,
      file_name: m.file_name,
      source: 'lesson',
      lesson_id: m.lesson_id,
      lesson_title: lessonTitles.get(m.lesson_id) || null,
      date: m.created_at,
    })
  }
  for (const e of evidence) {
    const url = e.photo_url || e.file_url
    if (!url) continue
    gallery.push({
      id: `evidence-${e.id}`,
      url,
      media_type: e.photo_url ? 'photo' : 'file',
      caption: e.title,
      explanation: e.student_explanation,
      file_name: null,
      source: 'evidence',
      lesson_id: e.lesson_id,
      lesson_title: e.lesson_id ? lessonTitles.get(e.lesson_id) || null : null,
      date: e.created_at,
    })
  }
  for (const d of days) {
    for (const m of d.media || []) {
      gallery.push({
        id: `calendar-${m.id}`,
        url: m.url,
        media_type: m.media_type,
        caption: m.caption || d.title,
        explanation: null,
        file_name: null,
        source: 'calendar',
        lesson_id: null,
        lesson_title: null,
        date: d.entry_date,
      })
    }
  }
  gallery.sort((a, b) => (b.date || '').localeCompare(a.date || ''))

  const minutes = lessons.reduce((sum, l) => {
    if (l.started_at && l.completed_at) {
      return sum + Math.round((+new Date(l.completed_at) - +new Date(l.started_at)) / 60000)
    }
    return sum
  }, 0)

  return NextResponse.json({
    expedition,
    sequence: buildExpeditionSequence({
      expeditionTitle: expedition.title,
      lessons: lessons.map((l) => ({
        id: l.id,
        lesson_number: l.lesson_number,
        title: l.title,
        essential_question: l.essential_question,
        status: l.status,
        planned_for: l.planned_for,
      })),
    }),
    chapters,
    wonder_wall: wonderWall,
    gallery,
    books: (booksRes.data || []) as Partial<LeBook>[],
    days: days.map((d) => ({
      id: d.id,
      entry_date: d.entry_date,
      title: d.title,
      duration_minutes: d.duration_minutes,
      reading_materials: d.reading_materials,
      subjects: d.subjects,
    })),
    totals: {
      chapters_total: chapters.length,
      chapters_completed: chapters.filter((c) => c.status === 'completed').length,
      minutes,
      wonders_total: wonderWall.wonder.length,
      wonders_answered: wonderWall.wonder.filter((w) => w.status === 'answered').length,
      gallery_items: gallery.length,
      days_logged: days.length,
    },
  })
}
