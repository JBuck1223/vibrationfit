/**
 * Master skill catalog — what this family believes a Grade 1 explorer
 * should win, in one list. Definitions live here. Status lives on
 * le_skill_progress. The Progress page is the checklist.
 */

import { MATH_LADDER, READING_LADDER, WRITING_LADDER } from './ladders'
import { LIFE_LEARNING_RESOURCES } from './life-learning'

export type SkillGroup =
  | 'big_ten'
  | 'math'
  | 'reading'
  | 'writing'
  | 'science'
  | 'geography'
  | 'history'
  | 'economics'
  | 'civics'
  | 'life_learning'
  | 'life_skills'

export interface CatalogSkill {
  key: string
  label: string
  group: SkillGroup
  subject: string
  benchmarks?: string[]
  check?: string
}

const BIG_TEN: CatalogSkill[] = [
  { key: 'bt-reads-simple-books', label: 'Reads simple books independently', group: 'big_ten', subject: 'reading' },
  { key: 'bt-writes-connected-sentences', label: 'Writes several connected, complete sentences', group: 'big_ten', subject: 'writing' },
  { key: 'bt-add-sub-20', label: 'Adds and subtracts within 20 (facts to 10 automatic)', group: 'big_ten', subject: 'math' },
  { key: 'bt-tens-ones', label: 'Understands tens and ones', group: 'big_ten', subject: 'math' },
  { key: 'bt-time-hour-half', label: 'Tells time to the hour and half-hour', group: 'big_ten', subject: 'math' },
  { key: 'bt-coins', label: 'Knows the coins and counts small combinations', group: 'big_ten', subject: 'math' },
  { key: 'bt-simple-map', label: 'Reads a simple map (compass rose, key, finds Florida)', group: 'big_ten', subject: 'social_studies' },
  { key: 'bt-research-own-question', label: 'Knows how to research an answer to his own question', group: 'big_ten', subject: 'science' },
  { key: 'bt-loves-learning', label: 'Loves learning', group: 'big_ten', subject: 'life_skills' },
  { key: 'bt-stays-curious', label: 'Stays curious', group: 'big_ten', subject: 'life_skills' },
]

const FLORIDA: CatalogSkill[] = [
  { key: 'fl-living-nonliving', label: 'Tells living from nonliving things', group: 'science', subject: 'science', benchmarks: ['SC.1.L.14.3'] },
  { key: 'fl-animal-needs', label: 'Animals need air, water, food, space', group: 'science', subject: 'science', benchmarks: ['SC.1.L.17.1'] },
  { key: 'fl-offspring-parents', label: 'Offspring resemble their parents', group: 'science', subject: 'science', benchmarks: ['SC.1.L.16.1'] },
  { key: 'fl-observe-living', label: 'Observes living things and their environment', group: 'science', subject: 'science', benchmarks: ['SC.1.L.14.1'] },
  { key: 'fl-push-pull', label: 'Changes motion with a push or a pull', group: 'science', subject: 'science', benchmarks: ['SC.1.P.13.1'] },
  { key: 'fl-sink-float', label: 'Sorts objects by properties including sink/float', group: 'science', subject: 'science', benchmarks: ['SC.1.P.8.1'] },
  { key: 'fl-investigate', label: 'Raises questions, investigates, explains findings', group: 'science', subject: 'science', benchmarks: ['SC.1.N.1.1'] },
  { key: 'fl-records', label: 'Keeps records of investigations', group: 'science', subject: 'science', benchmarks: ['SC.1.N.1.3'] },
  { key: 'fl-earth-water', label: 'Water, rocks, soil, and living things on Earth', group: 'science', subject: 'science', benchmarks: ['SC.1.E.6.1'] },
  { key: 'fl-need-for-water', label: 'The need for water; water safety', group: 'science', subject: 'science', benchmarks: ['SC.1.E.6.2'] },
  { key: 'fl-plants', label: 'Identifies plant parts: stem, roots, leaves, flowers', group: 'science', subject: 'science', benchmarks: ['SC.1.L.14.2'] },
  { key: 'fl-sun', label: 'The Sun: beneficial and harmful properties', group: 'science', subject: 'science', benchmarks: ['SC.1.E.5.4'] },
  { key: 'fl-map-florida', label: 'Uses maps to locate places in Florida', group: 'geography', subject: 'social_studies', benchmarks: ['SS.1.G.1.1'] },
  { key: 'fl-compass-rose', label: 'Map elements: compass rose, cardinal directions, key', group: 'geography', subject: 'social_studies', benchmarks: ['SS.1.G.1.2'] },
  { key: 'fl-draw-map', label: 'Constructs a basic map with directions and symbols', group: 'geography', subject: 'social_studies', benchmarks: ['SS.1.G.1.3'] },
  { key: 'fl-gulf-atlantic', label: 'Locates community, Florida, Atlantic, and Gulf', group: 'geography', subject: 'social_studies', benchmarks: ['SS.1.G.1.5'] },
  { key: 'fl-then-now', label: 'Compares life now with life in the past', group: 'history', subject: 'social_studies', benchmarks: ['SS.1.A.2.2'] },
  { key: 'fl-primary-source', label: 'Understands what a primary source is', group: 'history', subject: 'social_studies', benchmarks: ['SS.1.A.1.1'] },
  { key: 'fl-money-exchange', label: 'Money is how we exchange goods and services', group: 'economics', subject: 'social_studies', benchmarks: ['SS.1.E.1.1'] },
  { key: 'fl-scarcity-choice', label: 'We make choices because resources are scarce', group: 'economics', subject: 'social_studies', benchmarks: ['SS.1.E.1.6'] },
  { key: 'fl-rules-purpose', label: 'Purpose of rules and laws at home and in the community', group: 'civics', subject: 'social_studies', benchmarks: ['SS.1.CG.1.1'] },
  { key: 'fl-no-rules', label: 'What happens when there are no rules', group: 'civics', subject: 'social_studies', benchmarks: ['SS.1.CG.1.2'] },
  { key: 'fl-flag-pledge', label: 'Ways to show patriotism (flag, Pledge, anthem)', group: 'civics', subject: 'social_studies', benchmarks: ['SS.1.CG.2.3'] },
  { key: 'fl-2d-shapes', label: 'Identifies, compares, sorts 2D figures', group: 'math', subject: 'math', benchmarks: ['MA.1.GR.1.1'] },
  { key: 'fl-3d-solids', label: 'Identifies, compares, sorts 3D figures', group: 'math', subject: 'math', benchmarks: ['MA.1.GR.1.1'] },
  { key: 'ls-follows-directions', label: 'Follows multi-step directions', group: 'life_skills', subject: 'life_skills' },
  { key: 'ls-works-independently', label: 'Works independently for a stretch', group: 'life_skills', subject: 'life_skills' },
  { key: 'ls-perseveres', label: 'Shows perseverance when something is hard', group: 'life_skills', subject: 'life_skills' },
]

