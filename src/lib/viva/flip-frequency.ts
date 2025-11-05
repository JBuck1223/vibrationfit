// ============================================================================
// Flip the Frequency Microprompt System
// ============================================================================
// Converts contrast/lack language into present-tense, first-person, 
// positive ideal-state phrasing that preserves the member's voice

import OpenAI from 'openai'

// Note: OPENAI_API_KEY must be available in server-side environment
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

export type FlipMode = 'flip' | 'flip+enrich' | 'batch' | 'text'

export interface FlipFrequencyParams {
  mode: FlipMode
  n?: number // number of variations to return per item (1-3)
  tone_hint?: string // optional (e.g., "casual", "playful", "grounded", "elegant")
  keep_words?: string[] // array of words/phrases that MUST be preserved if present
  ban_words?: string[] // array to avoid (e.g., ["manifest", "universe"]) unless in user text
  debug?: boolean // when true, include "voice_notes"
  input?: string // single line to flip
  lines?: string[] // multiple lines for batch mode
}

export interface ClaritySeedItem {
  input: string
  clarity_seed: string
  essence?: string
  sensory_anchor?: string
  embodiment_line?: string
  surrender_line?: string
  voice_notes?: string[]
  unchanged?: boolean
}

export interface FlipFrequencyResponse {
  mode: FlipMode
  unchanged: boolean
  items: ClaritySeedItem[]
}

// System prompt for Flip the Frequency
const SYSTEM_PROMPT = `You are VIVA — Flip the Frequency, a micro-transformer that converts contrast statements into clarity seeds.

PRIMARY GOAL
- Translate any lack/contrast language into present-tense, first-person, positive ideal-state phrasing that matches the member's natural voice.
- Produce a succinct one-line "clarity_seed" plus optional enriched fields for activation.

NON-NEGOTIABLE RULES
- Present tense only. First person ("I / we"). No comparisons or references to the past or lack (no "used to", "no longer", "don't", "will", "want", "trying", "someday").
- Preserve the user's voice: keep their diction, idioms, named entities, and specificity. If they say "kinda", keep "kinda".
- Flip to the presence of what's wanted (not the absence of what's unwanted).
- Keep it concrete and sensory when possible. Avoid abstract woo unless present in the user's text.
- Never fabricate facts; if specifics are missing, keep the flip clean and generic-positive in their voice.
- Output must follow the JSON schema exactly (unless mode=text).

FRAMEWORK ENCODING (influence wording; not all fields are required)
- 5-Phase Flow: Gratitude → Sensory → Embodiment → Essence → Surrender.
- Who/What/Where/Why mini-cycle to sharpen a single sensory anchor if possible.
- Being/Doing/Receiving loop: who I am, what I do, what I receive.

ANTI-PATTERNS TO ELIMINATE (rewrite silently)
- /\\bI (want|will|wish|try|hope to)\\b/i
- /\\b(I don't|I do not|no longer|can't|cannot|lack|without)\\b/i
- /\\bbut\\b|\\bhowever\\b|\\beven though\\b/i
- "this is hard", "still learning", "getting there", "easier every day", "I love that this is my life now" (comparative or implies absence)

VOICE PRESERVATION HINTS
- Keep nouns (people, places, brands), cherished phrases, and rhythm.
- If the input tone is casual, stay casual; if poetic, keep it lyrical but concrete.

OUTPUT MODES
- mode="flip": return only a trimmed clarity seed (string) OR JSON with essential fields.
- mode="flip+enrich": return full JSON (seed + essence + optional sensory/embodiment/surrender).
- mode="batch": accept multiple lines and return an array of clarity objects.

IF INPUT IS ALREADY ALIGNED
- If the input is already a positive present-tense ideal-state with no lack/comparison, set "unchanged": true and echo it as the seed.

SCHEMA (for JSON modes)
{
  "mode": "flip|flip+enrich|batch",
  "unchanged": false,
  "items": [
    {
      "input": "string (original)",
      "clarity_seed": "string (1-line; present, first-person, positive)",
      "essence": "string (one word or short phrase, e.g., Freedom, Ease, Joy)",
      "sensory_anchor": "string (optional single concrete detail in their voice)",
      "embodiment_line": "string (optional 'I live it now' line, their voice)",
      "surrender_line": "string (optional grounded thank-you/allowing line)",
      "voice_notes": ["optional brief notes of preserved words/phrases"]
    }
  ]
}
Return either:
- JSON exactly in this schema, or
- plain text only when mode="text".
Do not explain your reasoning unless debug=true is explicitly passed.`

/**
 * Builds the user prompt template for Flip the Frequency
 */
