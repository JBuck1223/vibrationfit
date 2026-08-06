/**
 * Essence Story Prompts
 *
 * Generates short, feeling-first stories (~150-350 words) from life vision text.
 * Unlike focus stories (day-in-the-life narratives), essence stories skip scene
 * logistics and day structure entirely — they are pure emotional definition of
 * the vision. Feelings over facts: what this life FEELS like from the inside,
 * what is wanted and why, told with appreciation and ease.
 *
 * Inspired by the "tell a new story" teaching: "We didn't talk about any facts.
 * We just talked about emotion and how it feels."
 *
 * Prompt types:
 * 1. Category-Based Essence - Distill selected life vision categories into one feeling story
 * 2. Vision Board Essence - The feeling of living a vision board item
 * 3. Journal Essence - The feeling of a journal experience at its best
 * 4. Custom Essence - Feeling story from user-provided content
 *
 * Used by: /api/stories/generate (storyFormat: 'essence')
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import type {
  CategoryContent,
  VisionBoardStoryInput,
  JournalStoryInput,
} from './focus-story-prompt'

// ============================================================================
// CATEGORY FEELING ANCHORS (the emotional core of each life area)
// ============================================================================

const ESSENCE_CATEGORY_FEELINGS: Record<string, string> = {
  fun: 'Fun is allowed. Joy does not need to be justified.',
  health: 'My body supports my joy. Health expands what I am available for.',
  travel: 'The world opens me, and I move through it freely.',
  love: 'This relationship expands who I am. I am fully myself here.',
  family: 'I am free to enjoy my family. I am light, present, and fully here.',
  social: 'I am deeply wanted and cherished for exactly who I am.',
  home: 'My home supports me, holds me, and inspires me.',
  work: 'I choose how I create, when I create, and what matters.',
  money: 'Money removes friction and amplifies fun, presence, generosity.',
  stuff: 'Things enrich my life and amplify my joy.',
  giving: 'I give from fullness and genuine desire.',
  spirituality: 'Alignment is natural. I return to it easily.',
}

// ============================================================================
// ESSENCE STORY SYSTEM PROMPT
// ============================================================================

export const ESSENCE_STORY_SYSTEM_PROMPT = `${VIVA_PERSONA}

You are crafting an ESSENCE story — a short, feeling-first monologue that captures what
someone's vision FEELS like from the inside. This will be listened to as an audio
experience — it must sound natural, intimate, and deeply personal.

═══════════════════════════════════════════════════════════════
ESSENCE IDENTITY
═══════════════════════════════════════════════════════════════

FORMAT: A flowing, feeling-first story. 150-350 words. Feelings over facts.
VOICE: First person, present tense throughout. Certain. Embodied. Emotionally alive.
MEDIUM: Written for audio — natural rhythm, varied cadence, suitable for listening.

THE CORE PRINCIPLE:
"We didn't talk about any facts. We just talked about emotion and how it feels."
This story does not describe a day, a schedule, or a sequence of events.
It defines the vision EMOTIONALLY — what it feels like to be inside this life.

SHAPE (a natural arc, not labeled sections):
1. OPEN INSIDE THE FEELING — Drop the listener directly into the felt experience.
   Not "It feels like..." — state it as fact: "It is adventurous. It is free.
   There is no ending to where we can go."
2. NAME WHAT IS LIVED AND WHY — Touch the heart of the vision through how it feels
   to have it. The desire fulfilled, felt from the inside.
3. CLOSE ON EASE AND APPRECIATION — Settle into the story of ease: things work out,
   life flows, this is who I am now. A soft, complete exhale.

FORBIDDEN STRUCTURES:
- NO day structure. No morning/midday/afternoon/evening. No "I wake up..." openings.
- NO scene-by-scene logistics or itineraries of activities.
- NO factual inventories (lists of possessions, achievements, schedules, numbers).
- NO plot. This is emotional definition, not narrative sequence.
A brief flash of a real moment is welcome as an emotional anchor — but the moment
serves the feeling, never the other way around.

═══════════════════════════════════════════════════════════════
VIBRATIONAL INTEGRITY (non-negotiable)
═══════════════════════════════════════════════════════════════

The vision text you receive has been carefully crafted in present-tense, positive ideal-state language.
Your story MUST maintain that vibrational standard. Apply these rules to every sentence:

QUESTIONS — Zero tolerance. No question marks. No rhetorical wondering.
  "What could be better?" → DELETE or narrate the answer directly.

COMPARISON / BEFORE-AFTER — Narrate only what IS, never what WAS or ISN'T.
  "I no longer worry about..." → describe the peace directly.
  "unlike before..." / "things used to be..." → DELETE the contrast entirely.
  "I remember when..." → DELETE. This is NOW.

HEDGING / SEEKING / PROCESS — This person already HAS this life.
  "I'm learning to..." → "I..."
  "I'm finding..." / "I'm starting to..." → state it as fact.
  "It feels like..." → "It is."
  "I sometimes..." → DELETE "sometimes."
  "managed to..." / "we've found a way to..." → just state it.

WANTING / FUTURE — Everything is present tense, already real.
  "I want to..." / "I hope to..." → "I..."
  "I will..." / "someday..." → it's happening NOW.
  "I can't wait to..." / "I'm excited to see..." → DELETE. They're already there.

WEAK CLOSINGS — No trailing energy leaks.
  "This is just the beginning..." → gone.
  "The possibilities feel endless..." → gone.
  "There's room to grow..." → gone.

NEGATIVE FRAMING — Inclusion-based universe. Only name what is present.
  "There is no stress..." → describe the calm directly.
  "Free from..." / "without the weight of..." → describe the lightness.
  "It never drains me..." → "It energizes me."

FORBIDDEN PATTERNS (rewrite silently if they appear):
- "I want / I will / I wish / I try / I hope to"
- "I don't / I do not / no longer / can't / cannot / lack / without"
- "but / however / even though"
- "still learning", "getting there", "easier every day"
- "I love that this is my life now" (comparative — implies it wasn't before)
- "I'm so grateful for..." / "I feel blessed..." (announced gratitude)

═══════════════════════════════════════════════════════════════
FEELING CRAFT
═══════════════════════════════════════════════════════════════

EMOTION AS FACT:
State feelings as present reality, not aspiration or simile.
"It is spacious. It is easy. There is room for everything that matters." —
not "It would feel so spacious" or "It feels like there's room."

THEIR SPECIFICS AS EMOTIONAL ANCHORS:
Keep only the most emotionally charged names, places, and details from the input —
the ones that carry the feeling. A name spoken once with warmth beats a roster.
CRITICAL: ONLY use names, places, and details that appear in the PROVIDED input text.
NEVER invent or assume names.

KEEP THEIR RAW VOICE:
If their input uses powerful or authentic phrasing, let it ring in the story.
Their words carry more charge than polished ones.

NOT ALLOWED:
- Metaphor stacking ("tapestry", "dance", "symphony", "testament to")
- Inspirational poster language ("limitless potential", "ignite our spirit")
- Affirmation-speak ("I am a magnet for...", "the universe provides...")
- Guided-meditation cadence or breathy mysticism

RHYTHM:
- Short, declarative feeling statements mixed with longer flowing lines
- Repetition used sparingly and deliberately for incantatory build ("It is... It is...")
- Natural audio cadence (read it aloud in your head — it should breathe)

PARAGRAPH STARTER DIVERSITY (HARD RULE):
Do NOT begin more than ONE paragraph with the same 1-3 word stem.

CLOSING:
End settled and complete — ease, appreciation, quiet certainty.
No trailing questions, no "just the beginning", no open loops.

═══════════════════════════════════════════════════════════════
QUALITY GATES (apply before output)
═══════════════════════════════════════════════════════════════

FEELING TEST:
"Did this define the vision emotionally, or did it describe events?"
If it reads like a schedule or a scene list, it FAILS. Rewrite from the inside out.

AUTHENTICITY TEST:
"Could I tell whose inner world this is?"
If it's so generic it could be anyone's feelings, rewrite with THEIR emotional specifics.

VIBRATIONAL TEST:
Scan every sentence for forbidden patterns (questions, comparison, hedging, wanting,
negative framing). If any survive, rewrite them silently before output.

LENGTH TEST:
150-350 words. If it runs long, cut facts first — the feeling stays.`

// ============================================================================
// SHARED OUTPUT INSTRUCTIONS
// ============================================================================

const ESSENCE_OUTPUT_BLOCK = `LENGTH: 150-350 words. Short. Concentrated. Every line carries feeling.

OUTPUT:
Return ONLY the story text. No titles, headers, formatting, or commentary.
Write in flowing paragraphs suitable for audio narration.`

// ============================================================================
// CATEGORY-BASED ESSENCE PROMPT (life_vision source)
// ============================================================================

/**
 * Builds the user prompt for distilling selected life vision categories into
 * one unified essence story. Designed to be used with
 * ESSENCE_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildEssenceFromCategoriesPrompt(
  categoryData: Record<string, CategoryContent>,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const categorySections = Object.entries(categoryData)
    .filter(([_, content]) => content.visionText.trim())
    .map(([category, content]) => {
      const feeling = ESSENCE_CATEGORY_FEELINGS[category] || ''

      let section = `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
      section += `\nVision Text (source of feeling and phrasing):\n${content.visionText}\n`

      if (content.focusNotes.trim()) {
        section += `\nFocus Notes (the moments that matter most emotionally):\n${content.focusNotes}\n`
      }

      if (feeling) {
        section += `\nFeeling Anchor (invisible — the emotional core of this area):\n${feeling}\n`
      }

      return section
    })
    .join('\n---\n\n')

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SELECTED LIFE AREAS
═══════════════════════════════════════════════════════════════

${categorySections}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Distill these life areas into ONE unified essence story — a single flowing feeling,
not per-category sections. The listener should feel what it is like to be inside
this whole life at once.

REQUIREMENTS:
1. One unified emotional current — do NOT walk through categories one by one
2. Feelings over facts — emotional definition, not events or logistics
3. Keep only the most emotionally charged names, places, and phrases from the vision text
4. Focus notes carry the strongest emotional weight
5. Close on ease and appreciation — settled, complete
6. Apply all vibrational integrity rules — zero forbidden patterns in output

${ESSENCE_OUTPUT_BLOCK}`
}

// ============================================================================
// VISION BOARD ESSENCE PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating an essence story from a vision board item.
 * Designed to be used with ESSENCE_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildVisionBoardEssencePrompt(
  item: VisionBoardStoryInput,
  focusNotes?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const feelingAnchors = (item.categories || [])
    .map(cat => {
      const feeling = ESSENCE_CATEGORY_FEELINGS[cat]
      return feeling ? `${cat}: ${feeling}` : null
    })
    .filter(Boolean)
    .join('\n')

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: VISION BOARD ITEM
═══════════════════════════════════════════════════════════════

Item: ${item.name}
${item.description ? `\nDescription (source of feeling and phrasing):\n${item.description}` : ''}
${item.categories?.length ? `\nLife Areas: ${item.categories.join(', ')}` : ''}

${focusNotes ? `═══════════════════════════════════════════════════════════════
FOCUS NOTES (the moments that matter most emotionally):
═══════════════════════════════════════════════════════════════

${focusNotes}
` : ''}
${feelingAnchors ? `═══════════════════════════════════════════════════════════════
FEELING ANCHORS (invisible — the emotional core):
═══════════════════════════════════════════════════════════════

${feelingAnchors}
` : ''}
═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create an essence story of what it FEELS like to be living the reality of "${item.name}".
Not the day it happens, not the logistics of having it — the felt experience of it
being fully real, right now.

REQUIREMENTS:
1. Feelings over facts — emotional definition, not events or logistics
2. Write as if this is already the person's life — present tense, embodied, certain
3. Keep only the most emotionally charged names, places, and details from the description
4. Focus notes (if provided) carry the strongest emotional weight
5. Close on ease and appreciation — settled, complete
6. Apply all vibrational integrity rules — zero forbidden patterns in output

${ESSENCE_OUTPUT_BLOCK}`
}

// ============================================================================
// JOURNAL ENTRY ESSENCE PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating an essence story from a journal entry.
 * Designed to be used with ESSENCE_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildJournalEssencePrompt(
  entry: JournalStoryInput,
  focusNotes?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const feelingAnchors = (entry.categories || [])
    .map(cat => {
      const feeling = ESSENCE_CATEGORY_FEELINGS[cat]
      return feeling ? `${cat}: ${feeling}` : null
    })
    .filter(Boolean)
    .join('\n')

  const transcriptSection = entry.transcripts?.length
    ? `\nAudio Transcripts (additional raw voice — preserve their phrasing):\n${entry.transcripts.join('\n\n')}`
    : ''

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: JOURNAL ENTRY (${entry.date})
═══════════════════════════════════════════════════════════════

${entry.title ? `Title: ${entry.title}\n` : ''}
Journal Content (source of feeling and phrasing):
${entry.content}
${transcriptSection}
${entry.categories?.length ? `\nLife Areas: ${entry.categories.join(', ')}` : ''}

${focusNotes ? `═══════════════════════════════════════════════════════════════
FOCUS NOTES (the moments that matter most emotionally):
═══════════════════════════════════════════════════════════════

${focusNotes}
` : ''}
${feelingAnchors ? `═══════════════════════════════════════════════════════════════
FEELING ANCHORS (invisible — the emotional core):
═══════════════════════════════════════════════════════════════

${feelingAnchors}
` : ''}
═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Distill this journal entry into an essence story — the felt experience of this part
of life at its highest vibrational expression, as if it is fully real NOW.

This is NOT a summary or retelling of the journal entry. It uses the journal as raw
material to define the experience EMOTIONALLY, from the inside.

REQUIREMENTS:
1. Feelings over facts — emotional definition, not a recap of events
2. Elevate to ideal-state expression — present tense, embodied, certain
3. Keep only the most emotionally charged names, places, and phrases from their writing
4. Focus notes (if provided) carry the strongest emotional weight
5. Close on ease and appreciation — settled, complete
6. Apply all vibrational integrity rules — zero forbidden patterns in output

${ESSENCE_OUTPUT_BLOCK}`
}

// ============================================================================
// CUSTOM ESSENCE PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating an essence story from user-provided content.
 * Designed to be used with ESSENCE_STORY_SYSTEM_PROMPT as the system message.
 * When categoryData is provided, the user's life vision context enriches the feeling.
 */
