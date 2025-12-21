/**
 * Single Category Vision Prompt
 * 
 * Lean prompt builder for queue-based category vision generation.
 * Used by the assembly queue system to generate individual category vision text.
 * 
 * Used by: /api/viva/category-vision (queue system)
 */

import { VisionCategoryKey } from '@/lib/design-system/vision-categories'

export interface IndividualCategoryParams {
  categoryKey: VisionCategoryKey
  categoryLabel: string
  idealStateText: string
  clarityPresentStateText?: string
  contrastFlips: string[]
  perspective?: 'singular' | 'plural'
}

/**
 * Category Micro-Tuning Blocks
 * Internal guidance for each category to shape tone and emotional targets
 * Ordered to match VISION_CATEGORIES source of truth: src/lib/design-system/vision-categories.ts
 */
const CATEGORY_MICRO_TUNING: Record<string, string> = {
  fun: `Primary emotional target:
Permission.

Tone calibration:
• Lightness
• Spontaneity
• Play without justification

Avoid:
• Earned joy
• Scheduled happiness
• Productivity framing

Internal guide:
Fun is allowed. Joy does not need to be justified.`,

  health: `Primary emotional target:
Freedom of movement, energy, and enjoyment.

Tone calibration:
• Capability
• Pride without comparison
• Vitality as play
• Strength as enjoyment

Avoid:
• Fixing the body
• Discipline as control
• Fear-based motivation

Internal guide:
My body supports my joy. Health expands what I am available for in life.`,

  travel: `Primary emotional target:
Expansion through experience.

Tone calibration:
• Curiosity
• Wonder
• Flow

Avoid:
• Escapism
• Over-planning
• Status travel

Internal guide:
The world opens me, and I move through it freely.`,

  love: `Primary emotional target:
Freedom to be fully myself — emotionally, creatively, sexually, and spiritually.

Tone calibration:
• Mutual allowance
• Encouragement over expectation
• Desire without dependency
• Passion without pressure

Avoid:
• Validation seeking
• Completion narratives
• Sacrifice framing

Internal guide:
This relationship expands who I am. I do not shrink, perform, or manage myself here.`,

  family: `Primary emotional target:
Emotional freedom and mutual allowance.

Tone calibration:
• Leadership through alignment
• Joyful presence
• Trust in individuality

Avoid:
• Responsibility for others' emotions
• Perfectionism
• Martyrdom

Internal guide:
I am free to enjoy my family without carrying emotional weight that is not mine.`,

  social: `Primary emotional target:
Freedom to be authentic.

Tone calibration:
• Mutual enthusiasm
• Ease of connection
• Emotional reciprocity

Avoid:
• Obligation
• Over-giving
• Managing dynamics

Internal guide:
I am wanted for who I am, not for what I provide.`,

  home: `Primary emotional target:
Safety and ease.

Tone calibration:
• Exhale
• Comfort
• Flow

Avoid:
• Impressing others
• Maintenance stress
• Perfection pressure

Internal guide:
My home supports me. It does not demand from me.`,

  work: `Primary emotional target:
Creative freedom and feeling seen and valued.

Tone calibration:
• Self-directed flow
• Appreciation without dependence
• Impact without urgency
• Choice over obligation

Avoid:
• Grind culture
• "Hard but worth it" framing
• External validation loops

Internal guide:
I choose how I create, when I create, and what matters — and my work responds accordingly.`,

  money: `Primary emotional target:
Freedom of choice.

Tone calibration:
• Ease
• Spaciousness
• Calm confidence
• Optionality

Avoid:
• Hustle language
• Proving worth
• Money as identity or safety replacement

Internal guide:
Money removes friction from life and amplifies fun, presence, and generosity.`,

  stuff: `Primary emotional target:
Ease and enjoyment.

Tone calibration:
• Utility with delight
• Playfulness
• Simplicity

Avoid:
• Accumulation
• Status signaling
• Attachment

Internal guide:
Things support my life. They do not define it.`,

  giving: `Primary emotional target:
Overflow.

Tone calibration:
• Joyful generosity
• Choice
• Appreciation

Avoid:
• Duty
• Guilt
• Saving others

Internal guide:
I give because I want to, not because I should.`,

  spirituality: `Primary emotional target:
Freedom of alignment.

Tone calibration:
• Soft knowing
• Trust
• Presence

Avoid:
• Seeking
• Hierarchies
• Spiritual effort

Internal guide:
Alignment is natural. I return to it easily.`
}

