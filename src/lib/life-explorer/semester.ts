/**
 * Semester rule for Life Explorer.
 *
 * Semester 1: secure this grade. Do not mix next-grade rungs.
 * Semester 2: mix the next grade only where this grade is already secure.
 * Mixing is earned. Wobbly stays in a new unique day at this grade.
 */

import type { LeYearArc } from './types'
import {
  currentGradeRungsSecure,
  currentLadderPosition,
  parseGradeLevel,
  type Ladder,
  type LadderPosition,
  type LadderRung,
} from './ladders'
import type { LeSkillProgress } from './types'

export type Semester = 1 | 2

export interface SemesterWindows {
  semester: Semester
  semester_1_start: string
  semester_1_end: string
  semester_2_start: string
  semester_2_end: string
  school_year: string
  aim: string
}

/** Default US-style school year windows (Aug–Dec / Jan–May). */
export function defaultSemesterWindows(from = new Date()): Omit<SemesterWindows, 'semester' | 'aim'> {
  const month = from.getMonth() + 1
  const year = from.getFullYear()
  const startYear = month >= 8 ? year : year - 1
  return {
    school_year: `${startYear}-${startYear + 1}`,
    semester_1_start: `${startYear}-08-01`,
    semester_1_end: `${startYear}-12-31`,
    semester_2_start: `${startYear + 1}-01-01`,
    semester_2_end: `${startYear + 1}-05-31`,
  }
}

export function semesterFromDate(
  date: Date,
  arc?: Pick<LeYearArc, 'semester_1_start' | 'semester_1_end' | 'semester_2_start' | 'semester_2_end'> | null
): Semester {
  const iso = date.toISOString().slice(0, 10)
  if (arc) {
    if (iso >= arc.semester_2_start && iso <= arc.semester_2_end) return 2
    return 1
  }
  const month = date.getMonth() + 1
  return month >= 1 && month <= 5 ? 2 : 1
}

export function describeSemesterAim(semester: Semester, gradeLevel?: string | null): string {
  const grade = parseGradeLevel(gradeLevel)
  const gradeLabel = grade === 0 ? 'kindergarten' : `grade ${grade}`
  const nextLabel = `grade ${grade + 1}`
  if (semester === 1) {
    return `Semester 1 — make ${gradeLabel} reading and math solid, one skill at a time.`
  }
  return `Semester 2 — where ${gradeLabel} is solid, ${nextLabel} starts weaving in. Anything still settling stays at ${gradeLabel}.`
}

export function resolveSemester(
  gradeLevel?: string | null,
  arc?: LeYearArc | null,
  today = new Date()
): SemesterWindows {
  const windows = arc
    ? {
        school_year: arc.school_year,
        semester_1_start: arc.semester_1_start,
        semester_1_end: arc.semester_1_end,
        semester_2_start: arc.semester_2_start,
        semester_2_end: arc.semester_2_end,
      }
    : defaultSemesterWindows(today)
  const semester = semesterFromDate(today, windows)
  return {
    ...windows,
    semester,
    aim: describeSemesterAim(semester, gradeLevel),
  }
}

export interface MixPlan {
  position: LadderPosition
  /** Next-grade rung to weave in — only when earned. */
  mix_rung: LadderRung | null
  mix_next_grade: boolean
  reason: string
}

/**
 * Choose today's rungs. Never climb until secure.
 * Sem 2 mix is earned only when every current-grade rung in this domain is secure.
 */
export function mixPlanForLadder(
  ladder: Ladder,
  skills: LeSkillProgress[],
  gradeLevel: string | null | undefined,
  semester: Semester
): MixPlan {
  const position = currentLadderPosition(ladder, skills, gradeLevel)
  const grade = parseGradeLevel(gradeLevel)
  const thisGradeSecure = currentGradeRungsSecure(ladder, skills, gradeLevel)

  if (semester === 1 || !thisGradeSecure) {
    return {
      position,
      mix_rung: null,
      mix_next_grade: false,
      reason: thisGradeSecure
        ? 'This grade is solid — next-grade work starts in semester 2.'
        : `Still working on ${position.current_rung.label.toLowerCase()}.`,
    }
  }

  const mix = ladder.rungs.find((r) => r.grade === grade + 1 && !position.secured_keys.includes(r.key))
  if (!mix) {
    return {
      position,
      mix_rung: null,
      mix_next_grade: false,
      reason: 'This grade is solid, with nothing new to add yet.',
    }
  }

  return {
    position,
    mix_rung: mix,
    mix_next_grade: true,
    reason: `This grade is solid — weaving in ${mix.label.toLowerCase()}.`,
  }
}
