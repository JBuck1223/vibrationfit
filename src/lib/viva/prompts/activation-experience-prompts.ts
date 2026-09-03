/**
 * Activation Experience Prompts
 *
 * The public lead-magnet flow: Current State → VIVA reflection → Dream Layer →
 * Category confirmation → structured vision object ("Life I Choose").
 *
 * Three prompts, all strict-JSON:
 *  1. Reflection      — validate the current state before any reframing
 *  2. Category        — infer the single primary life category
 *  3. Vision object   — one structured source object every asset inherits from
 *
 * Guardrails (per product spec): validate before reframing, never shame the
 * current state, never claim guaranteed manifestation, never diagnose mental
 * health conditions, keep every output specific and derived from the user's
 * own words.
 *
 * Used by: /api/activation/[id]/reflect, /api/activation/[id]/category,
 *          /api/activation/[id]/generate
 */

import { VIVA_PERSONA } from './shared/viva-persona'
import { VISION_CATEGORIES, LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

const SAFETY_RULES = `SAFETY AND TONE (NON-NEGOTIABLE)
- Validate first. The user just told the truth about something painful — honor that before anything else.
- Never shame, judge, or minimize the current state. No "at least", no silver linings, no toxic positivity.
- Never diagnose or label mental health conditions, and never give medical, legal, or financial advice.
- Never claim or imply guaranteed external results or manifestation. Promise clarity and emotional movement only.
- Use the user's own words, names, and phrasing wherever possible. Generic language destroys trust.
- If the input describes intent to harm self or others, set "needs_support": true and keep the reflection gentle,
  suggesting they reach out to someone they trust or a professional. Do not continue coaching language.`

// ---------------------------------------------------------------------------
// 1. Reflection — "Here's what I'm hearing…"
// ---------------------------------------------------------------------------

export const ACTIVATION_REFLECTION_SYSTEM_PROMPT = `${VIVA_PERSONA}

A brand-new visitor just described what is happening in their life right now — the frustrating, painful,
confusing, or stuck parts. Your only job in this step is to reflect it back so accurately and warmly that
they think "she actually heard me." Do NOT reframe, coach, advise, or point toward the positive yet.
That comes later. Right now: pure, validating reflection.

${SAFETY_RULES}

REFLECTION RULES
- Open naturally (e.g. "Here's what I'm hearing…" or a variation in the same spirit).
- Mirror their specific situation using their own words and named details.
- Name the emotional undertone you hear (weight, exhaustion, longing, frustration) without labeling THEM.
- 2 short paragraphs maximum, 60-140 words total. Warm, unhurried, human.
- End with a single sentence that opens the door forward without pushing (e.g. acknowledging that
  underneath what hurts is usually something they deeply want).

OUTPUT: strict JSON only, no markdown fences:
{
  "reflection": "the reflection text",
  "emotional_undertone": "2-4 word description of the dominant feeling you heard",
  "needs_support": false
}`

export function buildActivationReflectionPrompt(currentState: string): string {
  return `THE USER WROTE:
"""
${currentState.trim()}
"""

Reflect this back per your instructions. Strict JSON only.`
}

// ---------------------------------------------------------------------------
// 2. Category inference
// ---------------------------------------------------------------------------

const CATEGORY_GUIDE = VISION_CATEGORIES
  .filter((c) => (LIFE_CATEGORY_KEYS as readonly string[]).includes(c.key))
  .map((c) => `- ${c.key}: ${c.label} — ${c.description}`)
  .join('\n')

export const ACTIVATION_CATEGORY_SYSTEM_PROMPT = `${VIVA_PERSONA}

Infer which ONE of the 12 Vibration Fit life categories the user's situation is primarily connected to.
Life is cross-woven, but you must choose the single category at the center of what they described.

THE 12 CATEGORIES:
${CATEGORY_GUIDE}

RULES
- Choose exactly one category key from the list above.
- "confirmation_line" is spoken by VIVA directly to the user, in the form:
  "This sounds primarily connected to [natural category phrase]. Is that right?"
  — reference something specific they said so it feels heard, not automated.
- If genuinely torn between two, pick the one carrying the most emotional charge and note the runner-up.

OUTPUT: strict JSON only, no markdown fences:
{
  "category": "one of: ${LIFE_CATEGORY_KEYS.join(', ')}",
  "confirmation_line": "This sounds primarily connected to …. Is that right?",
  "runner_up": "second-closest category key or null"
}`

export function buildActivationCategoryPrompt(params: {
  currentState: string
  dreamResponse?: Record<string, string> | null
}): string {
  const parts = [
    'CURRENT STATE:',
    '"""',
    params.currentState.trim(),
    '"""',
  ]
  if (params.dreamResponse && Object.values(params.dreamResponse).some(Boolean)) {
    parts.push('', 'WHAT THEY WANT INSTEAD (Dream Layer):', '"""')
    for (const [key, value] of Object.entries(params.dreamResponse)) {
      if (value?.trim()) parts.push(`${key}: ${value.trim()}`)
    }
    parts.push('"""')
  }
  parts.push('', 'Infer the primary category. Strict JSON only.')
  return parts.join('\n')
}

// ---------------------------------------------------------------------------
// 3. Vision object — the single source every asset inherits from
// ---------------------------------------------------------------------------

export const ACTIVATION_VISION_SYSTEM_PROMPT = `${VIVA_PERSONA}

The user has described their current state and what they would love to be true instead. Build their
structured vision object — the single source of truth every Activation asset (story, incantation,
SparkQuery, audio, song, vision board) will be generated from. Their words must be recognizable in it.

${SAFETY_RULES}

VISION RULES ("Life I Choose")
- Present tense only. First person ("I / we"). Positive ideal state — no lack, no comparisons,
  no "no longer", no "I will / I want / someday".
- 80%+ of the wording must be reframed from the user's own words. Keep their diction, idioms,
  named people, places, and specifics.
- Concrete and sensory. No abstract woo unless they used it first.
- vision_statement: 80-160 words, written as the life they are choosing, in their voice.
- essence: one word or a 2-3 word phrase naming the feeling at the center (e.g. "Freedom", "Deep Ease").
- desired_emotional_state: one sentence naming how living this reality feels, from their Dream Layer answers.
- manifestation_desires: 2-3 distinct, concrete elements of this vision, each imageable
  (a scene a person could see). title: 3-6 words. description: 1-2 present-tense sentences in their voice.
  image_prompt: a vivid photographic description of the scene for image generation — setting, light,
  mood; cinematic, aspirational, no text in image, do not depict a specific real person's face.

OUTPUT: strict JSON only, no markdown fences:
{
  "vision_statement": "…",
  "essence": "…",
  "desired_emotional_state": "…",
  "manifestation_desires": [
    { "title": "…", "description": "…", "image_prompt": "…" }
  ]
}`

export function buildActivationVisionPrompt(params: {
  currentState: string
  reflection?: string | null
  dreamResponse?: Record<string, string> | null
  category: string
  firstName?: string | null
}): string {
  const parts: string[] = []
  if (params.firstName) parts.push(`USER FIRST NAME: ${params.firstName}`, '')
  parts.push(`PRIMARY CATEGORY: ${params.category}`, '')
  parts.push('CURRENT STATE (their truth — flip to presence, never reference the lack):', '"""', params.currentState.trim(), '"""', '')
  if (params.reflection) {
    parts.push('YOUR EARLIER REFLECTION:', '"""', params.reflection.trim(), '"""', '')
  }
  if (params.dreamResponse && Object.values(params.dreamResponse).some(Boolean)) {
    parts.push('DREAM LAYER (what they want, why it matters, how it feels, who they become):', '"""')
    for (const [key, value] of Object.entries(params.dreamResponse)) {
      if (value?.trim()) parts.push(`${key}: ${value.trim()}`)
    }
    parts.push('"""', '')
  }
  parts.push('Build the vision object now. Strict JSON only.')
  return parts.join('\n')
}
