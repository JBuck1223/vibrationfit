/**
 * Sequential ladders — expedition-independent scope-and-sequences
 * with mastery micro-checks. Expeditions supply context and joy; the
 * ladders supply sequence. Neither ever depends on the other.
 *
 * Each rung carries a grade. Do not climb until `secure`.
 * Semester 1: secure this grade. Semester 2: mix the next grade only
 * where this grade is already secure.
 *
 * Reading and math practice is usually authored inside the expedition
 * on the current rung. Sequence is a working bet; materials may be
 * VF layered books, household, library, or another publisher's page.
 */

import type { LeSkillProgress } from './types'

export interface LadderRung {
  /** Stable key stored in le_skill_progress.skill */
  key: string
  label: string
  /** Typical grade this rung belongs to (K = 0). */
  grade: number
  /** A 60-second mastery micro-check the parent can run verbally. */
  mastery_check: string
  /** Reading rungs: practice words for printable decodable cards. */
  decodable_words?: string[]
  /** Florida benchmark codes this rung evidences (B.E.S.T. / NGSSS). Metadata only. */
  benchmarks?: string[]
}

export interface Ladder {
  subject: 'math' | 'reading' | 'writing'
  rungs: LadderRung[]
}

export const MATH_LADDER: Ladder = {
  subject: 'math',
  rungs: [
    {
      key: 'math-counting-cardinality',
      label: 'Counting & cardinality to 20',
      grade: 0,
      mastery_check: 'Count 17 objects, then answer "how many?" without recounting.',
      benchmarks: ['MA.K.NSO.1.1'],
    },
    {
      key: 'math-counting-100',
      label: 'Count to 100 by 1s and 10s',
      grade: 1,
      mastery_check: 'Count aloud from 47 to 63, then count 10-20-30… to 100.',
      benchmarks: ['MA.1.NSO.1.1'],
    },
    {
      key: 'math-skip-counting',
      label: 'Skip count by 2s to 20 and 5s to 100',
      grade: 1,
      mastery_check: 'Count 2-4-6… to 20, then 5-10-15… to 100, without stalling.',
      benchmarks: ['MA.1.NSO.1.1'],
    },
    {
      key: 'math-numbers-to-100',
      label: 'Read and write numbers to 100',
      grade: 1,
      mastery_check: 'Read 74 aloud, write "sixty-two" as digits, and show 38 as 30 + 8.',
      benchmarks: ['MA.1.NSO.1.2', 'MA.1.NSO.1.3'],
    },
    {
      key: 'math-place-value-tens-ones',
      label: 'Place value: tens and ones',
      grade: 1,
      mastery_check: 'Show 34 with blocks/objects as 3 tens and 4 ones and explain it.',
      benchmarks: ['MA.1.NSO.1.3'],
    },
    {
      key: 'math-compare-order-100',
      label: 'Plot, order, and compare to 100',
      grade: 1,
      mastery_check: 'Put 47, 74, 39 in order, point to about where 50 lives on a number line.',
      benchmarks: ['MA.1.NSO.1.4'],
    },
    {
      key: 'math-addition-within-10',
      label: 'Addition facts within 10',
      grade: 1,
      mastery_check: 'Answer 4+3, 6+2, 5+5 within a few seconds each, any order.',
      benchmarks: ['MA.1.NSO.2.1'],
    },
    {
      key: 'math-subtraction-within-10',
      label: 'Subtraction facts within 10',
      grade: 1,
      mastery_check: 'Answer 9−4, 7−3, 10−6 using fingers or objects if needed, then without.',
      benchmarks: ['MA.1.NSO.2.1'],
    },
    {
      key: 'math-add-sub-within-20',
      label: 'Add and subtract within 20',
      grade: 1,
      mastery_check: 'Solve 13+5 and 16−7 and explain how (counting on, making ten…).',
      benchmarks: ['MA.1.NSO.2.2', 'MA.1.AR.1.1'],
    },
    {
      key: 'math-ten-more-less',
      label: 'Ten more, ten less',
      grade: 1,
      mastery_check: 'Say ten more than 43 and ten less than 60 without counting by ones.',
      benchmarks: ['MA.1.NSO.2.3'],
    },
    {
      key: 'math-two-digit-plus-one',
      label: 'Two-digit plus one-digit (explore)',
      grade: 1,
      mastery_check: 'Solve 24+3 and 37+5 with objects or a number line and explain.',
      benchmarks: ['MA.1.NSO.2.4'],
    },
    {
      key: 'math-three-addends-equations',
      label: 'Three addends; missing numbers; true or false',
      grade: 1,
      mastery_check: 'Solve 2+5+3, find 7+___=12, and say whether 6+2=9 is true or false.',
      benchmarks: ['MA.1.AR.1.2', 'MA.1.AR.2.1', 'MA.1.AR.2.3'],
    },
    {
      key: 'math-measurement-length',
      label: 'Measure and compare lengths',
      grade: 1,
      mastery_check: 'Measure two objects with cubes or a ruler and say which is longer by how much.',
      benchmarks: ['MA.1.M.1.1', 'MA.1.M.1.2'],
    },
    {
      key: 'math-geometry-2d-3d',
      label: 'Sort, sketch, and compose shapes',
      grade: 1,
      mastery_check: 'Sort a handful of shapes by sides, sketch a triangle and rectangle, build a new shape from two.',
      benchmarks: ['MA.1.GR.1.1', 'MA.1.GR.1.2', 'MA.1.GR.1.3'],
    },
    {
      key: 'math-fractions-intro',
      label: 'Halves and quarters',
      grade: 1,
      mastery_check: 'Fold paper into halves and quarters and label each part.',
      benchmarks: ['MA.1.GR.1.4'],
    },
    {
      key: 'math-data-tally-pictographs',
      label: 'Tally marks and pictographs',
      grade: 1,
      mastery_check: 'Tally a quick survey (favorite animals), then read a simple pictograph.',
      benchmarks: ['MA.1.DP.1.1', 'MA.1.DP.1.2'],
    },
    // Optional stretch — after the grade-1 rungs, never a required grade-1 step.
    {
      key: 'math-multiplication-concept',
      label: 'Multiplication as equal groups',
      grade: 2,
      mastery_check: 'Show 3×4 as 3 groups of 4 objects and find the total.',
      benchmarks: ['MA.2.AR'],
    },
    {
      key: 'math-early-algebraic',
      label: 'Early algebraic thinking',
      grade: 2,
      mastery_check: 'Solve the missing number: 17 + ___ = 25 and explain the thinking.',
      benchmarks: ['MA.2.AR'],
    },
  ],
}

