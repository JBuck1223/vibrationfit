import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { loadActiveContext, nextLessonNumber } from './context'
import { LESSON_SYSTEM_PROMPT, buildLessonUserPrompt } from './prompts'
import type { LeLesson, LessonPayload } from './types'

function parseJsonObject(text: string): LessonPayload {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  const parsed = JSON.parse(cleaned)
  if (!parsed?.identity?.lesson_title) {
    throw new Error('Lesson payload missing identity.lesson_title')
  }
  return parsed as LessonPayload
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
    latestRecordSummary: latestSummary,
    recommendedNextAction: latest?.recommended_next_action || null,
    lessonNumber,
  })

  const model = `openai/gpt-4o-mini`
  const estimated = estimateTokensForText(userPrompt, model)
  const tokenValidation = await validateTokenBalance(userId, estimated, supabase)
  if (tokenValidation) {
    throw new Error(tokenValidation.error)
  }

  const completion = await gatewayClient.chat.completions.create({
    model,
    temperature: 0.7,
    max_tokens: 4000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: LESSON_SYSTEM_PROMPT },
      { role: 'user', content: userPrompt },
    ],
  })

  const content = completion.choices[0]?.message?.content
  if (!content) throw new Error('No lesson generated')

  const payload = parseJsonObject(content)
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
        lesson_id: lesson.id,
        lesson_number: lessonNumber,
      },
    },
    supabase
  )

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
