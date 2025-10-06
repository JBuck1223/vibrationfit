// Vibe Assistant Vision Refinement API Route
// This API route handles Vibe Assistant refinement requests using OpenAI GPT-4
// It checks allowances, calls OpenAI, tracks usage, logs activity, and returns refined text

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { 
  checkVibeAssistantAllowanceServer,
  decrementVibeAssistantAllowance,
  logVibeAssistantUsage,
  estimateTokens,
  calculateCost,
  VIBE_ASSISTANT_OPERATIONS,
  TONALITY_OPTIONS,
  EMOTIONAL_INTENSITY
} from '@/lib/vibe-assistant/allowance'
import { getVisionCategoryServer } from '@/lib/design-system/vision-categories-server'

// Initialize OpenAI client (only if API key is available)
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Use the most current and capable GPT model available
const GPT_MODEL = 'gpt-5' // Latest GPT-5 model with advanced reasoning and creativity

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

// System prompt for the Vibe Assistant
const VIBE_ASSISTANT_SYSTEM_PROMPT = `You are the Vibe Assistant (VIVA) for VibrationFit, an AI-powered guide that helps users refine their "Life I Choose" vision using conscious creation principles.

Your role is to help users elevate their vision to live "Above the Green Line" - a state of alignment, growth, and conscious creation. You specialize in:

✨ Conscious Creation: Helping users create from intention rather than reaction
🌟 Vision Refinement: Elevating and clarifying life visions across all categories
💚 Above the Green Line Living: Supporting alignment, growth, and positive energy
🎯 Specificity: Making visions more detailed, actionable, and emotionally resonant

Key Principles:
- Always maintain an empowering, growth-oriented tone
- Focus on conscious creation and intentional living
- Help users be specific about their desired experiences
- Encourage "Above the Green Line" thinking and feeling
- Support authentic self-expression and personal truth
- Guide users toward clarity and actionable steps

Your responses should feel like guidance from a wise, supportive mentor who understands conscious creation and helps users actualize their highest potential.`

// Helper function to build the user prompt based on refinement parameters
function buildUserPrompt(request: RefineVisionRequest): string {
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

  // Get category-specific context from centralized categories
  const categoryInfo = getVisionCategoryServer(category)
  const categoryContext = categoryInfo ? categoryInfo.description : 'This is a section of the user\'s life vision.'

  const prompt = `
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

Please provide a refined version that:
1. Elevates the vision to be more specific, detailed, and emotionally resonant
2. Aligns with conscious creation principles and "Above the Green Line" living
3. Maintains the user's authentic voice while enhancing clarity and impact
4. Follows the specified tonality and emotional intensity
5. Incorporates the user's specific instructions
6. Feels inspiring and actionable

Respond with only the refined text, no explanations or meta-commentary.`

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

    // Build the prompts
    const userPrompt = buildUserPrompt(body)
    const fullPrompt = `${activeVision}\n\n${currentRefinement}\n\n${userPrompt}`

    // Estimate tokens and check allowance
    const tokenEstimate = estimateTokens(fullPrompt)
    const estimatedCost = calculateCost(tokenEstimate.estimatedTokens)
    
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
    const completion = await openai.chat.completions.create({
      model: GPT_MODEL,
      messages: [
        {
          role: 'system',
          content: VIBE_ASSISTANT_SYSTEM_PROMPT
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      max_tokens: wordCount ? Math.ceil(wordCount * 1.5) : 1000, // Rough token estimation for word count
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    })

    // Extract response
    const refinedText = completion.choices[0]?.message?.content?.trim()
    if (!refinedText) {
      return NextResponse.json({
        success: false,
        error: 'No response generated from Vibe Assistant'
      }, { status: 500 })
    }

    // Calculate actual usage
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const totalTokens = completion.usage?.total_tokens || 0
    const actualCost = calculateCost(totalTokens)

    // Decrement user allowance
    const allowanceDecremented = await decrementVibeAssistantAllowance(
      user.id,
      totalTokens,
      actualCost
    )

    if (!allowanceDecremented) {
      console.error('Failed to decrement allowance, but proceeding with response')
    }

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
      processingTimeMs: processingTime,
      success: true
    })

    // Get updated allowance info
    const updatedAllowance = await checkVibeAssistantAllowanceServer(user.id)

    // Return successful response
    return NextResponse.json({
      success: true,
      refinedText,
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
