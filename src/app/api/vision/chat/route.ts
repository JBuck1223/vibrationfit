import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { 
  DISCOVERY_TEMPLATES, 
  getDrillDownQuestionsForCategory, 
  getCategoryKey,
  RHYTHM_QUESTION, 
  type DiscoveryOption 
} from './discovery-templates'

export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/vision/chat
 * Discovery Path Chat Handler
 * 
 * Manages 3-step Discovery flow:
 * 1. Initial broad options
 * 2. Drill-down based on selections (with AI insight message)
 * 3. Rhythm/integration question (with AI pattern recognition)
 * 4. Generate vision from elevated state
 */
export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      vision_id,
      category,
      action,
      step,
      selections,
      customInput
    } = body

    // Validate required fields
    if (!vision_id || !category) {
      return NextResponse.json(
        { error: 'vision_id and category are required' },
        { status: 400 }
      )
    }

    const categoryKey = getCategoryKey(category)

    // Get or create conversation record
    const { data: conversation } = await supabase
      .from('vision_conversations')
      .select('*')
      .eq('vision_id', vision_id)
      .eq('category', category)
      .single()

    // STEP 1: Start Discovery - Return initial question
    if (action === 'start' || !conversation) {
      const template = DISCOVERY_TEMPLATES[categoryKey]
      
      if (!template || template.length === 0) {
        return NextResponse.json(
          { error: `No Discovery template found for category: ${category}` },
          { status: 400 }
        )
      }

      const initialQuestion = template[0]

      // Create conversation record
      await supabase
        .from('vision_conversations')
        .insert({
          user_id: user.id,
          vision_id,
          category,
          path_chosen: 'discovery',
          messages: [],
          vibrational_state: 'neutral'
        })

      return NextResponse.json({
        type: 'discovery_question',
        step: 1,
        aiMessage: initialQuestion.aiMessage,
        question: {
          text: initialQuestion.questionText,
          options: initialQuestion.options,
          multiSelect: true
        }
      })
    }

    // STEP 2: Process initial selections, return drill-down questions
    if (action === 'submit_step_1') {
      if (!selections || selections.length === 0) {
        return NextResponse.json(
          { error: 'Selections are required for step 1' },
          { status: 400 }
        )
      }

      // Get drill-down questions based on selections
      const drillDowns = getDrillDownQuestionsForCategory(category, selections)

      // Save selections to conversation
      const messages = [
        {
          role: 'system',
          content: `User selected (Step 1): ${selections.join(', ')}${customInput ? ` | Custom: ${customInput}` : ''}`,
          timestamp: new Date().toISOString(),
          step: 1,
          selections
        }
      ]

      await supabase
        .from('vision_conversations')
        .update({
          messages,
          vibrational_state: 'neutral' // Starting neutral, will elevate in step 2
        })
        .eq('vision_id', vision_id)
        .eq('category', category)

      // Generate AI insight message about their selections
      const insightMessage = await generateInsightMessage(selections, category, customInput, user.id, supabase)

      return NextResponse.json({
        type: 'drill_down_questions',
        step: 2,
        aiMessage: insightMessage,
        questions: drillDowns.map(q => ({
          questionKey: q.questionKey,
          text: q.questionText,
          options: q.options,
          multiSelect: true
        }))
      })
    }

    // STEP 3: Process drill-down selections, detect patterns, return rhythm question
    if (action === 'submit_step_2') {
      const step2Data = selections // This should be an object like { creative_types: ['visual', 'music'], adventure_types: [...] }
      
      // Get existing messages
      const existingMessages = conversation?.messages || []
      
      // Add step 2 selections
      const updatedMessages = [
        ...existingMessages,
        {
          role: 'system',
          content: `User selections (Step 2): ${JSON.stringify(step2Data)}`,
          timestamp: new Date().toISOString(),
          step: 2,
          selections: step2Data
        }
      ]

      // Detect patterns across selections
      const patternAnalysis = await detectPatterns(existingMessages[0]?.selections || [], step2Data, category, user.id, supabase)

      // Update vibrational state to elevated (user is getting specific and energized)
      await supabase
        .from('vision_conversations')
        .update({
          messages: updatedMessages,
          vibrational_state: 'above_green_line' // Energy rising as they get specific
        })
        .eq('vision_id', vision_id)
        .eq('category', category)

      // Generate AI message that NAMES THE PATTERN
      const patternMessage = await generatePatternMessage(patternAnalysis, category, user.id, supabase)

      return NextResponse.json({
        type: 'rhythm_question',
        step: 3,
        aiMessage: patternMessage,
        question: {
          text: RHYTHM_QUESTION.questionText,
          options: RHYTHM_QUESTION.options,
          multiSelect: false // Single select for rhythm
        },
        patternDetected: patternAnalysis.theme
      })
    }

    // STEP 4: Process rhythm selection, generate vision
    if (action === 'submit_step_3') {
      const rhythmSelection = selections[0] // Single selection

      // Get all conversation data
      const existingMessages = conversation?.messages || []
      
      // Add step 3 selection
      const finalMessages = [
        ...existingMessages,
        {
          role: 'system',
          content: `User selected rhythm (Step 3): ${rhythmSelection}`,
          timestamp: new Date().toISOString(),
          step: 3,
          selections: [rhythmSelection]
        }
      ]

      // Update conversation
      await supabase
        .from('vision_conversations')
        .update({
          messages: finalMessages,
          vibrational_state: 'above_green_line',
          final_emotion_score: 4 // Optimism - ready for vision generation
        })
        .eq('vision_id', vision_id)
        .eq('category', category)

      // Extract all discovery data for vision generation
      const discoveryData = {
        step1: finalMessages.find(m => m.step === 1)?.selections || [],
        step2: finalMessages.find(m => m.step === 2)?.selections || {},
        step3: rhythmSelection,
        category
      }

      // Generate vision
      const generatedVision = await generateVisionFromDiscovery(discoveryData, user.id, vision_id, supabase)

      // Save generated vision
      await supabase
        .from('vision_conversations')
        .update({
          generated_vision: generatedVision,
          vision_generated_at: new Date().toISOString(),
          completed_at: new Date().toISOString()
        })
        .eq('vision_id', vision_id)
        .eq('category', category)

      return NextResponse.json({
        type: 'vision_generated',
        vision: generatedVision,
        aiMessage: "Here's your vision based on everything you discovered! ✨\n\nDoes this feel like YOU?"
      })
    }

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error in Discovery chat:', error)
    return NextResponse.json(
      { error: 'Failed to process Discovery chat' },
      { status: 500 }
    )
  }
}