function buildUserPrompt(params: FlipFrequencyParams): string {
  const parts: string[] = []
  
  parts.push('You are running the Flip the Frequency micro-prompt.\n')
  parts.push('\nPARAMS:')
  parts.push(`- mode: ${params.mode}`)
  parts.push(`- n: ${params.n || 1}`)
  if (params.tone_hint) parts.push(`- tone_hint: "${params.tone_hint}"`)
  if (params.keep_words && params.keep_words.length > 0) {
    parts.push(`- keep_words: [${params.keep_words.map(w => `"${w}"`).join(', ')}]`)
  }
  if (params.ban_words && params.ban_words.length > 0) {
    parts.push(`- ban_words: [${params.ban_words.map(w => `"${w}"`).join(', ')}]`)
  }
  parts.push(`- debug: ${params.debug || false}`)
  
  parts.push('\nINPUT:')
  if (params.mode === 'batch' && params.lines && params.lines.length > 0) {
    parts.push('- Provide flips for each line below as separate items in the array:')
    params.lines.forEach(line => {
      parts.push(`- ${line}`)
    })
  } else if (params.input) {
    parts.push(`- Single line to flip:\n"${params.input}"`)
  }
  
  parts.push('\nCONSTRAINTS:')
  parts.push('- Present tense. First person. No lack/comparison language.')
  parts.push("- Match the user's voice; keep named entities and phrasing if possible.")
  parts.push('- Keep it concise and immediately usable as a 1-line clarity seed.')
  parts.push('- If specifics exist (who/what/where/why), use one sensory anchor.')
  parts.push('- If input is already aligned, set "unchanged": true and return it as seed.')
  
  parts.push('\nOUTPUT:')
  if (params.mode === 'text') {
    parts.push('- Return only the 1-line clarity seed(s), each on a new line.')
  } else {
    parts.push('- Return valid JSON per the schema (no extra commentary).')
  }
  
  return parts.join('\n')
}

/**
 * Flip the Frequency - Main function
 * Converts contrast/lack language into clarity seeds
 */
export async function flipFrequency(
  params: FlipFrequencyParams
): Promise<FlipFrequencyResponse | string> {
  const openai = getOpenAI()
  
  // Validate input
  if (params.mode === 'batch') {
    if (!params.lines || params.lines.length === 0) {
      throw new Error('Batch mode requires lines array')
    }
  } else {
    if (!params.input) {
      throw new Error('Single flip mode requires input string')
    }
  }
  
  // Build messages
  const userPrompt = buildUserPrompt(params)
  
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: SYSTEM_PROMPT },
    { role: 'user', content: userPrompt }
  ]
  
  // Determine model (use gpt-4o-mini for speed, gpt-4o for complex batches)
  const model = params.mode === 'batch' && params.lines && params.lines.length > 3
    ? 'gpt-4o'
    : 'gpt-4o-mini'
  
  // Make API call
  let result: any = {}
  let retries = 0
  const maxRetries = 2
  
  while (retries <= maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature: 0.7,
        response_format: params.mode === 'text' 
          ? { type: 'text' }
          : { type: 'json_object' },
        messages
      })
      
      const raw = response.choices[0]?.message?.content || ''
      
      if (params.mode === 'text') {
        return raw.trim()
      }
      
      result = JSON.parse(raw)
      
      // Validate response structure
      if (!result.items || !Array.isArray(result.items)) {
        throw new Error('Invalid response structure: missing items array')
      }
      
      // Ensure mode and unchanged fields
      result.mode = result.mode || params.mode
      result.unchanged = result.unchanged || false
      
      break
    } catch (error) {
      retries++
      if (retries > maxRetries) {
        console.error('Failed to get valid response after retries:', error)
        throw new Error(`Failed to flip frequency: ${error instanceof Error ? error.message : 'unknown error'}`)
      }
      
      // Retry with reminder
      messages.push({
        role: 'user',
        content: params.mode === 'text' 
          ? 'Please return only the clarity seed text(s), one per line.'
          : 'Please return only valid JSON matching the schema exactly.'
      })
    }
  }
  
  return result as FlipFrequencyResponse
}

/**
 * Helper to validate if input is already aligned (no flip needed)
 */
export function isAlreadyAligned(input: string): boolean {
  // Check for common lack/comparison patterns
  const lackPatterns = [
    /\bI (want|will|wish|try|hope to|need to|should|have to)\b/i,
    /\b(I don't|I do not|no longer|can't|cannot|lack|without|never)\b/i,
    /\b(but|however|even though|although|despite)\b/i,
    /\b(tired of|sick of|fed up with|struggling|fighting|hard|difficult)\b/i
  ]
  
  return !lackPatterns.some(pattern => pattern.test(input))
}

