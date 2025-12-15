// ============================================================================
// Flip the Frequency Microprompt System
// ============================================================================
// Converts contrast/lack language into present-tense, first-person, 
// positive ideal-state phrasing that preserves the member's voice

import OpenAI from 'openai'
import { 
  buildFlipFrequencyPrompt, 
  FLIP_FREQUENCY_SYSTEM_PROMPT,
  FlipFrequencyParams,
  FlipMode
} from './prompts/flip-frequency-prompt'

// Note: OPENAI_API_KEY must be available in server-side environment
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Re-export types for backward compatibility
export type { FlipFrequencyParams, FlipMode }

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

// Use the enhanced system prompt from the centralized prompt file
const SYSTEM_PROMPT = FLIP_FREQUENCY_SYSTEM_PROMPT

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
  
  // Build messages using the enhanced prompt builder with density preservation
  const userPrompt = buildFlipFrequencyPrompt(params)
  
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



