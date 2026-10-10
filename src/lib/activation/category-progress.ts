/**
 * Per-category progress for the free Activation.
 *
 * Two different things are measured:
 *
 * - The chosen category is written from synthesized FIELDs that the vision
 *   generator reads directly, so its percent follows the existing word floors
 *   (length there is fidelity).
 * - Every other category only has SEED notes — an index of what VIVA now
 *   knows. Those are scored by the count of distinct ideas with diminishing
 *   returns, never by words, so a long paraphrase and a short one of the same
 *   fact score the same.
 *
 * Pure and client-safe.
 */

import {
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  type LifeCategoryKey,
} from '@/lib/design-system/vision-categories'
import type { ActivationSeedNote } from '@/lib/activation/orchestrator'
import {
  ACTIVATION_VISION_SOURCE_MIN,
  asSeedNotes,
  describeIntakeSubstance,
} from '@/lib/activation/intake-markers'

/** A category is "taking shape" once it has one contrast and one clarity seed. */
export const NEAR_COMPLETE_PERCENT = 50

/** Diminishing credit per distinct seed, by polarity. Clarity is worth more: the vision is written from what they want. */
const CONTRAST_STEPS = [20, 10, 5] as const
const CLARITY_STEPS = [30, 20, 10, 5] as const

/** Weights of the four chosen-category floors; sums to 1. */
const CHOSEN_WEIGHTS = { current: 0.3, want: 0.4, texture: 0.15, user: 0.15 } as const

export interface ActivationCategoryProgress {
  category: LifeCategoryKey
  label: string
  percent: number
  /** True for every category except the one they chose. */
  locked: boolean
  contrastCount: number
  clarityCount: number
  /** One short line about what would move this bar next. */
  gapHint: string | null
}

export interface ActivationProgressSummary {
  /** Categories with at least one seed or field (excluding none). */
  touched: number
  /** Categories at or above NEAR_COMPLETE_PERCENT. */
  nearComplete: number
  /** Locked categories at or above NEAR_COMPLETE_PERCENT — what membership picks up. */
  lockedNearComplete: number
  chosenPercent: number
}

export interface ActivationProgressInput {
  category?: string | null
  current_state?: string | null
  dream_response?: Record<string, string> | null
  conversation?: Array<{ role?: string; content?: string }> | null
  seeds?: unknown
}

function stepSum(count: number, steps: readonly number[]): number {
  let total = 0
  for (let i = 0; i < Math.min(count, steps.length); i++) total += steps[i]
  return total
}

export function seededPercent(contrastCount: number, clarityCount: number): number {
  return Math.min(100, stepSum(contrastCount, CONTRAST_STEPS) + stepSum(clarityCount, CLARITY_STEPS))
}

function chosenPercent(input: ActivationProgressInput): { percent: number; gapHint: string | null } {
  const substance = describeIntakeSubstance({
    current_state: input.current_state,
    dream_response: input.dream_response,
    category: input.category,
    conversation: input.conversation,
  })
  if (substance.ready) return { percent: 100, gapHint: null }

  const min = ACTIVATION_VISION_SOURCE_MIN
  const ratio = (actual: number, floor: number) => Math.min(1, actual / floor)
  const raw =
    CHOSEN_WEIGHTS.current * ratio(substance.currentWords, min.currentStateWords) +
    CHOSEN_WEIGHTS.want * ratio(substance.wantWords, min.wantWords) +
    CHOSEN_WEIGHTS.texture * ratio(substance.textureWords, min.textureWords) +
    CHOSEN_WEIGHTS.user * ratio(substance.userWords, min.userWords)
  // Never report 100 until the floors are actually met.
  const percent = Math.min(99, Math.round(raw * 100))

  let gapHint: string | null = null
  if (substance.currentWords < min.currentStateWords) gapHint = 'Still hearing what is true right now'
  else if (substance.wantWords < min.wantWords) gapHint = 'Still need more of the life you want'
  else if (substance.textureWords < min.textureWords) gapHint = 'Still need why it matters or how it feels'
  else if (substance.userWords < min.userWords) gapHint = 'Keep going — a few more details'

  return { percent, gapHint }
}

