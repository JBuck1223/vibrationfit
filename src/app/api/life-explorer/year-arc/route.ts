import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { defaultSemesterWindows, resolveSemester } from '@/lib/life-explorer/semester'
import { parseJsonObject, vivaComplete } from '@/lib/life-explorer/viva-complete'
import { profileSummaryForPrompt } from '@/lib/life-explorer/life-profile'
import {
  YEAR_ARC_DRAFT_SYSTEM_PROMPT,
  buildYearArcDraftPrompt,
} from '@/lib/viva/prompts/life-explorer-compose'
import type { LeYearArc, YearArcMonth } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const student = await getActiveStudent(supabase, request.nextUrl.searchParams.get('student_id') || undefined)
  if (!student) return NextResponse.json({ student: null, arc: null, semester: null })

  const { data: arc } = await supabase
    .from('le_year_arcs')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .maybeSingle()

  return NextResponse.json({
    student,
    arc: arc || null,
    semester: resolveSemester(student.grade_level, arc as LeYearArc | null),
  })
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

  const windows = defaultSemesterWindows()
  const { data: mapItems } = await supabase
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
    system: YEAR_ARC_DRAFT_SYSTEM_PROMPT,
    user: buildYearArcDraftPrompt({
      studentName: student.name,
      gradeLevel: student.grade_level,
      lifeIChoose: student.life_i_choose || null,
      profileSummary: profileSummaryForPrompt(profile),
      schoolYear: windows.school_year,
      mapItems: mapItems || [],
      parentWorldsDump: body.parent_worlds_dump || '',
    }),
    actionType: 'life_explorer_compose',
    metadata: { kind: 'year_arc', student_id: student.id },
  })

  const parsed = parseJsonObject<{ months: YearArcMonth[] }>(text)

  await supabase
    .from('le_year_arcs')
    .update({ status: 'archived', updated_at: new Date().toISOString() })
    .eq('student_id', student.id)
    .eq('status', 'active')

  const { data, error } = await supabase
    .from('le_year_arcs')
    .insert({
      student_id: student.id,
      created_by: user.id,
      household_id: student.household_id,
      school_year: windows.school_year,
      semester_1_start: windows.semester_1_start,
      semester_1_end: windows.semester_1_end,
      semester_2_start: windows.semester_2_start,
      semester_2_end: windows.semester_2_end,
      months: parsed.months || [],
      parent_worlds_dump: body.parent_worlds_dump || null,
      status: 'active',
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({
    arc: data,
    semester: resolveSemester(student.grade_level, data as LeYearArc),
  })
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
  if (body.months) patch.months = body.months
  if (typeof body.parent_worlds_dump === 'string') patch.parent_worlds_dump = body.parent_worlds_dump
  if (body.status) patch.status = body.status

  const { data, error } = await supabase
    .from('le_year_arcs')
    .update(patch)
    .eq('id', body.id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ arc: data })
}
