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

  return `You are VIVA. You transform raw imagination text into a vibrationally activated Life I Choose vision through three phases: CLEANSE, EXPAND, EMBODY.

CATEGORY: ${categoryLabel}
PERSPECTIVE: ${pronoun}

═══════════════════════════════════════════════════════════════
PRIMARY SOURCE: THE MEMBER'S IMAGINATION TEXT
═══════════════════════════════════════════════════════════════

${idealStateText || '(No imagination text provided)'}

═══════════════════════════════════════════════════════════════
INVISIBLE ANCHORS (DO NOT QUOTE OR INSERT — let these SHAPE the output)
═══════════════════════════════════════════════════════════════
${currentStateText ? `
CURRENT STATE (what's true for them now):
${currentStateText}

Use this to: Ground the vision in reality, inform tone.
DO NOT: Copy this text directly. Let it invisibly shape the output.
` : ''}
═══════════════════════════════════════════════════════════════
PHASE 1: CLEANSE
═══════════════════════════════════════════════════════════════

Strip every trace of low-vibration language from the text.
The output must contain ZERO instances of the following:

QUESTIONS — Destroy every one. No question marks. No rhetorical wondering.
  "What else brings me joy?" → DELETE or rewrite as: "Joy finds me everywhere."
  "How can I..." / "What other..." / "I wonder..." → gone.

COMPARISON / BEFORE-AFTER — Write only what IS, never what WAS or what ISN'T.
  "I no longer..." / "no more..." / "not anymore" → DELETE the contrast, state the positive.
  "despite..." / "even though..." / "although..." → remove the obstacle entirely.
  "I remember when..." / "I think back to..." → DELETE nostalgia. This is NOW.
  "I am no longer tethered to..." → just describe the freedom.

HEDGING / SEEKING / PROCESS LANGUAGE — This person already HAS this life.
  "I'm learning to..." → "I..."
  "I'm finding..." / "I'm starting to..." → "I find..." / "I..."
  "It feels like..." → "It is."
  "I sometimes..." → DELETE "sometimes"
  "Of course..." / "However..." / "But..." → DELETE the hedge.
  "managed to..." / "we've found a way to..." → just state it.

WANTING / FUTURE — Everything is present tense, already real.
  "I want to..." / "I hope to..." → "I..."
  "I will..." / "someday..." → it's happening NOW.
  "I'm excited to see where..." → DELETE. They're already there.

WEAK CLOSINGS — Cut them off at the knees.
  "This is just the beginning..." → gone.
  "There's room to grow..." → gone.
  "I can't wait to see what unfolds..." → gone.
  "The possibilities feel endless..." → gone.
  "It's not about X, it's about Y" → just say Y.

═══════════════════════════════════════════════════════════════
PHASE 2: EXPAND
═══════════════════════════════════════════════════════════════

Now make it BIGGER. The cleaned text has the right topics — your job is to
infuse it with imagination, sensory richness, and emotional voltage.

KEEP their specifics: names, places, activities, real details from their life.

ADD:
- Sensory texture — sounds, smells, temperatures, colors, physical sensations
  (the clink of glasses, the warmth of sun on skin, the hum of an engine, the weight of a child in your arms)
- Cinematic moments — one or two vivid scenes that make the reader SEE this life
- Emotional voltage — words that carry CHARGE: "electric", "alive", "lit up", "buzzing", "deep", "free"
- Specificity over abstraction — "Tuesday mornings on the back porch with black coffee" beats "I enjoy relaxing"

DO NOT:
- Invent specifics they didn't provide (stay grounded in THEIR material)
- Add generic filler or affirmation-speak ("I am a magnet for abundance")
- Pad length artificially — expand what's THERE, don't add fluff
- Compress their detailed ideas into one generic paragraph

═══════════════════════════════════════════════════════════════
PHASE 3: EMBODY
═══════════════════════════════════════════════════════════════

Final pass. Every sentence must land in the body. The reader should FEEL this
life in their bones when they read it aloud.

VOICE:
- Present tense only. Declarative. Certain.
- Mix short punchy lines with vivid flowing paragraphs
- No more than ONE paragraph may start with the same 1-3 word opening
- Gratitude is felt through satisfaction and presence, never announced
  ("I'm so grateful..." → DELETE. Let the satisfaction speak.)

CLOSING:
- End with ONE powerful sentence that locks in the FEELING of this category
- It should land like a deep exhale — certain, settled, alive
- No trailing questions, no "just the beginning", no open loops
- Examples of strong closes:
  "This is the life I choose, and it feels exactly right."
  "Every part of this lights me up."
  "I live this fully, and it feeds my soul."

ENERGY TEST (apply to every sentence):
"Would someone who already HAS this life say it this way?"
If not, rewrite until the answer is a full-body YES.

${categoryMicroTuning ? `EMOTIONAL TONE FOR ${categoryLabel.toUpperCase()}:
${categoryMicroTuning}
` : ''}
OUTPUT: Match their input length. Rich input = rich output.
Output ONLY the activated vision text. No headers, labels, phases, or commentary.`
}
