import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { CHECKIN_SYSTEM_PROMPT, buildCheckInUserPrompt } from './prompts'
import { recordFlashbackResults } from './flashback'
import { MATH_LADDER, READING_LADDER, WRITING_LADDER, currentLadderPosition } from './ladders'
import { catalogSkill } from './skill-catalog'
import { weeklyLifeLearningFocus } from './life-learning'
import type { CheckInInput, LeLessonRecord, LeSkillProgress, LessonPayload, SkillStatus } from './types'

interface StructuredCheckIn {
  recommended_next_action: string
  learned_statements: string[]
  wonder_questions: string[]
  skills_observed: Array<{
    skill: string
    subject: string
    status: SkillStatus
    notes: string
  }>
  evidence: {
    title: string
    type: string
    student_explanation: string
    academic_tags: string[]
  } | null
}

function fallbackStructure(input: CheckInInput): StructuredCheckIn {
  return {
    recommended_next_action:
      input.direction === 'change'
        ? 'Pause current topic and ask the child what they want to explore next.'
        : input.direction === 'deepen'
          ? 'Deepen tomorrow with the new question or favorite moment from today.'
          : 'Continue the expedition with the highest-interest unanswered Wonder Wall question.',
    learned_statements: input.created_said_demonstrated
      ? [input.created_said_demonstrated]
      : [],
    wonder_questions: input.new_question ? [input.new_question] : [],
    skills_observed: input.easy_or_difficult
      ? [
          {
            skill: 'lesson engagement',
            subject: 'general',
            status: /difficult|hard|struggle/i.test(input.easy_or_difficult)
              ? 'needs_support'
              : 'developing',
            notes: input.easy_or_difficult,
          },
        ]
      : [],
    evidence: input.created_said_demonstrated
      ? {
          title: 'Lesson demonstration',
          type: input.photo_url ? 'photo' : 'other',
          student_explanation: input.created_said_demonstrated,
          academic_tags: [],
        }
      : null,
  }
}

interface CheckInRungKeys {
  mathRungKey?: string
  readingRungKey?: string
  writingRungKey?: string
  lifeLearningRungKey?: string
  compassSliceKey?: string
}

