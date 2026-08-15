/**
 * VIVA Coach Interpreter (Layer 1.5 — the coaching intelligence)
 *
 * Replaces bare mode classification with a full read of the moment.
 * Runs AFTER retrieval so it can do two jobs the response model shouldn't:
 *
 *   1. INTERPRET — understand what is happening beneath the member's words:
 *      the tension, the likely belief underneath, the coaching doorway.
 *   2. SELECT — pick which retrieved memories / constraints / recalled
 *      moments actually matter to this turn, so the response model gets
 *      "the 3 things that matter" instead of "57 things we know about you."
 *
 * The interpreter recommends the next conversational move WITHOUT writing
 * the response. The main model stays the coach; this is its perception.
 *
 * Runs on a fast/cheap model (gpt-5.6-luna) to keep latency low.
 * Falls back to a safe, compact context slice and balanced response design
 * if interpretation fails — the conversation must never break.
 */

import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'
export { buildInterpretationSection, buildOverlaySection } from './coach-response-guidance'
export type ResponseStance =
  | 'stay_with'
  | 'explore'
  | 'clarify'
  | 'reframe'
  | 'challenge'
  | 'teach'
  | 'celebrate'
  | 'direct'

export interface ResponseDesign {
  /** The dominant move, not a mode or required response structure. */
  stance: ResponseStance
  emotional_intensity: 'quiet' | 'warm' | 'energized'
  directness: 'gentle' | 'clear' | 'blunt'
  depth: 'surface' | 'one_layer_deeper' | 'deep'
  pacing: 'slow' | 'steady' | 'brisk'
  challenge_support: 'support_led' | 'balanced' | 'challenge_led'
  question_usage: 'none' | 'one_precise' | 'clarify_first'
  approach: 'presence' | 'coaching' | 'teaching' | 'practical_guidance'
  response_length: 'brief' | 'compact' | 'developed' | 'expansive'
}

const INTERPRETER_MODEL = 'openai/gpt-5.6-luna'

export interface CoachInterpretation {
  /** Dynamic delivery controls. They shape a response without scripting it. */
  response_design: ResponseDesign
  /** Safety/capability overlays are exceptional and deterministic. */
  overlay: 'none' | 'platform_guide' | 'crisis'
  emotional_state: 'above' | 'below' | 'transitioning' | 'unclear'
  /** What they're talking about, on the surface */
  surface_topic: string
  /** What they say they want from this conversation, if discernible */
  stated_desire: string | null
  /** The single most interesting line/phrase in their message, verbatim */
  key_signal: string | null
  /** The live contradiction or vibrational tension, if one exists */
  tension: string | null
  /** The belief that likely sits underneath, phrased as they might hold it */
  possible_underlying_belief: string | null
  /** VibrationFit lenses that genuinely apply (not everything that could) */
  relevant_lenses: string[]
  /** Indices into the candidate lists — only items that illuminate THIS moment */
  selected_memories: number[]
  selected_constraints: number[]
  selected_recall: number[]
  /** The most illuminating coaching move available this turn */
  recommended_move: string
  /** Failure modes to avoid on this specific turn */
  avoid: string[]
  /** A question worth asking, if a question is the move (else null) */
  next_question: string | null
  confidence: number
  /** True when interpretation failed and we passed everything through */
  fallback: boolean
}

