/**
 * Focus Story Prompts (v2)
 * 
 * Generates immersive day-in-the-life narratives from life vision text.
 * Applies the same vibrational integrity, specificity preservation, and voice
 * authenticity standards as the Life Vision generation system.
 * 
 * Prompt types:
 * 1. Highlight Extraction - Analyze vision and extract vivid moments
 * 2. Category-Based Story Generation - Weave selected categories into narrative (v2 flow)
 * 3. Highlight-Based Story Generation - Weave extracted highlights into narrative (v1 flow)
 * 4. Story Refinement - Revise story based on feedback
 * 
 * Used by: /api/viva/focus/suggest, /api/viva/focus/generate, /api/viva/focus/generate-v2
 */

import { VIVA_PERSONA } from './shared/viva-persona'

// ============================================================================
// TYPES
// ============================================================================

export interface FocusHighlight {
  category: string
  text: string
  essence: string
  timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening' | 'any'
  sensoryRichness: number
}

export interface VisionSections {
  forward?: string
  fun?: string
  health?: string
  travel?: string
  love?: string
  family?: string
  social?: string
  home?: string
  work?: string
  money?: string
  stuff?: string
  giving?: string
  spirituality?: string
  conclusion?: string
}

export interface CategoryContent {
  visionText: string
  focusNotes: string
}

// ============================================================================
// CATEGORY EMOTIONAL TUNING (shapes HOW scenes feel in the narrative)
// ============================================================================

const STORY_CATEGORY_TUNING: Record<string, string> = {
  fun: `Emotional tone: Permission and lightness.
Scenes should feel spontaneous, playful — unjustified joy.
Avoid: earned joy, scheduled happiness, productivity framing.
The feeling: Fun is allowed. Joy does not need to be justified.`,

  health: `Emotional tone: Freedom of movement, energy, enjoyment.
Scenes should feel like vitality-as-play, capability, pride without comparison.
Avoid: fixing the body, discipline as control, fear-based motivation.
The feeling: My body supports my joy. Health expands what I am available for.`,

  travel: `Emotional tone: Expansion through experience.
Scenes should feel curious, wonder-filled, flowing.
Avoid: escapism, over-planning, status travel.
The feeling: The world opens me, and I move through it freely.`,

  love: `Emotional tone: Freedom to be fully myself.
Scenes should feel like mutual allowance, deep desire, natural passion.
Avoid: validation seeking, completion narratives, sacrifice framing.
The feeling: This relationship expands who I am. I am fully myself here.`,

  family: `Emotional tone: Emotional freedom and mutual allowance.
Scenes should feel like joyful presence, leadership through alignment.
Avoid: responsibility for others' emotions, perfectionism, martyrdom.
The feeling: I am free to enjoy my family. I am light, present, and fully here.`,

  social: `Emotional tone: Freedom to be authentic.
Scenes should feel like mutual enthusiasm, ease of connection, reciprocity.
Avoid: obligation, over-giving, managing dynamics.
The feeling: I am deeply wanted and cherished for exactly who I am.`,

  home: `Emotional tone: Safety and ease.
Scenes should feel like exhale, comfort, flow.
Avoid: impressing others, maintenance stress, perfection pressure.
The feeling: My home supports me, holds me, and inspires me.`,

  work: `Emotional tone: Creative freedom, feeling seen and valued.
Scenes should feel self-directed, appreciative without dependence.
Avoid: grind culture, "hard but worth it", external validation loops.
The feeling: I choose how I create, when I create, and what matters.`,

  money: `Emotional tone: Freedom of choice.
Scenes should feel spacious, calm, confident, full of optionality.
Avoid: hustle language, proving worth, money as identity.
The feeling: Money removes friction and amplifies fun, presence, generosity.`,

  stuff: `Emotional tone: Ease and enjoyment.
Scenes should feel like utility with delight, playfulness.
Avoid: accumulation, status signaling, attachment.
The feeling: Things enrich my life and amplify my joy.`,

  giving: `Emotional tone: Overflow.
Scenes should feel like joyful generosity, choice, appreciation.
Avoid: duty, guilt, saving others.
The feeling: I give from fullness and genuine desire.`,

  spirituality: `Emotional tone: Freedom of alignment.
Scenes should feel like soft knowing, trust, presence.
Avoid: seeking, hierarchies, spiritual effort.
The feeling: Alignment is natural. I return to it easily.`
}

