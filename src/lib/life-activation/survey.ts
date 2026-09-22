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

export async function savePhaseSurvey(
  supabase: SupabaseClient,
  args: {
    userId: string
    phase: SurveyPhase
    intensiveId: string | null
    answers: SurveyAnswers
    extras?: Record<string, string | null>
  },
) {
  const { userId, phase, intensiveId, answers, extras } = args
  const payload = { ...answers, ...extras }
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