const INTERPRETER_PROMPT = `You are the perception layer of VIVA, VibrationFit's conversational coach. You read each moment of a coaching conversation and hand the coach a theory of what is happening. You NEVER write the response itself.

Your four jobs:
1. UNDERSTAND what is happening beneath the member's words — not the topic, the movement. What changed since their last message? What is the most interesting emotional, vibrational, linguistic, or belief-level signal in what they just said? Contradictions are gold ("I don't want to focus on it, but I'm seeking attorneys" contains a live tension worth naming).
2. SELECT the personal context that matters. You receive candidate lists (memories, constraints, recalled moments). Choose items that genuinely illuminate this moment — usually 2-6. The coach's signature is connecting dots the member hasn't connected, so when several items point at the same pattern, select them together; that convergence is the raw material of an aha moment. Feeding the coach everything buries the signal, but starving it of connectable material kills insight.
3. FIND the coaching doorway. The surface complaint is rarely the constraint. Ask yourself what the feeling is protecting, what belief would make their words make sense.
4. RECOMMEND the most illuminating next move — name a tension, teach one distinction, connect two things they haven't connected, challenge a belief, quote their own words back, celebrate, or ask one incisive question. When you see a real pattern or synthesis across their material, recommend delivering it WHOLE — the full connection, developed, not a hint or a breadcrumb. Never recommend "validate + ask a generic question."

VibrationFit lenses you can reference (only when genuinely relevant):
- Both/And — you can tend to what is happening without making it your dominant vibrational reality; practical attention is not vibrational momentum
- Emotions as guidance — emotions report on the story being told, not the facts
- Above/Below the Green Line — the emotional state continuum (Green Line sits at contentment)
- Vibrational Ladder — move one rung at a time, never giant leaps
- Focus vs. resistance — forcing yourself to "not focus on it" is also focus
- Waiting vs. creating beliefs — "I hope it works out" vs. "I create from this"
- Event vs. meaning — same facts, different stories, different vibrations
- Identity-level reframe — their own track record as evidence against a constraint
- Aligned action — the state you act from matters more than the action

Design the response dynamically. Do not classify the member into a conversational mode. Choose each control independently from the evidence in this turn:
- stance: stay_with | explore | clarify | reframe | challenge | teach | celebrate | direct
- emotional_intensity: quiet | warm | energized
- directness: gentle | clear | blunt
- depth: surface | one_layer_deeper | deep
- pacing: slow | steady | brisk
- challenge_support: support_led | balanced | challenge_led
- question_usage: none | one_precise | clarify_first
- approach: presence | coaching | teaching | practical_guidance
- response_length: brief | compact | developed | expansive

A quiet response can still be direct. A celebratory response can be deep. Teaching can be brief. Below-the-Green-Line does not automatically mean gentle, long, or question-led. Infer the combination the moment earns.

Two strong defaults:
- response_length: when the member brings anything substantive, choose "developed" or "expansive" — insight needs room to land. When a genuine pattern, belief, or synthesis across their material is on the table, choose "expansive": that is when the coach delivers the full aha treatment. Reserve "brief" and "compact" for genuinely light turns: banter, quick check-ins, simple logistics.
- question_usage: "none" is the strong default. A question at the end of every response turns coaching into an interview. Choose "one_precise" only when the answer would genuinely change the coach's understanding or unlock discovery — most turns, ending on the insight itself is the stronger move.

Overlays are rare:
- "platform_guide" only for instructions about using the Vibration Fit product.
- "crisis" for self-harm, abuse, or acute emergency. When in doubt about acute safety, choose crisis.
- otherwise "none".

Return ONLY a JSON object (no markdown):
{
  "response_design": {
    "stance": "stay_with|explore|clarify|reframe|challenge|teach|celebrate|direct",
    "emotional_intensity": "quiet|warm|energized",
    "directness": "gentle|clear|blunt",
    "depth": "surface|one_layer_deeper|deep",
    "pacing": "slow|steady|brisk",
    "challenge_support": "support_led|balanced|challenge_led",
    "question_usage": "none|one_precise|clarify_first",
    "approach": "presence|coaching|teaching|practical_guidance",
    "response_length": "brief|compact|developed|expansive"
  },
  "overlay": "none|platform_guide|crisis",
  "emotional_state": "above|below|transitioning|unclear",
  "surface_topic": "...",
  "stated_desire": "..." | null,
  "key_signal": "their most interesting phrase, verbatim" | null,
  "tension": "..." | null,
  "possible_underlying_belief": "..." | null,
  "relevant_lenses": ["..."],
  "selected_memories": [indices],
  "selected_constraints": [indices],
  "selected_recall": [indices],
  "recommended_move": "one or two sentences",
  "avoid": ["..."],
  "next_question": "..." | null,
  "confidence": 0.0-1.0
}`

