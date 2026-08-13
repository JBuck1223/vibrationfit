import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { loadActiveContext, nextLessonNumber } from './context'
import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt } from './prompts'
import { MATH_LADDER, READING_LADDER, currentLadderPosition } from './ladders'
import { dueFlashbackItems, FLASHBACK_GAMES } from './flashback'
import { computeCoverage, coverageSteer } from './state-standards'
import { packForExpedition } from './packs/antarctica'
import { seedLessonItems } from './lesson-items'
import type { ActiveContext, LeLesson, LessonPayload } from './types'

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

async function loadCoverageSteers(
  supabase: SupabaseClient,
  studentId: string
): Promise<string[]> {
  const since = new Date(Date.now() - 45 * 86_400_000).toISOString()
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
  const coverage = computeCoverage({
    lessons: (lessons.data || []) as never,
    evidence: (evidence.data || []) as never,
    activityLogs: (logs.data || []) as never,
  })
  return coverageSteer(coverage)
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

  const mathPos = currentLadderPosition(MATH_LADDER, ctx.skills, ctx.student.grade_level)
  const readingPos = currentLadderPosition(READING_LADDER, ctx.skills, ctx.student.grade_level)
  const flashbackItems = dueFlashbackItems(ctx.wonderWall.learned)
  const flashbackGame = FLASHBACK_GAMES[lessonNumber % FLASHBACK_GAMES.length]
  const steers = await loadCoverageSteers(supabase, ctx.student.id)
  const pack = packForExpedition(ctx.expedition.title)

  const userPrompt = buildLessonUserPrompt({
    studentName: ctx.student.name,
    gradeLevel: ctx.student.grade_level,
    age: ctx.student.current_age,
    interests: ctx.student.interests || [],
    strengths: ctx.student.strengths || [],
    skillsNeedingSupport: ctx.student.skills_needing_support || [],
    lifeCategory: ctx.expedition.life_category,
    expeditionTitle: ctx.expedition.title,
    essentialQuestions: ctx.expedition.essential_questions || [],
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
    mathRung: mathPos.current_rung,
    readingRung: readingPos.current_rung,
    flashbackItems,
    flashbackGame,
    coverageSteers: steers,
    packResources: (pack?.resources ||
      (ctx.expedition.core_resources as never[]) ||
      []) as never,
    forecastMaterials: pack?.materials.plan_ahead || [],
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

  const title = payload.identity.lesson_title
  const essentialQuestion = payload.identity.essential_question || null
  const estimatedMinutes =
    payload.identity.estimated_total_minutes ||
    payload.time_summary?.lesson_minutes ||
    null

  const { data: lesson, error } = await supabase
    .from('le_lessons')
    .insert({
      expedition_id: ctx.expedition.id,
      student_id: ctx.student.id,
      created_by: userId,
      household_id: ctx.student.household_id,
      lesson_number: lessonNumber,
      title,
      essential_question: essentialQuestion,
      status: 'ready',
      estimated_total_minutes: estimatedMinutes,
      payload,
      planned_for: new Date().toISOString().slice(0, 10),
    })
    .select('*')
    .single()

  if (error || !lesson) {
    console.error('le insert lesson', error)
    throw new Error(error?.message || 'Failed to save lesson')
  }

  // Materialize the lesson's prescribed action items as a checkable list
  // inside the lesson bucket (non-fatal — the guide still renders without it).
  await seedLessonItems(supabase, lesson as LeLesson, userId)

  // Mark top wonder as exploring if present
  const topWonder = ctx.highInterestWonders[0]
  if (topWonder && topWonder.status === 'unexplored') {
    await supabase
      .from('le_wonder_items')
      .update({ status: 'exploring', updated_at: new Date().toISOString() })
      .eq('id', topWonder.id)
  }

  return lesson as LeLesson
}
