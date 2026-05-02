/**
 * VIVA Mode Detector (Layer 1)
 *
 * Fast classification of conversation mode before the main response.
 * Determines how VIVA should show up:
 *
 * - connection: presence only. Reflect, ask, make them feel seen. No coaching.
 * - coaching: they've asked to shift. Deploy A.U.R.A.
 * - momentum: they're above the line, riding a wave. Reinforce + anchor.
 * - crisis: something serious. Safe support, boundaries, possible referral.
 *
 * Uses a small, fast model call (gpt-4o-mini) to keep latency low.
 * Falls back to 'connection' if classification fails.
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'

export type VivaMode = 'connection' | 'coaching' | 'momentum' | 'crisis' | 'guide'

export interface ModeDetectionResult {
  mode: VivaMode
  emotional_state: 'above' | 'below' | 'transitioning' | 'unclear'
  confidence: number
  reasoning: string
}

const MODE_DETECTION_PROMPT = `You classify the mode of a coaching conversation. Given the user's latest message (and optionally recent context), return a JSON object.

Modes:
- "connection" — Default. They're processing, venting, talking things through, or just checking in. They have NOT asked to be coached, shifted, or given a solution.
- "coaching" — They explicitly or implicitly asked for help shifting. Signals: "help me with...", "how do I...", "I want to feel better about...", "what should I do", circling the same frustration multiple times, expressing readiness to change.
- "momentum" — They're sharing good news, celebrating, feeling energized, riding above the green line. They don't need coaching — they need reinforcement.
- "guide" — They're asking how to do something on the platform. Signals: "how do I create...", "where do I find...", "help me set up...", "how does X work", questions about features, navigation, or workflows.
- "crisis" — They mention self-harm, suicidal ideation, abuse, or are in an acute emotional emergency. This is rare but critical.

Emotional state:
- "above" — positive, energized, hopeful, grateful, excited
- "below" — frustrated, stuck, sad, anxious, angry, overwhelmed
- "transitioning" — mixed, processing, neutral
- "unclear" — can't determine

Rules:
- Default to "connection" when uncertain
- A single frustrated message does NOT mean coaching — it might just be venting
- Look for PERMISSION signals before classifying as coaching
- "crisis" should only trigger on genuinely alarming content

Return ONLY a JSON object:
{"mode": "...", "emotional_state": "...", "confidence": 0.0-1.0, "reasoning": "one sentence"}

No markdown, no explanation outside the JSON.`

/**
 * Detects the appropriate VIVA mode for the current interaction.
 * Runs quickly (gpt-4o-mini) to minimize latency before main response.
 */
export async function detectMode(
  latestMessage: string,
  recentMessages?: { role: string; content: string }[]
): Promise<ModeDetectionResult> {
  try {
    // Build minimal context (last 3 messages + current)
    let contextText = ''
    if (recentMessages && recentMessages.length > 0) {
      const recent = recentMessages.slice(-3)
      contextText = recent.map(m => `${m.role}: ${m.content.slice(0, 200)}`).join('\n') + '\n\n'
    }

    const prompt = `${contextText}Latest message from member:\n"${latestMessage}"`

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: MODE_DETECTION_PROMPT,
      prompt,
      temperature: 0.1,
    })

    const parsed = JSON.parse(result.text.trim())

    // Validate the mode
    const validModes: VivaMode[] = ['connection', 'coaching', 'momentum', 'crisis', 'guide']
    if (!validModes.includes(parsed.mode)) {
      parsed.mode = 'connection'
    }

    return {
      mode: parsed.mode,
      emotional_state: parsed.emotional_state || 'unclear',
      confidence: Math.min(1, Math.max(0, parsed.confidence || 0.5)),
      reasoning: parsed.reasoning || '',
    }
  } catch (error) {
    console.error('[VIVA Mode Detector] Error, defaulting to connection:', error)
    return {
      mode: 'connection',
      emotional_state: 'unclear',
      confidence: 0.3,
      reasoning: 'Classification failed, defaulting to presence mode',
    }
  }
}
