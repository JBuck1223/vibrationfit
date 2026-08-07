import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  ActiveContext,
  LeExpedition,
  LeLesson,
  LeLessonRecord,
  LeSkillProgress,
  LeStudent,
  LeWonderItem,
} from './types'

export async function getActiveStudent(
  supabase: SupabaseClient,
  studentId?: string
): Promise<LeStudent | null> {
  let query = supabase.from('le_students').select('*').eq('active', true)
  if (studentId) {
    query = query.eq('id', studentId)
  } else {
    query = query.order('created_at', { ascending: true }).limit(1)
  }
  const { data, error } = await query.maybeSingle()
  if (error) {
    console.error('le getActiveStudent', error)
    return null
  }
  return data as LeStudent | null
}

export async function getActiveExpedition(
  supabase: SupabaseClient,
  studentId: string
): Promise<LeExpedition | null> {
  const { data, error } = await supabase
    .from('le_expeditions')
    .select('*')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) {
    console.error('le getActiveExpedition', error)
    return null
  }
  return data as LeExpedition | null
}

export async function getWonderWall(
  supabase: SupabaseClient,
  expeditionId: string
): Promise<{ know: LeWonderItem[]; wonder: LeWonderItem[]; learned: LeWonderItem[] }> {
  const { data, error } = await supabase
    .from('le_wonder_items')
    .select('*')
    .eq('expedition_id', expeditionId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('le getWonderWall', error)
    return { know: [], wonder: [], learned: [] }
  }

  const items = (data || []) as LeWonderItem[]
  return {
    know: items.filter((i) => i.kind === 'know'),
    wonder: items.filter((i) => i.kind === 'wonder'),
    learned: items.filter((i) => i.kind === 'learned'),
  }
}

export async function loadActiveContext(
  supabase: SupabaseClient,
  studentId?: string
): Promise<ActiveContext | null> {
  const student = await getActiveStudent(supabase, studentId)
  if (!student) return null

  const expedition = await getActiveExpedition(supabase, student.id)
  if (!expedition) {
    return {
      student,
      expedition: null,
      wonderWall: { know: [], wonder: [], learned: [] },
      latestRecord: null,
      readyLesson: null,
      skills: [],
      highInterestWonders: [],
    }
  }

  const wonderWall = await getWonderWall(supabase, expedition.id)

  const { data: latestRecord } = await supabase
    .from('le_lesson_records')
    .select('*')
    .eq('student_id', student.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: readyLesson } = await supabase
    .from('le_lessons')
    .select('*')
    .eq('student_id', student.id)
    .eq('expedition_id', expedition.id)
    .in('status', ['ready', 'in_progress'])
    .order('lesson_number', { ascending: false })
    .limit(1)
    .maybeSingle()

  const { data: skills } = await supabase
    .from('le_skill_progress')
    .select('*')
    .eq('student_id', student.id)
    .order('updated_at', { ascending: false })

  const highInterestWonders = wonderWall.wonder
    .filter((w) => w.status !== 'answered')
    .sort((a, b) => (b.interest_level ?? 0) - (a.interest_level ?? 0))

  return {
    student,
    expedition,
    wonderWall,
    latestRecord: (latestRecord as LeLessonRecord) || null,
    readyLesson: (readyLesson as LeLesson) || null,
    skills: (skills as LeSkillProgress[]) || [],
    highInterestWonders,
  }
}

export async function nextLessonNumber(
  supabase: SupabaseClient,
  expeditionId: string
): Promise<number> {
  const { data } = await supabase
    .from('le_lessons')
    .select('lesson_number')
    .eq('expedition_id', expeditionId)
    .order('lesson_number', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data?.lesson_number ?? 0) + 1
}
