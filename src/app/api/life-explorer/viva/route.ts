import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { vivaComplete } from '@/lib/life-explorer/viva-complete'
import {
  LIFE_EXPLORER_SIDEKICK_SYSTEM_PROMPT,
  buildLifeExplorerSidekickPrompt,
} from '@/lib/viva/prompts/life-explorer-sidekick'
import type { LessonPayload } from '@/lib/life-explorer/types'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json()
  const mode: 'ask' | 'another_way' = body.mode === 'another_way' ? 'another_way' : 'ask'
  if (!body.lesson_id) {
    return NextResponse.json({ error: 'lesson_id required' }, { status: 400 })
  }

  const { data: lesson, error } = await supabase
    .from('le_lessons')
    .select('id, title, essential_question, payload, student_id, expedition_id')
    .eq('id', body.lesson_id)
    .single()

  if (error || !lesson) {
    return NextResponse.json({ error: 'Lesson not found' }, { status: 404 })
  }

  const [{ data: student }, { data: expedition }] = await Promise.all([
    supabase
      .from('le_students')
      .select('name, grade_level, life_i_choose')
      .eq('id', lesson.student_id)
      .single(),
    supabase
      .from('le_expeditions')
      .select('title, why_this_matters')
      .eq('id', lesson.expedition_id)
      .single(),
  ])

  const p = (lesson.payload || {}) as LessonPayload
  const { text } = await vivaComplete({
    supabase,
    userId: user.id,
    system: LIFE_EXPLORER_SIDEKICK_SYSTEM_PROMPT,
    user: buildLifeExplorerSidekickPrompt({
      mode,
      studentName: student?.name || 'the explorer',
      gradeLevel: student?.grade_level || '1',
      lifeIChoose: student?.life_i_choose || null,
      whyThisMatters: expedition?.why_this_matters || p.identity?.why_this_matters || null,
      expeditionTitle: expedition?.title || p.identity?.expedition || '',
      lessonTitle: lesson.title,
      essentialQuestion: lesson.essential_question,
      hook: p.fun_contract?.hook || null,
      coreConcept: p.teacher_script?.core_concept || null,
      parentQuestion: body.question || null,
    }),
    actionType: 'life_explorer_sidekick',
    maxTokens: 900,
    temperature: 0.5,
    metadata: { lesson_id: lesson.id, mode },
  })

  return NextResponse.json({ text, mode })
}
