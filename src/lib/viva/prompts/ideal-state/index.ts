/**
 * Ideal State Imagination Prompts - Category Router
 * Each category gets its own unique prompt generator
 */

import { VIVA_PERSONA } from '../shared/viva-persona'
import { ProfileContext } from '../../profile-context'

// Import category-specific builders
import { buildFunRecreationPrompt } from './fun-recreation'
import { buildHealthPrompt } from './health'
import { buildTravelPrompt } from './travel'
import { buildRomanticPrompt } from './romantic-relationship'
import { buildFamilyPrompt } from './family'
import { buildFriendshipsPrompt } from './friendships'
import { buildPhysicalEnvironmentPrompt } from './physical-environment'
import { buildCareerPrompt } from './career'
import { buildFinancesPrompt } from './finances'
import { buildStuffPrompt } from './stuff'
import { buildContributionPrompt } from './contribution'
import { buildSpiritualityPrompt } from './spirituality'
import { buildWildcardPrompt } from './wildcard'

/**
 * Route to the correct prompt builder based on category
 */
export function buildIdealStatePrompt(
  category: string,
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  const promptBuilders: Record<string, () => string> = {
    'fun-recreation': () => buildFunRecreationPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'health': () => buildHealthPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'travel': () => buildTravelPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'romantic-relationship': () => buildRomanticPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'family': () => buildFamilyPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'friendships': () => buildFriendshipsPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'physical-environment': () => buildPhysicalEnvironmentPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'career': () => buildCareerPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'finances': () => buildFinancesPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'stuff': () => buildStuffPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'contribution': () => buildContributionPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'spirituality': () => buildSpiritualityPrompt(categoryName, currentClarity, flippedContrast, profileContext),
    'wildcard': () => buildWildcardPrompt(categoryName, currentClarity, flippedContrast, profileContext),
  }

  const builder = promptBuilders[category]
  
  if (!builder) {
    console.warn(`[Ideal State] No prompt builder for category: ${category}, using generic fallback`)
    return buildGenericPrompt(categoryName, currentClarity, flippedContrast, profileContext)
  }

  return builder()
}

/**
 * Generic fallback for categories without specific builders
 */
function buildGenericPrompt(
  categoryName: string,
  currentClarity: string,
  flippedContrast: string,
  profileContext: ProfileContext
): string {
  return `${VIVA_PERSONA}

# YOUR TASK: Help ${categoryName} Come Alive

You're helping the member "Unleash their Imagination" for the **${categoryName}** area of their life.

## WHAT YOU KNOW SO FAR:

**From Step 1 (Current Clarity):**
${currentClarity}

**Clarity from Contrast:**
${flippedContrast || 'Not provided yet'}

## YOUR MISSION:

Generate 3-5 open-ended, evocative prompts that help them explore their IDEAL STATE in ${categoryName}.

These aren't questions to answer briefly - they're invitations to flow, to dream, to describe in detail what life looks like when this area is fully aligned.

## CRITICAL OUTPUT FORMAT:

Return ONLY valid JSON (no markdown, no code blocks):

{
  "prompts": [
    {
      "title": "Brief title (3-5 words)",
      "prompt": "The full evocative prompt text",
      "focusArea": "What this explores (e.g., 'daily rhythms', 'emotional baseline')"
    }
  ],
  "encouragement": "One sentence of warm encouragement"
}

Generate personalized, sensory-rich prompts that invite flow-state responses.`
}

