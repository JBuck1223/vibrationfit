/**
 * The two sequential ladders — expedition-independent scope-and-sequences
 * with mastery micro-checks. Expeditions supply context and joy; the
 * ladders supply sequence. Neither ever depends on the other.
 *
 * Math: K–5 progression; Life of Fred is the narrative layer on top.
 * Reading: systematic synthetic phonics (science-of-reading aligned),
 * practiced inside the expedition's story world (decodable mission logs).
 */

import type { LeSkillProgress } from './types'

export interface LadderRung {
  /** Stable key stored in le_skill_progress.skill */
  key: string
  label: string
  /** A 60-second mastery micro-check the parent can run verbally. */
  mastery_check: string
  /** Reading rungs: practice words for printable decodable cards. */
  decodable_words?: string[]
}

export interface Ladder {
  subject: 'math' | 'reading'
  rungs: LadderRung[]
}

export const MATH_LADDER: Ladder = {
  subject: 'math',
  rungs: [
    {
      key: 'math-counting-cardinality',
      label: 'Counting & cardinality to 20',
      mastery_check: 'Count 17 objects, then answer "how many?" without recounting.',
    },
    {
      key: 'math-counting-100',
      label: 'Count to 100 by 1s and 10s',
      mastery_check: 'Count aloud from 47 to 63, then count 10-20-30… to 100.',
    },
    {
      key: 'math-addition-within-10',
      label: 'Addition facts within 10',
      mastery_check: 'Answer 4+3, 6+2, 5+5 within a few seconds each, any order.',
    },
    {
      key: 'math-subtraction-within-10',
      label: 'Subtraction facts within 10',
      mastery_check: 'Answer 9−4, 7−3, 10−6 using fingers or objects if needed, then without.',
    },
    {
      key: 'math-place-value-tens-ones',
      label: 'Place value: tens and ones',
      mastery_check: 'Show 34 with blocks/objects as 3 tens and 4 ones and explain it.',
    },
    {
      key: 'math-add-sub-within-20',
      label: 'Add and subtract within 20',
      mastery_check: 'Solve 13+5 and 16−7 and explain how (counting on, making ten…).',
    },
    {
      key: 'math-measurement-length',
      label: 'Measure and compare lengths',
      mastery_check: 'Measure two objects with cubes or a ruler and say which is longer by how much.',
    },
    {
      key: 'math-time-money-intro',
      label: 'Time to the half hour; coin names',
      mastery_check: 'Read a clock at 3:30 and name penny, nickel, dime, quarter with values.',
    },
    {
      key: 'math-fractions-intro',
      label: 'Halves and quarters',
      mastery_check: 'Fold paper into halves and quarters and label each part.',
    },
    {
      key: 'math-multiplication-concept',
      label: 'Multiplication as equal groups',
      mastery_check: 'Show 3×4 as 3 groups of 4 objects and find the total.',
    },
    {
      key: 'math-early-algebraic',
      label: 'Early algebraic thinking',
      mastery_check: 'Solve the missing number: 7 + ___ = 12 and explain the thinking.',
    },
  ],
}

export const READING_LADDER: Ladder = {
  subject: 'reading',
  rungs: [
    {
      key: 'read-phonemic-awareness',
      label: 'Phonemic awareness',
      mastery_check: 'Say "cat" without the /k/. Blend /s/ /u/ /n/ into a word aloud.',
      decodable_words: ['at', 'am', 'an', 'it', 'in', 'up', 'on', 'us', 'if'],
    },
    {
      key: 'read-letter-sounds',
      label: 'Letter-sound correspondence',
      mastery_check: 'Give the sound for 10 random letters shown quickly, including short vowels.',
      decodable_words: ['a', 'e', 'i', 'o', 'u', 'm', 's', 't', 'p', 'n', 'c', 'd'],
    },
    {
      key: 'read-cvc-blending',
      label: 'Blend CVC words',
      mastery_check: 'Read map, sit, dog, fun, wet (no pictures) by blending sounds.',
      decodable_words: ['map', 'sit', 'dog', 'fun', 'wet', 'big', 'red', 'sun', 'top', 'bag', 'cod', 'cap'],
    },
    {
      key: 'read-digraphs',
      label: 'Digraphs (sh, ch, th, ck)',
      mastery_check: 'Read ship, chat, thin, duck and spell one of them aloud.',
      decodable_words: ['ship', 'chat', 'thin', 'duck', 'shop', 'chin', 'thick', 'pack', 'fish', 'path', 'chill', 'rock'],
    },
    {
      key: 'read-blends',
      label: 'Consonant blends',
      mastery_check: 'Read stop, flag, crab, jump without segmenting aloud first.',
      decodable_words: ['stop', 'flag', 'crab', 'jump', 'spot', 'swim', 'sled', 'frost', 'camp', 'trip', 'blast', 'grip'],
    },
    {
      key: 'read-silent-e',
      label: 'Silent e (a_e, i_e, o_e)',
      mastery_check: 'Read cap→cape, kit→kite, hop→hope and explain what the e does.',
      decodable_words: ['cape', 'kite', 'hope', 'ride', 'wave', 'bone', 'time', 'gate', 'life', 'note', 'safe', 'dive'],
    },
    {
      key: 'read-vowel-teams',
      label: 'Vowel teams (ai, ee, oa, ea)',
      mastery_check: 'Read rain, feet, boat, team in a short decodable sentence.',
      decodable_words: ['rain', 'feet', 'boat', 'team', 'seal', 'deep', 'coat', 'wait', 'sea', 'sleep', 'float', 'trail'],
    },
    {
      key: 'read-decodable-fluency',
      label: 'Decodable text fluency',
      mastery_check: 'Read a 4-sentence decodable mission log aloud with fewer than 3 stumbles.',
      decodable_words: ['mission', 'explore', 'frozen', 'discover', 'journey', 'report', 'brave', 'camp', 'trail', 'wind'],
    },
    {
      key: 'read-sight-vocabulary',
      label: 'High-frequency words',
      mastery_check: 'Read 15 high-frequency words (the, said, was, they…) on sight.',
      decodable_words: ['the', 'said', 'was', 'they', 'have', 'were', 'what', 'when', 'your', 'would', 'there', 'could'],
    },
    {
      key: 'read-comprehension-retell',
      label: 'Retell and comprehension',
      mastery_check: 'After a read-aloud, retell beginning / middle / end in own words.',
      decodable_words: ['first', 'next', 'then', 'last', 'because', 'before', 'after', 'suddenly', 'finally'],
    },
  ],
}

export interface LadderPosition {
  subject: 'math' | 'reading'
  current_rung: LadderRung
  rung_index: number
  total_rungs: number
  secured_keys: string[]
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
  const g = (gradeLevel || '').trim().toUpperCase()
  const grade =
    g.startsWith('K') || g.startsWith('P') ? 0 : parseInt(g.replace(/\D/g, ''), 10) || 0
  if (ladder.subject === 'reading') {
    if (grade <= 0) return 0
    if (grade === 1) return 2 // CVC blending (quick review, then digraphs)
    if (grade === 2) return 5 // silent e
    return 7 // decodable fluency
  }
  if (grade <= 0) return 0
  if (grade === 1) return 1 // count to 100
  if (grade === 2) return 4 // place value
  return 8 // fractions
}

/**
 * Determine the current rung: the first rung not yet 'secure' at or above
 * the grade floor. A rung explicitly observed as struggling (needs_support /
 * emerging / developing) pulls placement down to it, even below the floor.
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
  }
}