/**
 * Generate AI insight message about user's initial selections
 */
async function generateInsightMessage(
  selections: string[],
  category: string,
  customInput: string | undefined,
  userId: string,
  supabase: any
): Promise<string> {
  const prompt = `The user is discovering their vision for "${category}".

They selected: ${selections.join(', ')}
${customInput ? `They also said: "${customInput}"` : ''}

Write a warm, enthusiastic 2-3 sentence response that:
1. Validates their selections
2. Shows you see them
3. Transitions to getting more specific

Tone: Warm, insightful, like you're having a conversation with a friend

Example: "Love it! Creative, adventurous, and playful - that's a beautiful combination! 🎨🌄🎈\n\nLet's get more specific so we can capture what YOUR version of fun looks like:"

Write the response now:`

  // Estimate tokens and validate balance
  const estimatedTokens = estimateTokensForText(prompt, 'gpt-4')
  const tokenValidation = await validateTokenBalance(userId, estimatedTokens, supabase)
  
  if (tokenValidation) {
    // Return fallback message if insufficient tokens
    return "Great choices! Let's explore these more deeply..."
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 150,
  })

  const insightMessage = completion.choices[0]?.message?.content || "Great choices! Let's explore these more deeply..."

  // Track token usage
  if (completion.usage) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_generation',
      model_used: 'gpt-4',
      tokens_used: completion.usage.total_tokens || 0,
      input_tokens: completion.usage.prompt_tokens || 0,
      output_tokens: completion.usage.completion_tokens || 0,
      cost_estimate: 0, // Will be calculated by trackTokenUsage
      success: true,
      metadata: {
        category: category,
        step: 'discovery_insight',
        action: 'generateInsightMessage',
      },
    })
  }

  return insightMessage
}

