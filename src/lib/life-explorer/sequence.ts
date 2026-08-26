/**
 * Sequential expedition path — the dashboard a stranger can read in one look.
 * Pack chapters fill days that are not generated yet so the whole week is visible.
 */

import { packForExpedition } from './packs/antarctica'
import type { FacilitatorGuide } from './packs/types'
import type { LessonPayload } from './types'

export type SequenceStepStatus = 'completed' | 'today' | 'ready' | 'upcoming' | 'skipped'

export interface SequenceStep {
  day: number
  title: string
  essential_question: string | null
  status: SequenceStepStatus
  lesson_id: string | null
  planned_for: string | null
  /** Pack preview — shown when the day is not generated yet. */
  hook: string | null
  mission: string | null
}

export interface ExpeditionSequence {
  steps: SequenceStep[]
  current_day: number
  total_days: number
  completed_days: number
  tagline: string | null
  guide: FacilitatorGuide | null
}

export interface SequenceLessonInput {
  id: string
  lesson_number: number
  title: string
  essential_question: string | null
  status: string
  planned_for?: string | null
}

export function buildExpeditionSequence(opts: {
  expeditionTitle: string
  lessons: SequenceLessonInput[]
  today?: string
}): ExpeditionSequence {
  const pack = packForExpedition(opts.expeditionTitle)
  const byNumber = new Map(opts.lessons.map((l) => [l.lesson_number, l]))
  const packCount = pack?.fallback_lessons.length || 0
  const maxLesson = opts.lessons.reduce((m, l) => Math.max(m, l.lesson_number), 0)
  const total = Math.max(packCount, maxLesson, opts.lessons.length ? 1 : 0)

  const live =
    opts.lessons.find((l) => l.status === 'in_progress') ||
    opts.lessons.find((l) => l.status === 'ready')

  const steps: SequenceStep[] = []
  for (let day = 1; day <= total; day++) {
    const lesson = byNumber.get(day)
    const packLesson: LessonPayload | undefined = pack?.fallback_lessons[day - 1]
    const title =
      lesson?.title || packLesson?.identity.lesson_title || `Day ${day}`
    const essential =
      lesson?.essential_question || packLesson?.identity.essential_question || null
    let status: SequenceStepStatus = 'upcoming'
    if (lesson) {
      if (lesson.status === 'completed') status = 'completed'
      else if (lesson.status === 'skipped') status = 'skipped'
      else if (live && lesson.id === live.id) status = 'today'
      else status = 'ready'
    }
    steps.push({
      day,
      title,
      essential_question: essential,
      status,
      lesson_id: lesson?.id || null,
      planned_for: lesson?.planned_for || null,
      hook: packLesson?.fun_contract?.hook || null,
      mission: packLesson?.fun_contract?.story_mission || null,
    })
  }

  const todayStep = steps.find((s) => s.status === 'today')
  const nextUpcoming = steps.find((s) => s.status === 'upcoming' || s.status === 'ready')
  const lastDone = [...steps].reverse().find((s) => s.status === 'completed')
  const current_day =
    todayStep?.day || nextUpcoming?.day || lastDone?.day || (total > 0 ? 1 : 0)

  return {
    steps,
    current_day,
    total_days: total,
    completed_days: steps.filter((s) => s.status === 'completed').length,
    tagline: pack?.tagline || null,
    guide: pack?.facilitator_guide || null,
  }
}