export const READING_LADDER: Ladder = {
  subject: 'reading',
  rungs: [
    {
      key: 'read-phonemic-awareness',
      label: 'Phonemic awareness',
      grade: 0,
      mastery_check: 'Say "cat" without the /k/. Blend /s/ /u/ /n/ into a word aloud.',
      decodable_words: ['at', 'am', 'an', 'it', 'in', 'up', 'on', 'us', 'if'],
      benchmarks: ['ELA.K.F.1.2'],
    },
    {
      key: 'read-letter-sounds',
      label: 'Letter-sound correspondence',
      grade: 0,
      mastery_check: 'Give the sound for 10 random letters shown quickly, including short vowels.',
      decodable_words: ['a', 'e', 'i', 'o', 'u', 'm', 's', 't', 'p', 'n', 'c', 'd'],
      benchmarks: ['ELA.K.F.1.3'],
    },
    {
      key: 'read-cvc-blending',
      label: 'Blend CVC words',
      grade: 1,
      mastery_check: 'Read map, sit, dog, fun, wet (no pictures) by blending sounds.',
      decodable_words: ['map', 'sit', 'dog', 'fun', 'wet', 'big', 'red', 'sun', 'top', 'bag', 'cod', 'cap'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-digraphs',
      label: 'Digraphs (sh, ch, th, ck)',
      grade: 1,
      mastery_check: 'Read ship, chat, thin, duck and spell one of them aloud.',
      decodable_words: ['ship', 'chat', 'thin', 'duck', 'shop', 'chin', 'thick', 'pack', 'fish', 'path', 'chill', 'rock'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-blends',
      label: 'Consonant blends',
      grade: 1,
      mastery_check: 'Read stop, flag, crab, jump without segmenting aloud first.',
      decodable_words: ['stop', 'flag', 'crab', 'jump', 'spot', 'swim', 'sled', 'frost', 'camp', 'trip', 'blast', 'grip'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-silent-e',
      label: 'Silent e (a_e, i_e, o_e)',
      grade: 1,
      mastery_check: 'Read cap→cape, kit→kite, hop→hope and explain what the e does.',
      decodable_words: ['cape', 'kite', 'hope', 'ride', 'wave', 'bone', 'time', 'gate', 'life', 'note', 'safe', 'dive'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-vowel-teams',
      label: 'Vowel teams (ai, ee, oa, ea)',
      grade: 1,
      mastery_check: 'Read rain, feet, boat, team in a short decodable sentence.',
      decodable_words: ['rain', 'feet', 'boat', 'team', 'seal', 'deep', 'coat', 'wait', 'sea', 'sleep', 'float', 'trail'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-r-controlled',
      label: 'R-controlled vowels (ar, or, er/ir/ur)',
      grade: 1,
      mastery_check: 'Read car, storm, bird, hurt and one of them in a sentence.',
      decodable_words: ['car', 'storm', 'bird', 'hurt', 'star', 'fort', 'her', 'turn', 'shark', 'corn', 'girl', 'burst'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-inflectional-endings',
      label: 'Endings (-s, -ed, -ing)',
      grade: 1,
      mastery_check: 'Read jumps, jumped, jumping and tell how the ending changes the word.',
      decodable_words: ['jumps', 'jumped', 'jumping', 'digs', 'digging', 'looked', 'looking', 'plays', 'played', 'camping'],
      benchmarks: ['ELA.1.F.1.3'],
    },
    {
      key: 'read-decodable-fluency',
      label: 'Decodable text fluency',
      grade: 1,
      mastery_check: 'Read a 4-sentence decodable mission log aloud with fewer than 3 stumbles.',
      decodable_words: ['mission', 'explore', 'frozen', 'discover', 'journey', 'report', 'brave', 'camp', 'trail', 'wind'],
      benchmarks: ['ELA.1.F.1.4'],
    },
    {
      key: 'read-sight-vocabulary',
      label: 'High-frequency words',
      grade: 1,
      mastery_check: 'Read 15 high-frequency words (the, said, was, they…) on sight.',
      decodable_words: ['the', 'said', 'was', 'they', 'have', 'were', 'what', 'when', 'your', 'would', 'there', 'could'],
      benchmarks: ['ELA.1.F.1.4'],
    },
    {
      key: 'read-comprehension-retell',
      label: 'Retell and comprehension',
      grade: 1,
      mastery_check: 'After a read-aloud, retell beginning / middle / end in own words.',
      decodable_words: ['first', 'next', 'then', 'last', 'because', 'before', 'after', 'suddenly', 'finally'],
      benchmarks: ['ELA.1.R.1.1'],
    },
    {
      key: 'read-multisyllable',
      label: 'Two-syllable words',
      grade: 2,
      mastery_check: 'Read penguin, frozen, explorer, habitat by chunks, then the whole word.',
      decodable_words: ['penguin', 'frozen', 'explorer', 'habitat', 'island', 'number', 'problem', 'because'],
      benchmarks: ['ELA.2.F.1'],
    },
    {
      key: 'read-chapter-retell',
      label: 'Chapter retell with because',
      grade: 2,
      mastery_check: 'After a short chapter, retell and answer one "why" with because.',
      decodable_words: ['because', 'although', 'instead', 'finally', 'suddenly', 'together'],
      benchmarks: ['ELA.2.R.1'],
    },
  ],
}

export const WRITING_LADDER: Ladder = {
  subject: 'writing',
  rungs: [
    {
      key: 'write-print-one-sentence',
      label: 'Print letters; one true sentence',
      grade: 1,
      mastery_check: 'Write one true sentence about today with a capital and an end mark, legibly.',
      benchmarks: ['ELA.1.C.1.1'],
    },
    {
      key: 'write-narrative-first-next-last',
      label: 'Narrative: first, next, last',
      grade: 1,
      mastery_check: 'Tell and write a tiny story of something that happened, in order: first / next / last.',
      benchmarks: ['ELA.1.C.1.2'],
    },
    {
      key: 'write-informational',
      label: 'Informational: "I found out…"',
      grade: 1,
      mastery_check: 'Write two sentences that teach a fact he discovered, starting "I found out…".',
      benchmarks: ['ELA.1.C.1.4'],
    },
    {
      key: 'write-opinion',
      label: 'Opinion: "I love ___ because…"',
      grade: 1,
      mastery_check: 'Write an opinion with one reason: "I love ___ because ___."',
      benchmarks: ['ELA.1.C.1.3'],
    },
    {
      key: 'write-revise-with-guidance',
      label: 'Revise one thing with guidance',
      grade: 1,
      mastery_check: 'Reread a sentence with you and improve one thing (a word, an end mark, a detail).',
      benchmarks: ['ELA.1.C.1.5'],
    },
  ],
}

export interface LadderPosition {
  subject: 'math' | 'reading' | 'writing'
  current_rung: LadderRung
  rung_index: number
  total_rungs: number
  secured_keys: string[]
  /** True when every rung at the child's current grade is secure. */
  current_grade_secure: boolean
}

export function parseGradeLevel(gradeLevel?: string | null): number {
  const g = (gradeLevel || '').trim().toUpperCase()
  if (g.startsWith('K') || g.startsWith('P')) return 0
  const n = parseInt(g.replace(/\D/g, ''), 10)
  return Number.isFinite(n) ? n : 1
}

/**
 * Grade-based starting rung when observation hasn't said otherwise.
 * Phonemic awareness and letter sounds are kindergarten skills — a
 * typical 1st grader starts at CVC review, not phoneme drills. Explicit
 * observed struggle (a recorded non-secure status on an earlier rung)
 * always overrides the floor: placement is grade-informed, never
 * grade-blind.
 */
function gradeFloorIndex(ladder: Ladder, gradeLevel?: string | null): number {
  const grade = parseGradeLevel(gradeLevel)
  const idx = ladder.rungs.findIndex((r) => r.grade >= grade)
  return idx === -1 ? 0 : idx
}

export function currentGradeRungsSecure(
  ladder: Ladder,
  skills: LeSkillProgress[],
  gradeLevel?: string | null
): boolean {
  const grade = parseGradeLevel(gradeLevel)
  const secured = new Set(
    skills.filter((s) => s.subject === ladder.subject && s.status === 'secure').map((s) => s.skill)
  )
  const current = ladder.rungs.filter((r) => r.grade === grade)
  if (current.length === 0) return true
  return current.every((r) => secured.has(r.key))
}

/**
 * Determine the current rung: the first rung not yet 'secure' at or above
 * the grade floor. A rung explicitly observed as struggling (needs_support /
 * emerging / developing) pulls placement down to it, even below the floor.
 * Never climb past an unsecured rung.
 */
export function currentLadderPosition(
  ladder: Ladder,
  skills: LeSkillProgress[],
  gradeLevel?: string | null
): LadderPosition {
  const subjectSkills = skills.filter((s) => s.subject === ladder.subject)
  const secured = new Set(
    subjectSkills.filter((s) => s.status === 'secure').map((s) => s.skill)
  )
  const struggling = new Set(
    subjectSkills.filter((s) => s.status !== 'secure').map((s) => s.skill)
  )
  const floor = gradeFloorIndex(ladder, gradeLevel)

  let idx = ladder.rungs.findIndex((r, i) => i >= floor && !secured.has(r.key))
  if (idx === -1) idx = ladder.rungs.length - 1

  const strugglingIdx = ladder.rungs.findIndex((r) => struggling.has(r.key))
  if (strugglingIdx !== -1 && strugglingIdx < idx) idx = strugglingIdx

  return {
    subject: ladder.subject,
    current_rung: ladder.rungs[idx],
    rung_index: idx,
    total_rungs: ladder.rungs.length,
    secured_keys: [...secured],
    current_grade_secure: currentGradeRungsSecure(ladder, skills, gradeLevel),
  }
}

export function rungByKey(ladder: Ladder, key: string): LadderRung | undefined {
  return ladder.rungs.find((r) => r.key === key)
}

export type StrengthBand = 'strong' | 'wobbly' | 'untouched'

export interface RungWeather {
  rung: LadderRung
  band: StrengthBand
  status: LeSkillProgress['status'] | null
}

/** Progress view: strong vs wobbly vs not yet tried — no gold stars for covering. */
export function ladderWeather(
  ladder: Ladder,
  skills: LeSkillProgress[],
  gradeLevel?: string | null
): RungWeather[] {
  const grade = parseGradeLevel(gradeLevel)
  const byKey = new Map(skills.filter((s) => s.subject === ladder.subject).map((s) => [s.skill, s]))
  return ladder.rungs
    .filter((r) => r.grade === grade || r.grade === grade + 1)
    .map((rung) => {
      const row = byKey.get(rung.key)
      if (!row) return { rung, band: 'untouched' as const, status: null }
      if (row.status === 'secure') return { rung, band: 'strong' as const, status: row.status }
      return { rung, band: 'wobbly' as const, status: row.status }
    })
}
