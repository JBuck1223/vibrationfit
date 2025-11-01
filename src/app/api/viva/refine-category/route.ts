// /src/app/api/viva/refine-category/route.ts
// One-shot refinement endpoint for individual categories
// Uses master-vision assembly rules and conversational context

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { flattenProfile, flattenAssessment, flattenAssessmentWithScores } from '@/lib/viva/prompt-flatteners'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export const runtime = 'edge' // Use Edge Runtime for faster cold starts

/**
 * ============================
 *   VIVA Refinement Prompt Configuration
 * ============================
 */

// System persona + golden rules (matches master-vision)
const SHARED_SYSTEM_PROMPT = `
You are VIVA — the AI Vibrational Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the Life I Choose™ through vibrational alignment.

Persona: warm, wise, intuitive life coach (never therapist). Always present-tense, first-person, voice-faithful, and vibrationally activating.

Golden Rules (always enforce):
- Present Tense Only • First Person ("I / we") • Positive Ideal State (no comparisons, no lack).
- 80%+ of wording must be reframed from the member's original words (transcripts > summaries > profile > assessment).
- Flip negatives to aligned positives. No "but/however/even though." No "I will/I want/someday."
- Concrete, sensory, specific. No abstract "woo" unless the member uses it.
- Cross-weave categories naturally (life isn't siloed).
- Close each category with a one-sentence Essence (feeling lock-in).

5-Phase Conscious Creation Flow to encode in every category:
1) Gratitude opens   2) Sensory detail amplifies   3) Embodiment stabilizes
4) Essence locks in   5) Surrender releases

Bias: When in doubt, keep their diction, rhythm, and idioms; reframe to present-tense activation, not rewrite.
`

// 5-phase flow instructions
const FIVE_PHASE_INSTRUCTIONS = `
When generating each category:

Phase 1 — Gratitude Opening (1–2 short lines)
- Begin with appreciation in this area (use the member's own phrasing where possible).

Phase 2 — Sensory Expansion (2–4 lines)
- Translate their specifics into sight/sound/smell/touch/taste details that feel real.

Phase 3 — Embodied Lifestyle (2–6 lines)
- Present-tense "this is how I live it now," including natural cross-links to other categories.

Phase 4 — Essence Lock-In (1 line)
- Essence: a single sentence that names the dominant feeling state (their words > your words).

Phase 5 — Surrender/Allowing (1 line, optional if space tight)
- A brief thankful release (e.g., "Thank you for this or something even better.") If the user dislikes spiritual language, express a grounded gratitude line instead.
`

// Flow flexibility note
const FLOW_FLEXIBILITY_NOTE = `
The 5-Phase Flow is energetic, not literal.
Each category should flow through all five phases once overall.
Do NOT force equal length per phase.
Expand or condense each phase naturally based on the richness and quantity of the member's details.
When the user provides lots of detail, allow multiple paragraphs per phase.
When minimal detail is provided, merge phases naturally into a few concise paragraphs.
The goal is coherence and vibrational progression, not rigid structure.
`

// Style guardrails
const STYLE_GUARDRAILS = `
Voice Protection Rules (few-shot):
- Input: "I kinda want to travel more one day, maybe Thailand."
  Output: "I love how travel expands me. I feel warm sun on my skin in Thailand..."
- Input: "I don't want debt."
  Output: "I enjoy paying everything on time and watching balances stay at zero."

Forbidden patterns (rewrite before output):
- /\bI (want|will|wish|try|hope to)\b/i
- /\bI (don't|do not|no longer)\b.*\b/  (flip to the positive opposite)
- /\bbut\b|\bhowever\b|\beven though\b/i

Always rephrase to present-tense, positive, ideal state using the member's original terms.
`

// Micro rewrite guidance
const MICRO_REWRITE_RULE = `
If any source text includes future/lack phrasing ("I want / I will / I don't"), silently transform to present-tense positive equivalents before composing. Preserve the member's diction.
Examples:
- "I hope to get healthier" → "I feel healthy and energized."
- "I don't want to be in debt" → "I enjoy seeing my balances at zero and growing savings."
`

/**
 * ============================
 *   Request/Response Interfaces
 * ============================
 */
