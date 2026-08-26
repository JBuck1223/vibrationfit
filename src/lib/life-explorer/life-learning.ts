/**
 * Life Learning Resources — year-long practice worlds beside the expedition.
 *
 * A resource is not a unit. It is a repeatable practice world (sight words,
 * time, money, sentences, facts, the Life Compass) that shows up a little
 * every week all year. Expeditions supply joy and dressing; these supply
 * the steady life skills a Florida 1st grader owns by spring.
 *
 * Progress lives on le_skill_progress with subject 'life_learning' and
 * skill = the rung key below. No new tables.
 */

import { compassSliceForWeek } from './vf-kids'
import type { LeSkillProgress } from './types'

export type LifeLearningKey =
  | 'sight-words'
  | 'time'
  | 'money'
  | 'sentences'
  | 'facts-to-10'
  | 'life-compass'

export interface LifeLearningRung {
  /** Stored in le_skill_progress.skill (subject 'life_learning'). */
  key: string
  label: string
  mastery_check: string
  benchmarks?: string[]
}

export interface LifeLearningResource {
  key: LifeLearningKey
  /** Kid name. */
  name: string
  /** One-line year-long job. */
  job: string
  rungs: LifeLearningRung[]
  /** How it shows up in the weekly packet. */
  packet: string
  benchmarks?: string[]
}

export const LIFE_LEARNING_RESOURCES: LifeLearningResource[] = [
  {
    key: 'sight-words',
    name: 'Words I Just Know',
    job: 'The Polk 143 on sight by spring — 12 cards rotate every week.',
    packet: '12 sight-word cards (already in the weekly packet).',
    benchmarks: ['ELA.1.F.1.4'],
    rungs: [
      { key: 'll-sight-q1', label: 'Quarter 1 words on sight', mastery_check: 'Read 10 random quarter-1 words with no sounding out.' },
      { key: 'll-sight-q2', label: 'Quarter 2 words on sight', mastery_check: 'Read 10 random quarter-2 words with no sounding out.' },
      { key: 'll-sight-q3', label: 'Quarter 3 words on sight', mastery_check: 'Read 10 random quarter-3 words with no sounding out.' },
      { key: 'll-sight-q4', label: 'All 143 on sight', mastery_check: 'Read 15 random words from the whole list, quick and easy.' },
    ],
  },
  {
    key: 'time',
    name: 'When Things Happen',
    job: 'Hour and half hour, analog and digital, AM/PM — life stories and the fridge clock.',
    packet: 'A clock story page and cut-out clock faces on time-focus weeks.',
    benchmarks: ['MA.1.M.2.1'],
    rungs: [
      { key: 'll-time-hour', label: 'Time to the hour', mastery_check: 'Read a clock at 3:00 and 8:00 and say one thing that happens then.' },
      { key: 'll-time-half-hour', label: 'Time to the half hour', mastery_check: 'Read 3:30 and 7:30 on analog and digital clocks.' },
      { key: 'll-time-am-pm', label: 'AM and PM in his day', mastery_check: 'Say one thing he does at 7 AM and one at 7 PM, and which is which.' },
    ],
  },
  {
    key: 'money',
    name: 'What Coins Can Do',
    job: 'Coins, values, and making amounts — a standing Explorer Shop.',
    packet: 'A coin story page and cut-out coins on money-focus weeks.',
    benchmarks: ['MA.1.M.2.2', 'MA.1.M.2.3'],
    rungs: [
      { key: 'll-money-names', label: 'Coin names and values', mastery_check: 'Name penny, nickel, dime, quarter and their values, mixed order.' },
      { key: 'll-money-count', label: 'Count small coin piles', mastery_check: 'Count a pile of dimes and pennies (like 43\u00a2) touching each coin once.' },
      { key: 'll-money-25', label: 'Make 25\u00a2 two ways', mastery_check: 'Build 25\u00a2 two different ways at the Explorer Shop.' },
    ],
  },
  {
    key: 'sentences',
    name: 'My Life Sentences',
    job: 'Capitals, end marks, 1\u20133 true present-tense sentences about his own life.',
    packet: 'Field notes pages already ask for his sentences — this is the standard they grow toward.',
    benchmarks: ['ELA.1.C.1.1'],
    rungs: [
      { key: 'll-sentences-one', label: 'One true sentence', mastery_check: 'Write one true sentence with a capital and an end mark.' },
      { key: 'll-sentences-three', label: 'Three sentences about his life', mastery_check: 'Write three connected sentences about something he did today.' },
    ],
  },
  {
    key: 'facts-to-10',
    name: 'Fast Numbers',
    job: 'Addition and subtraction facts to 10, automatic — a 5-minute game, year-long.',
    packet: 'No page — it is a game inside the lesson\u2019s foundational block.',
    benchmarks: ['MA.1.NSO.2.1'],
    rungs: [
      { key: 'll-facts-add-10', label: 'Addition facts to 10, fast', mastery_check: 'Ten mixed addition facts in under a minute, smiling.' },
      { key: 'll-facts-sub-10', label: 'Subtraction facts to 10, fast', mastery_check: 'Ten mixed subtraction facts in under a minute.' },
    ],
  },
  {
    key: 'life-compass',
    name: 'Life Compass',
    job: '12 places on his life map plus 3 truths he can act — one slice per week as a lens.',
    packet: 'One compass card on compass-focus weeks; the fridge compass colors in slice by slice.',
    rungs: [
      { key: 'll-compass-truths', label: 'The three truths in his words', mastery_check: 'Say "I get to choose" about a real choice he made this week.' },
      { key: 'll-compass-slices', label: 'A story for every slice', mastery_check: 'Point at any colored slice on the fridge compass and tell its story.' },
    ],
  },
]

