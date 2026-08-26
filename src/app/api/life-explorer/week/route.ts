import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { loadActiveContext } from '@/lib/life-explorer/context'
import {
  MATH_LADDER,
  READING_LADDER,
  WRITING_LADDER,
  currentLadderPosition,
  ladderWeather,
} from '@/lib/life-explorer/ladders'
import { weeklyLifeLearningFocus } from '@/lib/life-explorer/life-learning'
import { mixPlanForLadder, resolveSemester } from '@/lib/life-explorer/semester'
import { parseJsonObject, vivaComplete } from '@/lib/life-explorer/viva-complete'
import { composeWeekStart, packForExpedition, weekDaysFromPack } from '@/lib/life-explorer/packs/antarctica'
import {
  WEEK_ARC_DRAFT_SYSTEM_PROMPT,
  buildWeekArcDraftPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'
import type { LeWeekArc, LeYearArc, LessonPayload, WeekArcDay } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 90

function mondayOf(date = new Date()): string {
  const d = new Date(date)
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return d.toISOString().slice(0, 10)
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const ctx = await loadActiveContext(
    supabase,
    request.nextUrl.searchParams.get('student_id') || undefined
  )
  if (!ctx) return NextResponse.json({ student: null, week: null })

  const weekStart = request.nextUrl.searchParams.get('week_start') || mondayOf()
  const { data: week } = await supabase
    .from('le_week_arcs')
    .select('*')
    .eq('student_id', ctx.student.id)
    .eq('week_start', weekStart)
    .maybeSingle()

  return NextResponse.json({
    student: ctx.student,
    expedition: ctx.expedition,
    week: week || null,
    week_start: weekStart,
  })
}

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const ctx = await loadActiveContext(supabase, body.student_id)
  if (!ctx?.student) return NextResponse.json({ error: 'No active student' }, { status: 400 })
  if (!ctx.expedition) {
    return NextResponse.json({ error: 'Start an expedition before composing a week' }, { status: 400 })
  }

  const weekStart: string = body.week_start || composeWeekStart()
  const pack = packForExpedition(ctx.expedition.title)
  if (pack && pack.fallback_lessons.length >= 5) {
    const { data, error } = await supabase
      .from('le_week_arcs')
      .upsert(
        {
          student_id: ctx.student.id,
          created_by: user.id,
          household_id: ctx.student.household_id,
          week_start: weekStart,
          days: weekDaysFromPack(pack, weekStart),
          materials: {
            plan_ahead: pack.materials.plan_ahead,
            pantry: pack.materials.pantry,
          },
          status: 'ready',
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,week_start' }
      )
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ week: data, from_pack: true })
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

  const [{ data: mapItems }, { data: recent }] = await Promise.all([
    supabase
      .from('le_world_map_items')
      .select('cluster, name, status')
      .eq('student_id', ctx.student.id),
    supabase
      .from('le_lessons')
      .select('title, payload')
      .eq('expedition_id', ctx.expedition.id)
      .order('lesson_number', { ascending: false })
      .limit(10),
  ])

  const recentLessons = (recent || []).map((l) => {
    const p = l.payload as LessonPayload
    return {
      title: l.title as string,
      hook: p?.fun_contract?.hook,
      mission: p?.fun_contract?.story_mission,
      artifact: p?.fun_contract?.artifact,
    }
  })

  const wobblyNotes = [
    ...ladderWeather(MATH_LADDER, ctx.skills, ctx.student.grade_level),
    ...ladderWeather(READING_LADDER, ctx.skills, ctx.student.grade_level),
    ...ladderWeather(WRITING_LADDER, ctx.skills, ctx.student.grade_level),
  ]
    .filter((r) => r.band === 'wobbly')
    .map((r) => `${r.rung.label} (${r.status})`)

  const { text } = await vivaComplete({
    supabase,
    userId: user.id,
    system: WEEK_ARC_DRAFT_SYSTEM_PROMPT,
    user: buildWeekArcDraftPrompt({
      studentName: ctx.student.name,
      gradeLevel: ctx.student.grade_level,
      lifeIChoose: ctx.student.life_i_choose || null,
      whyThisMatters: ctx.expedition.why_this_matters || null,
      expeditionTitle: ctx.expedition.title,
      weekStart,
      semesterAim: semester.aim,
      mixMath: mathMix.mix_next_grade,
      mixReading: readingMix.mix_next_grade,
      mathRung: {
        key: mathMix.position.current_rung.key,
        label: mathMix.position.current_rung.label,
      },
      readingRung: {
        key: readingMix.position.current_rung.key,
        label: readingMix.position.current_rung.label,
      },
      writingRung: {
        key: currentLadderPosition(WRITING_LADDER, ctx.skills, ctx.student.grade_level).current_rung.key,
        label: currentLadderPosition(WRITING_LADDER, ctx.skills, ctx.student.grade_level).current_rung.label,
      },
      lifeLearningFocus: (() => {
        const f = weeklyLifeLearningFocus(ctx.skills, new Date(`${weekStart}T12:00:00`))
        return { name: f.resource.name, rungLabel: f.rung.label }
      })(),
      mathMixRung: mathMix.mix_rung
        ? { key: mathMix.mix_rung.key, label: mathMix.mix_rung.label }
        : null,
      readingMixRung: readingMix.mix_rung
        ? { key: readingMix.mix_rung.key, label: readingMix.mix_rung.label }
        : null,
      mapTastes: mapItems || [],
      recentLessons,
      wobblyNotes,
    }),
    actionType: 'life_explorer_compose',
    maxTokens: 4000,
    metadata: { kind: 'week_arc', student_id: ctx.student.id, week_start: weekStart },
  })

  const parsed = parseJsonObject<{ days: WeekArcDay[]; materials: LeWeekArc['materials'] }>(text)

  const { data, error } = await supabase
    .from('le_week_arcs')
    .upsert(
      {
        student_id: ctx.student.id,
        created_by: user.id,
        household_id: ctx.student.household_id,
        week_start: weekStart,
        days: parsed.days || [],
        materials: parsed.materials || {},
        status: 'ready',
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,week_start' }
    )
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ week: data, semester })
}
