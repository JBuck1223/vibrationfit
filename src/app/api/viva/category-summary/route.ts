import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig, buildOpenAIParams } from '@/lib/ai/database-config'
import OpenAI from 'openai'
import { analyzeProfile, analyzeAssessment } from '@/lib/viva/profile-analyzer'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildCategorySummaryPrompt, CATEGORY_SUMMARY_SYSTEM_PROMPT } from '@/lib/viva/prompts/category-summary-prompt'
import { getCategoryClarityField } from '@/lib/design-system/vision-categories'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

function getCategoryProfileFields(category: string, profile: any): string {
  if (!profile) return ''
  
  const fields: string[] = []
  
  // Add the user's own clarity text for this category (highest priority context)
  const clarityField = getCategoryClarityField(category)
  if (profile[clarityField] && profile[clarityField].trim().length > 0) {
    fields.push(`User's own words about ${category}:\n"${profile[clarityField]}"`)
  }
  
  // Category-specific profile field mappings
  const categoryFields: Record<string, string[]> = {
    fun: ['leisure_time_weekly', 'hobbies'],
    health: ['exercise_frequency', 'health_concerns'],
    travel: ['countries_visited', 'travel_frequency'],
    love: ['relationship_status', 'relationship_length'],
    family: ['has_children', 'number_of_children'],
    social: ['close_friends_count', 'social_frequency'],
    home: ['living_situation', 'time_at_location'],
    work: ['employment_type', 'time_in_role', 'occupation'],
    money: ['household_income', 'consumer_debt', 'assets_equity'],
    stuff: ['material_values'],
    giving: ['volunteer_status', 'charitable_giving'],
    spirituality: ['spiritual_practice']
  }
  
  const relevantFields = categoryFields[category] || []
  
  relevantFields.forEach(field => {
    const value = profile[field]
    if (value !== null && value !== undefined && value !== '') {
      // Convert array fields to readable format
      if (Array.isArray(value)) {
        if (value.length > 0) {
          fields.push(`${field}: ${value.join(', ')}`)
        }
      } else {
        fields.push(`${field}: ${value}`)
      }
    }
  })
  
  return fields.length > 0 ? `Profile Context (${category}):\n${fields.map(f => `- ${f}`).join('\n')}\n` : ''
}

function sendProgress(controller: ReadableStreamDefaultController, stage: string, message: string) {
  const data = JSON.stringify({ type: 'progress', stage, message })
  controller.enqueue(new TextEncoder().encode(`data: ${data}\n\n`))
}

export async function POST(request: NextRequest) {
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const supabase = await createClient()
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (userError || !user) {
          const error = JSON.stringify({ type: 'error', error: 'Unauthorized' })
          controller.enqueue(new TextEncoder().encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        const { category, transcript, categoryName } = await request.json()

        if (!transcript || !category) {
          const error = JSON.stringify({ type: 'error', error: 'Transcript and category are required' })
          controller.enqueue(new TextEncoder().encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        // Stage 1: Evaluating input
        sendProgress(controller, 'evaluating', 'Evaluating your input...')

        // Stage 2: Get profile data
        sendProgress(controller, 'profile', `Compiling your profile information around ${categoryName}...`)
        
        let profile, assessment
        try {
          // Get raw profile data
          const { data: profileData } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('user_id', user.id)
            .single()
          profile = profileData
        } catch (err) {
          console.log('No profile found, continuing without profile data')
          profile = null
        }

        // Stage 3: Get assessment data
        sendProgress(controller, 'assessment', `Compiling your assessment data for ${categoryName}...`)
        
        try {
          // Get active assessment data
          const { data: assessmentData } = await supabase
            .from('assessment_results')
            .select('*')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .maybeSingle()
          
          if (assessmentData) {
            // Get assessment responses with questions and answers
            const { data: responsesData } = await supabase
              .from('assessment_responses')
              .select('*')
              .eq('assessment_id', assessmentData.id)
            
            assessment = {
              ...assessmentData,
              responses: responsesData || []
            }
          } else {
            assessment = null
          }
        } catch (err) {
          console.log('No assessment found, continuing without assessment data')
          assessment = null
        }

        // Stage 4: Reasoning
        sendProgress(controller, 'reasoning', 'Reasoning and synthesizing your vision...')

        // Build prompt with context
        const prompt = buildCategorySummaryPrompt(category, transcript, categoryName, profile, assessment)

        // Get admin-configured AI tool config from database
        const toolConfig = await getAIToolConfig('life_vision_category_summary')

        // Estimate tokens and validate balance
        const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
        const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
        
        if (tokenValidation) {
          const error = JSON.stringify({ 
            type: 'error', 
            error: tokenValidation.error,
            tokensRemaining: tokenValidation.tokensRemaining
          })
          controller.enqueue(new TextEncoder().encode(`data: ${error}\n\n`))
          controller.close()
          return
        }

        // Stage 5: Creating summary
        sendProgress(controller, 'creating', 'Creating your summary...')

        // Build OpenAI params using database config
        const messages = [
          { role: 'system' as const, content: toolConfig.system_prompt || CATEGORY_SUMMARY_SYSTEM_PROMPT },
          { role: 'user' as const, content: prompt }
        ]
        const openaiParams = buildOpenAIParams(toolConfig, messages)

        // Call OpenAI
        const completion = await openai.chat.completions.create(openaiParams)

        const summary = completion.choices[0]?.message?.content

        if (!summary) {
          throw new Error('No summary generated')
        }

        // Track token usage
        if (completion.usage) {
          try {
            await trackTokenUsage({
              user_id: user.id,
              action_type: 'life_vision_category_summary',
              model_used: toolConfig.model_name,
              tokens_used: completion.usage.total_tokens || 0,
              input_tokens: completion.usage.prompt_tokens || 0,
              output_tokens: completion.usage.completion_tokens || 0,
              actual_cost_cents: 0, // Will be calculated by trackTokenUsage
              // OpenAI reconciliation fields
              openai_request_id: completion.id,
              openai_created: completion.created,
              system_fingerprint: completion.system_fingerprint,
              success: true,
              metadata: {
                category: category,
                categoryName: categoryName,
                summary_length: summary.length,
                has_profile: !!profile,
                has_assessment: !!assessment,
              },
            })
          } catch (trackingError) {
            console.error('Failed to track token usage:', trackingError)
            // Don't fail the request if tracking fails
          }
        }

        // Send final result
        const result = JSON.stringify({ 
          type: 'complete',
          summary,
          model: toolConfig.model_name,
          category 
        })
        controller.enqueue(new TextEncoder().encode(`data: ${result}\n\n`))
        controller.close()

      } catch (err) {
        console.error('Category summary error:', err)
        const error = JSON.stringify({ 
          type: 'error', 
          error: err instanceof Error ? err.message : 'Failed to generate summary' 
        })
        controller.enqueue(new TextEncoder().encode(`data: ${error}\n\n`))
        controller.close()
      }
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
