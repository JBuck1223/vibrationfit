/**
 * Evaluation readiness — a derived rollup, not a second progress store.
 *
 * Grade-1 Florida benchmark codes live as metadata on ladder rungs
 * (ladders.ts), Life Learning resources (life-learning.ts), and Year Map
 * Big Ideas (year-map.ts). Readiness asks: of those codes, how many have
 * been touched, and how many are backed by something secure? All answers
 * come from le_skill_progress and the derived Year Map — nothing is
 * parent-filled.
 */

import { MATH_LADDER, READING_LADDER, WRITING_LADDER, parseGradeLevel } from './ladders'
import { LIFE_LEARNING_RESOURCES } from './life-learning'
import { YEAR_MAP_IDEAS, type YearMapStatus } from './year-map'
import type { LeSkillProgress } from './types'

export type ReadinessSubjectKey = 'math' | 'ela' | 'science' | 'social_studies'

export interface ReadinessSubject {
  key: ReadinessSubjectKey
  label: string
  total_codes: number
  secure_codes: number
  touched_codes: number
}

export interface Readiness {
  grade: number
  subjects: ReadinessSubject[]
}

function subjectForCode(code: string): ReadinessSubjectKey | null {
  if (code.startsWith('MA.')) return 'math'
  if (code.startsWith('ELA.')) return 'ela'
  if (code.startsWith('SC.')) return 'science'
  if (code.startsWith('SS.')) return 'social_studies'
  return null
}

const SUBJECT_LABELS: Record<ReadinessSubjectKey, string> = {
  math: 'Math',
  ela: 'Reading & Writing',
  science: 'Science',
  social_studies: 'Social Studies',
}

type CodeState = 'secure' | 'touched' | 'untouched'

function upgrade(current: CodeState | undefined, next: CodeState): CodeState {
  if (current === 'secure' || next === 'secure') return 'secure'
  if (current === 'touched' || next === 'touched') return 'touched'
  return 'untouched'
}

/**
 * Roll up benchmark-code readiness for the student's current grade.
 * A code is secure when any rung/resource carrying it is secure; touched
 * when any carrier has been observed at all (or its Big Idea is no longer
 * untouched); otherwise untouched.
 */
export function computeReadiness(
  skills: LeSkillProgress[],
  yearMap: YearMapStatus[],
  gradeLevel?: string | null
): Readiness {
  const grade = parseGradeLevel(gradeLevel)
  const gradeTag = `.${grade}.` // e.g. ".1." matches MA.1.x / ELA.1.x / SC.1.x / SS.1.x
  const states = new Map<string, CodeState>()

  const observed = new Map(skills.map((s) => [`${s.subject}:${s.skill}`, s.status]))

  function fold(codes: string[] | undefined, subject: string, skillKey: string) {
    for (const code of codes || []) {
      if (!code.includes(gradeTag)) continue
      const status = observed.get(`${subject}:${skillKey}`)
      const state: CodeState =
        status === 'secure' ? 'secure' : status ? 'touched' : 'untouched'
      states.set(code, upgrade(states.get(code), state))
    }
  }

  for (const ladder of [MATH_LADDER, READING_LADDER, WRITING_LADDER]) {
    for (const rung of ladder.rungs) fold(rung.benchmarks, ladder.subject, rung.key)
  }
  for (const resource of LIFE_LEARNING_RESOURCES) {
    for (const rung of resource.rungs) {
      fold(rung.benchmarks || resource.benchmarks, 'life_learning', rung.key)
    }
  }

  const yearMapByKey = new Map(yearMap.map((s) => [s.idea.key, s]))
  for (const idea of YEAR_MAP_IDEAS) {
    const status = yearMapByKey.get(idea.key)
    for (const code of idea.benchmarks || []) {
      if (!code.includes(gradeTag)) continue
      const state: CodeState =
        status?.level === 'green' ? 'secure' : status?.level === 'thin' ? 'touched' : 'untouched'
      states.set(code, upgrade(states.get(code), state))
    }
  }

  const bySubject = new Map<ReadinessSubjectKey, { total: number; secure: number; touched: number }>()
  for (const key of ['math', 'ela', 'science', 'social_studies'] as const) {
    bySubject.set(key, { total: 0, secure: 0, touched: 0 })
  }
  for (const [code, state] of states) {
    const subject = subjectForCode(code)
    if (!subject) continue
    const agg = bySubject.get(subject)!
    agg.total += 1
    if (state === 'secure') {
      agg.secure += 1
      agg.touched += 1
    } else if (state === 'touched') {
      agg.touched += 1
    }
  }

  return {
    grade,
    subjects: (['math', 'ela', 'science', 'social_studies'] as const).map((key) => {
      const agg = bySubject.get(key)!
      return {
        key,
        label: SUBJECT_LABELS[key],
        total_codes: agg.total,
        secure_codes: agg.secure,
        touched_codes: agg.touched,
      }
    }),
  }
}

/** Benchmark codes carried by a skill key (ladder rung or Life Learning rung). */
export function benchmarksForSkill(skillKey: string): string[] {
  for (const ladder of [MATH_LADDER, READING_LADDER, WRITING_LADDER]) {
    const rung = ladder.rungs.find((r) => r.key === skillKey)
    if (rung) return rung.benchmarks || []
  }
  for (const resource of LIFE_LEARNING_RESOURCES) {
    const rung = resource.rungs.find((r) => r.key === skillKey)
    if (rung) return rung.benchmarks || resource.benchmarks || []
  }
  return []
}

export interface EvaluationCountdown {
  anniversary: string
  days_remaining: number
}

/** Next annual-evaluation date from the Notice of Intent anniversary (F.S. 1002.41). */
export function evaluationCountdown(
  noticeOfIntentDate: string | null | undefined,
  now = new Date()
): EvaluationCountdown | null {
  if (!noticeOfIntentDate) return null
  const noi = new Date(`${noticeOfIntentDate}T00:00:00`)
  if (Number.isNaN(noi.getTime())) return null
  const next = new Date(noi)
  next.setFullYear(now.getFullYear())
  if (next.getTime() <= now.getTime()) next.setFullYear(now.getFullYear() + 1)
  const days = Math.ceil((next.getTime() - now.getTime()) / 86_400_000)
  return { anniversary: next.toISOString().slice(0, 10), days_remaining: days }
}
