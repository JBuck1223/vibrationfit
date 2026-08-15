import type { CoachInterpretation } from './coach-interpreter'

/** Renders the theory of the moment and independent delivery coordinates. */
export function buildInterpretationSection(interp: CoachInterpretation): string {
  const lines: string[] = []
  const design = interp.response_design
  lines.push(`- Response design: ${design.stance}; ${design.emotional_intensity} intensity; ${design.directness} directness; ${design.depth} depth; ${design.pacing} pacing; ${design.challenge_support}; ${design.question_usage}; ${design.approach}; ${design.response_length} length`)
  if (interp.surface_topic) lines.push(`- Surface: ${interp.surface_topic}`)
  if (interp.stated_desire) lines.push(`- What they want from this: ${interp.stated_desire}`)
  if (interp.key_signal) lines.push(`- Key signal (their words): "${interp.key_signal}"`)
  if (interp.tension) lines.push(`- Live tension: ${interp.tension}`)
  if (interp.possible_underlying_belief) {
    lines.push(`- Possible belief underneath: "${interp.possible_underlying_belief}" (a hypothesis — test it, don't assert it)`)
  }
  if (interp.relevant_lenses.length > 0) lines.push(`- Lenses that apply: ${interp.relevant_lenses.join(', ')}`)
  if (interp.recommended_move) lines.push(`- Recommended move: ${interp.recommended_move}`)
  if (interp.avoid.length > 0) lines.push(`- Avoid this turn: ${interp.avoid.join('; ')}`)
  if (interp.next_question && design.question_usage !== 'none') {
    lines.push(`- A question worth asking: "${interp.next_question}" (use it only if it still fits once you've written the insight — an observation that lands is often stronger)`)
  }

  const lengthGuidance = {
    brief: 'Usually 1-3 sentences. For genuinely light moments — banter, quick check-ins, celebration. Make one clean move and stop.',
    compact: 'Usually 2-4 short paragraphs. Develop one idea without turning it into a monologue.',
    developed: 'A full response. Name what you see, show the evidence from their own material, and say what it means. Short paragraphs, room to breathe, every section earning its place.',
    expansive: 'The full signature treatment: open one level deeper than what they said, set their old frame and new frame side by side in their own words, build the case from their life, develop the insight until it fully lands, and close on a line that stays with them. Length is whatever the insight needs — write with momentum, never repetition.',
  }[design.response_length]
  lines.push(`- Length calibration: ${lengthGuidance}`)
  if (design.question_usage === 'none') {
    lines.push(`- End on the insight, not a question. Give them something to sit with and let them decide where to take it.`)
  }

  return `## READ OF THIS MOMENT

A perception pass produced this theory of what is happening. It is a strong prior, not an order — if the member's message clearly calls for something else, trust the conversation:

${lines.join('\n')}

Treat every response-design control independently. These are delivery coordinates, not a checklist and not a fixed template. Depth and length are separate: going deep can mean naming one precise truth in two sentences; an expansive answer can still stay practical and surface-level. Match the member's conversational bandwidth, and stop when the useful move is complete. Do not announce any of this.`
}

/** Deterministic guardrails for exceptional overlays; normal conversation is fully dynamic. */
export function buildOverlaySection(overlay: CoachInterpretation['overlay']): string {
  if (overlay === 'platform_guide') {
    return `## PLATFORM GUIDANCE OVERLAY

Give clear, warm, step-by-step product directions. If the request is actually about the member's lived experience, return naturally to conversation.

- Life Vision: /life-vision
- Journal: /journal
- Vision Board: /vision-board
- Assessment: /assessment
- Audio Studio: /audio
- Profile: /profile
- VIVA: /viva
- Map: /map

If an essential detail is missing, ask one focused clarifying question.`
  }
  if (overlay === 'crisis') {
    return `## CRISIS SAFETY OVERLAY

Be calm, grounded, brief, and direct. Acknowledge the severity. Do not minimize, coach, reframe, or redirect to positive thinking. Ask whether they are safe right now. For self-harm or suicidal thoughts, express care and provide the 988 Suicide & Crisis Lifeline. For abuse, believe them without pressing for details and provide the National Domestic Violence Hotline (1-800-799-7233). Encourage immediate local emergency or qualified professional help when appropriate.`
  }
  return ''
}
