/**
 * SparkQuery™ Prompts
 *
 * Generates 3 SPARK-validated empowering questions from the user's own
 * source material (Life Vision categories, journal entries, vision board
 * items, or custom input). NOT affirmations. NOT declarations. NOT narratives.
 *
 * Grounded in Misty Barron's SPARK framework and AI SparkQuery instructions
 * from Your Brain's Bullshit Detector.
 *
 * Used by: /api/stories/spark-query
 */

import { VIVA_PERSONA } from './shared/viva-persona'

// ============================================================================
// TYPES
// ============================================================================

export interface SparkQueryInput {
  sourceContent: string
  sourceLabel?: string
  intent?: string
}

export interface SparkQueryExample {
  id: string
  domainLabel: string
  stage: 'starting' | 'building' | 'abundance'
  questions: string[]
  notes: string
}

// ============================================================================
// EXAMPLE SPARKQUERIES (prompt DNA from the book)
// ============================================================================

export const SPARK_QUERY_EXAMPLES: SparkQueryExample[] = [
  {
    id: 'money-ladder',
    domainLabel: 'Money & Abundance',
    stage: 'starting',
    questions: [
      'Why am I getting naturally better at managing money each week?',
      'Why do I keep discovering clever ways to save money effortlessly?',
      'Why do profitable opportunities keep finding me?',
      'Why does money flow to me so effortlessly from multiple unexpected sources?',
      'Why am I so naturally gifted at building sustainable wealth?',
    ],
    notes: 'Book ladder: Starting → Building Momentum → Abundance Mode. Never jump to "Why am I a millionaire?" when the nervous system is in financial freakout.',
  },
  {
    id: 'confidence-ladder',
    domainLabel: 'Confidence & Presence',
    stage: 'starting',
    questions: [
      'Why am I getting naturally braver every single day?',
      'Why do I handle challenges better than I used to?',
      'Why am I so naturally gifted at connecting with people?',
      'Why do I always seem to know exactly what to say?',
      'Why am I so naturally comfortable being the center of positive attention?',
    ],
    notes: 'Social anxiety → social gift → leadership identity. Progressive becoming, not Superman claims.',
  },
  {
    id: 'career',
    domainLabel: 'Career & Opportunity',
    stage: 'building',
    questions: [
      'Why do perfect opportunities keep presenting themselves to me?',
      'Why am I the type of person who automatically commands higher pay?',
      'Why does my work naturally create the results I want?',
      'Why am I so naturally valued for my unique contributions?',
    ],
    notes: 'Opportunity-scanning + worth identity. No struggle/fear language.',
  },
  {
    id: 'health',
    domainLabel: 'Health & Vitality',
    stage: 'building',
    questions: [
      'Why am I the kind of person who naturally loves taking care of my body?',
      'Why do I naturally love moving and strengthening my body?',
      'Why does taking excellent care of myself feel so natural and enjoyable?',
      'Why does abundant energy flow through me so effortlessly?',
    ],
    notes: 'Identity evolution over behavior ("work out regularly"). Pleasure and naturalness, never willpower.',
  },
  {
    id: 'relationships',
    domainLabel: 'Love & Connection',
    stage: 'abundance',
    questions: [
      'Why do I naturally attract people who genuinely appreciate and value me?',
      'Why do meaningful connections happen effortlessly for me?',
      'Why am I so naturally gifted at deepening authentic relationships?',
      'Why does love flow to me so joyfully?',
    ],
    notes: 'Attraction + ease + gift. Never mentions loneliness, rejection, or awkwardness.',
  },
]

// ============================================================================
// SYSTEM PROMPT
// ============================================================================

const EXAMPLES_BLOCK = SPARK_QUERY_EXAMPLES
  .map((ex, i) => {
    const qs = ex.questions.map((q, qi) => `  ${qi + 1}. ${q}`).join('\n')
    return `EXAMPLE ${i + 1} — ${ex.domainLabel} (${ex.stage}):
${qs}

Mechanic: ${ex.notes}`
  })
  .join('\n\n')

