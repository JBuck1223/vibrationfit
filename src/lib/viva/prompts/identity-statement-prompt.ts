/**
 * Identity Statement Prompts
 * 
 * Generates empowering "I am" identity declarations from life vision text.
 * Unlike focus stories (day-in-the-life narratives), identity statements are
 * direct first-person declarations designed for nervous system encoding through
 * audio repetition. These are not affirmations — they are identity-level truths
 * drawn from the member's own vision, voice, and specifics.
 * 
 * Prompt types:
 * 1. Category-Based Identity Statements - From selected life vision categories
 * 2. Custom Identity Statements - From user-provided content
 * 3. Flip Identity Statements - Transform limiting beliefs into identity declarations
 * 
 * Used by: /api/stories/generate (customMode: 'identity')
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import type { CategoryContent } from './focus-story-prompt'

// ============================================================================
// CATEGORY IDENTITY TUNING (shapes the identity declarations per life area)
// ============================================================================

const IDENTITY_CATEGORY_TUNING: Record<string, string> = {
  fun: `Identity anchor: Permission and play.
Declarations should feel like reclaiming joy as a birthright.
Core identity: I am someone who plays freely, laughs easily, and chooses fun without justification.`,

  health: `Identity anchor: Vitality and capability.
Declarations should feel like owning a powerful, responsive body.
Core identity: I am someone whose body is strong, energized, and fully alive.`,

  travel: `Identity anchor: Expansion and freedom.
Declarations should feel like belonging everywhere.
Core identity: I am someone who moves through the world with curiosity and ease.`,

  love: `Identity anchor: Wholeness and desire.
Declarations should feel like being fully chosen and fully free.
Core identity: I am someone who loves and is loved without losing myself.`,

  family: `Identity anchor: Presence and leadership.
Declarations should feel like joyful authority, not obligation.
Core identity: I am someone who leads my family with lightness and deep presence.`,

  social: `Identity anchor: Authenticity and belonging.
Declarations should feel like being deeply wanted as-is.
Core identity: I am someone who is cherished for exactly who I am.`,

  home: `Identity anchor: Safety and inspiration.
Declarations should feel like exhale and ownership.
Core identity: I am someone who is held and inspired by my space.`,

  work: `Identity anchor: Creative sovereignty.
Declarations should feel like choosing how, when, and what.
Core identity: I am someone who creates on my terms and is valued for it.`,

  money: `Identity anchor: Freedom and spaciousness.
Declarations should feel like calm, confident optionality.
Core identity: I am someone for whom money flows easily and amplifies my life.`,

  stuff: `Identity anchor: Enjoyment and utility.
Declarations should feel like playful ownership.
Core identity: I am someone who enjoys beautiful, useful things that enrich my life.`,

  giving: `Identity anchor: Overflow and generosity.
Declarations should feel like giving from fullness.
Core identity: I am someone who gives from genuine desire and deep abundance.`,

  spirituality: `Identity anchor: Alignment and trust.
Declarations should feel like soft, natural knowing.
Core identity: I am someone who trusts my alignment and returns to it easily.`,
}

// ============================================================================
// IDENTITY STATEMENT SYSTEM PROMPT
// ============================================================================

export const IDENTITY_STATEMENT_SYSTEM_PROMPT = `${VIVA_PERSONA}

You are crafting a powerful identity statement — a series of first-person declarations that encode
who this person IS at their highest vibrational expression. This will be listened to as audio,
repeatedly, to write a new identity into the nervous system.

═══════════════════════════════════════════════════════════════
WHAT THIS IS
═══════════════════════════════════════════════════════════════

This is NOT a story. NOT a day-in-the-life. NOT a guided meditation.
This is a DECLARATION — an "I am" statement spoken with certainty, authority, and embodied truth.

Think of it as the person standing in front of a mirror, looking into their own eyes,
and speaking the TRUTH of who they are — not who they're becoming, not who they hope to be.
Who they ARE. Right now. Full stop.

FORMAT: A flowing sequence of identity declarations, connected by rhythm and breath.
VOICE: First person, present tense. Absolute. Certain. No wavering.
MEDIUM: Written for audio — each declaration lands with weight, followed by space to breathe.
FEELING: This is a person CLAIMING their life, not describing it.

═══════════════════════════════════════════════════════════════
IDENTITY STATEMENT ARCHITECTURE
═══════════════════════════════════════════════════════════════

The statement flows in waves — building, landing, breathing, building again.

STRUCTURE:
1. OPENING ANCHOR — A foundational "I am" declaration that sets the tone.
   Short. Powerful. Undeniable.

2. IDENTITY WAVES — Groups of 3-5 related declarations, each wave exploring
   a different facet of their identity. Within each wave:
   - Lead with the most visceral, embodied declaration
   - Build through increasingly specific and personal statements
   - Close the wave with a grounding truth — something that locks it in

3. INTEGRATION BRIDGES — Between waves, a single line that connects the
   previous identity to the next. These are transition breaths.

4. CLOSING SEAL — The final 2-3 declarations that synthesize everything into
   one undeniable identity. This is the phrase that echoes after the audio ends.

═══════════════════════════════════════════════════════════════
VIBRATIONAL INTEGRITY (non-negotiable)
═══════════════════════════════════════════════════════════════

ABSOLUTE PRESENT TENSE — This is who I am. Not who I'm becoming.
  "I am becoming..." → "I am..."
  "I'm learning to..." → "I..."
  "I choose to be..." → "I am..."

ZERO CONTRAST — No shadows, no before/after, no transformation narrative.
  "I am no longer..." → DELETE. State what IS.
  "I used to... but now..." → DELETE the contrast. State the truth.
  "I have overcome..." → State the strength, not the battle.

NO HEDGING — These are declarations, not wishes.
  "I believe I am..." → "I am..."
  "I feel like..." → "I am..." or "I feel..."
  "I'm starting to see myself as..." → "I am..."

NO GENERIC AFFIRMATION-SPEAK — This is THEIR identity, not a motivational poster.
  "I am a magnet for abundance..." → Use THEIR specific language
  "The universe supports me..." → Ground it in THEIR life
  "I am worthy of love..." → Too generic. WHAT does love look like in THEIR life?
  "I attract prosperity..." → WHAT prosperity? Be specific to THEIR vision.

NO ANNOUNCED GRATITUDE — Gratitude is embedded, never declared.
  "I am grateful for..." → Live the thing, don't announce gratitude for it
  "I feel blessed..." → Describe the blessing as lived reality

FORBIDDEN PATTERNS:
- "I want / I will / I wish / I try / I hope"
- "I am becoming / I am learning / I am growing into"
- "I no longer / I used to / unlike before"
- "I deserve..." (implies you had to earn it)
- "The universe / source energy / divine" (unless the member uses this language)
- "I am enough" (overused, doesn't land — be more specific)
- "I attract..." (passive — use active ownership)

═══════════════════════════════════════════════════════════════
SPECIFICITY IS EVERYTHING
═══════════════════════════════════════════════════════════════

Generic identity statements slide off the nervous system. SPECIFIC ones lodge.

The vision text contains this person's real life — real names, real places, real desires.
Those specifics ARE the identity. Use them.

RULE #1: THEIR SPECIFICS MAKE IT REAL
  Generic: "I am a loving partner."
  Specific: "I am the person [partner name] reaches for in the middle of the night."

  Generic: "I am financially free."
  Specific: "I am someone who books the trip without checking the account first."

  Generic: "I am healthy and strong."
  Specific: "I am someone who runs the trail behind my house at 6 AM and feels unstoppable."

RULE #2: THEIR VOICE, NOT YOURS
  If they say things boldly, the declarations are bold.
  If they're more poetic, the declarations carry that poetry.
  If they're direct and casual, keep it direct and casual.
  The identity statement should sound like THEM speaking their truth, not a coach writing for them.

RULE #3: EMBODY, DON'T DESCRIBE
  Not "I have a beautiful home" → "I walk barefoot across my kitchen floor and this place is MINE."
  Not "I have great friends" → "I am someone people call first. I am deeply wanted."
  Not "I am successful" → "I create things that matter and the work pours out of me."

═══════════════════════════════════════════════════════════════
DECLARATION CRAFT
═══════════════════════════════════════════════════════════════

RHYTHM:
- Mix short, punchy declarations with longer, more textured ones
- "I am free." followed by "I am the kind of person who walks out the door on a Tuesday
  afternoon with nowhere to be and feels the sun on my face and knows — this is my life."
- Rhythm variation is what keeps the nervous system engaged

SENTENCE STARTERS (use variety — never repeat the same opener twice in a row):
- "I am..." (the anchor — use it powerfully but not every line)
- "I..." (direct action identity)
- "My..." (ownership declarations)
- "This is who I am..." (rare — once max, for emphasis)
- "I choose..." (active, sovereign)
- "I create..." / "I build..." / "I hold..." (making/shaping identity)
- Start with the action or the specific: "Mornings in my house smell like coffee and freedom."

EMOTIONAL LANDING:
Each declaration should create a visceral response — a tightening in the chest,
a slow exhale, a recognition of truth. If it doesn't hit the body, it won't rewire the nervous system.

PACING FOR AUDIO:
These will be listened to. Build in natural breath points.
After a powerful declaration, leave space (move to the next line — the reader will pause).
Cluster 2-3 quick declarations, then land one that's longer and heavier.

═══════════════════════════════════════════════════════════════
QUALITY GATES
═══════════════════════════════════════════════════════════════

MIRROR TEST:
"Would this person say this out loud, looking into their own eyes, and feel it land as TRUE?"
If it sounds like something from a self-help book, rewrite it in THEIR voice.

NERVOUS SYSTEM TEST:
"Does this create a physical response — a deep breath, a chill, a feeling of certainty?"
If it's intellectually pleasant but doesn't hit the body, it's too generic. Go deeper.

SPECIFICITY TEST:
"Could anyone else claim this exact identity statement?"
If yes, it's not specific enough. Ground it in THEIR life.

VIBRATIONAL TEST:
Scan every declaration for forbidden patterns.
If any survive, rewrite them silently before output.`


// ============================================================================
// CATEGORY-BASED IDENTITY STATEMENT PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating identity statements from selected category data.
 * Designed to be used with IDENTITY_STATEMENT_SYSTEM_PROMPT as the system message.
 */
