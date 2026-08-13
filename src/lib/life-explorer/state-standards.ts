/**
 * State Requirements Engine — designed for all 50 states, shipped
 * Florida-first. Compliance is derived from lesson records, evidence, and
 * the activity log. The parent never fills out a standards form.
 */

import type { LeActivityLog, LeLearningEvidence, LeLesson, LeSkillProgress } from './types'

// ---------------------------------------------------------------------------
// State profiles
// ---------------------------------------------------------------------------

export interface StateProfile {
  code: string
  name: string
  statute: string
  notice_of_intent: string
  record_keeping: string[]
  evaluation_options: string[]
  recommended_evaluation: string
  portfolio_retention_years: number
  required_approach: string
}

export const FLORIDA_PROFILE: StateProfile = {
  code: 'FL',
  name: 'Florida',
  statute: 'F.S. 1002.41 (Home Education Program)',
  notice_of_intent:
    'File a letter with the county superintendent within 30 days of beginning homeschool (child name, birth date, address). File once; no annual re-filing unless you move counties.',
  record_keeping: [
    'Daily log of educational activities, made contemporaneously',
    'Samples of the student\u2019s work (writing, math, art, projects, photos)',
    'Reading list: titles and authors of books read or read to the child',
  ],
  evaluation_options: [
    'Portfolio review by a Florida-certified teacher',
    'Nationally normed achievement test',
    'State student assessment test',
    'Psychological evaluation',
    'Other valid measurement agreed with the superintendent',
  ],
  recommended_evaluation:
    'Portfolio review by a Florida-certified teacher — the natural fit for this curriculum; due annually on the anniversary of the Notice of Intent.',
  portfolio_retention_years: 2,
  required_approach:
    'Sequentially progressive instruction — each year builds on the previous. Demonstrated automatically by the skill progress timeline (emerging → developing → secure).',
}

export const STATE_PROFILES: Record<string, StateProfile> = {
  FL: FLORIDA_PROFILE,
}

export function stateProfile(code: string | null | undefined): StateProfile {
  return STATE_PROFILES[(code || 'FL').toUpperCase()] || FLORIDA_PROFILE
}

// ---------------------------------------------------------------------------
// Subject areas + standards crosswalk
// ---------------------------------------------------------------------------

export type SubjectAreaKey =
  | 'ela'
  | 'math'
  | 'science'
  | 'social_studies'
  | 'pe_health'
  | 'arts'

export interface SubjectArea {
  key: SubjectAreaKey
  label: string
  /** Florida benchmark family shown on exports (B.E.S.T. / NGSSS). */
  fl_benchmark_family: string
  /** Words that map free-text subjects/tags/objective areas to this area. */
  match_words: string[]
}

export const SUBJECT_AREAS: SubjectArea[] = [
  {
    key: 'ela',
    label: 'English Language Arts',
    fl_benchmark_family: 'ELA.1 (B.E.S.T.)',
    match_words: [
      'ela', 'reading', 'writing', 'phonics', 'literacy', 'language',
      'vocabulary', 'spelling', 'handwriting', 'speaking', 'listening',
      'journal', 'story', 'narration',
    ],
  },
  {
    key: 'math',
    label: 'Mathematics',
    fl_benchmark_family: 'MA.1 (B.E.S.T.)',
    match_words: [
      'math', 'mathematics', 'counting', 'number', 'addition', 'subtraction',
      'measurement', 'measuring', 'geometry', 'fractions', 'place value',
    ],
  },
  {
    key: 'science',
    label: 'Science',
    fl_benchmark_family: 'SC.1 (NGSSS)',
    match_words: [
      'science', 'experiment', 'observation', 'nature', 'animals', 'biology',
      'physics', 'earth', 'weather', 'insulation', 'prediction', 'habitat',
    ],
  },
  {
    key: 'social_studies',
    label: 'Social Studies',
    fl_benchmark_family: 'SS.1 (NGSSS)',
    match_words: [
      'social studies', 'geography', 'map', 'history', 'community', 'civics',
      'culture', 'economics', 'continent', 'explorer',
    ],
  },
  {
    key: 'pe_health',
    label: 'PE / Health',
    fl_benchmark_family: 'PE.1 / HE.1',
    match_words: [
      'pe', 'physical', 'movement', 'exercise', 'health', 'nutrition',
      'body', 'motor', 'outdoor play', 'game',
    ],
  },
  {
    key: 'arts',
    label: 'Art / Music / Creative',
    fl_benchmark_family: 'VA.1 / MU.1',
    match_words: [
      'art', 'drawing', 'painting', 'craft', 'music', 'singing', 'creative',
      'building', 'diorama', 'design', 'theater', 'acting',
    ],
  },
]

