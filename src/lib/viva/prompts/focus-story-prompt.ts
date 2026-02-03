/**
 * Focus Story Prompts
 * 
 * Prompts for generating Focus stories - 5-7 minute day-in-the-life audio narratives
 * that bring life visions to life through immersive storytelling.
 * 
 * Two main prompts:
 * 1. Highlight Extraction - Analyze vision and extract most vivid moments
 * 2. Day-in-the-Life Story Generation - Weave highlights into a narrative
 * 
 * Used by: /api/life-vision/focus/suggest, /api/life-vision/focus/generate
 */

import { VIVA_PERSONA } from './shared/viva-persona'

// ============================================================================
// TYPES
// ============================================================================

export interface FocusHighlight {
  category: string
  text: string
  essence: string  // Single word capturing the feeling
  timeOfDay: 'morning' | 'midday' | 'afternoon' | 'evening' | 'any'
  sensoryRichness: number  // 1-5 scale
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

// ============================================================================
// HIGHLIGHT EXTRACTION PROMPT
// ============================================================================

/**
 * System prompt for extracting vivid highlights from a life vision
 */
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

  return `${FOCUS_HIGHLIGHT_SYSTEM_PROMPT}

LIFE VISION TO ANALYZE:
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
// DAY-IN-THE-LIFE STORY PROMPT
// ============================================================================

/**
 * System prompt for generating the day-in-the-life narrative
 */
export const FOCUS_STORY_SYSTEM_PROMPT = `${VIVA_PERSONA}

You are crafting an immersive day-in-the-life narrative that brings someone's life vision to life.
This story will be listened to as a 5-7 minute audio experience (750-1000 words).

NARRATIVE STYLE:
- First person, present tense throughout
- Sensory-rich and cinematic
- Flowing transitions between moments
- Emotionally activating without being preachy
- Natural rhythm suitable for audio listening

STORY STRUCTURE:
The day flows naturally from morning awakening through evening wind-down:

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
- Gratitude, presence, peace

WRITING RULES:
1. Each moment should SHOW, not tell ("I feel the warm sun on my face" not "I am grateful for the sun")
2. Transitions should be smooth, not jarring ("Later..." or "As the afternoon unfolds...")
3. Include micro-moments of sensation (a sip of coffee, a deep breath, a smile)
4. Vary sentence length - some short and punchy, some flowing and descriptive
5. End with a sense of completeness and contentment

AVOID:
- "I am so grateful for..." or "I feel blessed..."
- Listing activities without sensory grounding
- Rushing through moments
- Generic or vague descriptions
- Coaching or advice language`

/**
 * Builds the prompt for generating the day-in-the-life story
 */
export function buildDayInTheLifeStoryPrompt(
  highlights: FocusHighlight[],
  userName?: string,
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const pronoun = perspective === 'plural' ? 'we/us/our' : 'I/me/my'
  
  // Sort highlights by time of day for natural flow
  const timeOrder = { morning: 0, midday: 1, afternoon: 2, evening: 3, any: 2 }
  const sortedHighlights = [...highlights].sort((a, b) => 
    timeOrder[a.timeOfDay] - timeOrder[b.timeOfDay]
  )

  const highlightsList = sortedHighlights.map((h, i) => 
    `${i + 1}. [${h.timeOfDay.toUpperCase()}] ${h.category}: "${h.text}" (essence: ${h.essence})`
  ).join('\n')

  return `${FOCUS_STORY_SYSTEM_PROMPT}

PERSPECTIVE: ${pronoun}
${userName ? `NAME: ${userName} (use sparingly if at all)` : ''}

SELECTED HIGHLIGHTS TO WEAVE INTO THE DAY:
${highlightsList}

TASK:
Create a flowing day-in-the-life narrative (750-1000 words) that weaves these highlights 
into an immersive story. The narrative should:

1. Flow naturally from morning to evening
2. Include EACH highlight, expanded with sensory detail
3. Create smooth transitions between moments
4. Feel like listening to someone share their ideal day
5. End with a sense of peaceful completion

IMPORTANT:
- Every highlight MUST appear in the story
- Add sensory details that weren't in the original (sounds, textures, temperatures)
- Create bridging moments between highlights (a walk between places, a pause to breathe)
- The tone should be calm, present, and embodied - not excited or performative

TARGET LENGTH: 750-1000 words (this produces 5-7 minutes of audio)

OUTPUT:
Return ONLY the narrative text. No titles, headers, or formatting.
Write in flowing paragraphs suitable for audio narration.`
}

// ============================================================================
// STORY REFINEMENT PROMPT (for regeneration)
// ============================================================================

/**
 * Builds prompt for refining an existing story based on user feedback
 */
export function buildStoryRefinementPrompt(
  existingStory: string,
  feedback: string,
  highlights: FocusHighlight[]
): string {
  const highlightsList = highlights.map((h, i) => 
    `${i + 1}. ${h.category}: "${h.text}"`
  ).join('\n')

  return `${FOCUS_STORY_SYSTEM_PROMPT}

CURRENT STORY:
${existingStory}

USER FEEDBACK:
${feedback}

HIGHLIGHTS THAT MUST REMAIN:
${highlightsList}

TASK:
Revise the story based on the user's feedback while:
1. Maintaining the same highlights and overall structure
2. Addressing the specific feedback
3. Keeping the 750-1000 word target length
4. Preserving the sensory, immersive quality

OUTPUT:
Return ONLY the revised narrative text. No explanations or commentary.`
}
