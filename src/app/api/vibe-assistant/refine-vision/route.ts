// Vibe Assistant Vision Refinement API Route
// This API route handles Vibe Assistant refinement requests using OpenAI GPT-4
// It checks allowances, calls OpenAI, tracks usage, logs activity, and returns refined text

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getVisionCategoryServer } from '@/lib/design-system/vision-categories-server'
import { estimateTokens, checkVibeAssistantAllowanceServer, decrementVibeAssistantAllowance, logVibeAssistantUsage, calculateCost, VIBE_ASSISTANT_OPERATIONS } from '@/lib/vibe-assistant/allowance'

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Use the most current and capable GPT model available
const GPT_MODEL = 'gpt-5' // Latest GPT-5 model with advanced reasoning and creativity

// Tonality options for refinement
const TONALITY_OPTIONS = {
  ENCOURAGING: 'encouraging',
  CHALLENGING: 'challenging', 
  BALANCED: 'balanced',
  CELEBRATORY: 'celebratory'
} as const

// Emotional intensity options
const EMOTIONAL_INTENSITY = {
  GENTLE: 'gentle',
  MODERATE: 'moderate',
  INTENSE: 'intense',
  TRANSFORMATIVE: 'transformative'
} as const

// Use centralized vision categories as const

// Request body interface
interface RefineVisionRequest {
  visionId: string
  category: string
  activeVision: string
  currentRefinement: string
  instructions: string
  refinementPercentage: number // 0-100
  tonality: string
  wordCount?: number
  emotionalIntensity: string
}

// Response interface
interface RefineVisionResponse {
  success: boolean
  refinedText?: string
  vivaNotes?: string
  usage?: {
    inputTokens: number
    outputTokens: number
    totalTokens: number
    costUsd: number
    remainingTokens: number
  }
  error?: string
  allowanceInfo?: {
    tokensRemaining: number
    monthlyLimit: number
    tierName: string
  }
}

// Enhanced system prompt for the Vibe Assistant
const ENHANCED_SYSTEM_PROMPT = `You are the Vibe Assistant (VIVA) for VibrationFit, an AI-powered guide specializing in conscious creation and "Above the Green Line" living.

CORE EXPERTISE:
- Conscious Creation: Helping users create from intention rather than reaction
- Vision Refinement: Elevating life visions across 12 categories with specificity and emotional resonance
- Vibrational Alignment: Supporting users to live "Above the Green Line" in alignment with their highest vision
- Evidence Recognition: Helping users see and celebrate their actualization progress

CONSCIOUS CREATION PRINCIPLES:
FOUNDATIONAL TRUTH:
- The basis of life is freedom
- The purpose of life is joy  
- The result of life is expansion

A well-crafted vision section will give a feeling of freedom, and elicit a joyful expanded emotional state when read back by the user.

CORE PRINCIPLES:
1. Law of Attraction: Like attracts like - focus on desired outcomes with clarity
2. Law of Vibration: Everything is energy - align your frequency with your vision
3. Law of Deliberate Intent: Create from conscious choice, not reaction to circumstances
4. Above the Green Line: Living in alignment, growth, and positive energy
5. Below the Green Line: Contrast moments that provide clarity and growth opportunities
6. Vibe I Choose™: Conscious selection of emotional states and perspectives
7. Evidence of Actualization: Recognizing and celebrating progress and wins

VISION BOARD METHODOLOGY:
- Active: When we want to activate it in our vibration now (current focus)
- Actualized: When it came to fruition (manifested reality)
- Inactive: When not as interesting now as before (evolved priorities, like sports car → minivan when you have kids)

REFINEMENT APPROACH:
- Create visions that evoke freedom, joy, and expansion when read
- Maintain the user's authentic voice while enhancing clarity and impact
- Focus on specificity - help users be detailed about their desired experiences
- Encourage emotional resonance - help users feel their vision deeply
- Support actionable steps - make visions feel achievable and inspiring
- Honor the user's current level of consciousness while gently elevating
- Provide guidance that feels supportive, not prescriptive
- Ensure each refinement amplifies the user's sense of freedom and possibility

Your responses should feel like guidance from a wise, supportive mentor who understands conscious creation and helps users actualize their highest potential.`

