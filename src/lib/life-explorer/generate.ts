import { after } from 'next/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { loadActiveContext, nextLessonNumber } from './context'
import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt } from './prompts'
import { MATH_LADDER, READING_LADDER, WRITING_LADDER } from './ladders'
import { mixPlanForLadder, resolveSemester } from './semester'
import { dueFlashbackItems, FLASHBACK_GAMES } from './flashback'
import { computeCoverage, coverageSteer } from './state-standards'
import { computeYearMap, yearMapSteer } from './year-map'
import { weeklyLifeLearningFocus } from './life-learning'
import { compassSlice } from './vf-kids'
import { addDaysIso, composeWeekStart, packForExpedition } from './packs/antarctica'
import { seedLessonItems } from './lesson-items'
import { ensureExpeditionBook } from './expedition-book'
import type {
  ActiveContext,
  LeLesson,
  LeYearArc,
  LeWeekArc,
  LessonPayload,
  WeekArcDay,
} from './types'

function parseJsonObject(text: string): LessonPayload {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  let parsed: unknown
  try {
    parsed = JSON.parse(cleaned)
  } catch {
    // Model may wrap JSON in prose — extract the outermost object.
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('Lesson response contained no JSON')
    parsed = JSON.parse(match[0])
  }
  const payload = parsed as LessonPayload
  if (!payload?.identity?.lesson_title) {
    throw new Error('Lesson payload missing identity.lesson_title')
  }
  return payload
}

/** Fun Contract + facilitation guarantees validation. Empty list = passes. */
export function lessonContractViolations(payload: LessonPayload): string[] {
  const violations: string[] = []
  const fc = payload.fun_contract
  if (!fc) violations.push('missing fun_contract')
  else {
    for (const beat of [
      'hook',
      'story_mission',
      'embodiment',
      'artifact',
      'choice_point',
      'celebration_close',
    ] as const) {
      if (!fc[beat]?.trim()) violations.push(`fun_contract.${beat} empty`)
    }
    if (/today we will learn/i.test(fc.hook || '')) {
      violations.push('hook reads like a school packet ("today we will learn")')
    }
  }
  if (!payload.low_battery_mode?.steps?.length) violations.push('missing low_battery_mode')
  if (!payload.parent_answer_key?.unknown_script) violations.push('missing parent_answer_key')
  if (!payload.sibling_tag_along?.length) violations.push('missing sibling_tag_along')
  if (!payload.block_minutes?.length) violations.push('missing block_minutes')
  if ((payload.parent_prep?.prep_minutes ?? 99) > 10) {
    violations.push('parent prep exceeds 10 minutes')
  }

  // No invented URLs: every URL must be http(s) — hallucinated placeholders
  // like "example.com" or empty strings are rejected.
  const allResources = [
    payload.core_resource,
    ...(payload.parent_prep?.links || []),
    ...(payload.resource_queue || []),
  ]
  for (const r of allResources) {
    if (r?.url && !/^https?:\/\/|^\//.test(r.url)) {
      violations.push(`suspicious resource URL: ${r.url}`)
    }
  }
  return violations
}