interface RefineCategoryRequest {
  visionId: string
  category: string
  currentRefinement?: string // Optional - API will fetch if not provided
  conversationHistory: Array<{ role: 'user' | 'assistant', content: string }>
  instructions?: string
}

interface RefineCategoryResponse {
  success: boolean
  refinedText?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costUsd: number
  }
  error?: string
}

/**
 * ============================
 *   Build Refinement Prompt
 * ============================
 */
async function buildRefinementPrompt(
  request: RefineCategoryRequest,
  userId: string
): Promise<string> {
  const { category, currentRefinement, conversationHistory, instructions } = request
  
  // Get AI model config (use existing VISION_REFINEMENT config)
  const aiConfig = getAIModelConfig('VISION_REFINEMENT')
  
  // Get user data
  const supabase = await createClient()
  
  // Get vision context
  const { data: vision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('id', request.visionId)
    .eq('user_id', userId)
    .single()
  
  // Get profile
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()
  
  // Get assessment
  const { data: assessment } = await supabase
    .from('assessment_results')
    .select('*')
    .eq('user_id', userId)
    .order('completed_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  // Get category info
  const categoryMap: Record<string, string> = {
    'forward': 'Forward',
    'fun': 'Fun',
    'health': 'Health',
    'travel': 'Travel',
    'love': 'Love',
    'family': 'Family',
    'social': 'Social',
    'home': 'Home',
    'work': 'Work',
    'money': 'Money',
    'stuff': 'Stuff',
    'giving': 'Giving',
    'spirituality': 'Spirituality',
    'conclusion': 'Conclusion'
  }
  const categoryLabel = categoryMap[category] || category
  
  // Build full vision context for cross-referencing
  let fullVisionContext = ''
  if (vision) {
    const allCategories = Object.entries({
      forward: vision.forward,
      fun: vision.fun,
      health: vision.health,
      travel: vision.travel,
      love: vision.love || vision.romance,
      family: vision.family,
      social: vision.social,
      home: vision.home,
      work: vision.work || vision.business,
      money: vision.money,
      stuff: vision.stuff || vision.possessions,
      giving: vision.giving,
      spirituality: vision.spirituality,
      conclusion: vision.conclusion
    })
      .filter(([_, value]) => value && value.trim().length > 0)
      .map(([key, content]) => `## ${categoryMap[key] || key}\n${(content as string).substring(0, 400)}${(content as string).length > 400 ? '...' : ''}`)
      .join('\n\n')
    
    if (allCategories) {
      fullVisionContext = `\n\n**COMPLETE VISION CONTEXT (for cross-category connections):**\n\n${allCategories}\n\n`
    }
  }
  
  // Build conversation summary
  const conversationContext = conversationHistory.length > 0 ? `
**CONVERSATION CONTEXT (this is your refinement instructions):**
${conversationHistory.map(msg => `${msg.role === 'user' ? 'User' : 'VIVA'}: ${msg.content}`).join('\n\n')}
` : ''
  
  const additionalInstructions = instructions ? `
**ADDITIONAL INSTRUCTIONS:**
${instructions}
` : ''
  
  return `${SHARED_SYSTEM_PROMPT}

${FIVE_PHASE_INSTRUCTIONS}
${FLOW_FLEXIBILITY_NOTE}
${STYLE_GUARDRAILS}
${MICRO_REWRITE_RULE}

**TASK:** Refine the **${categoryLabel}** vision section. This is a REWRITE of their existing vision based on our conversation - NOT a new creation from scratch.

IMPORTANT: You are improving their existing vision section below. Use it as the foundation. Enhance, elevate, and refine it - but keep 80%+ of their words and maintain their voice.

${fullVisionContext}

${profile && Object.keys(profile).length > 0 ? `**PROFILE CONTEXT:**
${flattenProfile(profile)}
` : ''}

${assessment ? `**ASSESSMENT CONTEXT:**
${flattenAssessment(assessment)}
` : ''}

${conversationContext}

${additionalInstructions}

**THEIR CURRENT VISION TO REFINE:**
${currentRefinement || '[No existing vision - this is unexpected]'}

**YOUR MISSION:**
You are refining their existing vision above. Based on the conversation, create an improved version that:
1. Starts from their current vision text (above) - do NOT create from scratch
2. Incorporates the specific changes and improvements discussed in conversation
3. Follows the 5-Phase Conscious Creation Flow
4. Uses 80%+ of their original words and phrases from their current vision
5. Weaves in cross-category connections naturally
6. Activates vibrational alignment (freedom, joy, expansion)
7. Reads as present-tense, lived experience
8. Ends with an Essence lock-in sentence

**CRITICAL:** 
- This is a REFINEMENT, not a new creation
- The refined version MUST feel like an evolution of their existing vision above
- Keep their authentic voice, phrasing, and word choices
- Make it more powerful while keeping it recognizable as an improvement of theirs
- Preserve the good parts, enhance the weak parts

Output ONLY the refined vision text. No explanation, no meta-commentary, just the refined text itself.
`
}

/**
 * ============================
 *   POST Handler
 * ============================
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    // Get authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }
    
    // Parse request
    const body: RefineCategoryRequest = await req.json()
    const { visionId, category, currentRefinement, conversationHistory, instructions } = body
    
    // Validate
    if (!visionId || !category) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: visionId, category'
      }, { status: 400 })
    }
    
    // If no currentRefinement provided, fetch the original vision text
    let refinementToUse = currentRefinement || ''
    if (!refinementToUse) {
      const { data: fullVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('id', visionId)
        .eq('user_id', user.id)
        .single()
      
      if (fullVision) {
        // Map category to vision field
        const fieldMap: Record<string, string> = {
          'forward': 'forward',
          'fun': 'fun',
          'health': 'health',
          'travel': 'travel',
          'love': 'love',
          'family': 'family',
          'social': 'social',
          'home': 'home',
          'work': 'work',
          'money': 'money',
          'stuff': 'stuff',
          'giving': 'giving',
          'spirituality': 'spirituality',
          'conclusion': 'conclusion'
        }
        
        // Handle legacy field names
        const actualField = fieldMap[category] || category
        const legacyField = actualField === 'love' ? 'romance' : actualField === 'work' ? 'business' : actualField === 'stuff' ? 'possessions' : actualField
        
        refinementToUse = fullVision[actualField as keyof typeof fullVision] || fullVision[legacyField as keyof typeof fullVision] || ''
      }
    }
    
    // Verify vision ownership
    const { data: vision } = await supabase
      .from('vision_versions')
      .select('user_id')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()
    
    if (!vision) {
      return NextResponse.json({
        success: false,
        error: 'Vision not found or access denied'
      }, { status: 404 })
    }
    
    // Get AI config
    const aiConfig = getAIModelConfig('VISION_REFINEMENT')
    
    // Build prompt with the proper refinement text
    const bodyWithRefinement = {
      ...body,
      currentRefinement: refinementToUse
    }
    const prompt = await buildRefinementPrompt(bodyWithRefinement, user.id)
    
    // Estimate tokens
    const tokenEstimate = estimateTokensForText(prompt, aiConfig.model)
    const maxTokens = Math.ceil(tokenEstimate * 1.5)
    
    // Check token balance
    const balanceCheck = await validateTokenBalance(user.id, tokenEstimate)
    if (balanceCheck) {
      return NextResponse.json({
        success: false,
        error: balanceCheck.error
      }, { status: balanceCheck.status })
    }
    
    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: SHARED_SYSTEM_PROMPT },
        { role: 'user', content: prompt }
      ],
      temperature: aiConfig.temperature,
      max_tokens: Math.min(maxTokens, aiConfig.maxTokens),
    })
    
    const refinedText = completion.choices[0]?.message?.content?.trim()
    
    if (!refinedText) {
      return NextResponse.json({
        success: false,
        error: 'No refined text generated'
      }, { status: 500 })
    }
    
    // Track usage
    const usage = completion.usage
    if (usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'vision_refinement',
        model_used: aiConfig.model,
        tokens_used: usage.total_tokens,
        cost_estimate: 0, // Will be calculated
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        success: true,
      })
    }
    
    return NextResponse.json({
      success: true,
      refinedText,
      usage: usage ? {
        inputTokens: usage.prompt_tokens,
        outputTokens: usage.completion_tokens,
        totalTokens: usage.total_tokens,
        costUsd: 0 // Calculate based on model pricing
      } : undefined
    })
    
  } catch (error) {
    console.error('Refine category error:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to refine category'
    }, { status: 500 })
  }
}

