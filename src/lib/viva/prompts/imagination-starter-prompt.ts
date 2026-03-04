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
  fun: ['hobbies'],
  health: [],
  travel: ['passport', 'trips'],
  love: ['partner_name'],
  family: ['children', 'first_name'],
  social: ['first_name'],
  home: ['city', 'state'],
  work: ['occupation', 'company'],
  money: [],
  stuff: ['vehicles', 'items'],
  giving: [],
  spirituality: ['spiritual_practice']
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
- Removal language — no "is gone", "replaced by", "no more", "behind me" (these imply a past problem existed)
- Temporal contrast — no "now" used to imply change from before. "I now feel..." means "I didn't before." Just state it.
- Hedging / seeking — no "I'm learning...", "I'm finding...", "I'm starting to...", "sometimes"
- Future / wanting — no "I will", "I want", "I hope", "someday"
- Weak closings — no "this is just the beginning", "I can't wait to see", "the possibilities feel endless"
- Contrast connectors — no "Of course...", "However...", "But...", "Although..."
- Process framing — no "It's not about X, it's about Y" — just say Y
- Clinical data — NEVER include height, weight, body measurements, or medical data. A vision is not a chart.

═══════════════════════════════════════════════════════════════
PHASE 2: EXPAND — Make it vivid, specific, and REAL
═══════════════════════════════════════════════════════════════

Take the cleaned material and make it richer — but GROUNDED, not flowery.
The expansion must come from THEIR real life, not from generic inspiration.

RULE #1: SPECIFICS OVER ABSTRACTIONS (most important rule)
Their real names, places, routines, and details ARE the vision.
- If they named a person (partner, child, friend, nanny) → USE THE NAME
- If they described a specific activity → KEEP that activity, add sensory detail
- If they said something raw and real → PRESERVE IT. Their words > your polish.
WRONG: replace "Miss Kelly watches the kids" with "our support system helps out"
WRONG: replace "I eat pizza" with "I nourish my body with intention"
RIGHT: keep their specifics, add the FEEL of the moment around them

RULE #2: SENSORY EXPANSION (add texture to THEIR moments, don't invent new ones)
- Sounds: wooden spoons clacking, kids laughing, the hum of a boat engine
- Touch: sun on skin, sand between toes, the weight of a child on your hip
- Smell/taste: coffee brewing, salt air, garlic sizzling
- Sight: specific colors, light quality, a specific view they'd recognize

RULE #3: KEEP THEIR RAW VOICE
If they said something powerful in their own words, USE IT as-is.
"I don't believe food is bad" is MORE powerful than "I have a balanced relationship with nourishment."
Do NOT replace direct, real language with fancier synonyms or flowery metaphors.

EXPAND DOES NOT MEAN:
- Replace their words with fancier synonyms
- Add metaphors ("tapestry", "dance", "symphony", "testament to")
- Use inspirational poster language ("limitless potential", "boundless energy", "ignite our spirit")
- Insert affirmation-speak ("the universe provides", "every moment is a gift")
- Lose a single real name, place, or detail they provided

═══════════════════════════════════════════════════════════════
PHASE 3: EMBODY — Land it in the body
═══════════════════════════════════════════════════════════════

The reader should FEEL this life when they read it aloud.
It should sound like a real person talking about their real life with deep satisfaction.

VOICE:
- Present tense. Declarative. Certain. SPECIFIC.
- Mix short punchy lines with vivid sensory paragraphs
- Gratitude felt through satisfaction, never announced ("I'm so grateful..." → never)
- Must sound like THIS PERSON, not a life coach or greeting card

AUTHENTICITY TEST:
Read the output and ask: "Could I tell who this person is from reading this?"
If it's so generic it could apply to anyone, it fails. Rewrite with THEIR details.

CLOSING:
- End with ONE powerful sentence that locks in the FEELING
- A deep exhale — certain, settled, alive. Not a trailing thought.

ENERGY TEST (apply to every sentence):
"Would this specific person say it this way while living this life?"
If it sounds like a motivational poster instead of a real human, rewrite it.

OUTPUT: Just the vision text. No headers, labels, phases, or explanations.`
}
