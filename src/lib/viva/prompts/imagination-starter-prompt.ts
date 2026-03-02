/**
 * Imagination Starter Prompt
 * 
 * Generates activated, present-tense imagination text for the vision builder.
 * Uses raw profile data (state) and category-specific facts
 * to create vision text the user can personalize.
 * 
 * KEY PHILOSOPHY:
 * - Use their RAW details (names, places, activities) — not pre-processed AI content
 * - Transform all challenges into present-tense declarations
 * - Output is powerful and activated — no questions, no hedging, no weak endings
 * - Declarative, certain, embodied — as if this life already exists
 * - Natural, confident voice grounded in their real specifics
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
  stateText: string,
  profileData: Record<string, any>
): { totalWords: number; richness: 'minimal' | 'moderate' | 'rich' | 'very_rich' } {
  const stateWords = stateText?.trim().split(/\s+/).filter(Boolean).length || 0
  const profileFieldCount = Object.keys(profileData).length
  
  const adjustedTotal = stateWords + (profileFieldCount * 5)
  
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
 * @param stateText - Raw state text from profile (holistic description of where they are now)
 * @param profileData - Category-specific profile fields
 * @param inspirationQuestions - A few questions to weave in
 * @param perspective - singular (I/my) or plural (we/our)
 */
export function buildImaginationStarterPrompt(
  categoryKey: LifeCategoryKey,
  categoryLabel: string,
  stateText: string,
  profileData: Record<string, any>,
  inspirationQuestions: string[],
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/our' : 'I/my'
  const emotionalTarget = CATEGORY_EMOTIONAL_TARGETS[categoryKey]
  const profileContext = formatProfileContext(categoryKey, profileData)
  
  const { totalWords, richness } = calculateInputRichness(stateText, profileData)
  
  const lengthGuidance = {
    minimal: 'Write 100-150 words. Keep it simple since input is brief.',
    moderate: 'Write 150-250 words. Cover the main themes from their input.',
    rich: 'Write 250-400 words. Fully explore each topic from their state description.',
    very_rich: 'Write 400-600 words. This person has shared a lot - honor all of it. Multiple paragraphs, each topic addressed.'
  }[richness]
  
  const questionCount = richness === 'minimal' ? 2 : richness === 'moderate' ? 3 : 4
  const selectedQuestions = inspirationQuestions.slice(0, questionCount).join('\n- ')
  
  return `You generate imagination text for someone's ${categoryLabel} life vision through three phases: CLEANSE, EXPAND, EMBODY.

PERSPECTIVE: ${pronoun}
CATEGORY: ${categoryLabel}
EMOTIONAL TARGET: ${emotionalTarget}

═══════════════════════════════════════════════════════════════
RAW INPUT FROM THEIR PROFILE (mine for real details)
═══════════════════════════════════════════════════════════════

${stateText ? `CURRENT STATE (their description of where they are now):
"${stateText}"

Extract: names, places, activities, relationships, numbers, real specifics.
Every challenge or gap becomes something they HAVE now.
Everything already working gets amplified with vivid, embodied language.
` : ''}${profileContext ? `GROUNDING FACTS:
${profileContext}

` : ''}${selectedQuestions ? `INSPIRATION THEMES (weave as confident statements — NEVER as questions):
- ${selectedQuestions}

` : ''}═══════════════════════════════════════════════════════════════
LENGTH MATCH (CRITICAL)
═══════════════════════════════════════════════════════════════

Input richness: ${richness} (~${totalWords} words of input)
${lengthGuidance}

Do NOT compress their ideas. If they described multiple topics, address each one.
Do NOT pad with generic filler if input is brief.

═══════════════════════════════════════════════════════════════
PHASE 1: CLEANSE — Strip all low-vibration language
═══════════════════════════════════════════════════════════════

As you compose, ensure ZERO instances of:

- Questions of any kind — no "?", no "what else...", no "how can I...", no "I wonder..."
- Comparison / before-after — no "I no longer...", "unlike before...", "I used to...", "despite..."
- Hedging / seeking — no "I'm learning...", "I'm finding...", "I'm starting to...", "sometimes"
- Future / wanting — no "I will", "I want", "I hope", "someday"
- Weak closings — no "this is just the beginning", "I can't wait to see", "the possibilities feel endless"
- Contrast connectors — no "Of course...", "However...", "But...", "Although..."
- Process framing — no "It's not about X, it's about Y" — just say Y

═══════════════════════════════════════════════════════════════
PHASE 2: EXPAND — Make it bigger, more vivid, more alive
═══════════════════════════════════════════════════════════════

Take their real details and INFUSE them with imagination and sensory richness:

- Sounds: the clink of glasses, laughter echoing, the hum of an engine, music low in the background
- Touch/temperature: sun on skin, cool breeze, the weight of a child in your arms, warm mug in hand
- Sight: colors, light, landscapes, the look on someone's face
- Smell/taste: coffee, salt air, simmering food, fresh earth

Add emotional voltage — words that carry charge:
"electric", "alive", "lit up", "buzzing", "deep", "free", "powerful", "easy", "rich"

Stay grounded in THEIR material. Do not invent details they didn't provide.
Expand what's there — don't add filler or generic affirmation-speak.

═══════════════════════════════════════════════════════════════
PHASE 3: EMBODY — Make it land in the bones
═══════════════════════════════════════════════════════════════

Every sentence must feel like something this person would say while LIVING this life.

- Present tense only. Declarative. Certain.
- Mix short punchy lines with flowing cinematic paragraphs
- Gratitude is felt through deep satisfaction, never announced ("I'm so grateful..." → never)
- End with ONE powerful closing sentence that locks in the FEELING
  — a deep exhale, certain and settled, not a trailing thought

ENERGY TEST (apply to every sentence):
"Would someone who already HAS this life say it this way?"
If not, rewrite until the answer is a full-body YES.

OUTPUT: Just the vision text. No headers, labels, phases, or explanations.`
}
