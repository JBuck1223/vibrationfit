/**
 * Florida ledger weather — derived from evidence, ladders, and the
 * activity log. Not a form. Not someone else's scope-and-sequence.
 */

import { ladderWeather, MATH_LADDER, READING_LADDER, parseGradeLevel, type RungWeather } from './ladders'
import { resolveSemester, type SemesterWindows } from './semester'
import { computeCoverage, stateProfile, type CoverageLevel } from './state-standards'
import type { LeSkillProgress, LeYearArc } from './types'

export interface LedgerWeather {
  state_name: string
  statute: string
  semester: SemesterWindows
  grade_label: string
  areas: Array<{
    label: string
    family: string
    level: CoverageLevel
    touches: number
    last_touched: string | null
    weather: string
  }>
  math: RungWeather[]
  reading: RungWeather[]
  sequentially_progressive: boolean
}

function weatherLine(level: CoverageLevel, touches: number): string {
  if (level === 'green') return `Steady — ${touches} touches in the last 30 days.`
  if (level === 'thin') return `Light — ${touches} ${touches === 1 ? 'touch' : 'touches'} in the last 30 days.`
  return 'Quiet — nothing logged here in the last 30 days.'
}

export function buildLedgerWeather(input: {
  stateCode?: string | null
  gradeLevel?: string | null
  yearArc?: LeYearArc | null
  skills: LeSkillProgress[]
  coverage: ReturnType<typeof computeCoverage>
}): LedgerWeather {
  const profile = stateProfile(input.stateCode)
  const semester = resolveSemester(input.gradeLevel, input.yearArc)
  const grade = parseGradeLevel(input.gradeLevel)
  const math = ladderWeather(MATH_LADDER, input.skills, input.gradeLevel)
  const reading = ladderWeather(READING_LADDER, input.skills, input.gradeLevel)
  const strong = [...math, ...reading].filter((r) => r.band === 'strong').length
  const wobbly = [...math, ...reading].filter((r) => r.band === 'wobbly').length

  return {
    state_name: profile.name,
    statute: profile.statute,
    semester,
    grade_label: grade === 0 ? 'K' : String(grade),
    areas: input.coverage.map((c) => ({
      label: c.area.label,
      family: c.area.fl_benchmark_family,
      level: c.level,
      touches: c.touches_last_30_days,
      last_touched: c.last_touched,
      weather: weatherLine(c.level, c.touches_last_30_days),
    })),
    math,
    reading,
    sequentially_progressive: strong > 0 || wobbly > 0,
  }
}
