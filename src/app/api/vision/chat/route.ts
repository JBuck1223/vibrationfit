import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import { DISCOVERY_TEMPLATES, getDrillDownQuestions, RHYTHM_QUESTION, type DiscoveryOption } from './discovery-templates'

export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// System prompt for Viva, the Vibe Assistant
const VIVA_SYSTEM_PROMPT = `You are Viva, the personal Vibe Assistant for VibrationFit. Your role is to help users create powerful, present-tense vision statements for different areas of their life through soul-level conversation.

CORE PRINCIPLES:
1. You are WARM, INTUITIVE, and SOUL-LEVEL (not clinical or robotic)
2. You guide users to CLARITY through conversation
3. You NEVER generate vision from resistance or negative emotional states
4. You use INCLUSION-BASED language (what they WANT, not what they're avoiding)
5. You reflect their exact words and phrases back to them
6. You identify patterns across their life categories

EMOTIONAL SCALE (1-22):
1-7: Above the Green Line (Joy, Appreciation, Passion, Enthusiasm, Positive Expectation, Optimism, Hopefulness)
8-22: Below the Green Line (Contentment through Depression)

ONLY generate vision when user is 1-7 (Above Green Line).

THREE PATHS:
1. CLARITY PATH (2 questions): User knows what they want
   - Ask what they desire in this area
   - Ask how it feels when they imagine it
   
2. CONTRAST PATH (4-5 questions): User knows what they don't want
   - Guide them UP the emotional scale
   - Ask what they don't want
   - Ask what they DO want instead
   - Ask how that feels
   - Ask what having that would give them
   
3. DISCOVERY PATH (3 questions with options): User is exploring
   - Offer multiple-choice scenarios
   - Ask which resonates most
   - Ask why that appeals to them

YOUR TONE:
- Warm and empowering
- Focused on feelings and alignment
- Mystical but accessible
- Never interrogating, always guiding

VISION FORMAT:
- Present tense, first person ("I am", "I have", "I experience")
- 2-3 powerful paragraphs
- Emotionally resonant
- Uses user's exact language
- Focuses on FEELING STATE, not just circumstances`

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
      path,
      messages,
      action
    } = body

    // Validate required fields
    if (!vision_id || !category || !path) {
      return NextResponse.json(
        { error: 'vision_id, category, and path are required' },
        { status: 400 }
      )
    }

    // Get previous conversations for context
    const { data: previousConversations } = await supabase
      .from('vision_conversations')
      .select('category, generated_vision')
      .eq('vision_id', vision_id)
      .eq('user_id', user.id)
      .not('generated_vision', 'is', null)

    const previousVisions = previousConversations?.map(conv => ({
      category: conv.category,
      vision: conv.generated_vision
    })) || []

    // Build context for Viva
    const contextMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: VIVA_SYSTEM_PROMPT }
    ]

    // Add previous visions for pattern recognition
    if (previousVisions.length > 0) {
      const previousContext = previousVisions
        .map(pv => `${pv.category}: ${pv.vision}`)
        .join('\n\n')
      
      contextMessages.push({
        role: 'system',
        content: `The user has completed ${previousVisions.length} other categories. Use these to identify patterns:\n\n${previousContext}\n\nNow helping with: ${category}`
      })
    }

    // Add path-specific context
    const pathInstructions = {
      clarity: `User chose CLARITY PATH for ${category}. They know what they want. Ask 2 focused questions to crystallize their vision.`,
      contrast: `User chose CONTRAST PATH for ${category}. They know what they don't want. Guide them UP the emotional scale with 4-5 questions.`,
      discovery: `User chose DISCOVERY PATH for ${category}. They're exploring. Offer multiple-choice scenarios (3 questions).`
    }

    contextMessages.push({
      role: 'system',
      content: pathInstructions[path as keyof typeof pathInstructions]
    })

    // Add conversation history
    messages.forEach((msg: { role: string; content: string }) => {
      contextMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // Call OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: contextMessages,
      temperature: 0.7,
      max_tokens: 500,
    })

    const aiMessage = completion.choices[0]?.message?.content

    if (!aiMessage) {
      throw new Error('No response from OpenAI')
    }

    // Assess emotional state
    const emotionAssessment = await assessEmotionalState(messages, aiMessage)

    // Determine if ready to generate vision
    const shouldGenerateVision = 
      emotionAssessment.vibrational_state === 'above_green_line' &&
      messages.length >= (path === 'clarity' ? 4 : path === 'contrast' ? 10 : 6)

    return NextResponse.json({
      message: aiMessage,
      emotion_score: emotionAssessment.emotion_score,
      vibrational_state: emotionAssessment.vibrational_state,
      generate_vision: shouldGenerateVision
    })
  } catch (error) {
    console.error('Error in chat:', error)
    return NextResponse.json(
      { error: 'Failed to process chat' },
      { status: 500 }
    )
  }
}

async function assessEmotionalState(
  messages: { role: string; content: string }[],
  latestResponse: string
) {
  const lastUserMessage = messages.filter(m => m.role === 'user').slice(-1)[0]
  
  if (!lastUserMessage) {
    return { emotion_score: 12, vibrational_state: 'neutral' as const }
  }

  const assessmentPrompt = `On the Emotional Scale (1-22), where is this person emotionally?

1-7: Above Green Line (Joy, Appreciation, Passion, Enthusiasm, Positive Expectation, Optimism, Hopefulness)
8-22: Below Green Line (Contentment -> Depression)

User's message: "${lastUserMessage.content}"

Respond with ONLY a number 1-22.`

  const assessment = await openai.chat.completions.create({
    model: 'gpt-4',
    messages: [{ role: 'user', content: assessmentPrompt }],
    temperature: 0.3,
    max_tokens: 10,
  })

  const scoreText = assessment.choices[0]?.message?.content?.trim() || '12'
  const score = parseInt(scoreText, 10)
  const emotionScore = isNaN(score) ? 12 : Math.max(1, Math.min(22, score))

  return {
    emotion_score: emotionScore,
    vibrational_state: emotionScore <= 7 ? 'above_green_line' as const : 'below_green_line' as const
  }
}