/** Map any free-text strand (subject, tag, objective area) to subject areas. */
export function matchSubjectAreas(text: string): SubjectAreaKey[] {
  const lower = text.toLowerCase()
  return SUBJECT_AREAS.filter((area) =>
    area.match_words.some((w) => lower.includes(w))
  ).map((a) => a.key)
}

// ---------------------------------------------------------------------------
// Coverage radar
// ---------------------------------------------------------------------------

export type CoverageLevel = 'green' | 'thin' | 'untouched'

export interface SubjectCoverage {
  area: SubjectArea
  touches_last_30_days: number
  level: CoverageLevel
  last_touched: string | null
}

interface CoverageInputs {
  lessons: Array<Pick<LeLesson, 'payload' | 'created_at' | 'status'>>
  evidence: Array<Pick<LeLearningEvidence, 'academic_tags' | 'created_at'>>
  activityLogs: Array<Pick<LeActivityLog, 'subjects' | 'entry_date'>>
}

/**
 * Compute the coverage radar: green (3+ touches in 30 days),
 * thin (1–2), untouched (0). Thin/untouched areas softly weight
 * future lesson generation — never guilt.
 */
export function computeCoverage(inputs: CoverageInputs, now = new Date()): SubjectCoverage[] {
  const cutoff = new Date(now.getTime() - 30 * 86_400_000).toISOString()
  const touches = new Map<SubjectAreaKey, { count: number; last: string | null }>()
  for (const area of SUBJECT_AREAS) touches.set(area.key, { count: 0, last: null })

  function touch(keys: SubjectAreaKey[], dateIso: string) {
    for (const key of keys) {
      const t = touches.get(key)!
      if (dateIso >= cutoff) t.count += 1
      if (!t.last || dateIso > t.last) t.last = dateIso
    }
  }

  for (const lesson of inputs.lessons) {
    if (lesson.status !== 'completed') continue
    const strands = [
      ...(lesson.payload?.objectives || []).map((o) => `${o.area} ${o.objective}`),
      ...(lesson.payload?.standards_tags || []),
    ]
    for (const s of strands) touch(matchSubjectAreas(s), lesson.created_at)
  }

  for (const ev of inputs.evidence) {
    for (const tag of ev.academic_tags || []) touch(matchSubjectAreas(tag), ev.created_at)
  }

  for (const log of inputs.activityLogs) {
    for (const s of log.subjects || []) touch(matchSubjectAreas(s), `${log.entry_date}T00:00:00Z`)
  }

  return SUBJECT_AREAS.map((area) => {
    const t = touches.get(area.key)!
    const level: CoverageLevel = t.count >= 3 ? 'green' : t.count >= 1 ? 'thin' : 'untouched'
    return {
      area,
      touches_last_30_days: t.count,
      level,
      last_touched: t.last ? t.last.slice(0, 10) : null,
    }
  })
}

/** Thin/untouched areas, phrased as a soft steer for the Lesson Composer. */
export function coverageSteer(coverage: SubjectCoverage[]): string[] {
  return coverage
    .filter((c) => c.level !== 'green')
    .map(
      (c) =>
        `${c.area.label} is ${c.level === 'thin' ? 'lightly touched' : 'untouched'} lately — weave it in naturally if the topic allows (never as a worksheet bolt-on).`
    )
}

// ---------------------------------------------------------------------------
// Sequential progress proof
// ---------------------------------------------------------------------------

export function progressTimeline(skills: LeSkillProgress[]) {
  return skills
    .filter((s) => s.last_observed)
    .sort((a, b) => (a.last_observed || '').localeCompare(b.last_observed || ''))
    .map((s) => ({
      date: s.last_observed,
      skill: s.skill,
      subject: s.subject,
      status: s.status,
    }))
}
