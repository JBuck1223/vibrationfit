import type { AssessmentCategory } from '@/types/assessment'
import type { GreenLineResult } from '@/lib/assessment/scoring'
import type { Cadence, CreateCommitmentPayload } from './types'

/**
 * Green Line status for all 12 assessment categories.
 * This is the shape stored in assessment_results.green_line_status.
 */
export type GreenLineMap = Partial<Record<AssessmentCategory, GreenLineResult>>

export interface GreenLineDiagnosis {
  below: AssessmentCategory[]
  transition: AssessmentCategory[]
  above: AssessmentCategory[]
}

export type SuggestionTier = 'base' | 'supplement'

export interface SuggestedCommitment {
  title: string
  description: string
  category: 'activations' | 'connections' | 'sessions' | 'creations'
  cadence: Cadence
  deepLink: string
  rationale: string
  tier: SuggestionTier
}

/**
 * Diagnose which categories are below/transition/above the Green Line.
 */
export function diagnoseGreenLine(greenLineStatus: GreenLineMap): GreenLineDiagnosis {
  const below: AssessmentCategory[] = []
  const transition: AssessmentCategory[] = []
  const above: AssessmentCategory[] = []

  for (const [cat, status] of Object.entries(greenLineStatus)) {
    const category = cat as AssessmentCategory
    if (status === 'below') below.push(category)
    else if (status === 'transition') transition.push(category)
    else if (status === 'above') above.push(category)
  }

  return { below, transition, above }
}

/**
 * Generate the first-MAP commitment suggestions for an intensive user.
 *
 * Structure:
 *   BASE (4 universal) — one per MAP pillar, every user always gets these
 *   SUPPLEMENTS — extra activation reps on below/transition categories
 *
 * First target: "Above the Green Line Emotional State"
 * We help you get there with Creation, Activation, Connection, and Sessions.
 *
 * Deterministic: no AI, no tokens, instant results.
 */
export function suggestFirstCommitments(diagnosis: GreenLineDiagnosis): SuggestedCommitment[] {
  const suggestions: SuggestedCommitment[] = []

  // ── BASE: 4 universal commitments (one per MAP pillar) ────────────

  suggestions.push({
    title: 'Vision Audio Listen',
    description: 'Listen to your Life Vision audio daily to stay anchored in the life you\'re creating.',
    category: 'activations',
    cadence: { kind: 'daily' },
    deepLink: '/life-vision',
    rationale: 'Daily immersion in your vision rewires your default emotional state toward above the Green Line.',
    tier: 'base',
  })

  suggestions.push({
    title: 'Journal: Wins & Wobbles',
    description: 'Capture evidence of alignment (wins) and areas of resistance (wobbles). Quick entries are great! Getting it out of your head and stored helps us reference it later.',
    category: 'creations',
    cadence: { kind: 'daily' },
    deepLink: '/journal/new',
    rationale: 'Journaling creates evidence of your shift and surfaces wobbles before they take hold.',
    tier: 'base',
  })

  suggestions.push({
    title: 'Vibe Tribe Engagement',
    description: 'Share a post, celebrate a win, or engage with the community for support and accountability.',
    category: 'connections',
    cadence: { kind: 'days_per_week', count: 2 },
    deepLink: '/vibe-tribe',
    rationale: 'Community connection accelerates alignment shifts and keeps you accountable.',
    tier: 'base',
  })

  suggestions.push({
    title: 'Alignment Gym Session',
    description: 'Attend the live weekly session or watch the replay.',
    category: 'sessions',
    cadence: { kind: 'days_per_week', count: 1 },
    deepLink: '/alignment-gym',
    rationale: 'Live coaching keeps momentum on your toughest categories.',
    tier: 'base',
  })

  // ── SUPPLEMENTS: extra reps on below/transition areas ─────────────

  const needsAttention = [...diagnosis.below, ...diagnosis.transition]

  for (const cat of needsAttention) {
    const displayName = CATEGORY_DISPLAY_NAMES[cat]
    const isBelow = diagnosis.below.includes(cat)
    const severity = isBelow ? 'below the Green Line' : 'in the transition zone'

    suggestions.push({
      title: `Activate ${displayName}`,
      description: `Extra activation reps on ${displayName}: listen to your ${displayName} vision audio, journal insights about how you feel shifting, abundance connections, and any wobbles. We have tools to help you work through those.`,
      category: 'activations',
      cadence: { kind: 'days_per_week', count: isBelow ? 3 : 2 },
      deepLink: '/life-vision',
      rationale: `${displayName} is ${severity}. Targeted reps accelerate the shift above the line.`,
      tier: 'supplement',
    })
  }

  return suggestions
}

/**
 * Convert suggested commitments to API-ready payloads tied to a vision target.
 */
export function suggestionsToPayloads(
  suggestions: SuggestedCommitment[],
  visionTargetId: string,
): CreateCommitmentPayload[] {
  return suggestions.map(s => ({
    vision_target_id: visionTargetId,
    category: s.category,
    type: 'recurring' as const,
    title: s.title,
    description: s.description,
    cadence: s.cadence,
  }))
}

const CATEGORY_DISPLAY_NAMES: Record<AssessmentCategory, string> = {
  money: 'Money',
  health: 'Health',
  family: 'Family',
  love: 'Love',
  social: 'Social',
  work: 'Work',
  fun: 'Fun',
  travel: 'Travel',
  home: 'Home',
  stuff: 'Stuff',
  giving: 'Giving',
  spirituality: 'Spirituality',
}

export function formatCategoryList(categories: AssessmentCategory[]): string {
  if (categories.length === 0) return ''
  const names = categories.map(c => CATEGORY_DISPLAY_NAMES[c])
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function getCategoryDisplayName(cat: AssessmentCategory): string {
  return CATEGORY_DISPLAY_NAMES[cat] || cat
}
