import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import { MATH_LADDER, READING_LADDER, WRITING_LADDER, ladderWeather } from '@/lib/life-explorer/ladders'
import { mixPlanForLadder, resolveSemester } from '@/lib/life-explorer/semester'
import { computeCoverage } from '@/lib/life-explorer/state-standards'
import { computeYearMap } from '@/lib/life-explorer/year-map'
import { computeReadiness, evaluationCountdown } from '@/lib/life-explorer/readiness'
import { lifeLearningWeather } from '@/lib/life-explorer/life-learning'
import { buildLedgerWeather } from '@/lib/life-explorer/ledger'
import { SKILL_CATALOG, catalogSkill } from '@/lib/life-explorer/skill-catalog'
import type { LeYearArc, SkillStatus } from '@/lib/life-explorer/types'

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

  const { data: yearArc } = await supabase
    .from('le_year_arcs')
    .select('*')
    .eq('student_id', ctx.student.id)
    .eq('status', 'active')
    .maybeSingle()

  const semester = resolveSemester(ctx.student.grade_level, yearArc as LeYearArc | null)
  const mathMix = mixPlanForLadder(MATH_LADDER, ctx.skills, ctx.student.grade_level, semester.semester)
  const readingMix = mixPlanForLadder(
    READING_LADDER,
    ctx.skills,
    ctx.student.grade_level,
    semester.semester
  )
  const math = ladderWeather(MATH_LADDER, ctx.skills, ctx.student.grade_level)
  const reading = ladderWeather(READING_LADDER, ctx.skills, ctx.student.grade_level)
  const writing = ladderWeather(WRITING_LADDER, ctx.skills, ctx.student.grade_level)

  // Whole school year of inputs: coverage windows itself to 30 days,
  // while the Year Map keeps Big Ideas met once genuinely met.
  const since = new Date(Date.now() - 300 * 86_400_000).toISOString()
  const [lessons, evidence, logs] = await Promise.all([
    supabase
      .from('le_lessons')
      .select('payload, created_at, status')
      .eq('student_id', ctx.student.id)
      .gte('created_at', since),
    supabase
      .from('le_learning_evidence')
      .select('academic_tags, created_at')
      .eq('student_id', ctx.student.id)
      .gte('created_at', since),
    supabase
      .from('le_activity_logs')
      .select('subjects, entry_date')
      .eq('student_id', ctx.student.id)
      .gte('entry_date', since.slice(0, 10)),
  ])

  const coverage = computeCoverage({
    lessons: (lessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })

  const yearMap = computeYearMap({
    lessons: (lessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })

  const ledger = buildLedgerWeather({
    stateCode: ctx.student.state_code,
    gradeLevel: ctx.student.grade_level,
    yearArc: yearArc as LeYearArc | null,
    skills: ctx.skills,
    coverage,
  })

  const weekAgo = new Date()
  weekAgo.setDate(weekAgo.getDate() - 7)

  const { data: weekRecords } = await supabase
    .from('le_lesson_records')
    .select('*')
    .eq('student_id', ctx.student.id)
    .gte('created_at', weekAgo.toISOString())

  const strongest =
    ctx.highInterestWonders[0]?.statement || ctx.wonderWall.wonder[0]?.statement || null

  return NextResponse.json({
    summary: {
      student_name: ctx.student.name,
      expedition_title: ctx.expedition?.title || null,
      why_this_matters: ctx.expedition?.why_this_matters || null,
      lessons_this_week: (weekRecords || []).length,
      strongest_interest: strongest,
      skills: ctx.skills,
      semester,
      math,
      reading,
      writing,
      math_mix: mathMix,
      reading_mix: readingMix,
      life_learning: lifeLearningWeather(ctx.skills),
      strong: [...math, ...reading, ...writing].filter((r) => r.band === 'strong'),
      wobbly: [...math, ...reading, ...writing].filter((r) => r.band === 'wobbly'),
    },
    ledger,
    readiness: computeReadiness(ctx.skills, yearMap, ctx.student.grade_level),
    evaluation: evaluationCountdown(ctx.student.notice_of_intent_date),
    catalog: SKILL_CATALOG.map((skill) => {
      const row = ctx.skills.find((s) => s.skill === skill.key)
      return {
        ...skill,
        status: row?.status || null,
        last_observed: row?.last_observed || null,
        notes: row?.notes || null,
      }
    }),
  })
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const key = typeof body.key === 'string' ? body.key : ''
  const status = body.status as SkillStatus
  if (!key || !['secure', 'needs_support', 'developing'].includes(status)) {
    return NextResponse.json({ error: 'key and a valid status are required' }, { status: 400 })
  }

  const ctx = await loadActiveContext(supabase, body.student_id)
  if (!ctx) return NextResponse.json({ error: 'No active student' }, { status: 404 })

  const def = catalogSkill(key)
  const { error } = await supabase.from('le_skill_progress').upsert(
    {
      student_id: ctx.student.id,
      created_by: user.id,
      household_id: ctx.student.household_id,
      skill: key,
      subject: def?.subject || 'general',
      status,
      last_observed: new Date().toISOString().slice(0, 10),
      notes: typeof body.notes === 'string' && body.notes.trim() ? body.notes.trim() : undefined,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,skill,subject' }
  )
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, key, status })
}