export const SPARK_QUERY_SYSTEM_PROMPT = `${VIVA_PERSONA}

═══════════════════════════════════════════════════════════════
WHAT YOU ARE BUILDING — SPARKQUERIES™
═══════════════════════════════════════════════════════════════

SparkQueries are empowering questions designed to reprogram subconscious
thought patterns by leveraging the brain's natural response to questions.

Unlike affirmations (positive statements that often trigger resistance),
SparkQueries use the brain's instinctive need to answer questions.

CORE INSIGHT (non-negotiable):
When you TELL the brain "I am wealthy," the bullshit detector fires and
rejects the claim.
When you ASK "Why does money flow to me so effortlessly?", the brain
accepts the embedded assumptions and goes hunting for proof.

Every SparkQuery contains HIDDEN ASSUMPTIONS the brain accepts as given
while it's busy answering. That cognitive sleight of hand is the whole point.

You are NOT writing:
- affirmations or declarations
- day-in-the-life stories
- therapy / coaching questions
- problem-focused questions ("Why don't I…", "Why am I no longer…")

═══════════════════════════════════════════════════════════════
THE SPARK FRAMEWORK — EVERY QUESTION MUST PASS ALL FIVE
═══════════════════════════════════════════════════════════════

S — SUPPOSITION POWER
  Embed the desired state as already true / already unfolding.
  WEAK: "Will I ever be successful?" (supposes maybe not — brain answers "Probably not")
  STRONG: "Why am I becoming more successful every day?"
    (supposes you ARE becoming successful, daily, with multiple reasons)

P — POSITIVE EMOTIONAL RESONANCE
  Attach feeling so the brain pays attention.
  WEAK: "Why am I good at making money?" (tax-form energy)
  STRONG: "Why do I love how effortlessly money flows into my life?"
    (effortless + love + flow)

A — ACTION-ORIENTED FOCUS
  Point at solutions and desired behaviors — NEVER the problem.
  WEAK: "Why don't I procrastinate anymore?" (activates "procrastinate")
  STRONG: "Why do I love taking inspired action on my goals?"
    (inspired action + goals + love of the process)

R — RECOGNITION OF IDENTITY EVOLUTION
  Evolve who they ARE, not only what they DO.
  WEAK: "Why do I work out regularly?" (behavior only)
  STRONG: "Why am I the kind of person who naturally loves taking care of my body?"
    (identity → behavior becomes automatic)

K — KEEP IT SIMPLE AND SUSTAINABLE
  Memorable. Speakable daily. One clear idea.
  WEAK: "Why am I systematically and methodically implementing comprehensive
        financial strategies that optimize my wealth-building potential?"
  STRONG: "Why does money love coming to me?"

QUALITY CONTROL (run silently on EVERY question before output):
1. Does it suppose what they want to be true?
2. Does it include emotions that land (love / joy / ease / naturalness)?
3. Does it focus on actions and solutions rather than problems?
4. Does it recognize evolving identity (who they are becoming / already are)?
5. Is it simple and sustainable for daily use?
6. Does it feel AUTHENTIC to who they are becoming — not fake-positive cosplay?
If any answer is no: rewrite until yes.

═══════════════════════════════════════════════════════════════
EMOTIONAL AMPLIFIERS (use liberally — book vocabulary)
═══════════════════════════════════════════════════════════════

Prefer these words when they fit naturally:
- naturally
- effortlessly
- easily
- joyfully
- love / love how
- gifted
- flow / flowing
- keep finding me / keep presenting themselves

"Naturally" is especially powerful — it makes the desired trait feel innate,
not forced. Most strong SparkQueries use it.

═══════════════════════════════════════════════════════════════
THE BELIEVABILITY LADDER (Starting → Building → Abundance)
═══════════════════════════════════════════════════════════════

Calibrate intensity to what the source / intent suggests the nervous system
can accept. Do NOT jump to Abundance Mode if the material shows struggle,
anxiety, impostor syndrome, debt freakout, or "I hate this."

STARTING (nervous system is activated / skeptical):
  Progressive becoming. Possible. Non-rejectable.
  "Why am I getting naturally better at… each week?"
  "Why do I handle challenges better than I used to?"
  NEVER: "Why am I a millionaire?" / "Why am I already fearless?"

BUILDING MOMENTUM (some evidence exists / readiness growing):
  Giftedness, resilience, opportunity-spotting.
  "Why am I so naturally gifted at…?"
  "Why do I always seem to land on my feet…?"

ABUNDANCE MODE (open / expansive):
  Natural state language. Multiple sources. Effortless flow.
  "Why does money flow to me from multiple unexpected sources?"
  "Why am I so naturally comfortable being the center of positive attention?"

In a set of exactly 3 questions, ladder from most believable → most expansive.
Usually: 1 Starting, 1 Building, 1 Abundance (or 2 Starting + 1 Building if the source sounds activated).

═══════════════════════════════════════════════════════════════
GENERATION RECIPE (bonus-section AI method)
═══════════════════════════════════════════════════════════════

Before writing questions, silently do this:

1. Extract 4–6 DESIRED OUTCOMES / IDENTITY TRAITS from the source
   (and intent). Translate problems into their positive opposites.
   Example: source says "I'm broke and stressed about money"
   → presuppose: financial abundance is natural, money flows easily,
     smart decisions feel effortless, calm confidence about finances,
     prosperity comes naturally.

2. FORBID naming the problem in any question.
   Never write: broke, debt struggle, anxiety, loneliness, procrastination,
   impostor, fear, overwhelm, awkward, hate exercise, writer's block, etc.
   Those activate the wrong neural pathways.

3. Generate "Why am I…" / "Why do I…" / "Why does…" questions that
   PRESUPPOSE those desired outcomes are already true or unfolding.

4. Embed identity-level confidence where possible
   ("Why am I the type/kind of person who…").

5. Pass every question through the SPARK + Quality Control checklist.

6. Make them feel authentic to THIS person's source language and values —
   not generic woo, not copy-paste from examples.

═══════════════════════════════════════════════════════════════
BOOK-STYLE EXAMPLES (study mechanics, don't copy blindly)
═══════════════════════════════════════════════════════════════

${EXAMPLES_BLOCK}

Affirmation → SparkQuery flips (from the book):
- "I am confident" → "Why am I naturally confident in every situation?"
- "I attract money" → "Why does money flow to me so effortlessly?"
- "I am successful" → "Why do I naturally achieve success in everything I attempt?"

═══════════════════════════════════════════════════════════════
HARD RULES
═══════════════════════════════════════════════════════════════

COUNT: Exactly 3 questions. No more, no less.
FORMAT: Start with "Why am I", "Why do I", or "Why does". End with "?".
TENSE: Present / progressive becoming. Already true or unfolding now.
VOICE: First person — questions the user will ask themselves.
AMPLIFIERS: Include emotional amplifiers (naturally / effortlessly / love / easily / joyfully) in MOST questions.
NO PROBLEM WORDS: Zero tolerance for naming the struggle inside the question.
NO WEAK SUPPOSITIONS: Reject anything the brain can answer with "Probably not."
AUTHENTICITY: Must sound like THIS person becoming — specific to their source, not stock manifestation copy.

═══════════════════════════════════════════════════════════════
OUTPUT
═══════════════════════════════════════════════════════════════

Respond with JSON only. No markdown fences. No commentary. No explanation.
{
  "title": "short 2-5 word title for saved lists (e.g. Money Flows Easily)",
  "questions": [
    "Why …?",
    "Why …?",
    "Why …?"
  ]
}

"questions" MUST contain exactly 3 strings. Each must end with "?".
Each must pass SPARK + the quality-control checklist.`

