import type { SupabaseClient } from '@supabase/supabase-js'
import { getHouseholdContext } from '@/lib/household/context'
import { antarcticaCoreResourcesPayload } from './antarctica-resources'
import { generateDailyLesson } from './generate'
import type { LeExpedition, LeLesson, LeStudent } from './types'

export async function seedOliverAntarctica(
  supabase: SupabaseClient,
  userId: string,
  options?: { generateLesson?: boolean }
): Promise<{
  student: LeStudent
  expedition: LeExpedition
  lesson: LeLesson | null
  created: boolean
}> {
  const household = await getHouseholdContext(userId)
  const householdId = household?.householdId || null

  const { data: existing } = await supabase
    .from('le_students')
    .select('*')
    .eq('active', true)
    .ilike('name', 'Oliver')
    .limit(1)
    .maybeSingle()

  let student = existing as LeStudent | null
  let created = false

  if (!student) {
    const { data, error } = await supabase
      .from('le_students')
      .insert({
        created_by: userId,
        household_id: householdId,
        name: 'Oliver',
        grade_level: '1',
        current_age: 7,
        interests: ['animals', 'oceans', 'building', 'asking why'],
        strengths: ['curiosity', 'oral language', 'hands-on exploring'],
        skills_needing_support: ['writing complete sentences', 'addition facts'],
        active: true,
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message || 'Failed to create student')
    student = data as LeStudent
    created = true
  }

  let { data: expedition } = await supabase
    .from('le_expeditions')
    .select('*')
    .eq('student_id', student.id)
    .eq('status', 'active')
    .maybeSingle()

  if (!expedition) {
    const { data, error } = await supabase
      .from('le_expeditions')
      .insert({
        student_id: student.id,
        created_by: userId,
        household_id: householdId || student.household_id,
        life_category: 'travel',
        title: 'Antarctica',
        status: 'active',
        start_date: new Date().toISOString().slice(0, 10),
        essential_questions: [
          "How do explorers learn about places they've never been?",
          'Where is Antarctica and what makes it unique?',
          'How do penguins survive freezing temperatures?',
          "Why don't penguins freeze?",
        ],
        core_resources: antarcticaCoreResourcesPayload(),
        notes:
          'First Life Explorer expedition — PDF pack in public/homeschool/life-explorer/antarctica/. Ocean Adventures remains a finished static unit.',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message || 'Failed to create expedition')
    expedition = data

    const wonderSeeds = [
      { kind: 'know', statement: 'Penguins live there.', interest_level: null, status: 'unexplored' },
      { kind: 'know', statement: 'It is really cold.', interest_level: null, status: 'unexplored' },
      {
        kind: 'wonder',
        statement: "Why don't penguins freeze?",
        interest_level: 5,
        status: 'unexplored',
      },
      {
        kind: 'wonder',
        statement: 'Is there ice everywhere?',
        interest_level: 4,
        status: 'unexplored',
      },
      {
        kind: 'wonder',
        statement: 'Can people live in Antarctica?',
        interest_level: 3,
        status: 'unexplored',
      },
    ]

    await supabase.from('le_wonder_items').insert(
      wonderSeeds.map((w) => ({
        expedition_id: expedition!.id,
        created_by: userId,
        household_id: householdId || student!.household_id,
        kind: w.kind,
        statement: w.statement,
        interest_level: w.interest_level,
        status: w.status,
        source: 'student',
        original_language: true,
        recorded_at: new Date().toISOString().slice(0, 10),
      }))
    )
    created = true
  }

  // Keep core_resources current when re-seeding an existing expedition
  if (expedition) {
    await supabase
      .from('le_expeditions')
      .update({
        core_resources: antarcticaCoreResourcesPayload(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', expedition.id)
    expedition = {
      ...expedition,
      core_resources: antarcticaCoreResourcesPayload(),
    }
  }

  let lesson: LeLesson | null = null
  if (options?.generateLesson !== false) {
    lesson = await generateDailyLesson(supabase, userId, student.id)
  }

  return {
    student,
    expedition: expedition as LeExpedition,
    lesson,
    created,
  }
}
