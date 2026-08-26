/**
 * Year Map of Big Ideas — a checklist, not a calendar.
 *
 * Grade-1 science and social-studies ideas that expeditions will not hit
 * unless something steers them. Status is derived from completed lessons,
 * evidence tags, and the activity log (same inputs as the coverage radar).
 * Thin/untouched ideas softly steer the next lesson, feed the selection
 * engine's Unknown card, and can carry a Life Explorers book.
 *
 * Benchmark codes are metadata for the readiness rollup and binder.
 */

import type { LeActivityLog, LeLearningEvidence, LeLesson } from './types'

export type YearMapSubject = 'science' | 'social_studies'
export type YearMapLevel = 'green' | 'thin' | 'untouched'

export interface YearMapIdea {
  key: string
  subject: YearMapSubject
  /** Kid prompt — the idea as a door, not a topic sentence. */
  kid_prompt: string
  /** Words that match lesson tags / evidence / activity subjects to this idea. */
  match_words: string[]
  /** One-line hint for weaving it into an expedition naturally. */
  weave_hint: string
  /** NGSSS benchmark strands this idea evidences. Metadata only. */
  benchmarks?: string[]
}

export const YEAR_MAP_IDEAS: YearMapIdea[] = [
  // --- Science (the practice of science is already every expedition) ---
  {
    key: 'sci-living-nonliving',
    subject: 'science',
    kid_prompt: 'What makes something alive? What does every animal need?',
    match_words: ['living', 'nonliving', 'alive', 'animal needs', 'basic needs', 'survive'],
    weave_hint: 'Any creature in any expedition: does it need air, water, food, space?',
    benchmarks: ['SC.1.L.14', 'SC.1.L.17'],
  },
  {
    key: 'sci-plant-parts',
    subject: 'science',
    kid_prompt: 'What are the parts of a plant, and what does each part do?',
    match_words: ['plant', 'roots', 'stem', 'leaves', 'flower', 'seed', 'garden'],
    weave_hint: 'One backyard plant, pulled gently or sketched: roots, stem, leaves, flower.',
    benchmarks: ['SC.1.L.14.1', 'SC.1.L.14.2'],
  },
  {
    key: 'sci-offspring',
    subject: 'science',
    kid_prompt: 'Why do babies look like their parents (and a little different)?',
    match_words: ['offspring', 'parents', 'baby animal', 'resemble', 'life cycle', 'hatch'],
    weave_hint: 'Any animal expedition: compare a chick and hen, a cub and bear.',
    benchmarks: ['SC.1.L.16.1'],
  },
  {
    key: 'sci-sort-properties',
    subject: 'science',
    kid_prompt: 'How can you sort the world? What sinks and what floats?',
    match_words: ['sort', 'properties', 'sink', 'float', 'texture', 'material', 'classify'],
    weave_hint: 'A bowl of water and five treasures: predict, test, sort.',
    benchmarks: ['SC.1.P.8.1'],
  },
  {
    key: 'sci-push-pull',
    subject: 'science',
    kid_prompt: 'What makes things move? Push, pull, fast, slow, zigzag.',
    match_words: ['push', 'pull', 'motion', 'force', 'move', 'roll', 'speed'],
    weave_hint: 'Anything with wheels, sleds, boats, or wind — name the push or pull.',
    benchmarks: ['SC.1.P.12.1', 'SC.1.P.13.1'],
  },
  {
    key: 'sci-sun-stars',
    subject: 'science',
    kid_prompt: 'What is the Sun? Why do things fall down? What do magnifiers do?',
    match_words: ['sun', 'star', 'stars', 'gravity', 'sky', 'magnifier', 'telescope', 'moon'],
    weave_hint: 'One evening sky watch or one dropped rock — gravity and stars are free.',
    benchmarks: ['SC.1.E.5.1', 'SC.1.E.5.2', 'SC.1.E.5.3', 'SC.1.E.5.4'],
  },
  {
    key: 'sci-earth-surface',
    subject: 'science',
    kid_prompt: 'What is Earth made of where we stand? Water, rocks, soil, safety near water.',
    match_words: ['earth surface', 'soil', 'rocks', 'sand', 'water safety', 'beach', 'ocean', 'river'],
    weave_hint: 'Any outdoor expedition: what is underfoot, and what does water do to it?',
    benchmarks: ['SC.1.E.6.1', 'SC.1.E.6.2', 'SC.1.E.6.3'],
  },
  // --- Social studies ---
  {
    key: 'ss-maps-globes',
    subject: 'social_studies',
    kid_prompt: 'How do maps and globes work? Which way is north?',
    match_words: ['map', 'globe', 'compass', 'cardinal', 'north', 'directions', 'continent', 'geography'],
    weave_hint: 'Every expedition has a place — find it on the globe, walk its direction.',
    benchmarks: ['SS.1.G.1'],
  },
  {
    key: 'ss-past-present',
    subject: 'social_studies',
    kid_prompt: 'What was life like before? What is the same, what changed?',
    match_words: ['past', 'present', 'history', 'long ago', 'timeline', 'old days', 'before'],
    weave_hint: 'One "how did explorers do this before phones?" beat inside any mission.',
    benchmarks: ['SS.1.A.1', 'SS.1.A.2'],
  },
  {
    key: 'ss-holidays-character',
    subject: 'social_studies',
    kid_prompt: 'Why do we celebrate? Who are people of character worth knowing?',
    match_words: ['holiday', 'celebration', 'hero', 'character', 'tradition', 'memorial'],
    weave_hint: 'The season carries this one — name the holiday\u2019s story when it arrives.',
    benchmarks: ['SS.1.A.3'],
  },
  {
    key: 'ss-community-rules',
    subject: 'social_studies',
    kid_prompt: 'Who helps a town run? Why do rules exist — and what do we agree in our family?',
    match_words: ['community', 'helpers', 'rules', 'laws', 'firefighter', 'responsibility', 'citizen'],
    weave_hint: 'Rules vs family agreements — "I choose" makes this VF Kids territory.',
    benchmarks: ['SS.1.C.1', 'SS.1.C.2'],
  },
  {
    key: 'ss-symbols',
    subject: 'social_studies',
    kid_prompt: 'What are the symbols of our country and Florida?',
    match_words: ['flag', 'symbol', 'eagle', 'anthem', 'florida', 'america', 'pledge'],
    weave_hint: 'Light touch, woven when natural — a flag spotted on a walk counts.',
    benchmarks: ['SS.1.C.3'],
  },
  {
    key: 'ss-wants-needs',
    subject: 'social_studies',
    kid_prompt: 'What is a want, what is a need? Who buys, who sells, who makes?',
    match_words: ['wants', 'needs', 'goods', 'services', 'buyer', 'seller', 'shop', 'trade', 'economy'],
    weave_hint: 'The Explorer Shop (money weeks) doubles as economics — name it there.',
    benchmarks: ['SS.1.E.1'],
  },
]