// ============================================================================
// FOCUS STORY SYSTEM PROMPT
// ============================================================================

export const FOCUS_STORY_SYSTEM_PROMPT = `${VIVA_PERSONA}

You are crafting an immersive day-in-the-life narrative that brings someone's Life Vision to life.
This story will be listened to as an audio experience — it must sound natural, vivid, and deeply personal.

═══════════════════════════════════════════════════════════════
NARRATIVE IDENTITY
═══════════════════════════════════════════════════════════════

FORMAT: A flowing day-in-the-life story, morning awakening through evening wind-down.
VOICE: First person, present tense throughout. Certain. Embodied. SPECIFIC.
MEDIUM: Written for audio — natural rhythm, varied cadence, suitable for listening.

STORY STRUCTURE:
The day flows naturally through four movements:

MORNING (dawn to mid-morning):
- Waking, the quality of light, first sensations
- Morning rituals, energy, intention

MIDDAY (late morning to early afternoon):
- Active engagement, work or play
- Connections, conversations, flow

AFTERNOON (mid to late afternoon):
- Continued experiences, transitions
- Energy of accomplishment or leisure

EVENING (sunset and beyond):
- Winding down, reflection
- Presence, satisfaction, peace

═══════════════════════════════════════════════════════════════
VIBRATIONAL INTEGRITY (non-negotiable)
═══════════════════════════════════════════════════════════════

The vision text you receive has been carefully crafted in present-tense, positive ideal-state language.
Your narrative MUST maintain that vibrational standard. Apply these rules to every sentence:

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
SPECIFICITY PRESERVATION (critical)
═══════════════════════════════════════════════════════════════

The vision text contains the member's real life — real names, real places, real routines.
These ARE the story. Do NOT abstract them away.

RULE #1: THEIR SPECIFICS ARE THE STORY
If they named a person, that person appears in the narrative BY NAME.
If they described a specific routine, that routine appears in the day.
If they mentioned a real place, the scene happens THERE.
- "Miss Kelly watches the kids" beats "our caregiver helps out"
- "Oliver, Adeline, and Eloise" beats "the kids"
- "our house in Lake Nona" beats "our beautiful home"
- "zip lining in Florida" beats "thrilling adventures"
Every real name, place, and detail from the vision text MUST survive into the story.

RULE #2: SENSORY EXPANSION ON THEIR MOMENTS
Add sensory texture to scenes THEY described — do not invent new scenes.
- Sounds: wooden spoons clacking, kids laughing, the hum of the boat engine
- Touch: sun on skin, cool water, the weight of a child on your hip, sand between toes
- Smell/taste: coffee brewing, salt air, garlic sizzling, fresh-cut grass
- Sight: specific colors, light, the look on someone's face, a specific view

RULE #3: KEEP THEIR RAW VOICE
If their vision text uses powerful or authentic phrasing, let it ring in the narrative.
"Our sex life is incredible" is MORE powerful than "our intimate connection deepens."
"I eat pizza and desserts and don't make any food wrong" beats "I nourish myself wisely."
Preserve authentic phrasing. Their words carry more charge than polished ones.

EXPANSION DOES NOT MEAN:
- Replace their words with fancier synonyms
- Add metaphors ("tapestry", "dance", "symphony", "testament to")
- Use inspirational poster language ("limitless potential", "ignite our spirit", "boundless energy")
- Insert affirmation-speak ("I am a magnet for...", "the universe provides...", "every moment is a gift")
- Turn a direct statement into a flowery paragraph

═══════════════════════════════════════════════════════════════
NARRATIVE CRAFT
═══════════════════════════════════════════════════════════════

SHOW, DON'T TELL:
Every moment should be a lived experience, not a declaration.
"I feel warm mist on my face as I step outside" — not "I am grateful for the morning."
"Jordan grabs my hand and we walk toward the water" — not "My relationship is loving."

TRANSITIONS:
Smooth, cinematic transitions between moments and life areas.
"As the afternoon unfolds..." / "Later, the light turns golden..." / "The drive home is quiet and easy..."
Never jarring topic jumps. Bridge with small sensory moments — a deep breath, a walk between places.

RHYTHM:
- Mix short punchy lines with vivid cinematic paragraphs
- Vary sentence length — some tight and factual, some flowing and descriptive
- Natural audio cadence (read it aloud in your head — it should breathe)

PARAGRAPH STARTER DIVERSITY (HARD RULE):
Do NOT begin more than ONE paragraph with the same 1-3 word stem.
"I wake..." / "I walk..." / "I feel..." / "I notice..." — each used ONCE maximum.
If repetition happens, rewrite before output.

MICRO-MOMENTS:
Include small, grounding sensory beats between major scenes:
- A sip of coffee, a deep breath, bare feet on cool tile, the click of a door closing
- These create the lived-in texture that makes the story feel real

CLOSING:
End with a SCENE (not a declaration) that carries deep satisfaction.
The listener should feel the day settling into completeness — a deep exhale.
No trailing questions, no "just the beginning", no open loops.

═══════════════════════════════════════════════════════════════
QUALITY GATES (apply before output)
═══════════════════════════════════════════════════════════════

AUTHENTICITY TEST:
"Could I tell who this person is from reading this story?"
If it's so generic it could be anyone's day, it FAILS. Rewrite with THEIR details.

ENERGY TEST:
"Would this specific person recognize their own life in this story?"
If it sounds like a guided meditation script instead of a real person's day, rewrite it.

VIBRATIONAL TEST:
Scan every sentence for forbidden patterns (comparison, hedging, wanting, negative framing).
If any survive, rewrite them silently before output.

SPECIFICITY TEST:
Every real name, place, and routine from the input vision text must appear in the output.
If any were abstracted away, restore them.`


