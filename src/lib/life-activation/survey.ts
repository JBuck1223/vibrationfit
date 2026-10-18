import type { SupabaseClient } from '@supabase/supabase-js'
import type { IntakeQuestion } from '@/lib/constants/intensive-intake-questions'

export type SurveyPhase = 'pre_intensive' | 'post_intensive'
export type SurveyAnswers = Record<string, string | number>

export function surveyPrompt(
  question: IntakeQuestion,
  phase: SurveyPhase,
  shiftQuestion?: string,
) {
  if (question.id === 'biggest_shift' && shiftQuestion) return shiftQuestion
  return phase === 'pre_intensive' ? question.questionPre : question.questionPost
}

export function firstMissingSurveyAnswer(
  questions: IntakeQuestion[],
  answers: SurveyAnswers,
  phase: SurveyPhase,
  shiftQuestion?: string,
  skipIds?: string[],
) {
  for (const question of questions) {
    if (skipIds?.includes(question.id)) continue
    const prompt = surveyPrompt(question, phase, shiftQuestion)
    if (!prompt) continue
    const value = answers[question.id]
    if (value === undefined || value === '') return 'Answer each question before you continue.'
  }
  return null
}

export async function loadPhaseSurvey(
  supabase: SupabaseClient,
  args: {
    userId: string
    phase: SurveyPhase
    intensiveId: string | null
    questionIds: string[]
  },
): Promise<SurveyAnswers | null> {
  const { userId, phase, intensiveId, questionIds } = args
  let lookup = supabase
    .from('intensive_responses')
    .select('*')
    .eq('user_id', userId)
    .eq('phase', phase)
  lookup = intensiveId ? lookup.eq('intensive_id', intensiveId) : lookup.is('intensive_id', null)

  const { data, error } = await lookup.maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) return null

  const answers: SurveyAnswers = {}
  for (const id of questionIds) {
    const value = data[id]
    if (typeof value === 'number' && Number.isFinite(value)) answers[id] = value
    else if (typeof value === 'string') answers[id] = value
  }
  return answers
}

export async function savePhaseSurvey(
  supabase: SupabaseClient,
  args: {
    userId: string
    phase: SurveyPhase
    intensiveId: string | null
    answers: SurveyAnswers
    extras?: Record<string, string | null>
    statsSnapshot?: object | null
  },
) {
  const { userId, phase, intensiveId, answers, extras, statsSnapshot } = args
  const payload = {
    ...answers,
    ...extras,
    ...(statsSnapshot ? { stats_snapshot: statsSnapshot } : {}),
  }
  let lookup = supabase
    .from('intensive_responses')
    .select('id')
    .eq('user_id', userId)
    .eq('phase', phase)
  lookup = intensiveId ? lookup.eq('intensive_id', intensiveId) : lookup.is('intensive_id', null)

  const { data: existing, error: readError } = await lookup.maybeSingle()
  if (readError) throw new Error(readError.message)

  if (existing?.id) {
    const { error } = await supabase
      .from('intensive_responses')
      .update({ ...payload, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
    if (error) throw new Error(error.message)
    return
  }

  const { error } = await supabase.from('intensive_responses').insert({
    intensive_id: intensiveId,
    user_id: userId,
    phase,
    ...payload,
  })
  if (error) throw new Error(error.message)
}
