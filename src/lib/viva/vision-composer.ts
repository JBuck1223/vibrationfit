// src/lib/viva/vision-composer.ts
// Vision Composer - Transforms conversational input into "The Life I Choose" vision paragraphs

import { SupabaseClient } from '@supabase/supabase-js'
import OpenAI from 'openai'
import { VISION_COMPOSER_SYSTEM_PROMPT, VISION_COMPOSER_TASKS_PROMPT } from './prompts/vision-composer-prompt'

// Note: OPENAI_API_KEY must be available in server-side environment
const getOpenAI = () => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables')
  }
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

// Tiered model routing for speed + quality
export type VivaDepth = "light" | "deep"

export function pickModel(depth: VivaDepth = "light"): string {
  // Use gpt-4o-mini for now, update to gpt-5 when available
  return depth === "light" ? "gpt-4o-mini" : "gpt-4o"
}

export function determineDepth(input: VisionGenerationInput): VivaDepth {
  // Route to "deep" for complex vents or many contrasts
  if (input.vent && input.vent.length > 200) return "deep"
  if ((input.not_wants?.length ?? 0) > 3) return "deep"
  return "light"
}

export interface VisionGenerationInput {
  category: string
  conversationContext: string
  profileInsights: any
  assessmentInsights: any
  wants: string[]
  not_wants: string[]
  vent: string
  values: string[]
  toneHints: string[]
}

export interface VisionGenerationOutput {
  reflection: string // One-sentence mirror of feeling/theme
  paragraph: string // Polished present-tense, first-person paragraph (120-150 words)
  clarifier: string // 1-line follow-up question
  flip_map?: Array<{from: string; to: string}> // Contrast → desire transformation map
  related_categories?: string[] // Cross-category connections
}

/**
 * VIVA's Vision Composer - Following "The Life I Choose" Framework
 * 
 * MISSION: Transform mixed input (wants + contrast/vent) into a believable, 
 * present-tense, first-person Life Vision paragraph.
 * 
 * VIBRATIONAL GRAMMAR:
 * - Present tense, first person (I choose / I enjoy / I notice / I experience)
 * - Positive framing (say what IS, not what isn't)
 * - Believability > bravado; prefer micro-behaviors and rhythms to grand claims
 * - Include a simple ritual or rhythm where natural (e.g., Sunday check-in)
 * - Avoid "no / not / don't" constructions
 * - 120–150 words max
 * 
 * PROCESS:
 * 1. Mirror briefly (one specific feeling or theme in 1 short sentence)
 * 2. Flip contrast into direction of desire (no leaps)
 * 3. Write polished paragraph with sensory details and feeling place
 * 4. Add 1-line clarifier question
 */