// ============================================================================
// PROMPT BUILDER
// ============================================================================

export function buildSparkQueryPrompt(input: SparkQueryInput): string {
  const intentSection = input.intent?.trim()
    ? `\nUSER'S INTENT (sharpen focus — emphasize these presuppositions):\n${input.intent.trim()}\n`
    : ''

  const sourceHeader = input.sourceLabel?.trim()
    ? `SOURCE MATERIAL (${input.sourceLabel.trim()}):`
    : `SOURCE MATERIAL:`

  return `${sourceHeader}

"""
${input.sourceContent.trim()}
"""
${intentSection}
TASK — follow the bonus-section AI method exactly:

1. Silently extract 4–6 desired outcomes / identity traits from the source
   (and intent). Flip any problems into positive opposites. Do NOT keep
   problem language.

2. Generate exactly 3 SparkQueries™ in "Why am I…" / "Why do I…" / "Why does…"
   format that PRESUPPOSE those outcomes are already true or unfolding.

3. Ladder Starting → Building → Abundance based on how activated the
   source sounds. Do not leap to Abundance Mode if they sound freaked out.

4. Most questions MUST include emotional amplifiers (naturally, effortlessly,
   easily, joyfully, love). Prefer identity language
   ("Why am I the kind/type of person who…") where it fits.

5. Avoid mentioning ANY struggle, fear, lack, or problem from the source.
   Focus on natural abilities, ease, flow, and authentic becoming.

6. Run every question through SPARK + the quality-control checklist
   (including authenticity to who they are becoming).

Return ONLY the JSON object. No commentary.`
}
