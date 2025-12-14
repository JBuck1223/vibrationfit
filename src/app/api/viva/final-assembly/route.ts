/**
 * Final Assembly API Route
 * 
 * Step 6: Generates Forward/Conclusion sections and activation message
 * 
 * POST /api/viva/final-assembly
 * Body: { visionId, assembledVision }
 * Returns: { forward, conclusion, activation, harmonizationNotes }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import OpenAI from 'openai'
import { buildFinalAssemblyPrompt, buildActivationReflectionPrompt } from '@/lib/viva/prompts'
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
    const { visionId, assembledVision } = body

    // Validate required fields
    if (!visionId || !assembledVision) {
      return NextResponse.json(
        { error: 'Missing required fields: visionId, assembledVision' },
        { status: 400 }
      )
    }

    // Fetch user profile for personalization
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Fetch assessment summary
    const { data: assessment } = await supabase
      .from('assessments')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    // Count scenes for activation message
    const { count: scenesCount } = await supabase
      .from('visualization_scenes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    // Get AI config
    // TODO: Add 'LIFE_VISION_FINAL_ASSEMBLY' config in admin panel, using VISION_GENERATION for now
    const aiConfig = getAIModelConfig('VISION_GENERATION')

    // Build the final assembly prompt
    const prompt = buildFinalAssemblyPrompt(
      assembledVision,
      profile,
      assessment
    )

    console.log('[Final Assembly] Generating forward/conclusion for vision:', visionId)

    // Call OpenAI for Forward/Conclusion generation
    const startTime = Date.now()
    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: 'system',
          content: aiConfig.systemPrompt || 'You are VIVA, creating the final polish for a complete Life Vision.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: aiConfig.temperature,
      max_completion_tokens: aiConfig.maxTokens,
      response_format: { type: 'json_object' }
    })

    const responseTime = Date.now() - startTime
    const result = completion.choices[0]?.message?.content

    if (!result) {
      throw new Error('No response from AI')
    }

    // Parse JSON response
    let finalAssembly
    try {
      finalAssembly = JSON.parse(result)
    } catch (parseError) {
      console.error('[Final Assembly] Failed to parse AI response:', result)
      throw new Error('Invalid JSON response from AI')
    }

    // Track token usage for forward/conclusion
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'vision_generation',  // TODO: Add 'final_assembly' type if needed
      model_used: aiConfig.model,
      tokens_used: completion.usage?.total_tokens || 0,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      actual_cost_cents: 0,
      // OpenAI reconciliation fields
      openai_request_id: completion.id,
      openai_created: completion.created,
      system_fingerprint: completion.system_fingerprint,
      success: true,
      metadata: {
        visionId,
        hasHarmonizationNotes: finalAssembly.harmonizationNotes?.length > 0,
        responseTimeMs: responseTime
      }
    })

    // Generate activation message
    const visionSummary = `Complete life vision across 12 categories`
    const activationPrompt = buildActivationReflectionPrompt(
      profile?.first_name || 'friend',
      visionSummary,
      scenesCount || 0,
      12 // All 12 categories
    )

    const activationStartTime = Date.now()
    const activationCompletion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        {
          role: 'system',
          content: 'You are VIVA, celebrating a member\'s completion of their Life Vision.'
        },
        {
          role: 'user',
          content: activationPrompt
        }
      ],
      temperature: aiConfig.temperature,
      max_completion_tokens: 1000,
      response_format: { type: 'json_object' }
    })

    const activationResponseTime = Date.now() - activationStartTime
    const activationResult = activationCompletion.choices[0]?.message?.content

    let activationData
    if (activationResult) {
      try {
        activationData = JSON.parse(activationResult)
      } catch (e) {
        console.error('[Final Assembly] Failed to parse activation response')
        activationData = {
          activationMessage: 'Your vision is complete and ready for activation!',
          suggestedActions: []
        }
      }
    }

    // Track activation token usage
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'vision_generation',  // TODO: Add 'activation_message' type if needed
      model_used: aiConfig.model,
      tokens_used: activationCompletion.usage?.total_tokens || 0,
      input_tokens: activationCompletion.usage?.prompt_tokens || 0,
      output_tokens: activationCompletion.usage?.completion_tokens || 0,
      actual_cost_cents: 0,
      // OpenAI reconciliation fields
      openai_request_id: activationCompletion.id,
      openai_created: activationCompletion.created,
      system_fingerprint: activationCompletion.system_fingerprint,
      success: true,
      metadata: {
        visionId,
        responseTimeMs: activationResponseTime
      }
    })

    // Update vision_versions table with forward, conclusion, and activation
    const { error: updateError } = await supabase
      .from('vision_versions')
      .update({
        forward: finalAssembly.forward,
        conclusion: finalAssembly.conclusion,
        activation_message: activationData?.activationMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', visionId)

    if (updateError) {
      console.error('[Final Assembly] Failed to update vision:', updateError)
      // Don't fail the request, just log the error
    }

    console.log('[Final Assembly] Successfully generated forward, conclusion, and activation')

    return NextResponse.json({
      success: true,
      data: {
        forward: finalAssembly.forward,
        conclusion: finalAssembly.conclusion,
        activation: activationData,
        harmonizationNotes: finalAssembly.harmonizationNotes || []
      }
    })

  } catch (error: any) {
    console.error('[Final Assembly] Error:', error)
    return NextResponse.json(
      {
        error: 'Failed to generate final assembly',
        details: error.message
      },
      { status: 500 }
    )
  }
}