async function structureCheckIn(
  supabase: SupabaseClient,
  userId: string,
  studentName: string,
  lessonTitle: string,
  input: CheckInInput,
  rungKeys: CheckInRungKeys = {}
): Promise<StructuredCheckIn> {
  try {
    const userPrompt = buildCheckInUserPrompt({
      studentName,
      lessonTitle,
      enjoyedMost: input.enjoyed_most,
      createdSaidDemonstrated: input.created_said_demonstrated,
      easyOrDifficult: input.easy_or_difficult,
      newQuestion: input.new_question,
      direction: input.direction,
      parentNotes: input.parent_notes,
      lowBattery: input.low_battery,
      clickedInNewSituation: input.clicked_in_new_situation,
      ...rungKeys,
    })
    const model = 'openai/gpt-4o-mini'
    const estimated = estimateTokensForText(userPrompt, model)
    const tokenValidation = await validateTokenBalance(userId, estimated, supabase)
    if (tokenValidation) return fallbackStructure(input)

    // NOTE: the AI gateway rejects response_format ("400 Invalid input"),
    // so JSON-only output is enforced by the prompt and tolerant parsing below.
    const completion = await gatewayClient.chat.completions.create({
      model,
      temperature: 0.3,
      max_tokens: 1200,
      messages: [
        { role: 'system', content: CHECKIN_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
    })
    const content = completion.choices[0]?.message?.content
    if (!content) return fallbackStructure(input)

    await trackTokenUsage(
      {
        user_id: userId,
        action_type: 'life_explorer_checkin',
        model_used: 'gpt-4o-mini',
        tokens_used:
          (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0),
        input_tokens: completion.usage?.prompt_tokens || 0,
        output_tokens: completion.usage?.completion_tokens || 0,
        openai_request_id: completion.id,
        success: true,
        metadata: { lesson_id: input.lesson_id },
      },
      supabase
    )

    const cleaned = content.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
    let structured: Record<string, unknown>
    try {
      structured = JSON.parse(cleaned)
    } catch {
      const match = cleaned.match(/\{[\s\S]*\}/)
      if (!match) return fallbackStructure(input)
      structured = JSON.parse(match[0])
    }
    return { ...fallbackStructure(input), ...structured } as StructuredCheckIn
  } catch (err) {
    console.error('structureCheckIn fallback', err)
    return fallbackStructure(input)
  }
}

export async function recordLessonCheckIn(
  supabase: SupabaseClient,
  userId: string,
  input: CheckInInput
): Promise<{ record: LeLessonRecord; structured: StructuredCheckIn }> {
  const { data: lesson, error: lessonError } = await supabase
    .from('le_lessons')
    .select('*')
    .eq('id', input.lesson_id)
    .single()

  if (lessonError || !lesson) {
    throw new Error('Lesson not found')
  }

  const [{ data: student }, { data: skillRows }] = await Promise.all([
    supabase
      .from('le_students')
      .select('name, grade_level')
      .eq('id', lesson.student_id)
      .single(),
    supabase
      .from('le_skill_progress')
      .select('*')
      .eq('student_id', lesson.student_id),
  ])

  // Current rung keys so the interpreter records rung progress against the
  // canonical ladder keys instead of free-text skill names.
  const skills = (skillRows || []) as LeSkillProgress[]
  const grade = student?.grade_level
  const llFocus = weeklyLifeLearningFocus(skills)
  const rungKeys: CheckInRungKeys = {
    mathRungKey: currentLadderPosition(MATH_LADDER, skills, grade).current_rung.key,
    readingRungKey: currentLadderPosition(READING_LADDER, skills, grade).current_rung.key,
    writingRungKey: currentLadderPosition(WRITING_LADDER, skills, grade).current_rung.key,
    lifeLearningRungKey: llFocus.rung.key,
    compassSliceKey: llFocus.compass_slice_key || undefined,
  }

  const structured = await structureCheckIn(
    supabase,
    userId,
    student?.name || 'the student',
    lesson.title,
    input,
    rungKeys
  )

  const newQuestions = [
    ...(input.new_question ? [input.new_question] : []),
    ...(structured.wonder_questions || []),
  ].filter(Boolean)
  const uniqueQuestions = Array.from(new Set(newQuestions))

  const { data: record, error: recordError } = await supabase
    .from('le_lesson_records')
    .upsert(
      {
        lesson_id: lesson.id,
        expedition_id: lesson.expedition_id,
        student_id: lesson.student_id,
        created_by: userId,
        household_id: lesson.household_id,
        recorded_on: new Date().toISOString().slice(0, 10),
        status: 'completed',
        activities_completed: input.activities_completed || [],
        activities_skipped: input.activities_skipped || [],
        student_engagement: input.student_engagement ?? null,
        enjoyed_most: input.enjoyed_most || null,
        created_said_demonstrated: input.created_said_demonstrated || null,
        easy_or_difficult: input.easy_or_difficult || null,
        new_questions: uniqueQuestions,
        skills_observed: (structured.skills_observed || []).map((s) => s.skill),
        direction: input.direction || 'continue',
        parent_notes: input.parent_notes || null,
        recommended_next_action: structured.recommended_next_action,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'lesson_id' }
    )
    .select('*')
    .single()

  if (recordError || !record) {
    console.error('le check-in record', recordError)
    throw new Error(recordError?.message || 'Failed to save check-in')
  }

  await supabase
    .from('le_lessons')
    .update({ status: 'completed', updated_at: new Date().toISOString() })
    .eq('id', lesson.id)

  // Advance the Up Next queue: the wonder this lesson explored leaves the
  // queue (the parent can re-queue it from the steer panel to go deeper);
  // remaining queued wonders shift up.
  const { data: queuedItems } = await supabase
    .from('le_wonder_items')
    .select('id, priority, status')
    .eq('expedition_id', lesson.expedition_id)
    .not('priority', 'is', null)
    .order('priority', { ascending: true })
  if (queuedItems && queuedItems.length > 0) {
    const now = new Date().toISOString()
    const remaining = queuedItems.filter((q) => q.status !== 'exploring')
    for (const explored of queuedItems.filter((q) => q.status === 'exploring')) {
      await supabase
        .from('le_wonder_items')
        .update({ priority: null, updated_at: now })
        .eq('id', explored.id)
    }
    for (let i = 0; i < remaining.length; i++) {
      if (remaining[i].priority !== i + 1) {
        await supabase
          .from('le_wonder_items')
          .update({ priority: i + 1, updated_at: now })
          .eq('id', remaining[i].id)
      }
    }
  }

  for (const statement of structured.learned_statements || []) {
    if (!statement.trim()) continue
    await supabase.from('le_wonder_items').insert({
      expedition_id: lesson.expedition_id,
      created_by: userId,
      household_id: lesson.household_id,
      kind: 'learned',
      statement: statement.trim(),
      status: 'answered',
      source: 'check_in',
      original_language: true,
      recorded_at: new Date().toISOString().slice(0, 10),
    })
  }

  for (const question of uniqueQuestions) {
    if (!question.trim()) continue
    await supabase.from('le_wonder_items').insert({
      expedition_id: lesson.expedition_id,
      created_by: userId,
      household_id: lesson.household_id,
      kind: 'wonder',
      statement: question.trim(),
      interest_level: 4,
      status: 'unexplored',
      source: 'student',
      original_language: true,
      recorded_at: new Date().toISOString().slice(0, 10),
    })
  }

  let evidenceId: string | null = null
  if (structured.evidence || input.photo_url) {
    const ev = structured.evidence
    const { data: evidence } = await supabase
      .from('le_learning_evidence')
      .insert({
        student_id: lesson.student_id,
        expedition_id: lesson.expedition_id,
        lesson_id: lesson.id,
        lesson_record_id: record.id,
        created_by: userId,
        household_id: lesson.household_id,
        type: (ev?.type as string) || (input.photo_url ? 'photo' : 'other'),
        title: ev?.title || 'Lesson artifact',
        photo_url: input.photo_url || null,
        student_explanation: ev?.student_explanation || input.created_said_demonstrated || null,
        parent_observation: input.parent_notes || null,
        academic_tags: ev?.academic_tags || [],
      })
      .select('id')
      .single()
    evidenceId = evidence?.id || null
  }

  for (const skill of structured.skills_observed || []) {
    await supabase.from('le_skill_progress').upsert(
      {
        student_id: lesson.student_id,
        created_by: userId,
        household_id: lesson.household_id,
        skill: skill.skill,
        subject: skill.subject || 'general',
        status: skill.status || 'developing',
        last_observed: new Date().toISOString().slice(0, 10),
        evidence_ids: evidenceId ? [evidenceId] : [],
        notes: skill.notes || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'student_id,skill,subject' }
    )
  }

  const catalogKeys = (lesson.payload as LessonPayload | undefined)?.skill_keys || []
  if (catalogKeys.length > 0) {
    const { data: existingRows } = await supabase
      .from('le_skill_progress')
      .select('skill, subject, status, notes')
      .eq('student_id', lesson.student_id)
      .in('skill', catalogKeys)
    const existing = new Map(
      (existingRows || []).map((r) => [`${r.skill}::${r.subject}`, r as { status: string; notes: string | null }])
    )
    const today = new Date().toISOString().slice(0, 10)
    const lessonNote = `Day ${lesson.payload?.identity?.lesson_number || ''} — ${lesson.title}`.replace('Day  —', 'Day')
    for (const key of catalogKeys) {
      const def = catalogSkill(key)
      const subject = def?.subject || 'general'
      const prior = existing.get(`${key}::${subject}`)
      if (prior?.status === 'secure' || prior?.status === 'needs_support') continue
      await supabase.from('le_skill_progress').upsert(
        {
          student_id: lesson.student_id,
          created_by: userId,
          household_id: lesson.household_id,
          skill: key,
          subject,
          status: 'developing',
          last_observed: today,
          evidence_ids: evidenceId ? [evidenceId] : [],
          notes: prior?.notes || lessonNote,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'student_id,skill,subject' }
      )
    }
  }

  if (input.direction === 'change') {
    await supabase
      .from('le_expeditions')
      .update({ status: 'paused', updated_at: new Date().toISOString() })
      .eq('id', lesson.expedition_id)
  }

  // Retention engine: apply Expedition Flashback recall results.
  if (input.flashback_results?.length) {
    await recordFlashbackResults(supabase, input.flashback_results)
  }

  // Compliance derivation: every completed lesson writes its own daily
  // activity-log entry (Florida contemporaneous log) — never parent homework.
  await writeActivityLogFromLesson(supabase, userId, lesson, input)

  return { record: record as LeLessonRecord, structured }
}

async function writeActivityLogFromLesson(
  supabase: SupabaseClient,
  userId: string,
  lesson: {
    id: string
    student_id: string
    expedition_id: string
    household_id: string | null
    title: string
    payload: LessonPayload
  },
  input: CheckInInput
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)

  // Idempotent: skip if this lesson already produced today's auto entry.
  const autoTitle = `Lesson: ${lesson.title}`
  const { data: existing } = await supabase
    .from('le_activity_logs')
    .select('id')
    .eq('student_id', lesson.student_id)
    .eq('entry_date', today)
    .eq('title', autoTitle)
    .maybeSingle()
  if (existing) return

  const p = lesson.payload
  const time = p?.time_summary
  const durationMinutes = input.low_battery
    ? p?.low_battery_mode?.total_minutes || 15
    : (time?.lesson_minutes || 0) +
      (time?.reading_minutes || 0) +
      (time?.foundational_minutes || 0)

  const subjects = Array.from(
    new Set((p?.objectives || []).map((o) => o.area.toLowerCase()))
  )

  const readingMaterials = [
    ...(p?.parent_prep?.books || []),
    ...(p?.core_resource?.resource_type === 'book' && p.core_resource.title
      ? [p.core_resource.title]
      : []),
  ]

  const title = input.low_battery && p?.low_battery_mode?.log_title
    ? p.low_battery_mode.log_title
    : autoTitle

  await supabase.from('le_activity_logs').insert({
    student_id: lesson.student_id,
    expedition_id: lesson.expedition_id,
    created_by: userId,
    household_id: lesson.household_id,
    entry_date: today,
    title,
    description: [
      p?.identity?.essential_question ? `Essential question: ${p.identity.essential_question}` : null,
      input.created_said_demonstrated ? `Student demonstrated: ${input.created_said_demonstrated}` : null,
      input.low_battery ? 'Short-form (low-battery) lesson day.' : null,
    ]
      .filter(Boolean)
      .join('\n') || null,
    duration_minutes: Math.max(durationMinutes, 15),
    reading_materials: Array.from(new Set(readingMaterials)),
    subjects: subjects.length > 0 ? subjects : ['general'],
  })
}