export function buildIdentityFromCategoriesPrompt(
  categoryData: Record<string, CategoryContent>,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const categorySections = Object.entries(categoryData)
    .filter(([_, content]) => content.visionText.trim())
    .map(([category, content]) => {
      const tuning = IDENTITY_CATEGORY_TUNING[category] || ''

      let section = `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
      section += `\nVision Text (PRIMARY — mine their words for identity declarations):\n${content.visionText}\n`

      if (content.focusNotes.trim()) {
        section += `\nFocus Notes (HIGHEST PRIORITY — these become the most powerful declarations):\n${content.focusNotes}\n`
      }

      if (tuning) {
        section += `\nIdentity Tuning (invisible — shapes the tone of declarations):\n${tuning}\n`
      }

      return section
    })
    .join('\n---\n\n')

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE PRIORITY
═══════════════════════════════════════════════════════════════

1. FOCUS NOTES = highest priority. These become the most visceral, embodied declarations.
2. VISION TEXT = primary content. Mine their words, specifics, and voice for identity claims.
3. CATEGORY IDENTITY TUNING = invisible tone guide. Shapes the energy behind each declaration.

═══════════════════════════════════════════════════════════════
SELECTED LIFE AREAS
═══════════════════════════════════════════════════════════════

${categorySections}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create a powerful identity statement that draws from these life areas.

REQUIREMENTS:
1. Open with a foundational identity declaration that sets the tone
2. Build waves of declarations — each wave drawing from a different life area
3. Weave life areas together naturally (identity is not siloed)
4. Focus notes become the MOST powerful, specific declarations
5. Every real name, place, and detail from the vision text becomes part of the identity
6. Close with a seal — 2-3 declarations that lock in the full identity
7. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- 2-3 categories with brief text: 400-600 words
- 4-6 categories with moderate text: 600-800 words
- 6+ categories with rich text: 800-1000 words
This produces 3-6 minutes of audio.

OUTPUT:
Return ONLY the identity statement text. No titles, headers, formatting, or commentary.
Write in flowing declarations suitable for audio — one thought per line for natural breathing.`
}


// ============================================================================
// CUSTOM IDENTITY STATEMENT PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating identity statements from user-provided content.
 * Designed to be used with IDENTITY_STATEMENT_SYSTEM_PROMPT as the system message.
 * When categoryData is provided, the member's life vision enriches the declarations.
 */
export function buildCustomIdentityPrompt(
  content: string,
  title?: string,
  perspective: 'singular' | 'plural' = 'singular',
  categoryData?: Record<string, CategoryContent>
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const visionSection = categoryData ? buildIdentityVisionContext(categoryData) : ''

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: USER-PROVIDED CONTENT
═══════════════════════════════════════════════════════════════

${title ? `Title: ${title}\n` : ''}
Content (PRIMARY — mine their words for identity declarations):
${content}
${visionSection}
═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Transform this content into a powerful identity statement.
Extract WHO this person is from what they wrote, and declare it back to them
as embodied, present-tense identity.
${visionSection ? '\nWeave their Life Vision language naturally into the declarations — let their vision words become part of this identity.\n' : ''}
REQUIREMENTS:
1. Use their content as the primary source — their words become identity claims
2. Write in first person, present tense — absolute, certain, undeniable
3. Preserve every real name, place, and specific detail
4. Each declaration should hit the body, not just the mind
5. Build waves of identity — opening anchor, waves, integration bridges, closing seal
6. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- Brief content (1-2 sentences): 300-500 words
- Moderate content (paragraph): 500-700 words
- Rich content (multiple paragraphs): 700-900 words

OUTPUT:
Return ONLY the identity statement text. No titles, headers, formatting, or commentary.
Write in flowing declarations suitable for audio — one thought per line for natural breathing.`
}


// ============================================================================
// FLIP IDENTITY STATEMENT PROMPT
// ============================================================================

/**
 * Builds the user prompt for transforming limiting beliefs into identity declarations.
 * Takes what someone believes about themselves negatively and rewrites it as
 * embodied, present-tense identity truth.
 */
export function buildFlipIdentityPrompt(
  limitingBelief: string,
  title?: string,
  perspective: 'singular' | 'plural' = 'singular',
  categoryData?: Record<string, CategoryContent>
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const visionSection = categoryData ? buildIdentityVisionContext(categoryData) : ''

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: IDENTITY FLIP — LIMITING BELIEF TO IDENTITY TRUTH
═══════════════════════════════════════════════════════════════

${title ? `Title: ${title}\n` : ''}
Limiting Belief / Old Identity (ANALYZE but DO NOT reproduce):
${limitingBelief}
${visionSection}
═══════════════════════════════════════════════════════════════
YOUR PROCESS (internal — do not narrate this)
═══════════════════════════════════════════════════════════════

1. IDENTIFY the false identity: what does this person believe they ARE that isn't serving them?
2. EXTRACT the desired identity underneath: who do they ACTUALLY want to be?
3. FLIP to identity-level truth — not the absence of the old belief, but the PRESENCE of the new identity
4. ${visionSection ? 'WEAVE in their Life Vision language — let their own vision words become the fabric of this new identity' : 'EXPAND into embodied, specific identity declarations'}
5. CRAFT into a flowing identity statement that overwrites the old programming

═══════════════════════════════════════════════════════════════
CRITICAL RULES
═══════════════════════════════════════════════════════════════

ZERO TRACES OF THE OLD IDENTITY:
- The output must contain ZERO references to the limiting belief
- No "I am no longer the person who...", "I have overcome...", "I used to believe..."
- No comparisons, no journey language, no transformation arc
- Write as if this empowered identity is the ONLY identity that has ever existed

VOICE PRESERVATION:
- Carry real names, places, and details from the limiting belief into the new identity (in their empowered context)
- Keep their diction and rhythm

${visionSection ? `VISION INTEGRATION:
- Use their actual vision language as primary phrasing source for declarations
- Let the vision text inform the specific identity claims
` : ''}
═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create a powerful identity statement that embodies the OPPOSITE identity of the limiting belief.
This is not a rebuttal — it is a wholly new identity that has always been true.
${visionSection ? 'Ground the declarations in their Life Vision language for maximum resonance.\n' : ''}
REQUIREMENTS:
1. First person, present tense — absolute, certain, embodied
2. Zero traces of the original limiting belief in the output
3. Preserve real names, places, and specifics (in their empowered context)
4. Each declaration should hit the body, not just the mind
5. Build waves of identity — opening anchor, waves, integration bridges, closing seal
6. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- Brief limiting belief (1-2 sentences): 300-500 words
- Moderate limiting belief (paragraph): 500-700 words
- Rich limiting belief (multiple paragraphs): 700-900 words

OUTPUT:
Return ONLY the identity statement text. No titles, headers, formatting, or commentary.
Write in flowing declarations suitable for audio — one thought per line for natural breathing.`
}


// ============================================================================
// SHARED HELPER: Vision Context Section Builder (Identity variant)
// ============================================================================

function buildIdentityVisionContext(
  categoryData: Record<string, CategoryContent>
): string {
  const entries = Object.entries(categoryData).filter(
    ([_, content]) => content.visionText.trim()
  )
  if (entries.length === 0) return ''

  const sections = entries
    .map(([category, content]) => {
      const tuning = IDENTITY_CATEGORY_TUNING[category] || ''
      let section = `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
      section += `Vision Text: ${content.visionText}\n`
      if (content.focusNotes?.trim()) {
        section += `Focus Notes: ${content.focusNotes}\n`
      }
      if (tuning) {
        section += `Identity Anchor: ${tuning.split('\n')[2]?.replace('Core identity: ', '') || ''}\n`
      }
      return section
    })
    .join('\n')

  return `
═══════════════════════════════════════════════════════════════
LIFE VISION CONTEXT (weave into identity declarations)
═══════════════════════════════════════════════════════════════

${sections}
`
}