async function loadSteers(
  supabase: SupabaseClient,
  studentId: string
): Promise<{ coverage: string[]; yearMap: string[] }> {
  // Whole school year of inputs: coverage applies its own 30-day window,
  // while Year Map Big Ideas stay met once genuinely met.
  const since = new Date(Date.now() - 300 * 86_400_000).toISOString()
  const [lessons, evidence, logs] = await Promise.all([
    supabase
      .from('le_lessons')
      .select('payload, created_at, status')
      .eq('student_id', studentId)
      .gte('created_at', since),
    supabase
      .from('le_learning_evidence')
      .select('academic_tags, created_at')
      .eq('student_id', studentId)
      .gte('created_at', since),
    supabase
      .from('le_activity_logs')
      .select('subjects, entry_date')
      .eq('student_id', studentId)
      .gte('entry_date', since.slice(0, 10)),
  ])
  const inputs = {
    lessons: (lessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  }
  return {
    coverage: coverageSteer(computeCoverage(inputs)),
    yearMap: yearMapSteer(computeYearMap(inputs)),
  }
}

async function loadComposerExtras(
  supabase: SupabaseClient,
  studentId: string,
  expeditionId: string
): Promise<{
  yearArc: LeYearArc | null
  weekDay: WeekArcDay | null
  mapHits: Array<{ cluster: string; name: string; status: string }>
  recentLessons: Array<{ title: string; hook?: string; mission?: string; artifact?: string }>
  forecastMaterials: string[]
}> {
  const today = new Date().toISOString().slice(0, 10)
  const [arcRes, weekRes, mapRes, lessonsRes] = await Promise.all([
    supabase
      .from('le_year_arcs')
      .select('*')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .maybeSingle(),
    supabase
      .from('le_week_arcs')
      .select('*')
      .eq('student_id', studentId)
      .lte('week_start', today)
      .order('week_start', { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from('le_world_map_items')
      .select('cluster, name, status')
      .eq('student_id', studentId)
      .order('sort_order', { ascending: true }),
    supabase
      .from('le_lessons')
      .select('title, payload')
      .eq('expedition_id', expeditionId)
      .order('lesson_number', { ascending: false })
      .limit(8),
  ])

  const week = weekRes.data as LeWeekArc | null
  const weekDay =
    week?.days?.find((d) => d.date === today) ||
    null

  const recentLessons = (lessonsRes.data || []).map((l) => {
    const p = l.payload as LessonPayload
    return {
      title: l.title as string,
      hook: p?.fun_contract?.hook,
      mission: p?.fun_contract?.story_mission,
      artifact: p?.fun_contract?.artifact,
    }
  })

  const forecastMaterials = [
    ...((week?.materials?.plan_ahead as string[]) || []),
    ...((week?.materials?.pantry as string[]) || []),
  ]

  return {
    yearArc: (arcRes.data as LeYearArc | null) || null,
    weekDay,
    mapHits: (mapRes.data || []) as Array<{ cluster: string; name: string; status: string }>,
    recentLessons,
    forecastMaterials,
  }
}

/** Pull a complete pre-built lesson from the Expedition Pack. */
function fallbackFromPack(ctx: ActiveContext, lessonNumber: number): LessonPayload | null {
  if (!ctx.expedition) return null
  const pack = packForExpedition(ctx.expedition.title)
  if (!pack || pack.fallback_lessons.length === 0) return null
  const idx = Math.min(lessonNumber - 1, pack.fallback_lessons.length - 1)
  const payload = JSON.parse(JSON.stringify(pack.fallback_lessons[idx])) as LessonPayload
  payload.identity.lesson_number = lessonNumber
  return payload
}

export async function generateDailyLesson(
  supabase: SupabaseClient,
  userId: string,
  studentId?: string
): Promise<LeLesson> {
  const ctx = await loadActiveContext(supabase, studentId)
  if (!ctx?.student) throw new Error('No active student')
  if (!ctx.expedition) throw new Error('No active expedition')

  if (ctx.readyLesson) {
    return ctx.readyLesson
  }

  const lessonNumber = await nextLessonNumber(supabase, ctx.expedition.id)
  const latest = ctx.latestRecord
  const latestSummary = latest
    ? `Status ${latest.status}; enjoyed: ${latest.enjoyed_most || 'n/a'}; created: ${latest.created_said_demonstrated || 'n/a'}; easy/hard: ${latest.easy_or_difficult || 'n/a'}; questions: ${(latest.new_questions || []).join('; ')}; direction: ${latest.direction || 'continue'}`
    : null

  const extras = await loadComposerExtras(supabase, ctx.student.id, ctx.expedition.id)
  const semester = resolveSemester(ctx.student.grade_level, extras.yearArc)
  const mathMix = mixPlanForLadder(MATH_LADDER, ctx.skills, ctx.student.grade_level, semester.semester)
  const readingMix = mixPlanForLadder(
    READING_LADDER,
    ctx.skills,
    ctx.student.grade_level,
    semester.semester
  )
  const writingMix = mixPlanForLadder(
    WRITING_LADDER,
    ctx.skills,
    ctx.student.grade_level,
    semester.semester
  )
  // One foundational domain per lesson, rotating — never all three in a day.
  const foundationalFocus = (['math', 'reading', 'writing'] as const)[lessonNumber % 3]
  const llFocus = weeklyLifeLearningFocus(ctx.skills)
  const flashbackItems = dueFlashbackItems(ctx.wonderWall.learned)
  const flashbackGame = FLASHBACK_GAMES[lessonNumber % FLASHBACK_GAMES.length]
  const steers = await loadSteers(supabase, ctx.student.id)
  const pack = packForExpedition(ctx.expedition.title)

  // Authored pack days are the proving path — do not wait on a VIVA draft.
  if (pack && lessonNumber <= pack.fallback_lessons.length) {
    const payload = fallbackFromPack(ctx, lessonNumber)!
    payload.flashback = { game: flashbackGame, items: flashbackItems }
    return insertGeneratedLesson(supabase, ctx, userId, lessonNumber, payload)
  }

  const userPrompt = buildLessonUserPrompt({
    studentName: ctx.student.name,
    gradeLevel: ctx.student.grade_level,
    age: ctx.student.current_age,
    interests: ctx.student.interests || [],
    strengths: ctx.student.strengths || [],
    skillsNeedingSupport: ctx.student.skills_needing_support || [],
    lifeIChoose: ctx.student.life_i_choose || null,
    whyThisMatters: ctx.expedition.why_this_matters || null,
    lifeCategory: ctx.expedition.life_category,
    expeditionTitle: ctx.expedition.title,
    essentialQuestions: ctx.expedition.essential_questions || [],
    worldMapHits: extras.mapHits,
    semesterAim: semester.aim,
    mathMix: mathMix.mix_rung,
    readingMix: readingMix.mix_rung,
    recentLessons: extras.recentLessons,
    weekDay: extras.weekDay
      ? {
          why: extras.weekDay.why,
          world_taste: extras.weekDay.world_taste,
          story_chapter: extras.weekDay.story_chapter,
          hook_seed: extras.weekDay.hook_seed,
          mission_seed: extras.weekDay.mission_seed,
          artifact_seed: extras.weekDay.artifact_seed,
        }
      : null,
    know: ctx.wonderWall.know.map((k) => k.statement),
    wonder: ctx.highInterestWonders.map((w) => ({
      statement: w.statement,
      interest_level: w.interest_level,
      status: w.status,
    })),
    learned: ctx.wonderWall.learned.map((l) => l.statement),
    upNextQueue: ctx.highInterestWonders
      .filter((w) => w.priority != null)
      .map((w) => w.statement),
    steerDirection: ctx.expedition.steer?.direction || null,
    latestRecordSummary: latestSummary,
    recommendedNextAction: latest?.recommended_next_action || null,
    lessonNumber,
    mathRung: mathMix.position.current_rung,
    readingRung: readingMix.position.current_rung,
    writingRung: writingMix.position.current_rung,
    writingMix: writingMix.mix_rung,
    foundationalFocus,
    lifeLearningFocus: {
      name: llFocus.resource.name,
      job: llFocus.resource.job,
      rungLabel: llFocus.rung.label,
      masteryCheck: llFocus.rung.mastery_check,
      compassSliceName: llFocus.compass_slice_key
        ? compassSlice(llFocus.compass_slice_key as never).kid_name
        : null,
    },
    yearMapSteers: steers.yearMap,
    flashbackItems,
    flashbackGame,
    coverageSteers: steers.coverage,
    packResources: (pack?.resources ||
      (ctx.expedition.core_resources as never[]) ||
      []) as never,
    forecastMaterials:
      extras.forecastMaterials.length > 0
        ? extras.forecastMaterials
        : pack?.materials.plan_ahead || [],
  })

  let payload: LessonPayload | null = null
  let usedFallback = false

  try {
    const model = `openai/gpt-4o-mini`
    const estimated = estimateTokensForText(userPrompt, model)
    const tokenValidation = await validateTokenBalance(userId, estimated, supabase)
    if (tokenValidation) {
      throw new Error(tokenValidation.error)
    }

    // NOTE: the AI gateway rejects response_format ("400 Invalid input"),
    // so JSON-only output is enforced by the prompt and parseJsonObject.
    const completion = await gatewayClient.chat.completions.create({
      model,
      temperature: 0.7,
      max_tokens: 6000,
      messages: [
        { role: 'system', content: LESSON_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })

    const content = completion.choices[0]?.message?.content
    if (!content) throw new Error('No lesson generated')

    const candidate = parseJsonObject(content)
    const violations = lessonContractViolations(candidate)
    if (violations.length > 0) {
      console.warn('le lesson failed contract, using pack fallback:', violations)
      payload = fallbackFromPack(ctx, lessonNumber)
      usedFallback = payload !== null
      if (!payload) payload = candidate // no pack — ship the best we have
    } else {
      payload = candidate
      // Flashback is precomputed truth — never trust the model's copy blindly.
      payload.flashback = { game: flashbackGame, items: flashbackItems }
    }

    await trackTokenUsage(
      {
        user_id: userId,
        action_type: 'life_explorer_lesson',
        model_used: model.replace(/^openai\//, '') || VISION_MODEL,
        tokens_used:
          (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0),
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        openai_request_id: completion.id,
        success: true,
        metadata: {
          expedition_id: ctx.expedition.id,
          lesson_number: lessonNumber,
          used_fallback: usedFallback,
        },
      },
      supabase
    )
  } catch (err) {
    // AI reliability guarantee: Today always renders a teachable lesson.
    console.error('le generate failed, using pack fallback', err)
    payload = fallbackFromPack(ctx, lessonNumber)
    usedFallback = true
    if (!payload) throw err
  }

  if (usedFallback && payload) {
    // Fallback lessons still get today's flashback items.
    payload.flashback = { game: flashbackGame, items: flashbackItems }
  }

  if (!payload) throw new Error('No lesson payload')
  return insertGeneratedLesson(supabase, ctx, userId, lessonNumber, payload)
}

async function insertGeneratedLesson(
  supabase: SupabaseClient,
  ctx: ActiveContext,
  userId: string,
  lessonNumber: number,
  payload: LessonPayload,
  plannedFor?: string
): Promise<LeLesson> {
  const title = payload.identity.lesson_title
  const essentialQuestion = payload.identity.essential_question || null
  const estimatedMinutes =
    payload.identity.estimated_total_minutes ||
    payload.time_summary?.lesson_minutes ||
    null

  const { data: lesson, error } = await supabase
    .from('le_lessons')
    .insert({
      expedition_id: ctx.expedition!.id,
      student_id: ctx.student.id,
      created_by: userId,
      household_id: ctx.student.household_id,
      lesson_number: lessonNumber,
      title,
      essential_question: essentialQuestion,
      status: 'ready',
      estimated_total_minutes: estimatedMinutes,
      payload,
      planned_for: plannedFor || new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error || !lesson) {
    console.error('le insert lesson', error)
    throw new Error(error?.message || 'Failed to save lesson')
  }

  await seedLessonItems(supabase, lesson as LeLesson, userId)

  const topWonder = ctx.highInterestWonders[0]
  if (topWonder && topWonder.status === 'unexplored') {
    await supabase
      .from('le_wonder_items')
      .update({ status: 'exploring', updated_at: new Date().toISOString() })
      .eq('id', topWonder.id)
  }

  return lesson as LeLesson
}

/**
 * Write every authored pack day as a real, openable lesson for this week.
 * Today is Day 1 of a complete lineup — not a path of empty titles.
 */
export async function materializePackLessons(
  supabase: SupabaseClient,
  userId: string,
  studentId?: string
): Promise<LeLesson[]> {
  const ctx = await loadActiveContext(supabase, studentId)
  if (!ctx?.student) throw new Error('No active student')
  if (!ctx.expedition) throw new Error('No active expedition')

  const pack = packForExpedition(ctx.expedition.title)
  if (!pack?.fallback_lessons.length) {
    return ctx.readyLesson ? [ctx.readyLesson] : []
  }

  const weekStart = composeWeekStart()
  const { data: existing } = await supabase
    .from('le_lessons')
    .select('id, lesson_number, planned_for, status, payload')
    .eq('expedition_id', ctx.expedition.id)

  if (pack.slug === 'oceans') {
    const why = pack.fallback_lessons[0]?.identity.why_this_matters
    if (why && why !== ctx.expedition.why_this_matters) {
      await supabase
        .from('le_expeditions')
        .update({ why_this_matters: why, updated_at: new Date().toISOString() })
        .eq('id', ctx.expedition.id)
    }
    await supabase
      .from('le_world_map_items')
      .update({
        name: 'The Gulf from home',
        taste_looks_like: 'Finger on the map, then west into the Gulf.',
      })
      .eq('student_id', ctx.student.id)
      .ilike('name', '%Atlantic from Florida%')
  }

  const byNumber = new Map((existing || []).map((row) => [row.lesson_number as number, row]))
  const lessons: LeLesson[] = []

  for (let n = 1; n <= pack.fallback_lessons.length; n++) {
    const plannedFor = addDaysIso(weekStart, n - 1)
    const already = byNumber.get(n)
    if (already) {
      const payload = JSON.parse(JSON.stringify(pack.fallback_lessons[n - 1])) as LessonPayload
      payload.identity.lesson_number = n
      const stored = (already.payload || {}) as LessonPayload
      const canRefresh = already.status === 'ready' || already.status === 'in_progress'
      const payloadChanged =
        canRefresh &&
        (stored.identity?.why_this_matters !== payload.identity.why_this_matters ||
          stored.identity?.world_taste !== payload.identity.world_taste ||
          stored.teacher_script?.mystery_or_question !== payload.teacher_script?.mystery_or_question ||
          JSON.stringify(stored.visuals || []) !== JSON.stringify(payload.visuals || []) ||
          JSON.stringify(stored.skill_keys || []) !== JSON.stringify(payload.skill_keys || []) ||
          JSON.stringify(stored.crew || []) !== JSON.stringify(payload.crew || []) ||
          JSON.stringify(stored.book_chapter || null) !== JSON.stringify(payload.book_chapter || null))
      const patch: Record<string, unknown> = {}
      if (already.planned_for !== plannedFor) patch.planned_for = plannedFor
      if (payloadChanged) {
        payload.book_id = stored.book_id || payload.book_id
        patch.payload = payload
        patch.title = payload.identity.lesson_title
        patch.essential_question = payload.identity.essential_question || null
        patch.estimated_total_minutes =
          payload.identity.estimated_total_minutes ||
          payload.time_summary?.lesson_minutes ||
          null
      }
      if (Object.keys(patch).length > 0) {
        await supabase.from('le_lessons').update(patch).eq('id', already.id)
      }
      if (payloadChanged && already.status === 'ready') {
        await supabase.from('le_lesson_items').delete().eq('lesson_id', already.id)
      }
      const { data } = await supabase.from('le_lessons').select('*').eq('id', already.id).single()
      if (data) {
        if (payloadChanged && already.status === 'ready') {
          await seedLessonItems(supabase, data as LeLesson, userId)
        }
        lessons.push(data as LeLesson)
      }
      continue
    }
    const payload = JSON.parse(JSON.stringify(pack.fallback_lessons[n - 1])) as LessonPayload
    payload.identity.lesson_number = n
    lessons.push(await insertGeneratedLesson(supabase, ctx, userId, n, payload, plannedFor))
  }

  const expedition = ctx.expedition
  if (pack.slug === 'oceans' && expedition) {
    const paint = () =>
      ensureExpeditionBook(supabase, userId, {
        studentId: ctx.student.id,
        expeditionId: expedition.id,
      }).catch((err) => console.error('le expedition book', err))
    try {
      after(paint)
    } catch {
      void paint()
    }
  }

  return lessons
}