export function buildCustomEssencePrompt(
  content: string,
  title?: string,
  perspective: 'singular' | 'plural' = 'singular',
  categoryData?: Record<string, CategoryContent>
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const visionSection = categoryData ? buildEssenceVisionContextSection(categoryData) : ''

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: USER-PROVIDED CONTENT
═══════════════════════════════════════════════════════════════

${title ? `Title: ${title}\n` : ''}
Content (source of feeling and phrasing):
${content}
${visionSection}
═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Distill this content into an essence story — the felt experience of what they
described, fully real, right now. Feelings over facts.
${visionSection ? '\nLet the Life Vision context deepen the feeling — without overriding their original content.\n' : ''}
REQUIREMENTS:
1. Feelings over facts — emotional definition, not events or logistics
2. First person, present tense — embodied, certain, alive
3. Keep only the most emotionally charged names, places, and phrases from their writing
4. Close on ease and appreciation — settled, complete
5. Apply all vibrational integrity rules — zero forbidden patterns in output

${ESSENCE_OUTPUT_BLOCK}`
}

// ============================================================================
// SHARED HELPER: Vision Context Section Builder
// ============================================================================

function buildEssenceVisionContextSection(
  categoryData: Record<string, CategoryContent>
): string {
  const entries = Object.entries(categoryData).filter(
    ([_, content]) => content.visionText.trim()
  )
  if (entries.length === 0) return ''

  const sections = entries
    .map(([category, content]) => {
      const feeling = ESSENCE_CATEGORY_FEELINGS[category] || ''
      let section = `### ${category.charAt(0).toUpperCase() + category.slice(1)}\n`
      section += `Vision Text: ${content.visionText}\n`
      if (content.focusNotes?.trim()) {
        section += `Focus Notes: ${content.focusNotes}\n`
      }
      if (feeling) {
        section += `Feeling Anchor: ${feeling}\n`
      }
      return section
    })
    .join('\n')

  return `
═══════════════════════════════════════════════════════════════
LIFE VISION CONTEXT (deepens the feeling — weave naturally)
═══════════════════════════════════════════════════════════════

${sections}
`
}
