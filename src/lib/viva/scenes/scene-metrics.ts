/**
 * Scene Metrics Utilities
 * 
 * Utilities for computing optimal scene counts based on input richness.
 * Used in the Creative Visualization Scene Builder (Step 4) to dynamically
 * determine how many scenes to generate based on user input density.
 */

import { countDistinctIdeas, combineTextSources } from '../text-metrics'

/**
 * Data tier indicating richness level
 * - A: Rich data (profile story + assessment + existing vision)
 * - B: Moderate data (some profile/assessment)
 * - C: Sparse data (minimal input)
 */
export type DataRichnessTier = 'A' | 'B' | 'C'

/**
 * Result of scene count inference
 */
export interface SceneCountRecommendation {
  /** Minimum recommended scenes */
  minScenes: number
  /** Maximum recommended scenes */
  maxScenes: number
  /** Target scenes to aim for */
  targetScenes: number
  /** Total distinct ideas found in input */
  distinctIdeas: number
  /** Data richness tier */
  tier: DataRichnessTier
}

/**
 * Infers recommended scene count from available data
 * 
 * Algorithm:
 * 1. Combine all text sources
 * 2. Count distinct ideas
 * 3. Apply tier-based multipliers
 * 4. Clamp to [1, 8] range
 * 
 * Tier guidelines:
 * - A (rich): 3-6 scenes (user provided lots of detail)
 * - B (moderate): 2-4 scenes (moderate input)
 * - C (sparse): 1-3 scenes (minimal input)
 * 
 * Scene count scales with idea count:
 * - Few ideas (1-2): 1-2 scenes
 * - Several ideas (3-5): 2-4 scenes
 * - Many ideas (6-10): 3-6 scenes
 * - Abundant ideas (10+): 4-8 scenes
 * 
 * @param profileGoesWellText - "What's going well" from profile
 * @param profileNotWellTextFlipped - Flipped contrast from profile
 * @param assessmentSnippets - Relevant assessment responses
 * @param existingVisionParagraph - Any existing vision text
 * @param tier - Data richness tier (defaults to 'C' if not provided)
 * @returns Scene count recommendation
 * 
 * @example
 * const recommendation = inferSceneCountFromData(
 *   profileStory,
 *   profileState,
 *   assessmentResponses,
 *   visionText,
 *   'A'
 * )
 * // Use in prompt: "Generate ${recommendation.targetScenes} scenes..."
 */
export function inferSceneCountFromData(
  profileGoesWellText?: string | null,
  profileNotWellTextFlipped?: string | null,
  assessmentSnippets?: string[] | null,
  existingVisionParagraph?: string | null,
  tier: DataRichnessTier = 'C'
): SceneCountRecommendation {
  // Combine all available text sources
  const assessmentText = assessmentSnippets && assessmentSnippets.length > 0
    ? assessmentSnippets.join('\n')
    : null
  
  const combinedText = combineTextSources(
    profileGoesWellText,
    profileNotWellTextFlipped,
    assessmentText,
    existingVisionParagraph
  )
  
  // Count distinct ideas
  const distinctIdeas = countDistinctIdeas(combinedText)
  
  // Base scene count on idea count
  let baseMinScenes: number
  let baseMaxScenes: number
  let baseTargetScenes: number
  
  if (distinctIdeas <= 2) {
    // Very few ideas - keep it simple
    baseMinScenes = 1
    baseMaxScenes = 2
    baseTargetScenes = 1
  } else if (distinctIdeas <= 5) {
    // Several ideas - moderate scenes
    baseMinScenes = 2
    baseMaxScenes = 4
    baseTargetScenes = 3
  } else if (distinctIdeas <= 10) {
    // Many ideas - more scenes
    baseMinScenes = 3
    baseMaxScenes = 6
    baseTargetScenes = 4
  } else {
    // Abundant ideas - rich scene generation
    baseMinScenes = 4
    baseMaxScenes = 8
    baseTargetScenes = 6
  }
  
  // Apply tier-based adjustments
  let minScenes = baseMinScenes
  let maxScenes = baseMaxScenes
  let targetScenes = baseTargetScenes
  
  switch (tier) {
    case 'A':
      // Rich data: Allow higher scene counts
      minScenes = Math.max(3, baseMinScenes)
      maxScenes = Math.min(8, baseMaxScenes + 1)
      targetScenes = Math.min(6, baseTargetScenes + 1)
      break
      
    case 'B':
      // Moderate data: Use base recommendations
      minScenes = Math.max(2, baseMinScenes)
      maxScenes = Math.min(6, baseMaxScenes)
      targetScenes = Math.min(4, baseTargetScenes)
      break
      
    case 'C':
      // Sparse data: Be conservative
      minScenes = Math.max(1, baseMinScenes - 1)
      maxScenes = Math.min(4, baseMaxScenes - 1)
      targetScenes = Math.min(3, baseTargetScenes - 1)
      break
  }
  
  // Final clamp to [1, 8] range
  minScenes = Math.max(1, Math.min(8, minScenes))
  maxScenes = Math.max(1, Math.min(8, maxScenes))
  targetScenes = Math.max(minScenes, Math.min(maxScenes, targetScenes))
  
  return {
    minScenes,
    maxScenes,
    targetScenes,
    distinctIdeas,
    tier
  }
}

