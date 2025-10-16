// Actualization Blueprint Generator API Route
// This API route generates AI-powered actualization blueprints from vision content
// It analyzes vision sections and creates detailed action plans for actualization

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getVisionCategoryServer } from '@/lib/design-system/vision-categories-server'

// Initialize OpenAI client
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null

// Use GPT-5 mini for cost efficiency
const GPT_MODEL = 'gpt-5-mini'

// Request body interface
interface GenerateBlueprintRequest {
  visionId: string
  category: string
  visionContent: string
  focusArea?: string // Specific aspect to focus on
  timeline?: string // "3 months", "1 year", "3 years", etc.
  priority?: 'low' | 'medium' | 'high' | 'urgent'
}

// Response interface
interface GenerateBlueprintResponse {
  success: boolean
  blueprint?: {
    id: string
    title: string
    description: string
    aiAnalysis: string
    opportunitySummary: string
    successMetrics: string
    potentialChallenges: string
    recommendedTimeline: string
    phases: any[]
    resourcesNeeded: any[]
    milestones: any[]
  }
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

// Enhanced system prompt for Blueprint Generation
const BLUEPRINT_SYSTEM_PROMPT = `You are the Actualization Blueprint Generator for VibrationFit, an AI-powered strategist that helps users turn their visions into concrete, actionable plans for conscious creation and "Above the Green Line" living.

Your role is to analyze vision content and create detailed blueprints that help users actualize their dreams through practical, step-by-step action plans.

CORE EXPERTISE:
- Vision Analysis: Identifying the biggest opportunities for joy, impact, and transformation
- Strategic Planning: Breaking down big visions into manageable phases and tasks
- Resource Mapping: Identifying people, places, tools, skills, and financial needs
- Timeline Creation: Realistic timelines that honor the user's current life situation
- Conscious Creation Alignment: Ensuring all plans support "Above the Green Line" living

CONSCIOUS CREATION PRINCIPLES:
FOUNDATIONAL TRUTH:
- The basis of life is freedom
- The purpose of life is joy  
- The result of life is expansion

A well-crafted blueprint will give a feeling of freedom, and elicit a joyful expanded emotional state when reviewed by the user.

BLUEPRINT APPROACH:
- Focus on the biggest opportunities for joy and impact
- Create action-oriented plans (not timeline-rigid)
- Honor the user's authentic desires and current situation
- Build in flexibility and adaptability
- Include celebration and reflection points
- Connect to conscious creation principles throughout
- Make each step feel inspiring and empowering
- Design for Vision Board integration (Active → Actualized flow)
- Emphasize immediate, actionable steps over rigid timelines

Your responses should feel like guidance from a wise, strategic mentor who understands both conscious creation and practical implementation.`

// Helper function to build the blueprint generation prompt
async function buildBlueprintPrompt(request: GenerateBlueprintRequest, userId: string): Promise<string> {
  const { visionId, category, visionContent, focusArea, timeline, priority } = request
  
  // Get category-specific context
  const categoryInfo = getVisionCategoryServer(category)
  const categoryContext = categoryInfo ? categoryInfo.description : 'This is a section of the user\'s life vision.'

  // Get user profile context for personalized planning
  const supabase = await createClient()
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  // Get full vision context
  const { data: fullVision } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('id', visionId)
    .eq('user_id', userId)
    .single()

  // Build user context
  const userContext = userProfile ? `
USER PROFILE CONTEXT:
Location: ${userProfile.city || 'Not specified'}, ${userProfile.state || 'Not specified'}
Relationship Status: ${userProfile.relationship_status || 'Not specified'}
Career: ${userProfile.occupation || 'Not specified'}${userProfile.company ? ` at ${userProfile.company}` : ''}
Family: ${userProfile.has_children ? `${userProfile.number_of_children} children` : 'No children'}
Health Focus: ${userProfile.exercise_frequency || 'Not specified'}
Living Situation: ${userProfile.living_situation || 'Not specified'}
` : ''

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

  const prompt = `
${fullVisionContext}

${userContext}

Please create an Actualization Blueprint for this ${categoryInfo?.label || category} vision section.

VISION CONTENT TO ANALYZE:
${visionContent}

CATEGORY CONTEXT:
${categoryContext}

${focusArea ? `FOCUS AREA: ${focusArea}` : ''}
${timeline ? `PREFERRED TIMELINE: ${timeline}` : ''}
${priority ? `PRIORITY LEVEL: ${priority}` : ''}

Please provide a comprehensive Actualization Blueprint that includes:

1. **AI Analysis**: Your analysis of why this vision element is a big opportunity for joy and impact
2. **Opportunity Summary**: What makes this vision element particularly powerful for the user's transformation
3. **Success Metrics**: How to measure progress and success
4. **Potential Challenges**: Anticipated obstacles and how to navigate them
5. **Recommended Timeline**: Realistic timeline considering the user's current situation
6. **Phases**: 3-5 phases with specific objectives, tasks, and timelines
7. **Resources Needed**: People, places, tools, skills, and financial resources
8. **Milestones**: Key checkpoints and celebration points

Format your response as:

---
ACTUALIZATION BLUEPRINT:

**Title**: [Compelling title for this blueprint]

**AI Analysis**: [Your analysis of why this is a big opportunity for joy and impact]

**Opportunity Summary**: [What makes this vision element particularly powerful for transformation]

**Success Metrics**: [How to measure progress and success]

**Potential Challenges**: [Anticipated obstacles and navigation strategies]

**Recommended Approach**: [General approach and flow]

**ACTION PHASES**:
Phase 1: [Title] - Foundation
- Objective: [What this phase accomplishes]
- Key Actions: [3-5 specific actions to take]
- Resources: [What's needed for this phase]
- Success Indicators: [How to know this phase is complete]

Phase 2: [Title] - Building
- Objective: [What this phase accomplishes]
- Key Actions: [3-5 specific actions to take]
- Resources: [What's needed for this phase]
- Success Indicators: [How to know this phase is complete]

[Continue for 3-4 phases total]

**RESOURCES NEEDED**:
- People: [Specific people or types of people needed]
- Places: [Locations, venues, or spaces needed]
- Tools: [Technology, equipment, or materials needed]
- Skills: [Knowledge or abilities to develop]
- Financial: [Budget estimates and funding sources]

**CELEBRATION POINTS**:
- [Celebration 1]: [What to celebrate and how]
- [Celebration 2]: [What to celebrate and how]
- [Celebration 3]: [What to celebrate and how]
- [Final Celebration]: [What to celebrate and how]

**IMMEDIATE ACTIONS**: [3-5 specific actions the user can take right now to get started]
---

The blueprint should feel inspiring, achievable, and aligned with conscious creation principles. Make it practical enough to act on while maintaining the magic and possibility of the original vision.
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
    const body: GenerateBlueprintRequest = await request.json()
    const { visionId, category, visionContent, focusArea, timeline, priority } = body

    // Validate required fields
    if (!visionId || !category || !visionContent) {
      return NextResponse.json({
        success: false,
        error: 'Missing required fields: visionId, category, visionContent'
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

    // Build the enhanced prompt
    const userPrompt = await buildBlueprintPrompt(body, user.id)
    
    console.log('Blueprint Prompt Info:', {
      promptLength: userPrompt.length,
      estimatedTokens: Math.ceil(userPrompt.length / 4),
      firstChars: userPrompt.substring(0, 300)
    })

    // Note: Token allowance checking removed - using new tracking system

    // Call OpenAI API
    let completion
    try {
      completion = await openai.chat.completions.create({
        model: GPT_MODEL,
        messages: [
          {
            role: 'system',
            content: BLUEPRINT_SYSTEM_PROMPT
          },
          {
            role: 'user',
            content: userPrompt
          }
        ],
        max_completion_tokens: 8000 // Allow for comprehensive blueprints
      })
    } catch (openaiError) {
      console.error('OpenAI API Error:', openaiError)
      return NextResponse.json({
        success: false,
        error: `OpenAI API Error: ${openaiError instanceof Error ? openaiError.message : 'Unknown error'}`
      }, { status: 500 })
    }

    // Extract response
    const fullResponse = completion.choices[0]?.message?.content?.trim()
    
    console.log('Blueprint Response:', {
      hasResponse: !!fullResponse,
      responseLength: fullResponse?.length || 0,
      firstChars: fullResponse?.substring(0, 200) || 'No response',
      usage: completion.usage
    })
    
    if (!fullResponse) {
      return NextResponse.json({
        success: false,
        error: 'No blueprint generated from AI'
      }, { status: 500 })
    }

    // Parse the blueprint from the response
    const blueprintMatch = fullResponse.match(/---\s*ACTUALIZATION BLUEPRINT:\s*([\s\S]*?)\s*---/)
    if (!blueprintMatch) {
      return NextResponse.json({
        success: false,
        error: 'Invalid blueprint format received from AI'
      }, { status: 500 })
    }

    const blueprintContent = blueprintMatch[1].trim()

    // Calculate actual usage and track tokens
    const inputTokens = completion.usage?.prompt_tokens || 0
    const outputTokens = completion.usage?.completion_tokens || 0
    const totalTokens = completion.usage?.total_tokens || 0

    // Track token usage
    if (totalTokens > 0) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'blueprint_generation',
        model_used: GPT_MODEL,
        tokens_used: totalTokens,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
        cost_estimate: 0, // Will be calculated by trackTokenUsage
        success: true,
        metadata: {
          category: category,
          vision_id: visionId,
          focus_area: focusArea,
          timeline: timeline,
          priority: priority,
          blueprint_length: blueprintContent.length,
        },
      })
    }

    // Save the blueprint to the database
    const { data: savedBlueprint, error: saveError } = await supabase
      .from('actualization_blueprints')
      .insert({
        user_id: user.id,
        vision_id: visionId,
        title: `Blueprint for ${category}`,
        description: blueprintContent,
        category: category,
        priority_level: priority || 'medium',
        ai_analysis: blueprintContent,
        opportunity_summary: blueprintContent,
        success_metrics: blueprintContent,
        potential_challenges: blueprintContent,
        recommended_timeline: timeline || '6-12 months',
        phases: [], // Will be parsed and structured later
        resources_needed: [],
        milestones: [],
        status: 'draft'
      })
      .select()
      .single()

    if (saveError) {
      console.error('Error saving blueprint:', saveError)
      // Continue without saving to database
    }

    // Note: Old logging system removed - using new token tracking

    // Return successful response
    return NextResponse.json({
      success: true,
      blueprint: {
        id: savedBlueprint?.id || 'temp-id',
        title: `Blueprint for ${category}`,
        description: blueprintContent,
        aiAnalysis: blueprintContent,
        opportunitySummary: blueprintContent,
        successMetrics: blueprintContent,
        potentialChallenges: blueprintContent,
        recommendedTimeline: timeline || '6-12 months',
        phases: [],
        resourcesNeeded: [],
        milestones: []
      },
      usage: {
        inputTokens,
        outputTokens,
        totalTokens,
        costUsd: 0, // Cost calculated by tracking system
        remainingTokens: 0 // Not using allowance system anymore
      }
    })

  } catch (error) {
    console.error('Blueprint generation error:', error)
    
    // Track failed usage if we have user context
    try {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (user) {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'blueprint_generation',
          model_used: GPT_MODEL,
          tokens_used: 0,
          success: false,
          error_message: error instanceof Error ? error.message : 'Unknown error',
          metadata: {
            category: 'unknown',
            operation: 'generate_blueprint',
          },
        })
      }
    } catch (logError) {
      console.error('Failed to track error:', logError)
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
    error: 'Method not allowed. Use POST for blueprint generation.'
  }, { status: 405 })
}