export function lifeLearningResource(key: LifeLearningKey): LifeLearningResource {
  return LIFE_LEARNING_RESOURCES.find((r) => r.key === key)!
}

/**
 * Weekly focus rotation: time, money, compass — one per week.
 * Sight words and reading cards appear every week regardless; facts-to-10
 * is a 5-minute game whenever the math rung is facts.
 */
const FOCUS_ROTATION: LifeLearningKey[] = ['time', 'money', 'life-compass']

export interface WeeklyLifeLearningFocus {
  resource: LifeLearningResource
  /** The current (first non-secure) rung for the focus. */
  rung: LifeLearningRung
  /** Compass weeks: the slice of the week. */
  compass_slice_key: string | null
}

export function weeklyLifeLearningFocus(
  skills: LeSkillProgress[],
  date = new Date()
): WeeklyLifeLearningFocus {
  const jan1 = new Date(date.getFullYear(), 0, 1)
  const week = Math.floor((date.getTime() - jan1.getTime()) / (7 * 86_400_000))
  const resource = lifeLearningResource(FOCUS_ROTATION[week % FOCUS_ROTATION.length])
  return {
    resource,
    rung: currentLifeLearningRung(resource, skills),
    compass_slice_key: resource.key === 'life-compass' ? compassSliceForWeek(date).key : null,
  }
}

/** First rung not yet secure — same never-climb rule as the ladders. */
export function currentLifeLearningRung(
  resource: LifeLearningResource,
  skills: LeSkillProgress[]
): LifeLearningRung {
  const secured = new Set(
    skills
      .filter((s) => s.subject === 'life_learning' && s.status === 'secure')
      .map((s) => s.skill)
  )
  return resource.rungs.find((r) => !secured.has(r.key)) || resource.rungs[resource.rungs.length - 1]
}

export interface LifeLearningWeather {
  resource: LifeLearningResource
  rung: LifeLearningRung
  band: 'strong' | 'wobbly' | 'untouched'
  secured_count: number
  total_rungs: number
}

/** Parent view: where each practice world stands. */
export function lifeLearningWeather(skills: LeSkillProgress[]): LifeLearningWeather[] {
  const bySkill = new Map(
    skills.filter((s) => s.subject === 'life_learning').map((s) => [s.skill, s])
  )
  return LIFE_LEARNING_RESOURCES.map((resource) => {
    const rung = currentLifeLearningRung(resource, skills)
    const securedCount = resource.rungs.filter((r) => bySkill.get(r.key)?.status === 'secure').length
    const row = bySkill.get(rung.key)
    const band = securedCount === resource.rungs.length
      ? ('strong' as const)
      : row
        ? row.status === 'secure'
          ? ('strong' as const)
          : ('wobbly' as const)
        : securedCount > 0
          ? ('wobbly' as const)
          : ('untouched' as const)
    return { resource, rung, band, secured_count: securedCount, total_rungs: resource.rungs.length }
  })
}