function seedGapHint(contrastCount: number, clarityCount: number): string | null {
  if (contrastCount === 0 && clarityCount === 0) return null
  if (clarityCount === 0) return 'Heard what is not working here'
  if (contrastCount === 0) return 'Heard what you want here'
  return 'Taking shape'
}

export function groupSeedsByCategory(
  seeds: ActivationSeedNote[],
): Record<LifeCategoryKey, { contrast: ActivationSeedNote[]; clarity: ActivationSeedNote[] }> {
  const grouped = {} as Record<LifeCategoryKey, { contrast: ActivationSeedNote[]; clarity: ActivationSeedNote[] }>
  for (const key of LIFE_CATEGORY_KEYS) grouped[key] = { contrast: [], clarity: [] }
  for (const seed of seeds) {
    const bucket = grouped[seed.category as LifeCategoryKey]
    if (!bucket) continue
    bucket[seed.polarity].push(seed)
  }
  return grouped
}

export function describeActivationCategoryProgress(
  input: ActivationProgressInput,
): ActivationCategoryProgress[] {
  const seeds = asSeedNotes(input.seeds)
  const grouped = groupSeedsByCategory(seeds)
  const chosen = input.category && (LIFE_CATEGORY_KEYS as readonly string[]).includes(input.category)
    ? (input.category as LifeCategoryKey)
    : null

  return LIFE_CATEGORY_KEYS.map((category) => {
    const bucket = grouped[category]
    const contrastCount = bucket.contrast.length
    const clarityCount = bucket.clarity.length
    const label = getVisionCategoryLabel(category)

    if (category === chosen) {
      const { percent, gapHint } = chosenPercent(input)
      return { category, label, percent, locked: false, contrastCount, clarityCount, gapHint }
    }

    return {
      category,
      label,
      percent: seededPercent(contrastCount, clarityCount),
      locked: true,
      contrastCount,
      clarityCount,
      gapHint: seedGapHint(contrastCount, clarityCount),
    }
  })
}

export function summarizeActivationProgress(
  progress: ActivationCategoryProgress[],
): ActivationProgressSummary {
  const chosen = progress.find((p) => !p.locked)
  return {
    touched: progress.filter((p) => p.percent > 0).length,
    nearComplete: progress.filter((p) => p.percent >= NEAR_COMPLETE_PERCENT).length,
    lockedNearComplete: progress.filter((p) => p.locked && p.percent >= NEAR_COMPLETE_PERCENT).length,
    chosenPercent: chosen?.percent ?? 0,
  }
}

/**
 * Coverage block for the intake prompt. Lists existing keys per category so
 * VIVA reuses them instead of inventing near-duplicates, and names what is
 * still empty so spillover has somewhere to land.
 */
export function formatSeedCoverageForPrompt(
  seeds: unknown,
  chosenCategory?: string | null,
): string {
  const grouped = groupSeedsByCategory(asSeedNotes(seeds))
  const lines: string[] = []
  const empty: string[] = []

  for (const category of LIFE_CATEGORY_KEYS) {
    if (category === chosenCategory) continue
    const bucket = grouped[category]
    if (bucket.contrast.length === 0 && bucket.clarity.length === 0) {
      empty.push(category)
      continue
    }
    const render = (list: ActivationSeedNote[]) =>
      list.map((s) => `${s.key}: ${s.text}`).join(' | ')
    lines.push(
      `- ${category}: contrast [${render(bucket.contrast) || 'none'}] clarity [${render(bucket.clarity) || 'none'}]`,
    )
  }

  const touched = lines.length
  return [
    `Seeds so far in the other ${LIFE_CATEGORY_KEYS.length - 1} areas: ${touched} area${touched === 1 ? '' : 's'} touched.`,
    lines.length ? lines.join('\n') : '- none yet',
    empty.length ? `Still empty: ${empty.join(', ')}` : 'Every other area has at least one seed.',
  ].join('\n')
}