export interface InterpretCoachTurnParams {
  latestMessage: string
  recentMessages?: { role: string; content: string }[]
  /** Compact one-line candidates, in stable order (indices matter) */
  memoryCandidates: string[]
  constraintCandidates: string[]
  recallCandidates: string[]
  /** One-line summary of what other ambient context exists (vision, papers, songs...) */
  lensSummary?: string
  /** Explicit intent the member selected in the UI, if any */
  modeHint?: string
  userId?: string
  /** Disable usage persistence for standalone diagnostics outside a request scope. */
  trackUsage?: boolean
}

function fallbackInterpretation(params: InterpretCoachTurnParams): CoachInterpretation {
  const selectedMemories = params.memoryCandidates.map((_, i) => i).slice(0, 6)
  const remainingAfterMemories = 6 - selectedMemories.length
  const selectedConstraints = params.constraintCandidates.map((_, i) => i).slice(0, remainingAfterMemories)
  const remainingAfterConstraints = remainingAfterMemories - selectedConstraints.length

  return {
    response_design: {
      stance: 'stay_with',
      emotional_intensity: 'warm',
      directness: 'clear',
      depth: 'one_layer_deeper',
      pacing: 'steady',
      challenge_support: 'balanced',
      question_usage: 'none',
      approach: 'coaching',
      response_length: 'developed',
    },
    overlay: 'none',
    emotional_state: 'unclear',
    surface_topic: '',
    stated_desire: null,
    key_signal: null,
    tension: null,
    possible_underlying_belief: null,
    relevant_lenses: [],
    // Preserve a small context slice so a failed helper cannot flood the coach prompt.
    selected_memories: selectedMemories,
    selected_constraints: selectedConstraints,
    selected_recall: params.recallCandidates.map((_, i) => i).slice(0, remainingAfterConstraints),
    recommended_move: '',
    avoid: [],
    next_question: null,
    confidence: 0.3,
    fallback: true,
  }
}

function asIndexArray(value: unknown, max: number): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map(v => (typeof v === 'number' ? v : parseInt(String(v), 10)))
    .filter(n => Number.isInteger(n) && n >= 0 && n < max)
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value.filter((v): v is string => typeof v === 'string').slice(0, 8)
}

function enumValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return allowed.includes(value as T) ? (value as T) : fallback
}

function parseResponseDesign(value: unknown): ResponseDesign {
  const design = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    stance: enumValue(design.stance, ['stay_with', 'explore', 'clarify', 'reframe', 'challenge', 'teach', 'celebrate', 'direct'], 'explore'),
    emotional_intensity: enumValue(design.emotional_intensity, ['quiet', 'warm', 'energized'], 'warm'),
    directness: enumValue(design.directness, ['gentle', 'clear', 'blunt'], 'clear'),
    depth: enumValue(design.depth, ['surface', 'one_layer_deeper', 'deep'], 'one_layer_deeper'),
    pacing: enumValue(design.pacing, ['slow', 'steady', 'brisk'], 'steady'),
    challenge_support: enumValue(design.challenge_support, ['support_led', 'balanced', 'challenge_led'], 'balanced'),
    question_usage: enumValue(design.question_usage, ['none', 'one_precise', 'clarify_first'], 'none'),
    approach: enumValue(design.approach, ['presence', 'coaching', 'teaching', 'practical_guidance'], 'coaching'),
    response_length: enumValue(design.response_length, ['brief', 'compact', 'developed', 'expansive'], 'developed'),
  }
}

/**
 * Reads the current coaching moment: what's underneath the member's words,
 * which retrieved context matters, and what the next move should be.
 */