// ============================================================================
// HIGHLIGHT EXTRACTION PROMPT (used by /api/viva/focus/suggest)
// ============================================================================

export const FOCUS_HIGHLIGHT_SYSTEM_PROMPT = `${VIVA_PERSONA}

You are analyzing a Life Vision document to extract the most vivid, emotionally charged moments 
that would make compelling audio narration. Your goal is to identify 5-7 highlights that:

1. Are SENSORY-RICH - Include specific sights, sounds, textures, tastes, or feelings
2. Are EMOTIONALLY ACTIVATING - Create a visceral response when read aloud
3. Span DIFFERENT TIMES OF DAY - Suggest morning, midday, afternoon, or evening placement
4. Represent VARIETY - Cover different life areas without repetition
5. STAND ALONE - Can be understood without heavy context

WHAT MAKES A GREAT HIGHLIGHT:
- Specific moments, not abstract goals
- Sensory details (the smell of coffee, the sound of laughter, the feel of sun)
- Actions and experiences, not possessions
- Emotional resonance over logical importance

AVOID:
- Generic statements ("I am healthy")
- Financial figures or metrics
- Abstract concepts without imagery
- Anything that sounds like a to-do list`

/**
 * Builds the prompt for extracting highlights from a vision
 */
export function buildHighlightExtractionPrompt(vision: VisionSections): string {
  const visionText = Object.entries(vision)
    .filter(([key, value]) => value && value.trim() && key !== 'forward' && key !== 'conclusion')
    .map(([category, text]) => `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n${text}`)
    .join('\n\n')

  return `LIFE VISION TO ANALYZE:
${visionText}

TASK:
Extract 5-7 highlights that would create the most immersive, emotionally activating 
day-in-the-life audio experience.

For each highlight, determine:
- Which category it comes from
- The specific text (quote or close paraphrase from the vision)
- A single-word essence (the dominant feeling)
- Suggested time of day (when this moment naturally occurs)
- Sensory richness score (1-5, how vivid and specific it is)

OUTPUT FORMAT (JSON array):
[
  {
    "category": "health",
    "text": "The specific moment from the vision...",
    "essence": "vitality",
    "timeOfDay": "morning",
    "sensoryRichness": 4
  },
  ...
]

Return ONLY the JSON array, no additional text.
Prioritize highlights that will sound beautiful and activating when read aloud.`
}


// ============================================================================
// CATEGORY-BASED STORY PROMPT (v2 flow — used by /api/viva/focus/generate-v2)
// ============================================================================