/**
 * Builds prompt for individual category generation (used by queue system)
 * 
 * @param categoryKey - The category key (e.g., 'fun', 'health')
 * @param categoryLabel - The category label (e.g., 'Fun', 'Health')
 * @param idealStateText - User's imagination text (PRIMARY SOURCE)
 * @param clarityPresentStateText - Clarity text from profile (what's already going well)
 * @param contrastFlips - Array of contrast flips
 * @param _scenes - Array of scene objects (not used in polish mode)
 * @param _blueprintData - Blueprint data (not used in polish mode)
 * @param _transcript - Raw transcript (not used in polish mode)
 * @param _activeVisionCategoryText - Existing active vision for this category (not used in polish mode)
 * @param perspective - 'singular' or 'plural'
 * @returns Complete prompt string for single category generation
 */
export function buildIndividualCategoryPrompt(
  categoryKey: string,
  categoryLabel: string,
  idealStateText: string,
  clarityPresentStateText: string,
  contrastFlips: string[],
  _scenes: any[], // Not used in polish mode
  _blueprintData: any, // Not used in polish mode
  _transcript: string, // Not used in polish mode
  _activeVisionCategoryText: string | null, // Not used in polish mode
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const categoryMicroTuning = CATEGORY_MICRO_TUNING[categoryKey] || ''
  const pronoun = perspective === 'plural' ? 'we/our' : 'I/my'

  // Format contrast flips
  const contrastFlipsText = contrastFlips
    .filter(f => f && f.trim())
    .join('\n')

  return `You are VIVA. Your job is to POLISH the member's imagination text into a flowing vision.

CATEGORY: ${categoryLabel}
PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
PRIMARY SOURCE: THE MEMBER'S IMAGINATION TEXT
═══════════════════════════════════════════════════════════════

${idealStateText || '(No imagination text provided)'}

═══════════════════════════════════════════════════════════════
INVISIBLE ANCHORS (DO NOT QUOTE OR INSERT - let these SHAPE the output)
═══════════════════════════════════════════════════════════════
${clarityPresentStateText ? `
CLARITY (what's already true for them):
${clarityPresentStateText}

Use this to: Add grounding specifics, acknowledge what's working, inform tone.
DO NOT: Copy this text. DO NOT insert it as a paragraph. DO NOT reference it directly.
` : ''}
${contrastFlipsText ? `
CONTRAST FLIPS (what they've chosen instead):
${contrastFlipsText}

Use this to: Inform emphasis, add energy to related passages.
DO NOT: Copy this text. DO NOT insert it as a paragraph. DO NOT reference it directly.
` : ''}
═══════════════════════════════════════════════════════════════
YOUR JOB: FLOW, DON'T LIST
═══════════════════════════════════════════════════════════════

The imagination text IS the vision. Your job is to make it FLOW:

1. KEEP THEIR CONTENT - Every topic, activity, and desire stays
2. KEEP THEIR VOICE - Match their tone (direct, casual, poetic, whatever they use)
3. KEEP THEIR SPECIFICS - "Our sex life is incredible" stays exactly

LIGHT POLISH:
- Convert future → present tense ("We will have" → "We have")
- Convert wanting → having ("I want to travel" → "I travel")
- Smooth transitions between ideas
- Add a sensory detail here and there (sparingly)

THE KEY INSTRUCTION:
If CLARITY or CONTRAST FLIPS contain something valuable not in the imagination text,
you may add a sentence or two that NATURALLY fits the flow.

But write it in the VOICE of the vision (present tense, feeling-based, embodied),
NOT in the voice of the original conversational text.

WRONG: "I have three kids—six, four, and one—so getting out the door has some intensity"
RIGHT: "Traveling with three little ones keeps life interesting, and we move through it with flow"

WRONG: "I've been making $200k for 5 years and feel stuck there"  
RIGHT: "Our income expands dynamically, growing beyond the familiar into something even better"

DO NOT:
- Start paragraphs with "I'm so grateful for..."
- Insert clarity/contrast text as-is (biggest mistake)
- Generate scenes they didn't describe
- Compress detailed lists

${categoryMicroTuning ? `EMOTIONAL TONE FOR ${categoryLabel.toUpperCase()}:
${categoryMicroTuning}
` : ''}
OUTPUT: Match their input length. Rich input = rich output.
Output ONLY the polished vision text. No headers, labels, or commentary.`
}
