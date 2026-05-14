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

export interface SuggestedCommitment {
  title: string
  description: string
  category: 'activations' | 'connections' | 'sessions' | 'creations'
  cadence: Cadence
  deepLink: string
  rationale: string
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
 * Generate the default first-MAP commitment suggestions for an intensive user.
 *
 * These are VibrationFit-internal actions chosen to move below/transition
 * categories toward above the Green Line. Every suggestion maps to a tool
 * the user built during Steps 1-10 of the intensive.
 *
 * The rules are deterministic: no AI, no tokens, instant results.
 */
export function suggestFirstCommitments(diagnosis: GreenLineDiagnosis): SuggestedCommitment[] {
  const suggestions: SuggestedCommitment[] = []
  const hasBelowOrTransition = diagnosis.below.length > 0 || diagnosis.transition.length > 0

  suggestions.push({
    title: 'Morning Vision + Daily Paper',
    description: 'Read your Life Vision, scan your Vision Board, and complete your Daily Paper each morning.',
    category: 'activations',
    cadence: { kind: 'daily' },
    deepLink: '/daily-paper/new',
    rationale: hasBelowOrTransition
      ? `Anchors your day in the vision. Targets your ${formatCategoryList(diagnosis.below)} areas.`
      : 'Anchors your day in the vision you created.',
  })

  suggestions.push({
    title: 'Night Sleep Immersion + Journal',
    description: 'Journal evidence of alignment, then drift off to your sleep immersion track.',
    category: 'creations',
    cadence: { kind: 'daily' },
    deepLink: '/journal/new',
    rationale: 'Creates evidence of alignment and reinforces your vision during sleep.',
  })

  suggestions.push({
    title: 'Vibe Tribe Engagement',
    description: 'Share a post or engage with the community for support and accountability.',
    category: 'connections',
    cadence: { kind: 'days_per_week', count: 2 },
    deepLink: '/vibe-tribe',
    rationale: 'Community connection accelerates alignment shifts.',
  })

  suggestions.push({
    title: 'Alignment Gym Session',
    description: 'Attend the live weekly session or watch the replay.',
    category: 'sessions',
    cadence: { kind: 'days_per_week', count: 1 },
    deepLink: '/alignment-gym',
    rationale: 'Live coaching keeps momentum on your toughest categories.',
  })

  if (diagnosis.below.length >= 3) {
    suggestions.push({
      title: 'Vision Audio Listen',
      description: 'Listen to your full Life Vision audio or a category-specific track.',
      category: 'activations',
      cadence: { kind: 'daily' },
      deepLink: '/life-vision',
      rationale: `With ${diagnosis.below.length} categories below the line, extra immersion builds momentum.`,
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

function formatCategoryList(categories: AssessmentCategory[]): string {
  if (categories.length === 0) return ''
  const names = categories.map(c => CATEGORY_DISPLAY_NAMES[c])
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}
