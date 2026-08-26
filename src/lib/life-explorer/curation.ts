/**
 * Resource Curation Standard — how content earns its place in a lesson.
 *
 * Tier 1 (franchise): proven kid-engagement franchises. Default first look.
 * Tier 2 (verified):  museum/zoo/aquarium education pages, .gov/.edu kids'
 *                     content, library-curated lists.
 * Tier 3 (vf_original): when no high-quality resource exists, Life Explorer
 *                     authors its own experiment/craft. These compound into
 *                     the Expedition Pack library.
 *
 * Absolute rule: never invent a URL. Anything unverified is
 * needs_parent_link, full stop.
 */

import type { CoreResource, EngagementTier } from './types'

/** Tier 1 franchises the Lesson Composer may reference by name. */
export const TIER1_FRANCHISES = {
  video: [
    'SciShow Kids',
    'Nat Geo Kids',
    'PBS Kids',
    'Wild Kratts',
    'Mystery Doug',
    'Free School',
    'Homeschool Pop',
    'Crash Course Kids',
  ],
  podcast: [
    'Brains On!',
    'Wow in the World',
    'Tumble',
    'Circle Round',
    'Story Pirates',
    'But Why',
    'Greeking Out',
  ],
  experiment: [
    'Steve Spangler Science',
    'The Dad Lab',
    'KiwiCo',
    'Exploratorium Science Snacks',
    "NASA Kids' Club",
    'JPL Education',
  ],
  book: [
    'Usborne',
    'DK',
    'Caldecott list',
    'Sibert list',
    'Geisel list',
  ],
} as const

/** Max video runtime by grade band (quality gate). */
export const MAX_VIDEO_MINUTES: Record<string, number> = {
  'K-2': 10,
  '3-5': 15,
}

export function maxVideoMinutesForGrade(gradeLevel: string): number {
  const grade = parseInt(gradeLevel, 10)
  if (Number.isNaN(grade) || grade <= 2) return MAX_VIDEO_MINUTES['K-2']
  return MAX_VIDEO_MINUTES['3-5']
}

/**
 * Quality gate for a resource entering a pack or lesson.
 * Returns a list of violations (empty = passes).
 */
export function resourceQualityViolations(
  resource: CoreResource,
  gradeLevel: string
): string[] {
  const violations: string[] = []

  const hasUrl = Boolean(resource.url)
  const flaggedForParent = resource.needs_parent_link === true
  const isOriginal = resource.engagement_tier === 'vf_original'

  if (!hasUrl && !flaggedForParent && !isOriginal && resource.resource_type !== 'book') {
    violations.push(
      `"${resource.title}" has no URL and is not marked needs_parent_link or vf_original`
    )
  }

  if (
    resource.resource_type === 'video' &&
    typeof resource.duration_minutes === 'number' &&
    resource.duration_minutes > maxVideoMinutesForGrade(gradeLevel)
  ) {
    violations.push(
      `"${resource.title}" runs ${resource.duration_minutes} min — over the ${maxVideoMinutesForGrade(gradeLevel)} min cap for this grade band`
    )
  }

  return violations
}

/** Sort resources for the play queue: franchise → verified → originals. */
const TIER_ORDER: Record<EngagementTier, number> = {
  franchise: 0,
  verified: 1,
  vf_original: 2,
}

export function sortByTier(resources: CoreResource[]): CoreResource[] {
  return [...resources].sort(
    (a, b) =>
      (TIER_ORDER[a.engagement_tier || 'verified'] ?? 1) -
      (TIER_ORDER[b.engagement_tier || 'verified'] ?? 1)
  )
}

/**
 * Shape of a Tier 3 VF-original experiment or craft. When no great resource
 * exists for a Wonder question, the Composer authors one of these and it is
 * saved into the Expedition Pack library.
 */
export interface VfOriginalActivity {
  title: string
  kind: 'experiment' | 'craft'
  question_it_answers: string
  materials: string[]
  pantry_grade: boolean
  steps: string[]
  kid_language_explanation: string
  what_to_notice: string[]
  mess_level: 'clean' | 'wipeable' | 'towels-out'
  minutes: number
}