/**
 * Detect patterns across user's selections
 */
async function detectPatterns(
  step1Selections: string[],
  step2Selections: Record<string, string[]>,
  category: string,
  userId: string,
  supabase: any
): Promise<{ theme: string; evidence: string[] }> {
  // Flatten all selections
  const allSelections = [
    ...step1Selections,
    ...Object.values(step2Selections).flat()
  ]

  const prompt = `Analyze these selections for "${category}" and identify the CORE THEME or pattern:

Step 1: ${step1Selections.join(', ')}
Step 2 details: ${JSON.stringify(step2Selections)}

What's the thread that runs through these choices? Look for:
- Repeated words or concepts (e.g., "spontaneous" appearing 3 times)
- Underlying values (freedom, connection, beauty, etc.)
- Personality traits being revealed

Return ONLY a JSON object:
{
  "theme": "one core theme in 2-4 words",
  "evidence": ["reason 1", "reason 2", "reason 3"]
}

Be specific and insightful. This is about seeing the pattern they might not see themselves.`

  // Estimate tokens and validate balance
  const estimatedTokens = estimateTokensForText(prompt, 'gpt-4')
  const tokenValidation = await validateTokenBalance(userId, estimatedTokens, supabase)
  
  if (tokenValidation) {
    // Return fallback if insufficient tokens
    return {
      theme: 'variety and exploration',
      evidence: ['Multiple interests selected', 'Diverse preferences shown']
    }
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.5,
    max_tokens: 200,
  })

  // Track token usage
  if (completion.usage) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_generation',
      model_used: 'gpt-4',
      tokens_used: completion.usage.total_tokens || 0,
      input_tokens: completion.usage.prompt_tokens || 0,
      output_tokens: completion.usage.completion_tokens || 0,
      cost_estimate: 0, // Will be calculated by trackTokenUsage
      success: true,
      metadata: {
        category: category,
        step: 'discovery_pattern_detection',
        action: 'detectPatterns',
      },
    })
  }

  try {
    const response = completion.choices[0]?.message?.content || '{}'
    const parsed = JSON.parse(response)
    return {
      theme: parsed.theme || 'variety and exploration',
      evidence: parsed.evidence || []
    }
  } catch (e) {
    return {
      theme: 'variety and exploration',
      evidence: ['Multiple interests selected', 'Diverse preferences shown']
    }
  }
}

/**
 * Generate pattern recognition message
 */
async function generatePatternMessage(
  patternAnalysis: { theme: string; evidence: string[] },
  category: string,
  userId: string,
  supabase: any
): Promise<string> {
  const prompt = `The user is discovering their vision for "${category}".

Pattern detected: ${patternAnalysis.theme}
Evidence: ${patternAnalysis.evidence.join('; ')}

Write a warm, insightful message (3-4 sentences) that:
1. Names the pattern you see ("I'm seeing something beautiful here!")
2. Reflects it back to them specifically
3. Makes them feel SEEN
4. Transitions to the final question about rhythm/integration

Tone: Warm, insightful, like a breakthrough moment in therapy

Example: "I'm seeing something beautiful here! 🌟\n\nYou're drawn to creative expression (visual art and music), spontaneous adventures in nature, cultural experiences, and playful experimentation.\n\nAnd here's what really stands out: **spontaneity** keeps showing up. You don't want rigid plans - you want the freedom to follow your impulses, create when inspired, explore when curious.\n\nOne last question to make this really YOU:"

Write the message now:`

  // Estimate tokens and validate balance
  const estimatedTokens = estimateTokensForText(prompt, 'gpt-4')
  const tokenValidation = await validateTokenBalance(userId, estimatedTokens, supabase)
  
  if (tokenValidation) {
    // Return fallback message if insufficient tokens
    return `I see a clear pattern emerging! Let's capture how this integrates into your life:`
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
    max_tokens: 250,
  })

  const patternMessage = completion.choices[0]?.message?.content || `I see a clear pattern emerging! Let's capture how this integrates into your life:`

  // Track token usage
  if (completion.usage) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_generation',
      model_used: 'gpt-4',
      tokens_used: completion.usage.total_tokens || 0,
      input_tokens: completion.usage.prompt_tokens || 0,
      output_tokens: completion.usage.completion_tokens || 0,
      cost_estimate: 0, // Will be calculated by trackTokenUsage
      success: true,
      metadata: {
        category: category,
        step: 'discovery_pattern_message',
        action: 'generatePatternMessage',
      },
    })
  }

  return patternMessage
}