/**
 * Determines data richness tier from available data
 * 
 * Tier A: Has profile story + assessment data + existing vision
 * Tier B: Has at least 2 of the above
 * Tier C: Has 1 or fewer sources
 */
export function determineDataTier(
  hasProfileStory: boolean,
  hasAssessmentData: boolean,
  hasExistingVision: boolean
): DataRichnessTier {
  const sourceCount = [hasProfileStory, hasAssessmentData, hasExistingVision].filter(Boolean).length
  
  if (sourceCount >= 3) {
    return 'A'
  } else if (sourceCount >= 2) {
    return 'B'
  } else {
    return 'C'
  }
}

/**
 * Formats scene count recommendation for prompt injection
 */
export function formatSceneCountForPrompt(recommendation: SceneCountRecommendation): string {
  return `Target scenes: aim for ${recommendation.targetScenes} scenes (minimum ${recommendation.minScenes}, maximum ${recommendation.maxScenes}), based on ${recommendation.distinctIdeas} distinct desires/ideas shared in this category.`
}

/**
 * Helper to check if scene count should be increased based on user feedback
 * If user specifically mentions many distinct experiences/desires, suggest more scenes
 */
export function shouldSuggestMoreScenes(
  currentSceneCount: number,
  userFeedback: string
): boolean {
  const feedbackLower = userFeedback.toLowerCase()
  
  // Keywords suggesting user wants more detail
  const moreDetailKeywords = [
    'more',
    'also',
    'another',
    'multiple',
    'several',
    'many',
    'various',
    'different'
  ]
  
  const hasMoreDetailKeywords = moreDetailKeywords.some(keyword => 
    feedbackLower.includes(keyword)
  )
  
  // If current count is low and user mentions multiple things, suggest more
  return currentSceneCount < 4 && hasMoreDetailKeywords
}

/**
 * Adjusts scene count based on regeneration request
 * Returns new target scene count
 */
export function adjustSceneCountForRegeneration(
  currentCount: number,
  adjustment: 'more' | 'fewer' | 'much_more' | 'much_fewer'
): number {
  let newCount = currentCount
  
  switch (adjustment) {
    case 'more':
      newCount = currentCount + 1
      break
    case 'fewer':
      newCount = currentCount - 1
      break
    case 'much_more':
      newCount = currentCount + 2
      break
    case 'much_fewer':
      newCount = currentCount - 2
      break
  }
  
  // Clamp to valid range [1, 8]
  return Math.max(1, Math.min(8, newCount))
}

