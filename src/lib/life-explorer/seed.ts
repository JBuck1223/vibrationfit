import type { SupabaseClient } from '@supabase/supabase-js'
import { getHouseholdContext } from '@/lib/household/context'
import { antarcticaCoreResourcesPayload } from './antarctica-resources'
import { generateDailyLesson, materializePackLessons } from './generate'
import { composeWeekStart, weekDaysFromPack } from './packs/antarctica'
import { OCEANS_PACK, OCEANS_WHY } from './packs/oceans'
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
        // No canned life_i_choose: the vision comes from the profile flow
        // (parent intake -> VIVA draft -> child edits).
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
        why_this_matters:
          'You want to be an explorer who asks why the world is the way it is. Antarctica is a real place where explorers go to find out — this is that life, not a Travel unit.',
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
          'Expedition 1 of this life — our pack, not a third-party curriculum. Printables generate live at /api/life-explorer/print/*. Ocean Adventures remains a finished static unit.',
      })
      .select('*')
      .single()
    if (error || !data) throw new Error(error?.message || 'Failed to create expedition')
    expedition = data

    // The Wonder Wall starts EMPTY on purpose. Day 1's lesson seeds it from
    // the child's own words (Know/Wonder sticky notes) — never from canned
    // statements. The pack's likely_wonders are parent conversation prompts
    // only, surfaced inside lesson 1, not inserted as data.
    created = true
  }

  // Keep pack resources and why-this-matters current when re-seeding
  if (expedition) {
    const why =
      (expedition as LeExpedition).why_this_matters ||
      'You want to be an explorer who asks why the world is the way it is. Antarctica is a real place where explorers go to find out — this is that life, not a Travel unit.'
    await supabase
      .from('le_expeditions')
      .update({
        core_resources: antarcticaCoreResourcesPayload(),
        why_this_matters: why,
        notes:
          'Expedition 1 of this life — our pack, not a third-party curriculum. Printables generate live at /api/life-explorer/print/*. Ocean Adventures remains a finished static unit.',
        updated_at: new Date().toISOString(),
      })
      .eq('id', expedition.id)
    expedition = {
      ...expedition,
      core_resources: antarcticaCoreResourcesPayload(),
      why_this_matters: why,
    }
  }

  const { count: mapCount } = await supabase
    .from('le_world_map_items')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student.id)

  if (!mapCount) {
    const starters = [
      {
        cluster: 'places',
        name: 'The bottom of the globe',
        taste_looks_like: 'Spin a globe until you find the ice at the bottom.',
      },
      {
        cluster: 'earth',
        name: 'Ice you can hold',
        taste_looks_like: 'A bowl of ice. How long can a hand stay in?',
      },
      {
        cluster: 'living',
        name: 'Penguins at the ice',
        taste_looks_like: 'How a body stays warm where the air is colder than ice water.',
      },
      {
        cluster: 'water',
        name: 'Frozen ocean',
        taste_looks_like: 'Water that turns to ice — and ice that is a desert.',
      },
      {
        cluster: 'people',
        name: 'Explorers who go anyway',
        taste_looks_like: 'People who learn a place before they ever stand on it.',
      },
    ]
    await supabase.from('le_world_map_items').insert(
      starters.map((item, i) => ({
        student_id: student.id,
        created_by: userId,
        household_id: householdId || student.household_id,
        cluster: item.cluster,
        name: item.name,
        taste_looks_like: item.taste_looks_like,
        status: 'unvisited',
        sort_order: i,
      }))
    )
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

/**
 * Pause Antarctica (or any active expedition) and start Ocean Explorers
 * with the authored 5-day pack on the coming Monday.
 */
export async function startOliverOceans(
  supabase: SupabaseClient,
  userId: string,
  options?: { generateLesson?: boolean }
): Promise<{
  student: LeStudent
  expedition: LeExpedition
  lesson: LeLesson | null
  week_start: string
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

  if (!existing) throw new Error('Oliver is not in Life Explorer yet — seed Antarctica first, or add the student.')
  const student = existing as LeStudent

  await supabase
    .from('le_expeditions')
    .update({ status: 'paused', updated_at: new Date().toISOString() })
    .eq('student_id', student.id)
    .eq('status', 'active')

  const { data: expedition, error } = await supabase
    .from('le_expeditions')
    .insert({
      student_id: student.id,
      created_by: userId,
      household_id: householdId || student.household_id,
      life_category: 'travel',
      title: OCEANS_PACK.title,
      why_this_matters: OCEANS_WHY,
      status: 'active',
      start_date: new Date().toISOString().slice(0, 10),
      essential_questions: OCEANS_PACK.essential_questions,
      core_resources: OCEANS_PACK.resources,
      notes:
        'Ocean Explorers week 1 — authored pack that beats TGTB Math 1 and Language Arts 1 lessons 1–5, plus science and history. TGTB is a tool, not the spine.',
    })
    .select('*')
    .single()

  if (error || !expedition) throw new Error(error?.message || 'Failed to start Ocean Explorers')

  const weekStart = composeWeekStart()
  const days = weekDaysFromPack(OCEANS_PACK, weekStart)

  await supabase.from('le_week_arcs').upsert(
    {
      student_id: student.id,
      created_by: userId,
      household_id: householdId || student.household_id,
      week_start: weekStart,
      days,
      materials: {
        plan_ahead: OCEANS_PACK.materials.plan_ahead,
        pantry: OCEANS_PACK.materials.pantry,
      },
      status: 'ready',
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'student_id,week_start' }
  )

  const oceanMap = [
    {
      cluster: 'living' as const,
      name: 'The water’s edge',
      taste_looks_like: 'A shell, a rock, a crab — which is alive?',
    },
    {
      cluster: 'water' as const,
      name: 'The Gulf from home',
      taste_looks_like: 'Finger on the map, then west into the Gulf.',
    },
    {
      cluster: 'people' as const,
      name: 'Boats then and now',
      taste_looks_like: 'A stick boat vs a motor boat in a tub.',
    },
    {
      cluster: 'places' as const,
      name: 'Home port',
      taste_looks_like: 'Our house, Florida, the Gulf, the Atlantic.',
    },
  ]

  const { count: atlanticCount } = await supabase
    .from('le_world_map_items')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .ilike('name', '%Atlantic%')

  const { count: gulfCount } = await supabase
    .from('le_world_map_items')
    .select('id', { count: 'exact', head: true })
    .eq('student_id', student.id)
    .ilike('name', '%Gulf from home%')

  if (!atlanticCount && !gulfCount) {
    const { count: existingCount } = await supabase
      .from('le_world_map_items')
      .select('id', { count: 'exact', head: true })
      .eq('student_id', student.id)
    const start = existingCount || 0
    await supabase.from('le_world_map_items').insert(
      oceanMap.map((item, i) => ({
        student_id: student.id,
        created_by: userId,
        household_id: householdId || student.household_id,
        cluster: item.cluster,
        name: item.name,
        taste_looks_like: item.taste_looks_like,
        status: 'unvisited',
        sort_order: start + i,
      }))
    )
  }

  let lesson: LeLesson | null = null
  if (options?.generateLesson !== false) {
    const week = await materializePackLessons(supabase, userId, student.id)
    lesson = week[0] || null
  }

  return {
    student,
    expedition: expedition as LeExpedition,
    lesson,
    week_start: weekStart,
  }
}