/**
 * Generate final vision from all discovery data
 */
async function generateVisionFromDiscovery(
  discoveryData: {
    step1: string[]
    step2: Record<string, string[]>
    step3: string
    category: string
  },
  userId: string,
  visionId: string,
  supabase: any
): Promise<string> {
  // Get previous visions for pattern recognition
  const { data: previousConversations } = await supabase
    .from('vision_conversations')
    .select('category, generated_vision')
    .eq('vision_id', visionId)
    .eq('user_id', userId)
    .not('generated_vision', 'is', null)

  const previousVisions = previousConversations?.map((conv: any) => ({
    category: conv.category,
    vision: conv.generated_vision
  })) || []

  const prompt = `Generate a Life Vision statement for "${discoveryData.category}".

USER'S DISCOVERY DATA:
Initial interests: ${discoveryData.step1.join(', ')}
Specific preferences: ${JSON.stringify(discoveryData.step2)}
Rhythm preference: ${discoveryData.step3}

${previousVisions.length > 0 ? `PREVIOUS VISIONS (for pattern recognition):
${previousVisions.map((pv: any) => `${pv.category}: ${pv.vision}`).join('\n\n')}` : ''}

VISION REQUIREMENTS:
1. Write in PRESENT TENSE, first person ("I am", "I have", "I experience")
2. Use INCLUSION-BASED language (what they WANT, not avoiding)
3. Use their EXACT WORDS and phrases from selections
4. Make it 2-3 powerful paragraphs
5. Make it FEEL GOOD to read - emotionally resonant
6. Focus on the FEELING STATE they desire
7. Integrate their rhythm preference naturally
8. Capture the THEME/PATTERN across their selections

Generate the vision now:`

  // Estimate tokens and validate balance
  const estimatedTokens = estimateTokensForText(prompt, 'gpt-4')
  const tokenValidation = await validateTokenBalance(userId, estimatedTokens, supabase)
  
  if (tokenValidation) {
    // Return fallback message if insufficient tokens
    return 'Your vision is being created...'
  }

  const completion = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.7,
    max_tokens: 500,
  })

  const generatedVision = completion.choices[0]?.message?.content || 'Your vision is being created...'

  // Track token usage
  if (completion.usage) {
    await trackTokenUsage({
      user_id: userId,
      action_type: 'vision_generation',
      model_used: 'gpt-4',
      tokens_used: completion.usage.total_tokens || 0,
      input_tokens: completion.usage.prompt_tokens || 0,
      output_tokens: completion.usage.completion_tokens || 0,
      cost_estimate: 0, // Will be calculated by trackTokenUsage
      success: true,
      metadata: {
        category: discoveryData.category,
        vision_id: visionId,
        step: 'discovery_vision_generation',
        action: 'generateVisionFromDiscovery',
        previous_visions_count: previousVisions.length,
        generated_vision_length: generatedVision.length,
      },
    })
  }

  return generatedVision
}