export async function composeVisionParagraph(
  input: VisionGenerationInput
): Promise<VisionGenerationOutput> {
  
  const userContext = buildUserContext(input)

  const messages = [
    { role: 'system' as const, content: VISION_COMPOSER_SYSTEM_PROMPT },
    { role: 'user' as const, content: userContext },
    { role: 'user' as const, content: VISION_COMPOSER_TASKS_PROMPT }
  ]

  const openai = getOpenAI()
  const depth = determineDepth(input)
  const model = pickModel(depth)
  
  let result: any = {}
  let retries = 0
  const maxRetries = 1
  
  while (retries <= maxRetries) {
    try {
      const response = await openai.chat.completions.create({
        model,
        temperature: 0.6,
        response_format: { type: 'json_object' },
        messages
      })
      
      const raw = response.choices[0]?.message?.content || '{}'
      result = JSON.parse(raw)
      break
    } catch (error) {
      retries++
      if (retries > maxRetries) {
        console.error('Failed to get valid JSON response after retries:', error)
        throw new Error('Failed to generate vision: invalid response format')
      }
      // Retry with a reminder
      messages.push({
        role: 'user',
        content: 'Please return only valid JSON.'
      })
    }
  }
  
  // Apply guardrails
  let paragraph = result.paragraph || ''
  
  // Check for negations
  if (hasNegation(paragraph)) {
    paragraph = paragraph.replace(/\b(don't|do not|not|never|no\b)\b/gi, '').replace(/\s{2,}/g, ' ')
  }
  
  // Ensure ritual
  paragraph = ensureRitual(paragraph)
  
  // Enforce length
  paragraph = enforceLength(paragraph)
  
  return {
    reflection: result.reflection || '',
    paragraph,
    clarifier: result.clarifier || '',
    flip_map: result.flip_map || [],
    related_categories: result.related_categories || []
  }
}

// Guardrail functions
function hasNegation(s: string): boolean {
  return /\b(don't|do not|not|no\b|never)\b/i.test(s)
}

function ensureRitual(s: string): string {
  if (!/\b(daily|weekly|morning|evening|Sunday|ritual|check-?in|each (day|week)|I start|I end)\b/i.test(s)) {
    return s.trim() + ' I enjoy a simple weekly check-in to keep this feeling alive.'
  }
  return s
}

function enforceLength(s: string): string {
  const words = s.trim().split(/\s+/)
  if (words.length > 160) return words.slice(0, 160).join(' ')
  if (words.length < 80) return s + ' I notice how this feels in daily life.'
  return s
}

/**
 * Builds contextual prompt from conversation and profile data (optimized for token efficiency)
 */
function buildUserContext(input: VisionGenerationInput): string {
  const parts: string[] = []
  
  // Helper to truncate strings
  const truncate = (s = '', max = 800) => s.length > max ? s.slice(0, max) + '…' : s
  
  parts.push(`CATEGORY: ${input.category}\n`)
  
  // Slim profile data
  const strengths = input.profileInsights?.strengths?.slice(0, 3)?.join(', ')
  const values = (input.values?.length ? input.values : input.profileInsights?.values)?.slice(0, 3)?.join(', ')
  
  if (strengths) parts.push(`STRENGTHS: ${strengths}`)
  if (values) parts.push(`VALUES: ${values}`)
  
  // Category score
  const score = input.assessmentInsights?.categoryScores?.[input.category]
  if (typeof score === 'number') parts.push(`CATEGORY SCORE: ${score}/100`)
  
  // Conversation (truncated)
  if (input.conversationContext) {
    parts.push(`CONVERSATION: ${truncate(input.conversationContext, 700)}`)
  }
  
  // User input (limited to most important)
  if (input.wants?.length) parts.push(`WANTS: ${input.wants.slice(0, 5).join(', ')}`)
  if (input.not_wants?.length) parts.push(`LESS OF: ${input.not_wants.slice(0, 5).join(', ')}`)
  if (input.vent) parts.push(`VENT: ${truncate(input.vent, 500)}`)
  if (input.toneHints?.length) parts.push(`TONE: ${input.toneHints.slice(0, 3).join(', ')}`)
  
  return parts.join('\n')
}

/**
 * Gets category-specific seed questions for conversational prompts
 */
export function getCategorySeedQuestions(category: string): string[] {
  const questions: Record<string, string[]> = {
    forward: [
      "What's calling you forward in life right now? What feels like it wants to emerge?",
      "What intention do you want to set for this vision we're creating together?",
      "How do you want to begin this vision? What energy do you want to set?"
    ],
    fun: [
      "What activities reliably make you smile or laugh?",
      "When in the week is fun easiest to fit?",
      "Who do you love having fun with?"
    ],
    health: [
      "What does peak physical health feel like in your body?",
      "What sorts of activities light you up and make you feel alive?",
      "How does movement and exercise feel in your body when it's flowing?"
    ],
    travel: [
      "What do you love about exploring new places?",
      "What emotions do you feel while traveling?",
      "What cultures or destinations call to you?"
    ],
    romance: [
      "How do you want connection with your partner to feel?",
      "What simple ritual keeps you two close?",
      "What shared experiences light you up together?"
    ],
    family: [
      "What does a happy, healthy family dynamic look like for you?",
      "How does it feel to grow together as a family?",
      "What moments with your family bring you the most joy?"
    ],
    social: [
      "What kind of energy do you want in your friendships?",
      "What do you enjoy doing with your friends?",
      "How do you feel when you're around your favorite people?"
    ],
    home: [
      "What does walking into your ideal home feel like?",
      "What spaces in your home bring you the most peace?",
      "How do you want your living space to support your best life?"
    ],
    business: [
      "What does a day of fulfilling, meaningful work look like?",
      "What impact do you want to have on the people you serve?",
      "How do you want to show up to your work and colleagues?"
    ],
    money: [
      "How do you want your relationship with money to feel?",
      "What simple weekly money ritual keeps things clear and calm?",
      "What would 'enough' look like right now?"
    ],
    possessions: [
      "What material things would add joy and ease to your life?",
      "How do you want to feel about the things you own?",
      "What items would make your daily life more fun and effortless?"
    ],
    giving: [
      "How do you want to contribute and make a difference?",
      "What causes or people do you feel called to support?",
      "What does giving back feel like when it's aligned and joyful?"
    ],
    spirituality: [
      "How do you want to feel connected to Source?",
      "What signs and synchronicities show you you're on the right path?",
      "How do you nurture your spiritual growth in everyday moments?"
    ],
    conclusion: [
      "What feels like the most important thing to remember about this vision?",
      "What's the essence of everything we've created together?",
      "How do you want to end this vision? What final affirmation captures your commitment?"
    ]
  }
  
  return questions[category] || [
    "What's most important to you in this area of life?",
    "How do you want to feel in this area?",
    "What would make this area really come alive for you?"
  ]
}

/**
 * Transforms a polished vision paragraph into "The Life I Choose" format
 * Ensures it meets all criteria: present tense, first person, positive framing, ritual, sensory details
 */
export function refineVisionParagraph(paragraph: string): string {
  // This function could do additional refinement if needed
  // For now, the AI should already produce well-formatted paragraphs
  // But we can add validation and minor adjustments here
  
  // Ensure paragraph doesn't exceed 150 words
  const words = paragraph.split(/\s+/)
  if (words.length > 150) {
    return words.slice(0, 150).join(' ')
  }
  
  return paragraph
}
