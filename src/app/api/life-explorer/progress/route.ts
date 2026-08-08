import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const studentId = request.nextUrl.searchParams.get('student_id') || undefined
  const ctx = await loadActiveContext(supabase, studentId)
  if (!ctx) {
    return NextResponse.json({ summary: null })
  }

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)
  const weekIso = weekAgo.toISOString()

  const { data: weekRecords } = await supabase
    .from('le_lesson_records')
    .select('*')
    .eq('student_id', ctx.student.id)
    .gte('created_at', weekIso)

  const { count: wonderCount } = await supabase
    .from('le_wonder_items')
    .select('*', { count: 'exact', head: true })
    .eq('kind', 'wonder')
    .eq(
      'expedition_id',
      ctx.expedition?.id || '00000000-0000-0000-0000-000000000000'
    )

  const { data: evidence } = await supabase
    .from('le_learning_evidence')
    .select('type')
    .eq('student_id', ctx.student.id)
    .gte('created_at', weekIso)

  const strongest =
    ctx.highInterestWonders[0]?.statement ||
    ctx.wonderWall.wonder[0]?.statement ||
    null

  const readingPracticed = (weekRecords || []).filter((r) =>
    (r.skills_observed || []).some((s: string) => /read/i.test(s))
  ).length

  const writingObserved = (weekRecords || []).filter((r) =>
    (r.skills_observed || []).some((s: string) => /writ/i.test(s))
  ).length

  const mathPracticed = (weekRecords || []).filter((r) =>
    (r.skills_observed || []).some((s: string) => /math|add|count/i.test(s))
  ).length

  return NextResponse.json({
    summary: {
      student_name: ctx.student.name,
      expedition_title: ctx.expedition?.title || null,
      life_category: ctx.expedition?.life_category || null,
      lessons_this_week: (weekRecords || []).length,
      reading_practiced: readingPracticed,
      writing_observed: writingObserved,
      math_practiced: mathPracticed,
      research_questions: wonderCount || ctx.wonderWall.wonder.length,
      evidence_this_week: (evidence || []).length,
      strongest_interest: strongest,
      skills: ctx.skills,
    },
  })
}
