import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { materializePackLessons } from '@/lib/life-explorer/generate'
import { buildExpeditionSequence } from '@/lib/life-explorer/sequence'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id') || undefined
  let ctx = await loadActiveContext(supabase, studentId)

  if (!ctx) {
    return NextResponse.json({
      student: null,
      expedition: null,
      lesson: null,
      wonder_wall: { know: [], wonder: [], learned: [] },
      needs_seed: true,
    })
  }

  if (ctx.expedition) {
    try {
      await materializePackLessons(supabase, user.id, ctx.student.id)
      ctx = (await loadActiveContext(supabase, studentId)) || ctx
    } catch (err) {
      console.error('le materialize pack', err)
    }
  }

  // Story so far — every lesson of the expedition as chapters (titles, not
  // day numbers). The client derives the next-step spotlight from these.
  let chapters: Array<{
    id: string
    title: string
    essential_question: string | null
    lesson_number: number
    planned_for: string
    status: string
  }> = []
  if (ctx.expedition) {
    const { data } = await supabase
      .from('le_lessons')
      .select('id, title, essential_question, lesson_number, planned_for, status')
      .eq('expedition_id', ctx.expedition.id)
      .order('lesson_number', { ascending: true })
    chapters = data || []
  }

  const today = new Date().toISOString().slice(0, 10)
  const { data: todayLogs } = await supabase
    .from('le_activity_logs')
    .select('id')
    .eq('student_id', ctx.student.id)
    .eq('entry_date', today)
    .limit(1)

  return NextResponse.json({
    student: ctx.student,
    expedition: ctx.expedition,
    lesson: ctx.readyLesson,
    wonder_wall: ctx.wonderWall,
    latest_record: ctx.latestRecord,
    skills: ctx.skills,
    chapters,
    sequence: ctx.expedition
      ? buildExpeditionSequence({
          expeditionTitle: ctx.expedition.title,
          lessons: chapters.map((c) => ({
            id: c.id,
            lesson_number: c.lesson_number,
            title: c.title,
            essential_question: c.essential_question,
            status: c.status,
            planned_for: c.planned_for,
          })),
        })
      : null,
    activity_logged_today: (todayLogs?.length || 0) > 0,
    needs_seed: !ctx.expedition,
  })
}
