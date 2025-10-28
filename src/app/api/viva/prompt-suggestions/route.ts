import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIModelConfig } from '@/lib/ai/config'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { categoryKey, categoryLabel, profileData, assessmentData } = await request.json()

    if (!categoryKey || !categoryLabel) {
      return NextResponse.json({ error: 'Category key and label are required' }, { status: 400 })
    }

    // Get admin-approved AI model config
    const aiConfig = getAIModelConfig('PROMPT_SUGGESTIONS')

    // Build comprehensive context with ALL profile fields and assessment data
    let context = `Category: ${categoryLabel}\n\n`
    
    // Profile Data - ALL fields
    if (profileData) {
      context += `=== USER PROFILE DATA ===\n\n`
      
      // Profile story (their own words)
      if (profileData.story && profileData.story.trim().length > 10) {
        context += `**Profile Story (their own words about ${categoryLabel}):**\n"${profileData.story}"\n\n`
      }
      
      // Extract key fields that should be highlighted for prompt injection
      const hobbies = profileData.hobbies && Array.isArray(profileData.hobbies) && profileData.hobbies.length > 0 
        ? profileData.hobbies.join(', ') 
        : null
      const occupation = profileData.occupation || null
      const leisureTime = profileData.leisure_time_weekly || null
      const spiritualPractice = profileData.spiritual_practice || null
      const travelFrequency = profileData.travel_frequency || null
      const socialPreference = profileData.social_preference || null
      
      // Highlight key injectable fields for Peak Experiences
      if (hobbies || occupation || leisureTime || spiritualPractice || travelFrequency) {
        context += `**Key Activities/Interests (USE THESE IN PEAK EXPERIENCES PROMPTS):**\n`
        if (hobbies) context += `- Hobbies: ${hobbies}\n`
        if (occupation) context += `- Occupation/Work: ${occupation}\n`
        if (leisureTime) context += `- Leisure Activities: ${leisureTime}\n`
        if (spiritualPractice) context += `- Spiritual Practice: ${spiritualPractice}\n`
        if (travelFrequency) context += `- Travel Frequency: ${travelFrequency}\n`
        context += `\nIMPORTANT: When creating the Peak Experiences prompt, you MUST inject these actual hobbies/interests/activities. For example, if hobbies are listed, use them in the prompt like "Describe a peak experience when you were ${hobbies?.split(',')[0] || 'doing something you love'}..."\n\n`
      }
      
      // All other profile fields (excluding metadata)
      const profileFields = Object.entries(profileData)
        .filter(([key, value]) => 
          !['id', 'user_id', 'created_at', 'updated_at', 'completion_percentage', 'story', 'profile_picture_url', 'ai_tags', 'story_recordings', 'hobbies', 'occupation', 'leisure_time_weekly', 'spiritual_practice', 'travel_frequency', 'social_preference'].includes(key) &&
          value !== null && 
          value !== undefined && 
          value !== '' &&
          !(Array.isArray(value) && value.length === 0)
        )
        .map(([key, value]) => {
          const displayValue = Array.isArray(value) ? value.join(', ') : value
          return `- ${key.replace(/_/g, ' ')}: ${displayValue}`
        })
      
      if (profileFields.length > 0) {
        context += `**Other Profile Details:**\n${profileFields.join('\n')}\n\n`
      }
    }
    
    // Assessment Data - ALL data including scoring
    if (assessmentData) {
      context += `=== ASSESSMENT DATA ===\n\n`
      
      // Overall assessment score
      if (assessmentData.overallScore !== undefined) {
        context += `**Overall Assessment Score:** ${assessmentData.overallScore}%\n`
        context += `**Green Line Status:** ${assessmentData.greenLineStatus || 'not assessed'}\n\n`
      }
      
      // Category-specific score
      if (assessmentData.categoryScore !== undefined) {
        context += `**${categoryLabel} Category Score:** ${assessmentData.categoryScore}%\n`
        if (assessmentData.categoryScore >= 80) {
          context += `Status: Thriving - This is a strong area for them\n\n`
        } else if (assessmentData.categoryScore >= 60) {
          context += `Status: Moderate alignment - Room for growth\n\n`
        } else {
          context += `Status: Growth area - Significant opportunity for improvement\n\n`
        }
      }
      
      // All category scores for context
      if (assessmentData.allCategoryScores && Object.keys(assessmentData.allCategoryScores).length > 0) {
        context += `**All Category Scores (for context):**\n`
        Object.entries(assessmentData.allCategoryScores).forEach(([cat, score]: [string, any]) => {
          context += `- ${cat}: ${score}%\n`
        })
        context += `\n`
      }
      
      // ALL assessment responses for this category (not just top 5)
      if (assessmentData.responses && assessmentData.responses.length > 0) {
        context += `**Assessment Questions & Answers (${assessmentData.responses.length} total):**\n\n`
        assessmentData.responses.forEach((r: any, idx: number) => {
          context += `${idx + 1}. Q: ${r.question_text}\n`
          context += `   A: ${r.response_text}\n`
          context += `   Score: ${r.response_value || 0}/5`
          if (r.green_line) {
            context += ` | Green Line: ${r.green_line === 'above' ? 'Above (aligned)' : 'Below (needs work)'}`
          }
          context += `\n\n`
        })
      }
    }

    const prompt = `You are VIVA, a personal vibrational coach helping someone create their Life Vision for the "${categoryLabel}" category.

${context}

Generate THREE personalized, creative, and engaging prompt suggestions. These prompts should help them dive deep into their experiences, feelings, and desires for this area of their life.

GUIDELINES FOR CREATIVITY:
- Be creative and engaging - use vivid, sensory language that helps them access their experiences
- Ask thought-provoking questions that invite deep reflection
- Use their specific data to create connections and insights
- Make it conversational and warm, like a trusted friend or coach
- Help them access emotions, memories, and desires they might not have consciously thought about
- Use metaphors, storytelling language, or evocative phrases when appropriate
- Each prompt can be longer (2-4 sentences) to fully set the context and invite deep reflection

GUARDRAILS (to keep prompts on track):
- Must reference their actual data (profile story, assessment responses, scores) when available
- Don't make up facts or assume things not in the data
- Stay focused on the category (${categoryLabel})
- Keep prompts relevant to creating a life vision (not therapy or advice)
- For Peak Experiences: Reference positive aspects, high scores, or positive assessment responses
- For What Feels Amazing: Reference specific things going well, high-scoring responses, or positive profile details
- For What Feels Bad: Reference specific challenges, low scores, or areas they indicated frustration
- If data is limited, create encouraging prompts that help them explore openly

1. **Peak Experiences Prompt:**
   - Start with "Describe a peak experience..." or "Describe peak moments..." to make it action-oriented
   - MUST inject their actual hobbies, interests, or activities from their profile when relevant
   - Example format: "Describe a peak experience when you were [doing their hobby/activity]" or "Describe peak moments you've had around [their specific interest]"
   - Reference positive data (high scores, positive assessment responses, good things in their story)
   - Use evocative language to help them access these memories
   - Make it descriptive - ask them to describe what made these moments special, what they were doing, how they felt

2. **What Feels Amazing Prompt:**
   - Start with "Describe areas of your life..." or "Describe what feels amazing..." to make it action-oriented
   - Ask them to describe what's currently going really well right now
   - Reference specific positive data from their profile or assessment when available
   - Make it descriptive - ask them to describe the specific areas, situations, or feelings that feel amazing
   - Invite them to elaborate on what makes these areas feel good

3. **What Feels Bad or Missing Prompt:**
   - Start with "Describe what feels off..." or "Describe what feels missing..." to make it action-oriented
   - Ask them to describe frustrations, challenges, or gaps they're experiencing
   - Reference specific low scores or areas of concern from their data when available
   - Be empathetic and validating
   - Make it descriptive - ask them to describe specifically what feels off, what's missing, what's frustrating
   - Create a safe space for them to be honest and detailed about what's not working

Return ONLY a JSON object with this exact structure:
{
  "peakExperiences": "Your descriptive prompt that starts with 'Describe...' and includes their actual hobbies/interests/activities from their profile. Be specific and action-oriented. Example: 'Describe a peak experience when you were doing [hobby]. What were you doing? How did you feel? What made that moment special?'",
  "whatFeelsAmazing": "Your descriptive prompt that starts with 'Describe...' about areas of their life that feel amazing right now. Be specific and action-oriented. Example: 'Describe areas of your life that feel amazing right now. What specifically feels good? What's working well?'",
  "whatFeelsBad": "Your descriptive prompt that starts with 'Describe...' about what feels off or missing. Be empathetic and action-oriented. Example: 'Describe what feels off or missing in your life right now. What specifically feels frustrating? What's not working?'"
}

CRITICAL REQUIREMENTS:
- ALL prompts MUST start with "Describe" to be action-oriented
- For Peak Experiences: MUST inject their actual hobbies, interests, or activities from the profile when available (e.g., if they have hobbies listed, use them: "Describe a peak experience when you were [hobby 1] or [hobby 2]")
- Make prompts descriptive and detailed - ask them to describe specific things, feelings, experiences
- Keep prompts conversational and warm, but direct and action-oriented
- Each prompt should be 1-3 sentences, focusing on getting them to describe in detail

Do NOT include any markdown, explanations, or other text - ONLY the JSON object.`

    // Estimate tokens and validate balance
    const estimatedTokens = estimateTokensForText(prompt, aiConfig.model)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    
    if (tokenValidation) {
      return NextResponse.json(
        { 
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    const completion = await openai.chat.completions.create({
      model: aiConfig.model,
      messages: [
        { role: 'system', content: aiConfig.systemPrompt || 'You are a helpful assistant that generates personalized prompts in JSON format only. Return ONLY valid JSON, no other text.' },
        { role: 'user', content: prompt }
      ],
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens,
      response_format: { type: 'json_object' }
    })

    const responseText = completion.choices[0]?.message?.content
    if (!responseText) {
      throw new Error('No response from AI')
    }

    let suggestions
    try {
      suggestions = JSON.parse(responseText)
    } catch (e) {
      // Fallback if JSON parsing fails
      console.error('Failed to parse AI response:', e)
      suggestions = {
        peakExperiences: `Let's think about some peak experiences you've had around ${categoryLabel.toLowerCase()}. Describe one or more experiences that you would deem to have been peak moments in your life.`,
        whatFeelsAmazing: `Based on your current situation, what feels like it's going really well right now? If you have any clarity on what you do want in this area, let it fly!`,
        whatFeelsBad: `Based on your current situation, what feels off right now? Anything frustrating? What's not working? Don't hold back—vent it out!`
      }
    }

    // Track token usage
    if (completion.usage) {
      try {
        await trackTokenUsage({
          user_id: user.id,
          action_type: 'prompt_suggestions',
          model_used: aiConfig.model,
          tokens_used: completion.usage.total_tokens || 0,
          input_tokens: completion.usage.prompt_tokens || 0,
          output_tokens: completion.usage.completion_tokens || 0,
          cost_estimate: 0, // Will be calculated by trackTokenUsage
          success: true,
          metadata: {
            categoryKey: categoryKey,
            categoryLabel: categoryLabel,
            has_profile: !!profileData,
            has_assessment: !!assessmentData,
          },
        })
      } catch (trackingError) {
        console.error('Failed to track token usage:', trackingError)
        // Don't fail the request if tracking fails
      }
    }

    return NextResponse.json(suggestions)

  } catch (err) {
    console.error('Prompt suggestions error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to generate prompt suggestions' },
      { status: 500 }
    )
  }
}