export interface YearMapStatus {
  idea: YearMapIdea
  level: YearMapLevel
  touches: number
  last_touched: string | null
}

interface YearMapInputs {
  lessons: Array<Pick<LeLesson, 'payload' | 'created_at' | 'status'>>
  evidence: Array<Pick<LeLearningEvidence, 'academic_tags' | 'created_at'>>
  activityLogs: Array<Pick<LeActivityLog, 'subjects' | 'entry_date'>>
}

function matchIdeas(text: string): string[] {
  const lower = text.toLowerCase()
  return YEAR_MAP_IDEAS.filter((idea) =>
    idea.match_words.some((w) => lower.includes(w))
  ).map((i) => i.key)
}

/**
 * Derive green / thin / untouched per Big Idea — whole school year, not a
 * 30-day window: a Big Idea genuinely met in September stays met in March.
 */
export function computeYearMap(inputs: YearMapInputs): YearMapStatus[] {
  const touches = new Map<string, { count: number; last: string | null }>()
  for (const idea of YEAR_MAP_IDEAS) touches.set(idea.key, { count: 0, last: null })

  function touch(keys: string[], dateIso: string) {
    for (const key of keys) {
      const t = touches.get(key)!
      t.count += 1
      if (!t.last || dateIso > t.last) t.last = dateIso
    }
  }

  for (const lesson of inputs.lessons) {
    if (lesson.status !== 'completed') continue
    const strands = [
      ...(lesson.payload?.objectives || []).map((o) => `${o.area} ${o.objective}`),
      ...(lesson.payload?.standards_tags || []),
      lesson.payload?.identity?.lesson_title || '',
      lesson.payload?.identity?.essential_question || '',
    ]
    for (const s of strands) touch(matchIdeas(s), lesson.created_at)
  }

  for (const ev of inputs.evidence) {
    for (const tag of ev.academic_tags || []) touch(matchIdeas(tag), ev.created_at)
  }

  for (const log of inputs.activityLogs) {
    for (const s of log.subjects || []) touch(matchIdeas(s), `${log.entry_date}T00:00:00Z`)
  }

  return YEAR_MAP_IDEAS.map((idea) => {
    const t = touches.get(idea.key)!
    const level: YearMapLevel = t.count >= 2 ? 'green' : t.count === 1 ? 'thin' : 'untouched'
    return {
      idea,
      level,
      touches: t.count,
      last_touched: t.last ? t.last.slice(0, 10) : null,
    }
  })
}

/**
 * Soft steer for the Lesson Composer — a couple of untouched ideas at a
 * time, with their weave hints. Never a worksheet bolt-on; if the active
 * wonder cannot take the idea, a Life Learning story page or a book
 * carries it that week instead.
 */
export function yearMapSteer(statuses: YearMapStatus[], limit = 2): string[] {
  return statuses
    .filter((s) => s.level === 'untouched')
    .slice(0, limit)
    .map(
      (s) =>
        `Big Idea not yet met: "${s.idea.kid_prompt}" — ${s.idea.weave_hint} Weave it in only if today's topic allows.`
    )
}

/** Untouched ideas — fuel for the selection engine's Unknown card and books. */
export function untouchedIdeas(statuses: YearMapStatus[]): YearMapIdea[] {
  return statuses.filter((s) => s.level === 'untouched').map((s) => s.idea)
}
