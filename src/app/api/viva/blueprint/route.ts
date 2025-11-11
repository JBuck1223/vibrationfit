/**
 * Blueprint API Route
 * 
 * Step 3: Generates Being/Doing/Receiving loops for a category
 * 
 * POST /api/viva/blueprint
 * Body: { category, categoryName, currentClarity, idealState, flippedContrast }
 * Returns: { loops: [{being, doing, receiving, essence}], summary }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildBlueprintPrompt } from '@/lib/viva/prompts'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { getAIModelConfig } from '@/lib/ai/config'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const {
      category,
      categoryName,
      currentClarity,
      idealState,
      flippedContrast
    } = body

    // Validate required fields
    if (!category || !categoryName) {
      return NextResponse.json(
        { error: 'Missing required fields: category, categoryName' },
        { status: 400 }
      )
    }

    // Get AI configuration
    // TODO: Add 'LIFE_VISION_BLUEPRINT' config in admin panel, using BLUEPRINT_GENERATION for now
    const aiConfig = getAIModelConfig('BLUEPRINT_GENERATION')

    // Build the blueprint prompt
    const prompt = buildBlueprintPrompt(
      category,
      categoryName,
      currentClarity || '',
      idealState || '',
      flippedContrast || ''
    )

    console.log('[Blueprint] Generating Being/Doing/Receiving loops for category:', category)

    // Call OpenAI
    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: 'system',
          content: aiConfig.systemPrompt || 'You are VIVA, helping members create their Being/Doing/Receiving blueprint.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
      response_format: { type: 'json_object' }
    })

    const responseTime = Date.now() - startTime
    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let parsedResponse
    try {
      parsedResponse = JSON.parse(result)
    } catch (parseError) {
      console.error('[Blueprint] Failed to parse AI response:', result)
      throw new Error('Invalid JSON response from AI')
    }

    // Track token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'blueprint_generation',  // Already exists!
      model_used: aiConfig.model,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      cost_estimate: 0,
      success: true,
      metadata: {
        category,
        categoryName,
        loopCount: parsedResponse.loops?.length || 0,
        responseTimeMs: responseTime
      }
    })

    // Save blueprint to life_vision_category_state table
    const { error: dbError } = await supabase
      .from('life_vision_category_state')
      .upsert({
        user_id: user.id,
        category,
        blueprint_data: parsedResponse.loops
      }, {
        onConflict: 'user_id,category'
      })

    if (dbError) {
      console.error('[Blueprint] Failed to save to database:', dbError)
      // Don't fail the request, just log the error
    }

    console.log('[Blueprint] Successfully generated', parsedResponse.loops?.length || 0, 'loops')

    return NextResponse.json({
      success: true,
      data: parsedResponse
    })

  } catch (error: any) {
    console.error('[Blueprint] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate blueprint',
        details: error.message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/viva/blueprint?category=<category>
 * Retrieves stored blueprint for a category
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get category from query params
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')

    if (!category) {
      return NextResponse.json(
        { error: 'Missing required parameter: category' },
        { status: 400 }
      )
    }

    // Fetch blueprint from database
    const { data, error } = await supabase
      .from('life_vision_category_state')
      .select('blueprint_data')
      .eq('user_id', user.id)
      .eq('category', category)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      throw error
    }

    return NextResponse.json({
      success: true,
      data: {
        loops: data?.blueprint_data || [],
        hasBlueprint: !!data?.blueprint_data
      }
    })

  } catch (error: any) {
    console.error('[Blueprint GET] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to retrieve blueprint',
        details: error.message
      },
      { status: 500 }
    )
  }
}