// Enhanced helper function to build the user prompt with full context
async function buildUserPrompt(
  request: RefineVisionRequest, 
  userId: string
): Promise<string> {
  const { category, activeVision, currentRefinement, instructions, refinementPercentage, tonality, wordCount, emotionalIntensity } = request
  
  // Map tonality to specific guidance
  const tonalityGuidance = {
    [TONALITY_OPTIONS.ENCOURAGING]: "Use an encouraging, supportive tone that builds confidence and motivation.",
    [TONALITY_OPTIONS.CHALLENGING]: "Use a challenging, growth-oriented tone that pushes for deeper thinking and higher standards.",
    [TONALITY_OPTIONS.BALANCED]: "Use a balanced, wise tone that combines support with gentle challenge.",
    [TONALITY_OPTIONS.CELEBRATORY]: "Use a celebratory, uplifting tone that honors progress and amplifies positive energy."
  }

  // Map emotional intensity to specific guidance
  const intensityGuidance = {
    [EMOTIONAL_INTENSITY.GENTLE]: "Use gentle, soft language that feels nurturing and safe.",
    [EMOTIONAL_INTENSITY.MODERATE]: "Use moderate, steady language that feels grounded and reliable.",
    [EMOTIONAL_INTENSITY.INTENSE]: "Use intense, powerful language that creates strong emotional resonance."
  }

  // Get category-specific context
  const categoryInfo = getVisionCategoryServer(category)
  const categoryContext = categoryInfo ? categoryInfo.description : 'This is a section of the user\'s life vision.'

  // Get full vision context
  const supabase = await createClient()
  const { data: fullVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('id', request.visionId)
    .eq('user_id', userId)
    .single()

  // Get user profile context
  const { data: userProfile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  // Get refinement history for this category
  const { data: refinementHistory } = await supabase
    .from('vibe_assistant_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('vision_id', request.visionId)
    .eq('category', category)
    .eq('operation_type', 'refine_vision')
    .order('created_at', { ascending: false })
    .limit(3)

  // Build full vision context
  const fullVisionContext = fullVision ? `
COMPLETE VISION DOCUMENT:
Title: ${fullVision.title || 'Untitled Vision'}
Forward: ${fullVision.forward || 'Not specified'}
Fun & Recreation: ${fullVision.fun || 'Not specified'}
Travel & Adventure: ${fullVision.travel || 'Not specified'}
Home & Living: ${fullVision.home || 'Not specified'}
Family & Parenting: ${fullVision.family || 'Not specified'}
Romance & Partnership: ${fullVision.romance || 'Not specified'}
Health & Vitality: ${fullVision.health || 'Not specified'}
Money & Abundance: ${fullVision.money || 'Not specified'}
Business & Career: ${fullVision.business || 'Not specified'}
Friends & Social: ${fullVision.social || 'Not specified'}
Possessions & Lifestyle: ${fullVision.possessions || 'Not specified'}
Giving & Contribution: ${fullVision.giving || 'Not specified'}
Spirituality & Growth: ${fullVision.spirituality || 'Not specified'}
Conclusion: ${fullVision.conclusion || 'Not specified'}
` : ''

  // Build user profile context
  const userProfileContext = userProfile ? `
USER PROFILE CONTEXT:
Location: ${userProfile.city || 'Not specified'}, ${userProfile.state || 'Not specified'}
Relationship Status: ${userProfile.relationship_status || 'Not specified'}
Career: ${userProfile.occupation || 'Not specified'}${userProfile.company ? ` at ${userProfile.company}` : ''}
Family: ${userProfile.has_children ? `${userProfile.number_of_children} children` : 'No children'}
Health Focus: ${userProfile.exercise_frequency || 'Not specified'}
Living Situation: ${userProfile.living_situation || 'Not specified'}
` : ''

  // Build refinement history context
  const refinementHistoryContext = refinementHistory && refinementHistory.length > 0 ? `
PREVIOUS REFINEMENTS FOR THIS CATEGORY:
${refinementHistory.map((ref, index) => `
Version ${index + 1}: ${ref.output_text || 'No output text available'}
Created: ${new Date(ref.created_at).toLocaleDateString()}
`).join('\n')}
` : ''

  const prompt = `
${fullVisionContext}

${userProfileContext}

${refinementHistoryContext}

Please refine this ${categoryInfo?.label || category} vision section for conscious creation and "Above the Green Line" living.

CONTEXT:
${categoryContext}

CURRENT ACTIVE VISION:
${activeVision}

CURRENT REFINEMENT WORK:
${currentRefinement}

USER INSTRUCTIONS:
${instructions}

REFINEMENT PARAMETERS:
- Refinement Level: ${refinementPercentage}% (0% = minor tweaks, 100% = complete rewrite)
- Tonality: ${tonalityGuidance[tonality as keyof typeof tonalityGuidance] || tonalityGuidance[TONALITY_OPTIONS.BALANCED]}
- Emotional Intensity: ${intensityGuidance[emotionalIntensity as keyof typeof intensityGuidance] || intensityGuidance[EMOTIONAL_INTENSITY.MODERATE]}
${wordCount ? `- Target Word Count: Approximately ${wordCount} words` : ''}

Please provide:
1. The refined vision text
2. VIVA Notes explaining your refinement approach

Format your response as:

[REFINED VISION TEXT HERE]

---
VIVA NOTES:
Here's what I was thinking as I refined your vision:

I really wanted to capture that sense of freedom and expansion you're looking for, so I focused on adding those world-class retreats in stunning locations. There's something magical about imagining yourself in serene beaches and majestic mountains with your community - it just opens up so many possibilities for growth and connection.

What I love about this approach is how it serves multiple purposes. Not only do you get these incredible experiences to look forward to, but they also create opportunities for your community to deepen their bonds and elevate their vibrations together. It's like creating a ripple effect of positive energy.

I made sure to keep your authentic voice throughout - you can still hear "you" in every sentence. But I added those specific details about the retreats because I know how important it is to have something tangible to visualize and feel into. That's the key to conscious creation, right? Being able to really connect with the emotions of what you're creating.

The language flows in a way that should feel inspiring when you read it back to yourself. My goal was to amplify that sense of freedom and possibility while staying true to what makes your vision uniquely yours.
---

The refined version should:
1. Evoke freedom, joy, and expansion when read by the user
2. Elevate the vision to be more specific, detailed, and emotionally resonant
3. Align with conscious creation principles and "Above the Green Line" living
4. Maintain the user's authentic voice while enhancing clarity and impact
5. Follow the specified tonality and emotional intensity
6. Incorporate the user's specific instructions
7. Feel inspiring and actionable
8. Consider the user's profile context for personalized guidance
9. Build upon previous refinements for consistency
10. Amplify the user's sense of freedom and possibility

IMPORTANT: Do not use asterisks (*) or any special formatting characters in the refined text. Write in plain, natural language that flows smoothly.
`

  return prompt.trim()
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const startTime = Date.now()
  
  try {
    // Check if OpenAI client is available
    if (!openai) {
      return NextResponse.json({ 
        success: false,
        error: 'OpenAI API key not configured. Please contact support.' 
      }, { status: 500 })
    }

    // Parse request body
    const body: RefineVisionRequest = await request.json()
    const { visionId, category, activeVision, currentRefinement, instructions, refinementPercentage, tonality, wordCount, emotionalIntensity } = body

    // Validate required fields
    if (!visionId || !category || !activeVision || !currentRefinement || !instructions) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: visionId, category, activeVision, currentRefinement, instructions'
      }, { status: 400 })
    }

    // Validate refinement percentage
    if (refinementPercentage < 0 || refinementPercentage > 100) {
      return NextResponse.json({
        success: false,
        error: 'Refinement percentage must be between 0 and 100'
      }, { status: 400 })
    }

    // Get user authentication
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({
        success: false,
        error: 'Authentication required'
      }, { status: 401 })
    }

    // Verify vision ownership
    const { data: vision, error: visionError } = await supabase
      .from('vision_versions')
      .select('user_id')
      .eq('id', visionId)
      .eq('user_id', user.id)
      .single()

    if (visionError || !vision) {
      return NextResponse.json({
        success: false,
        error: 'Vision not found or access denied'
      }, { status: 404 })
    }

    // Build the enhanced prompt with full context
    const userPrompt = await buildUserPrompt(body, user.id)
    
    console.log('Prompt Info:', {
      promptLength: userPrompt.length,
      estimatedTokens: Math.ceil(userPrompt.length / 4),
      firstChars: userPrompt.substring(0, 300)
    })

    // Estimate tokens and check allowance
    const tokenEstimate = estimateTokens(userPrompt)
    const estimatedCost = tokenEstimate.estimatedCost
    
    // Check if user has sufficient allowance
    const allowance = await checkVibeAssistantAllowanceServer(user.id)
    if (!allowance) {
      return NextResponse.json({
        success: false,
        error: 'Unable to check allowance'
      }, { status: 500 })
    }

    if (allowance.tokensRemaining < tokenEstimate.estimatedTokens) {
      return NextResponse.json({
        success: false,
        error: 'Insufficient tokens remaining',
        allowanceInfo: {
          tokensRemaining: allowance.tokensRemaining,
          monthlyLimit: allowance.monthlyLimit,
          tierName: allowance.tierName
        }
      }, { status: 402 })
    }

    // Call OpenAI API with the latest GPT model
    let completion
    try {
      // Simplified API call for GPT-5 compatibility
      completion = await openai.chat.completions.create({
        model: 'gpt-5-mini', // Much cheaper than GPT-5, perfect for well-defined tasks
        messages: [
          {
            role: 'system',
            content: ENHANCED_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_completion_tokens: wordCount ? Math.ceil(wordCount * 1.5) : 10000 // Allow for much longer responses
        // Note: GPT-5 mini only supports default values for temperature (1), top_p, frequency_penalty, and presence_penalty
      })
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError)
      return NextResponse.json({
        success: false,
        error: `OpenAI API Error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      }, { status: 500 })
    }

    // Extract response and parse VIVA Notes
    const fullResponse = completion.choices[0]?.message?.content?.trim()
    
    console.log('GPT-5 Response:', {
      hasResponse: !!fullResponse,
      responseLength: fullResponse?.length || 0,
      firstChars: fullResponse?.substring(0, 200) || 'No response',
      usage: completion.usage
    })
    
    if (!fullResponse) {
      return NextResponse.json({
        success: false,
        error: 'No response generated from Vibe Assistant',
        debug: {
          hasChoices: completion.choices?.length > 0,
          hasMessage: !!completion.choices[0]?.message,
          hasContent: !!completion.choices[0]?.message?.content,
          usage: completion.usage
        }
      }, { status: 500 })
    }

    // Parse VIVA Notes from the response
    const vivaNotesMatch = fullResponse.match(/---\s*VIVA NOTES:\s*([\s\S]*?)(?:\s*---|$)/)
    let refinedText = fullResponse
    let vivaNotes = ''

    if (vivaNotesMatch) {
      // Remove the VIVA Notes section from the refined text
      refinedText = fullResponse.replace(/---\s*VIVA NOTES:[\s\S]*?(?:\s*---|$)/, '').trim()
      vivaNotes = vivaNotesMatch[1].trim()
      
      // Clean up any remaining markers and formatting
      refinedText = refinedText.replace(/\[REFINED VISION TEXT HERE\]/g, '').trim()
    } else {
      // If no VIVA Notes found, clean up any markers in the response
      refinedText = fullResponse.replace(/\[REFINED VISION TEXT HERE\]/g, '').trim()
    }
    
    // Clean up any asterisk formatting
    refinedText = refinedText.replace(/\*\*(.*?)\*\*/g, '$1').trim()

    // Calculate actual usage
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const totalTokens = completion.usage?.total_tokens || 0
    const actualCost = calculateCost(inputTokens, outputTokens)

    // NEW: Precise token tracking with real OpenAI costs
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'vision_refinement',
      model_used: 'gpt-4',
      tokens_used: totalTokens,
      cost_estimate: actualCost,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      success: true,
      metadata: {
        visionId: visionId,
        category: category,
        operationType: VIBE_ASSISTANT_OPERATIONS.REFINE_VISION,
        inputTokens,
        outputTokens,
        totalTokens,
        actualCost,
        userPrompt: userPrompt.substring(0, 100) + '...'
      }
    })

    // Log usage
    const processingTime = Date.now() - startTime
    await logVibeAssistantUsage({
      userId: user.id,
      visionId: visionId,
      category: category,
      operationType: VIBE_ASSISTANT_OPERATIONS.REFINE_VISION,
      inputTokens,
      outputTokens,
      totalTokens,
      costUsd: actualCost,
      refinementPercentage,
      tonality,
      wordCountTarget: wordCount,
      emotionalIntensity,
      instructions,
      inputText: currentRefinement,
      outputText: refinedText,
      vivaNotes: vivaNotes,
      processingTimeMs: processingTime,
      success: true
    })

    // Get updated allowance info
    const updatedAllowance = await checkVibeAssistantAllowanceServer(user.id)

    // Return successful response
    return NextResponse.json({
      success: true,
      refinedText,
      vivaNotes,
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd: actualCost,
        remainingTokens: updatedAllowance?.tokensRemaining || 0
      },
      allowanceInfo: updatedAllowance ? {
        tokensRemaining: updatedAllowance.tokensRemaining,
        monthlyLimit: updatedAllowance.monthlyLimit,
        tierName: updatedAllowance.tierName
      } : undefined
    })

  } catch (error) {
    console.error('Vibe Assistant refinement error:', error)
    
    // Log error if we have user context
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await logVibeAssistantUsage({
          userId: user.id,
          category: 'unknown',
          operationType: VIBE_ASSISTANT_OPERATIONS.REFINE_VISION,
          inputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          costUsd: 0,
          success: false,
          errorMessage: error instanceof Error ? error.message : 'Unknown error'
        })
      }
    } catch (logError) {
      console.error('Failed to log error:', logError)
    }

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 })
  }
}

// Handle unsupported methods
export async function GET() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for vision refinement.'
  }, { status: 405 })
}

export async function PUT() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for vision refinement.'
  }, { status: 405 })
}

export async function DELETE() {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed. Use POST for vision refinement.'
  }, { status: 405 })
}
