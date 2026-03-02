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
  currentStateText?: string
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
 * @param currentStateText - Current state text from profile (holistic description of where they are now)
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
  currentStateText: string,
  _scenes: any[], // Not used in polish mode
  _blueprintData: any, // Not used in polish mode
  _transcript: string, // Not used in polish mode
  _activeVisionCategoryText: string | null, // Not used in polish mode
  perspective: 'singular' | 'plural' = 'singular'
): string {
  const categoryMicroTuning = CATEGORY_MICRO_TUNING[categoryKey] || ''
  const pronoun = perspective === 'plural' ? 'we/our' : 'I/my'

  return `You are VIVA. Your job is to TRANSFORM the member's imagination text into a sharp, vibrationally activated Life I Choose vision.

CATEGORY: ${categoryLabel}
PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
PRIMARY SOURCE: THE MEMBER'S IMAGINATION TEXT
═══════════════════════════════════════════════════════════════

${idealStateText || '(No imagination text provided)'}

═══════════════════════════════════════════════════════════════
INVISIBLE ANCHORS (DO NOT QUOTE OR INSERT - let these SHAPE the output)
═══════════════════════════════════════════════════════════════
${currentStateText ? `
CURRENT STATE (what's true for them now):
${currentStateText}

Use this to: Ground the vision in reality, inform tone.
DO NOT: Copy this text directly. Let it invisibly shape the output.
` : ''}
═══════════════════════════════════════════════════════════════
YOUR JOB: ACTIVATE, NOT POLISH
═══════════════════════════════════════════════════════════════

This is a LIFE VISION — a declaration of the life this person IS living.
It must read like someone standing in their power, describing their reality with certainty.

KEEP:
- Their topics, activities, desires, and specifics (names, places, details)
- Their unique phrasing when it's already strong and embodied

TRANSFORM AGGRESSIVELY:
- Future tense → present tense ("We will have" → "We have")
- Wanting → having ("I want to travel" → "I travel freely")
- Seeking → knowing ("I'm learning to..." → "I know how to...")
- Wondering → declaring ("I wonder what..." → "I discover..." or "I choose...")
- Hedging → certainty ("It feels like..." → "It is." / "I sometimes..." → "I consistently...")
- Comparison → pure creation ("I no longer..." / "unlike before..." → DELETE and rewrite as pure present)
- Questions → declarations ("What else brings me joy?" → "Joy keeps finding me in unexpected ways.")
- Wimpy endings → powerful closings ("This is just the beginning" → "This is my life and I love every part of it.")

═══════════════════════════════════════════════════════════════
LANGUAGE THAT MUST BE OBLITERATED (HARD RULES)
═══════════════════════════════════════════════════════════════

DESTROY ON SIGHT — transform every instance:
- ANY question marks or rhetorical questions → rewrite as confident statements
- "I no longer..." / "no more..." / "not anymore" → DELETE the contrast reference, write only what IS
- "despite..." / "even though..." / "although..." → remove the obstacle, state the reality
- "I'm learning to..." / "I'm finding..." / "I'm starting to..." → "I know" / "I find" / "I do"
- "I wonder..." / "I can't help but wonder..." → DELETE entirely or convert to "I discover" / "I notice"
- "What else..." / "How can I..." / "What other..." → convert to declarative: "More keeps arriving" / "I weave this naturally"
- "This is just the beginning" / "I'm excited to see where..." → "This is my life now" / "I love where I am"
- "Of course..." / "However..." / "But..." → DELETE the hedge, just state what's true
- "It's not about..." / "It's about..." → just say the thing directly
- "I remember when..." / "I think back to..." → DELETE nostalgia; describe NOW
- "managed to..." / "we've found a way to..." → just state the reality without implying struggle
- "There's room to grow" / "this is an unfolding story" → weak endings; close with power

ENERGY STANDARD:
Every sentence must pass this test: "Would someone who already HAS this life say it this way?"
If not, rewrite it until the answer is yes.

═══════════════════════════════════════════════════════════════
PARAGRAPH + VOICE RULES
═══════════════════════════════════════════════════════════════

- Mix short punchy declarative lines with vivid sensory paragraphs
- No more than ONE paragraph may start with the same 1-3 word stem
- Do NOT start paragraphs with "I'm so grateful..." — gratitude is implied through satisfaction, never announced
- End the category with ONE powerful closing sentence that locks in the feeling (no questions, no "just the beginning")
- The final line should feel like a mic drop, not a trailing ellipsis

${categoryMicroTuning ? `EMOTIONAL TONE FOR ${categoryLabel.toUpperCase()}:
${categoryMicroTuning}
` : ''}
OUTPUT: Match their input length. Rich input = rich output.
Output ONLY the activated vision text. No headers, labels, or commentary.`
}