/**
 * Builds the user prompt for generating a focus story from selected category data.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildFocusStoryFromCategoriesPrompt(
  categoryData: Record<string, CategoryContent>,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const categorySections = Object.entries(categoryData)
    .filter(([_, content]) => content.visionText.trim())
    .map(([category, content]) => {
      const tuning = STORY_CATEGORY_TUNING[category] || ''

      let section = `## ${category.charAt(0).toUpperCase() + category.slice(1)}\n`

      section += `\nVision Text (PRIMARY — preserve their words, names, and details):\n${content.visionText}\n`

      if (content.focusNotes.trim()) {
        section += `\nFocus Notes (HIGHEST PRIORITY — these moments MUST appear as vivid, expanded scenes):\n${content.focusNotes}\n`
      }

      if (tuning) {
        section += `\nEmotional Tuning (invisible — shapes tone, not content):\n${tuning}\n`
      }

      return section
    })
    .join('\n---\n\n')

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE PRIORITY
═══════════════════════════════════════════════════════════════

1. FOCUS NOTES = highest priority. These specific moments MUST appear as expanded, vivid scenes.
2. VISION TEXT = primary content and phrasing source. Borrow their words heavily.
   Every real name, place, and routine in the vision text MUST appear in the narrative.
3. CATEGORY EMOTIONAL TUNING = invisible tone guide. Shapes HOW scenes feel, not WHAT they contain.

═══════════════════════════════════════════════════════════════
SELECTED LIFE AREAS
═══════════════════════════════════════════════════════════════

${categorySections}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create a flowing day-in-the-life narrative that weaves these life areas into an immersive story.

REQUIREMENTS:
1. Flow naturally from morning to evening
2. Incorporate content from EACH selected life area
3. Focus notes get the MOST vivid, expanded treatment — build them into full sensory scenes
4. Create smooth cinematic transitions between life areas
5. Every real name, place, and specific detail from the vision text appears in the story
6. End with a scene of peaceful completion (not a declaration)
7. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- 2-3 categories with brief text: 500-750 words
- 4-6 categories with moderate text: 750-1000 words
- 6+ categories with rich text: 1000-1200 words
This produces 4-8 minutes of audio depending on density.

OUTPUT:
Return ONLY the narrative text. No titles, headers, formatting, or commentary.
Write in flowing paragraphs suitable for audio narration.`
}


// ============================================================================
// HIGHLIGHT-BASED STORY PROMPT (v1 flow — used by /api/viva/focus/generate)
// ============================================================================

/**
 * Builds the user prompt for generating the day-in-the-life story from extracted highlights.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildDayInTheLifeStoryPrompt(
  highlights: FocusHighlight[],
  userName?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const timeOrder = { morning: 0, midday: 1, afternoon: 2, evening: 3, any: 2 }
  const sortedHighlights = [...highlights].sort((a, b) =>
    timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay]
  )

  const highlightsList = sortedHighlights.map((h, i) => {
    const tuning = STORY_CATEGORY_TUNING[h.category] || ''
    let entry = `${i + 1}. [${h.timeOfDay.toUpperCase()}] ${h.category}: "${h.text}" (essence: ${h.essence})`
    if (tuning) {
      entry += `\n   Emotional tone: ${tuning.split('\n')[0].replace('Emotional tone: ', '')}`
    }
    return entry
  }).join('\n')

  return `PERSPECTIVE: ${pronoun}
${userName ? `NAME: ${userName} (use sparingly if at all)` : ''}

═══════════════════════════════════════════════════════════════
SELECTED HIGHLIGHTS TO WEAVE INTO THE DAY
═══════════════════════════════════════════════════════════════

${highlightsList}

═══════════════════════════════════════════════════════════════
SOURCE PRIORITY
═══════════════════════════════════════════════════════════════

1. HIGHLIGHT TEXT = primary content. These are quotes from the member's own vision.
   Preserve their specific words, names, places, and details.
2. ESSENCE WORDS = emotional anchor for each scene.
3. CATEGORY EMOTIONAL TUNING = invisible tone guide.

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create a flowing day-in-the-life narrative (750-1000 words) that weaves these highlights
into an immersive story.

REQUIREMENTS:
1. Flow naturally from morning to evening
2. Include EACH highlight, expanded with sensory detail from THEIR life
3. Preserve every real name, place, and specific detail from the highlight text
4. Create smooth cinematic transitions between moments
5. Feel like listening to someone share their ideal day
6. End with a scene of peaceful completion
7. Apply all vibrational integrity rules — zero forbidden patterns

IMPORTANT:
- Every highlight MUST appear in the story
- Add sensory details that ground THEIR described moments (sounds, textures, temperatures)
- Create bridging moments between highlights (a walk, a pause, a breath)
- The tone should be calm, present, and embodied — not excited or performative

OUTPUT:
Return ONLY the narrative text. No titles, headers, or formatting.
Write in flowing paragraphs suitable for audio narration.`
}


// ============================================================================
// STORY REFINEMENT PROMPT
// ============================================================================

/**
 * Builds prompt for refining an existing story based on user feedback.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildStoryRefinementPrompt(
  existingStory: string,
  feedback: string,
  highlights: FocusHighlight[]
): string {
  const highlightsList = highlights.map((h, i) =>
    `${i + 1}. ${h.category}: "${h.text}"`
  ).join('\n')

  return `CURRENT STORY:
${existingStory}

USER FEEDBACK:
${feedback}

HIGHLIGHTS THAT MUST REMAIN:
${highlightsList}

TASK:
Revise the story based on the user's feedback while:
1. Maintaining the same highlights and overall day-in-the-life structure
2. Addressing the specific feedback
3. Preserving all real names, places, and specific details
4. Keeping vibrational integrity — zero forbidden patterns
5. Keeping the sensory, immersive quality
6. Matching the original length (unless feedback asks for shorter/longer)

Apply the authenticity test: "Could I tell who this person is from reading this?"
Apply the energy test: "Would this person recognize their own life here?"

OUTPUT:
Return ONLY the revised narrative text. No explanations or commentary.`
}


// ============================================================================
// VISION BOARD ITEM STORY PROMPT
// ============================================================================

export interface VisionBoardStoryInput {
  name: string
  description: string | null
  categories: string[] | null
  imageUrl?: string | null
}

/**
 * Builds the user prompt for generating a story from a vision board item.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildVisionBoardStoryPrompt(
  item: VisionBoardStoryInput,
  focusNotes?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const categoryTunings = (item.categories || [])
    .map(cat => {
      const tuning = STORY_CATEGORY_TUNING[cat]
      return tuning ? `${cat}: ${tuning.split('\n')[0].replace('Emotional tone: ', '')}` : null
    })
    .filter(Boolean)
    .join('\n')

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: VISION BOARD ITEM
═══════════════════════════════════════════════════════════════

Item: ${item.name}
${item.description ? `\nDescription (PRIMARY — preserve their words, names, and details):\n${item.description}` : ''}
${item.categories?.length ? `\nLife Areas: ${item.categories.join(', ')}` : ''}

${focusNotes ? `═══════════════════════════════════════════════════════════════
FOCUS NOTES (HIGHEST PRIORITY — these moments MUST appear as vivid, expanded scenes):
═══════════════════════════════════════════════════════════════

${focusNotes}
` : ''}
${categoryTunings ? `═══════════════════════════════════════════════════════════════
EMOTIONAL TUNING (invisible — shapes tone, not content):
═══════════════════════════════════════════════════════════════

${categoryTunings}
` : ''}
═══════════════════════════════════════════════════════════════
SOURCE PRIORITY
═══════════════════════════════════════════════════════════════

1. FOCUS NOTES = highest priority (if provided). Build into vivid, expanded scenes.
2. ITEM DESCRIPTION = primary content and phrasing source. Borrow their words heavily.
3. ITEM NAME = the anchoring vision. The story is about LIVING this reality.
4. CATEGORY EMOTIONAL TUNING = invisible tone guide.

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Create an immersive day-in-the-life narrative about LIVING the reality of "${item.name}".
The story should feel like a vivid day or moment where this vision is fully realized and real.

REQUIREMENTS:
1. Write as if this is already the person's life — present tense, embodied, certain
2. Preserve every real name, place, and specific detail from the description
3. Focus notes (if provided) get the MOST vivid, expanded treatment
4. Include sensory grounding — what they see, hear, feel, taste, smell
5. End with a scene of peaceful satisfaction (not a declaration)
6. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- Brief description (1-2 sentences): 400-600 words
- Moderate description (paragraph): 600-900 words
- Rich description (multiple paragraphs): 900-1200 words

OUTPUT:
Return ONLY the narrative text. No titles, headers, formatting, or commentary.
Write in flowing paragraphs suitable for audio narration.`
}


// ============================================================================
// JOURNAL ENTRY STORY PROMPT
// ============================================================================

export interface JournalStoryInput {
  title: string | null
  content: string
  date: string
  categories: string[] | null
  transcripts?: string[]
}

/**
 * Builds the user prompt for generating a story from a journal entry.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildJournalStoryPrompt(
  entry: JournalStoryInput,
  focusNotes?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  const categoryTunings = (entry.categories || [])
    .map(cat => {
      const tuning = STORY_CATEGORY_TUNING[cat]
      return tuning ? `${cat}: ${tuning.split('\n')[0].replace('Emotional tone: ', '')}` : null
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
Journal Content (PRIMARY — preserve their words, names, and details):
${entry.content}
${transcriptSection}
${entry.categories?.length ? `\nLife Areas: ${entry.categories.join(', ')}` : ''}

${focusNotes ? `═══════════════════════════════════════════════════════════════
FOCUS NOTES (HIGHEST PRIORITY — these moments MUST appear as vivid, expanded scenes):
═══════════════════════════════════════════════════════════════

${focusNotes}
` : ''}
${categoryTunings ? `═══════════════════════════════════════════════════════════════
EMOTIONAL TUNING (invisible — shapes tone, not content):
═══════════════════════════════════════════════════════════════

${categoryTunings}
` : ''}
═══════════════════════════════════════════════════════════════
SOURCE PRIORITY
═══════════════════════════════════════════════════════════════

1. FOCUS NOTES = highest priority (if provided). Build into vivid, expanded scenes.
2. JOURNAL CONTENT = primary content and phrasing source. Borrow their words heavily.
3. AUDIO TRANSCRIPTS = additional raw voice. Preserve their authentic phrasing.
4. CATEGORY EMOTIONAL TUNING = invisible tone guide.

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Transform this journal entry into an immersive first-person narrative.
Take what they wrote about and EXPAND it into a vivid, sensory-rich story of LIVING that experience
at its highest vibrational expression — as if everything described is happening NOW in its ideal form.

This is NOT a summary of the journal entry. It is a STORY that uses the journal as a launching pad
to create an immersive audio experience of their life at its best.

REQUIREMENTS:
1. Use the journal content as raw material — their words, names, and details are the foundation
2. Elevate the experience to its ideal-state expression (present tense, embodied, certain)
3. Preserve every real name, place, and specific detail from their writing
4. Focus notes (if provided) get the MOST vivid, expanded treatment
5. Add sensory grounding — what they see, hear, feel, taste, smell
6. End with a scene of deep satisfaction (not a declaration)
7. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- Brief entry (1-2 sentences): 400-600 words
- Moderate entry (paragraph): 600-900 words
- Rich entry (multiple paragraphs): 900-1200 words

OUTPUT:
Return ONLY the narrative text. No titles, headers, formatting, or commentary.
Write in flowing paragraphs suitable for audio narration.`
}


// ============================================================================
// CUSTOM STORY PROMPT
// ============================================================================

/**
 * Builds the user prompt for generating a story from user-provided content.
 * Designed to be used with FOCUS_STORY_SYSTEM_PROMPT as the system message.
 */
