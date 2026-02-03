/**
 * Imagination Starter Prompt
 * 
 * Generates a draft "Get Me Started" text for the imagination step.
 * Uses raw profile data (clarity + contrast) and category-specific facts
 * to create a starting point the user can edit and expand.
 * 
 * KEY PHILOSOPHY:
 * - Use their RAW language (no pre-processed AI content)
 * - Flip contrast to positive WITHIN this prompt
 * - Output is meant to be EDITED, not final
 * - Leave room for expansion - don't be "complete"
 * - Natural, conversational voice they'll want to personalize
 * 
 * Used by: /api/viva/imagination-starter
 */

import { LifeCategoryKey } from '@/lib/design-system/vision-categories'

/**
 * Category-specific profile fields to extract for context
 * These ground the imagination in real facts from their life
 */
export const CATEGORY_PROFILE_FIELDS: Record<LifeCategoryKey, string[]> = {
  fun: ['hobbies', 'leisure_time_weekly'],
  health: ['exercise_frequency', 'height', 'weight', 'health_conditions', 'medications'],
  travel: ['travel_frequency', 'passport', 'countries_visited'],
  love: ['relationship_status', 'relationship_length', 'partner_name'],
  family: ['has_children', 'number_of_children', 'children_ages', 'first_name'],
  social: ['close_friends_count', 'social_preference', 'first_name'],
  home: ['living_situation', 'time_at_location', 'city', 'state', 'country'],
  work: ['employment_type', 'occupation', 'company', 'time_in_role'],
  money: ['household_income', 'savings_retirement', 'assets_equity', 'consumer_debt'],
  stuff: ['lifestyle_category', 'vehicles', 'items'],
  giving: ['volunteer_status', 'charitable_giving', 'legacy_mindset'],
  spirituality: ['spiritual_practice', 'meditation_frequency', 'personal_growth_focus']
}

/**
 * Category-specific emotional targets to guide the tone
 */
const CATEGORY_EMOTIONAL_TARGETS: Record<LifeCategoryKey, string> = {
  fun: 'Permission and lightness - fun is allowed without justification',
  health: 'Freedom of movement, energy, and enjoyment - my body supports my joy',
  travel: 'Expansion through experience - curiosity, wonder, and flow',
  love: 'Freedom to be fully myself - mutual allowance and passion without pressure',
  family: 'Emotional freedom and joyful presence - without carrying weight that isn\'t mine',
  social: 'Freedom to be authentic - wanted for who I am, not what I provide',
  home: 'Safety and ease - my home supports me, it doesn\'t demand from me',
  work: 'Creative freedom and feeling valued - I choose how and when I create',
  money: 'Freedom of choice - ease, spaciousness, and calm confidence',
  stuff: 'Ease and enjoyment - things support my life, they don\'t define it',
  giving: 'Overflow - I give because I want to, not because I should',
  spirituality: 'Freedom of alignment - soft knowing, trust, and presence'
}

/**
 * Extract relevant profile fields for a category
 */
export function extractCategoryProfileData(
  categoryKey: LifeCategoryKey,
  profile: any
): Record<string, any> {
  if (!profile) return {}
  
  const fields = CATEGORY_PROFILE_FIELDS[categoryKey] || []
  const data: Record<string, any> = {}
  
  for (const field of fields) {
    const value = profile[field]
    if (value !== null && value !== undefined && value !== '') {
      // Format arrays nicely
      if (Array.isArray(value) && value.length > 0) {
        data[field] = value.join(', ')
      } else if (typeof value === 'boolean') {
        data[field] = value ? 'Yes' : 'No'
      } else {
        data[field] = value
      }
    }
  }
  
  return data
}

/**
 * Format profile data as natural context string
 */
function formatProfileContext(categoryKey: LifeCategoryKey, profileData: Record<string, any>): string {
  const entries = Object.entries(profileData)
  if (entries.length === 0) return ''
  
  const formatted = entries.map(([key, value]) => {
    // Convert snake_case to readable label
    const label = key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    return `${label}: ${value}`
  }).join('\n')
  
  return formatted
}

/**
 * Calculate input richness to determine output length
 */
function calculateInputRichness(
  clarityText: string,
  contrastText: string,
  profileData: Record<string, any>
): { totalWords: number; richness: 'minimal' | 'moderate' | 'rich' | 'very_rich' } {
  const clarityWords = clarityText?.trim().split(/\s+/).filter(Boolean).length || 0
  const contrastWords = contrastText?.trim().split(/\s+/).filter(Boolean).length || 0
  const profileFieldCount = Object.keys(profileData).length
  
  // Estimate total input "weight"
  const totalWords = clarityWords + contrastWords
  const adjustedTotal = totalWords + (profileFieldCount * 5) // Each profile field adds ~5 words of context
  
  let richness: 'minimal' | 'moderate' | 'rich' | 'very_rich'
  if (adjustedTotal < 30) {
    richness = 'minimal'
  } else if (adjustedTotal < 80) {
    richness = 'moderate'
  } else if (adjustedTotal < 150) {
    richness = 'rich'
  } else {
    richness = 'very_rich'
  }
  
  return { totalWords: adjustedTotal, richness }
}