function fromLadders(): CatalogSkill[] {
  const math = MATH_LADDER.rungs.map((r) => ({
    key: r.key,
    label: r.label,
    group: 'math' as const,
    subject: 'math',
    benchmarks: r.benchmarks,
    check: r.mastery_check,
  }))
  const reading = READING_LADDER.rungs.map((r) => ({
    key: r.key,
    label: r.label,
    group: 'reading' as const,
    subject: 'reading',
    benchmarks: r.benchmarks,
    check: r.mastery_check,
  }))
  const writing = WRITING_LADDER.rungs.map((r) => ({
    key: r.key,
    label: r.label,
    group: 'writing' as const,
    subject: 'writing',
    benchmarks: r.benchmarks,
    check: r.mastery_check,
  }))
  return [...math, ...reading, ...writing]
}

function fromLifeLearning(): CatalogSkill[] {
  return LIFE_LEARNING_RESOURCES.flatMap((res) =>
    res.rungs.map((r) => ({
      key: r.key,
      label: `${res.name}: ${r.label}`,
      group: 'life_learning' as const,
      subject: 'life_learning',
      benchmarks: r.benchmarks || res.benchmarks,
      check: r.mastery_check,
    }))
  )
}

export const SKILL_CATALOG: CatalogSkill[] = [
  ...BIG_TEN,
  ...fromLadders(),
  ...fromLifeLearning(),
  ...FLORIDA,
]

const BY_KEY = new Map(SKILL_CATALOG.map((s) => [s.key, s]))

export function catalogSkill(key: string): CatalogSkill | undefined {
  return BY_KEY.get(key)
}

export const SKILL_GROUP_ORDER: SkillGroup[] = [
  'big_ten',
  'math',
  'reading',
  'writing',
  'science',
  'geography',
  'history',
  'economics',
  'civics',
  'life_learning',
  'life_skills',
]

export const SKILL_GROUP_LABEL: Record<SkillGroup, string> = {
  big_ten: 'The Big Ten',
  math: 'Math',
  reading: 'Reading',
  writing: 'Writing',
  science: 'Science',
  geography: 'Geography',
  history: 'History',
  economics: 'Economics',
  civics: 'Civics',
  life_learning: 'Life Learning',
  life_skills: 'Life skills',
}

export function skillsInGroup(group: SkillGroup): CatalogSkill[] {
  return SKILL_CATALOG.filter((s) => s.group === group)
}

export type ChecklistState = 'empty' | 'practiced' | 'won' | 'needs_more'

export function checklistState(status?: string | null): ChecklistState {
  if (status === 'secure') return 'won'
  if (status === 'developing') return 'practiced'
  if (status === 'needs_support') return 'needs_more'
  return 'empty'
}