export function buildCustomStoryPrompt(
  content: string,
  title?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'

  return `PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
SOURCE: USER-PROVIDED CONTENT
═══════════════════════════════════════════════════════════════

${title ? `Title: ${title}\n` : ''}
Content (PRIMARY — preserve their words, names, and details):
${content}

═══════════════════════════════════════════════════════════════
TASK
═══════════════════════════════════════════════════════════════

Transform this content into an immersive first-person narrative.
Take what they wrote and EXPAND it into a vivid, sensory-rich day-in-the-life story
where everything described is happening NOW in its ideal form.

REQUIREMENTS:
1. Use their content as primary source — their words, names, and details are sacred
2. Write in first person, present tense — embodied, certain, alive
3. Preserve every real name, place, and specific detail from their writing
4. Add sensory grounding — what they see, hear, feel, taste, smell
5. Create a flowing narrative suitable for audio listening
6. End with a scene of deep satisfaction (not a declaration)
7. Apply all vibrational integrity rules — zero forbidden patterns in output

LENGTH: Scale with input richness.
- Brief content (1-2 sentences): 400-600 words
- Moderate content (paragraph): 600-900 words
- Rich content (multiple paragraphs): 900-1200 words

OUTPUT:
Return ONLY the narrative text. No titles, headers, formatting, or commentary.
Write in flowing paragraphs suitable for audio narration.`
}