export async function interpretCoachTurn(
  params: InterpretCoachTurnParams
): Promise<CoachInterpretation> {
  try {
    const sections: string[] = []

    if (params.recentMessages && params.recentMessages.length > 0) {
      const recent = params.recentMessages
        .slice(-8)
        .map(m => `${m.role === 'user' ? 'MEMBER' : 'VIVA'}: ${m.content.slice(0, 400)}`)
        .join('\n')
      sections.push(`CONVERSATION SO FAR:\n${recent}`)
    }

    sections.push(`LATEST MESSAGE FROM MEMBER:\n"${params.latestMessage.slice(0, 1500)}"`)

    if (params.modeHint) {
      sections.push(`The member selected this starting intent for the session: ${params.modeHint}. Treat it as useful evidence, not a mode that overrides what is happening now.`)
    }

    if (params.memoryCandidates.length > 0) {
      sections.push(
        `CANDIDATE MEMORIES (durable things VIVA knows about them):\n${params.memoryCandidates
          .map((m, i) => `[${i}] ${m.slice(0, 250)}`)
          .join('\n')}`
      )
    }

    if (params.constraintCandidates.length > 0) {
      sections.push(
        `CANDIDATE CONSTRAINTS (limiting beliefs on their ledger):\n${params.constraintCandidates
          .map((c, i) => `[${i}] ${c.slice(0, 250)}`)
          .join('\n')}`
      )
    }

    if (params.recallCandidates.length > 0) {
      sections.push(
        `CANDIDATE RECALLED MOMENTS (semantically similar to what they just said):\n${params.recallCandidates
          .map((r, i) => `[${i}] ${r.slice(0, 300)}`)
          .join('\n')}`
      )
    }

    if (params.lensSummary) {
      sections.push(`OTHER AMBIENT CONTEXT AVAILABLE TO THE COACH: ${params.lensSummary}`)
    }

    const result = await generateText({
      model: gateway(INTERPRETER_MODEL),
      system: INTERPRETER_PROMPT,
      prompt: sections.join('\n\n'),
    })

    if (params.trackUsage !== false && result.usage?.totalTokens) {
      trackTokenUsage({
        user_id: params.userId ?? null,
        action_type: 'background_processing',
        model_used: INTERPRETER_MODEL,
        tokens_used: result.usage.totalTokens,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        billable: false,
        success: true,
        metadata: { helper: 'coach_interpreter' },
      }).catch(() => {})
    }

    const jsonText = result.text.trim().replace(/^```(?:json)?\n?|\n?```$/g, '')
    const parsed = JSON.parse(jsonText) as Record<string, unknown>

    const validStates = ['above', 'below', 'transitioning', 'unclear'] as const
    const emotionalState = validStates.includes(parsed.emotional_state as (typeof validStates)[number])
      ? (parsed.emotional_state as (typeof validStates)[number])
      : 'unclear'

    const selectedMemories = asIndexArray(parsed.selected_memories, params.memoryCandidates.length)
    const selectedConstraints = asIndexArray(parsed.selected_constraints, params.constraintCandidates.length)
    const selectedRecall = asIndexArray(parsed.selected_recall, params.recallCandidates.length)
    let selectionBudget = 6
    const takeWithinBudget = (indices: number[]) => {
      const selected = indices.slice(0, selectionBudget)
      selectionBudget -= selected.length
      return selected
    }

    return {
      response_design: parseResponseDesign(parsed.response_design),
      overlay: enumValue(parsed.overlay, ['none', 'platform_guide', 'crisis'], 'none'),
      emotional_state: emotionalState,
      surface_topic: typeof parsed.surface_topic === 'string' ? parsed.surface_topic : '',
      stated_desire: typeof parsed.stated_desire === 'string' ? parsed.stated_desire : null,
      key_signal: typeof parsed.key_signal === 'string' ? parsed.key_signal : null,
      tension: typeof parsed.tension === 'string' ? parsed.tension : null,
      possible_underlying_belief:
        typeof parsed.possible_underlying_belief === 'string' ? parsed.possible_underlying_belief : null,
      relevant_lenses: asStringArray(parsed.relevant_lenses),
      selected_memories: takeWithinBudget(selectedMemories),
      selected_constraints: takeWithinBudget(selectedConstraints),
      selected_recall: takeWithinBudget(selectedRecall),
      recommended_move: typeof parsed.recommended_move === 'string' ? parsed.recommended_move : '',
      avoid: asStringArray(parsed.avoid),
      next_question: typeof parsed.next_question === 'string' ? parsed.next_question : null,
      confidence: Math.min(1, Math.max(0, Number(parsed.confidence) || 0.5)),
      fallback: false,
    }
  } catch (error) {
    console.error('[VIVA Interpreter] Failed, passing context through:', error)
    return fallbackInterpretation(params)
  }
}
