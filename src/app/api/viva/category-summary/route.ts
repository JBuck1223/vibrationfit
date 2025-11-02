import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { analyzeProfile, analyzeAssessment } from '@/lib/viva/profile-analyzer'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { flattenAssessmentResponsesNumbered } from '@/lib/viva/prompt-flatteners'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

const SHARED_SYSTEM_PROMPT = `You are VIVA — the Vibrational Intelligence Virtual Assistant for Vibration Fit.
Your purpose is to help members articulate and activate the life they choose through vibrational alignment.
You are a warm, wise, intuitive life coach — never a therapist or problem-solver.
All responses must be in present tense, first person, and vibrationally activating.`

function getCategoryProfileFields(category: string, profile: any): string {
  if (!profile) return ''
  
  const fields: string[] = []
  const categoryStories: Record<string, string> = {
    fun: 'fun_story',
    health: 'health_story',
    travel: 'travel_story',
    love: 'love_story',
    family: 'family_story',
    social: 'social_story',
    home: 'home_story',
    work: 'work_story',
    money: 'money_story',
    stuff: 'stuff_story',
    giving: 'giving_story',
    spirituality: 'spirituality_story'
  }
  
  // Add the user's own story text for this category (highest priority context)
  const storyField = categoryStories[category]
  if (storyField && profile[storyField] && profile[storyField].trim().length > 0) {
    fields.push(`User's own words about ${category}:\n"${profile[storyField]}"`)
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

function buildCategoryPrompt(
  category: string, 
  transcript: string, 
  categoryName: string,
  profile: any,
  assessment: any
): string {
  // Get category-specific profile story (user's own words)
  const categoryStories: Record<string, string> = {
    fun: 'fun_story',
    health: 'health_story',
    travel: 'travel_story',
    love: 'love_story',
    family: 'family_story',
    social: 'social_story',
    home: 'home_story',
    work: 'work_story',
    money: 'money_story',
    stuff: 'stuff_story',
    giving: 'giving_story',
    spirituality: 'spirituality_story'
  }
  
  const storyField = categoryStories[category]
  const profileStory = profile && storyField && profile[storyField] && profile[storyField].trim()
    ? profile[storyField].trim()
    : null
  
  // Get category-specific assessment responses
  const categoryResponses = assessment?.responses?.filter((r: any) => r.category === category) || []
  
  // Build data sections
  let dataSections = ''
  
  if (transcript && transcript.trim()) {
    dataSections += `## DATA SOURCE 1: User's Current Reflection (Spoken/Written Input)
"${transcript}"

`
  }
  
  if (profileStory) {
    dataSections += `## DATA SOURCE 2: User's Profile Story (Their Own Words)
"${profileStory}"

`
  }
  
  if (categoryResponses.length > 0) {
    dataSections += `## DATA SOURCE 3: Assessment Responses (Their Own Answers)
${flattenAssessmentResponsesNumbered(categoryResponses, false)}`
  }
  
  return `${SHARED_SYSTEM_PROMPT}

# YOUR TASK: Create a Data-Driven Summary of ${categoryName}

## CRITICAL INSTRUCTIONS:

**PRIMARY GOAL: Capture the user's voice using their own words. 80%+ of the output must be reframed from their actual speech patterns, phrases, and word choices. If it doesn't sound like them, it won't stick.**

**APPROACH:**
1. First, create THREE separate summaries (one for each data source below)
2. Then, combine these summaries to identify what's going well and what's challenging
3. Use their actual words, phrases, and speech patterns throughout - reframe, don't rewrite

${dataSections}

## STEP 1: Create Three Separate Summaries

For EACH data source above, create a brief summary that:
- Uses their exact words, phrases, and speech patterns
- Identifies what's going well in their own words
- Identifies what's challenging in their own words
- Maintains their voice, tone, and way of expressing themselves

## STEP 2: Combine Into Final Summary

Combine all three summaries to create one unified view that identifies:

**What's Going Really Well** - Things they mentioned that feel positive, aligned, or working well
- Extract their actual words and phrases
- Reframe in first person present tense USING THEIR SPEECH PATTERNS
- Be specific and grounded in what they actually said

**What's Challenging** - Things they mentioned that feel difficult, frustrating, or out of alignment
- Use their actual words and phrases
- Reframe in first person present tense USING THEIR SPEECH PATTERNS
- Be compassionate but honest about what they expressed

## OUTPUT FORMAT (strict - no markdown, no vibrational summary):

CRITICAL: Do NOT use markdown formatting. No asterisks (**), no hash symbols (#), no markdown syntax. Use plain text with clean line breaks.

${categoryName}

The things going really well in this area are...
- [Item 1 - Use their words, their phrases, reframed in first person]
- [Item 2 - Use their words, their phrases, reframed in first person]
- [Item 3 - Use their words, their phrases, reframed in first person]
- [Additional items as needed]

The challenges currently in this area are...
- [Challenge 1 - Use their words, their phrases, reframed in first person]
- [Challenge 2 - Use their words, their phrases, reframed in first person]
- [Challenge 3 - Use their words, their phrases, reframed in first person]
- [Additional challenges as needed]

## CRITICAL RULES:

1. **80%+ must be their actual words reframed** - If you're writing in a style that doesn't match their speech patterns, you're doing it wrong.

2. **Match their tone** - If they're casual, be casual. If they're formal, be formal. If they use slang, use similar language.

3. **Use their phrases** - If they say "I'm really struggling with..." use that phrase structure. Don't replace it with generic language.

4. **No "woo" language** - No "vibrational alignment," "raising my frequency," or abstract spiritual concepts. Use concrete, real language THEY would use.

5. **Reframe, don't rewrite** - Take "I'm stressed about money" and reframe it as "Money feels stressful right now" or "I feel stress around my financial situation" - same meaning, their words, first person present.

6. **Be specific** - Include actual details they mentioned (names, places, specific situations, concrete examples).

7. **No overview paragraph** - Just go straight to the two sections.

8. **If they didn't mention something positive, don't make it up** - Only include what they actually said or implied.

9. **NO MARKDOWN FORMATTING** - Do not use asterisks (**), hash symbols (#), or any markdown syntax. Write in plain text with clean formatting. Use line breaks and dashes for bullet points, but no markdown syntax.

Remember: This should read like THEM summarizing their own life, not an AI writing about them. Use their words, their phrasing, and plain text formatting - no markdown.`
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
          // Get raw assessment data
          const { data: assessmentData } = await supabase
            .from('assessment_results')
            .select('*')
            .eq('user_id', user.id)
            .order('completed_at', { ascending: false })
            .limit(1)
            .single()
          
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
        const prompt = buildCategoryPrompt(category, transcript, categoryName, profile, assessment)

        // Get admin-approved AI model config
        const aiConfig = getAIModelConfig('LIFE_VISION_CATEGORY_SUMMARY')

        // Estimate tokens and validate balance
        const estimatedTokens = estimateTokensForText(prompt, aiConfig.model)
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

        // Call OpenAI
        const completion = await openai.chat.completions.create({
          model: aiConfig.model,
          messages: [
            { role: 'system', content: aiConfig.systemPrompt || SHARED_SYSTEM_PROMPT },
            { role: 'user', content: prompt }
          ],
          temperature: aiConfig.temperature,
          max_tokens: aiConfig.maxTokens,
        })

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
              model_used: aiConfig.model,
              tokens_used: completion.usage.total_tokens || 0,
              input_tokens: completion.usage.prompt_tokens || 0,
              output_tokens: completion.usage.completion_tokens || 0,
              cost_estimate: 0, // Will be calculated by trackTokenUsage
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
          model: aiConfig.model,
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