/**
 * Build the imagination starter prompt
 * 
 * @param categoryKey - The category (fun, health, etc.)
 * @param categoryLabel - Human-readable label (Fun, Health, etc.)
 * @param clarityText - Raw clarity text from profile (what's working)
 * @param contrastText - Raw contrast text from profile (what's not working - will be flipped)
 * @param profileData - Category-specific profile fields
 * @param inspirationQuestions - A few questions to weave in
 * @param perspective - singular (I/my) or plural (we/our)
 */
export function buildImaginationStarterPrompt(
  categoryKey: LifeCategoryKey,
  categoryLabel: string,
  clarityText: string,
  contrastText: string,
  profileData: Record<string, any>,
  inspirationQuestions: string[],
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/our' : 'I/my'
  const emotionalTarget = CATEGORY_EMOTIONAL_TARGETS[categoryKey]
  const profileContext = formatProfileContext(categoryKey, profileData)
  
  // Calculate input richness to determine output length
  const { totalWords, richness } = calculateInputRichness(clarityText, contrastText, profileData)
  
  // Dynamic length guidance based on input richness
  const lengthGuidance = {
    minimal: 'Write 100-150 words. Keep it simple since input is brief.',
    moderate: 'Write 150-250 words. Cover the main themes from their input.',
    rich: 'Write 250-400 words. Fully explore each topic from their clarity and contrast.',
    very_rich: 'Write 400-600 words. This person has shared a lot - honor all of it. Multiple paragraphs, each topic addressed.'
  }[richness]
  
  // Pick questions based on richness
  const questionCount = richness === 'minimal' ? 2 : richness === 'moderate' ? 3 : 4
  const selectedQuestions = inspirationQuestions.slice(0, questionCount).join('\n- ')
  
  return `You are helping someone write their ideal ${categoryLabel} life vision. Generate a DRAFT starting point they will EDIT and EXPAND.

PERSPECTIVE: ${pronoun}
CATEGORY: ${categoryLabel}
EMOTIONAL TARGET: ${emotionalTarget}

═══════════════════════════════════════════════════════════════
RAW INPUT FROM THEIR PROFILE (use their words and details)
═══════════════════════════════════════════════════════════════

${clarityText ? `WHAT'S ALREADY WORKING (clarity):
"${clarityText}"

` : ''}${contrastText ? `WHAT THEY WANT TO CHANGE (contrast - flip this to positive):
"${contrastText}"

The contrast shows what they DON'T want. Transform this into what they DO want.
Example: "I never have time for fun" → "I make space for play and joy flows naturally"
Example: "My partner and I fight constantly" → "We communicate with ease and understanding"

` : ''}${profileContext ? `GROUNDING FACTS:
${profileContext}

` : ''}${selectedQuestions ? `INSPIRATION QUESTIONS (weave themes naturally):
- ${selectedQuestions}

` : ''}═══════════════════════════════════════════════════════════════
YOUR TASK
═══════════════════════════════════════════════════════════════

LENGTH MATCH (CRITICAL):
Input richness: ${richness} (~${totalWords} words of input)
${lengthGuidance}

Do NOT compress their ideas. If they wrote about multiple topics, address each one.
Do NOT pad with generic filler if input is brief.

Write a DRAFT imagination text that:

1. USES THEIR WORDS - borrow phrasing from clarity text heavily
2. FLIPS CONTRAST TO POSITIVE - transform what's not working into what IS working
3. GROUNDS IN FACTS - use their actual details (names, places, numbers)
4. PRESENT TENSE - everything is happening NOW
5. LEAVES ROOM - this is a starting point, not a finished vision

VOICE GUIDELINES:
- Conversational and warm, not formal or "vision-y"
- Mix short punchy statements with flowing descriptions
- Include sensory details where natural (what they see, feel, hear)
- Avoid generic phrases like "I am grateful for..." or "I manifest..."
- Sound like a friend describing their amazing life, not an affirmation

CRITICAL - THIS IS A DRAFT:
- Don't try to be "complete" - leave threads they'll want to expand
- Include a question or two they might want to answer (e.g., "...and [what else brings me joy?]")
- Make it good enough to excite them, imperfect enough they'll want to add their voice

OUTPUT: Just the draft text. No headers, labels, or explanations.`
}
