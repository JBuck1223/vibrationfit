import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import OpenAI from 'openai'

export const runtime = 'nodejs'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * POST /api/vision/generate
 * Generate vision text from conversation using OpenAI
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
      conversation_messages,
      vibrational_state
    } = body

    // Validate required fields
    if (!vision_id || !category || !conversation_messages) {
      return NextResponse.json(
        { error: 'vision_id, category, and conversation_messages are required' },
        { status: 400 }
      )
    }

    // Only generate vision if user is above the Green Line
    if (vibrational_state !== 'above_green_line') {
      return NextResponse.json(
        { 
          error: 'Vision can only be generated when above the Green Line',
          vibrational_state 
        },
        { status: 400 }
      )
    }

    // Get existing conversations for context (pattern recognition)
    const { data: existingConversations } = await supabase
      .from('vision_conversations')
      .select('category, generated_vision')
      .eq('vision_id', vision_id)
      .eq('user_id', user.id)
      .not('generated_vision', 'is', null)

    const previousVisions = existingConversations?.map(conv => ({
      category: conv.category,
      vision: conv.generated_vision
    })) || []

    // Build context for AI
    const contextMessages = []
    
    if (previousVisions.length > 0) {
      const previousContext = previousVisions
        .map(pv => `${pv.category}: ${pv.vision}`)
        .join('\n\n')
      
      contextMessages.push({
        role: 'system',
        content: `The user has already completed ${previousVisions.length} other categories. Here are their previous visions for context (use these to identify patterns and themes):\n\n${previousContext}`
      })
    }

    // System prompt for vision generation
    contextMessages.push({
      role: 'system',
      content: `You are generating a vision statement for the "${category}" category of the user's life.

CRITICAL RULES:
1. Write in PRESENT TENSE, first person ("I am", "I have", "I experience")
2. Use INCLUSION-BASED language (what they WANT, not what they're avoiding)
3. Use the user's EXACT WORDS and phrases from the conversation
4. Keep it to 2-3 powerful paragraphs
5. Make it FEEL GOOD to read - emotionally resonant
6. Focus on the FEELING STATE they desire, not just circumstances
7. Identify and weave in any patterns from their previous category visions

The vision should feel like a declaration of what IS, not what will be. It should activate their emotional alignment when they read it.

Category: ${category}

Generate the vision now based on the conversation below.`
    })

    // Add conversation messages
    conversation_messages.forEach((msg: { role: string; content: string }) => {
      contextMessages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })
    })

    // Call OpenAI to generate vision
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: contextMessages as OpenAI.Chat.ChatCompletionMessageParam[],
      temperature: 0.7,
      max_tokens: 800,
    })

    const generatedVision = completion.choices[0]?.message?.content

    if (!generatedVision) {
      throw new Error('No vision generated from OpenAI')
    }

    // Save generated vision to conversation
    const { error: updateError } = await supabase
      .from('vision_conversations')
      .update({
        generated_vision: generatedVision,
        vision_generated_at: new Date().toISOString(),
        completed_at: new Date().toISOString()
      })
      .eq('vision_id', vision_id)
      .eq('category', category)

    if (updateError) throw updateError

    // Update vision_versions sections with generated vision
    const { data: visionVersion } = await supabase
      .from('vision_versions')
      .select('sections')
      .eq('id', vision_id)
      .single()

    const updatedSections = {
      ...(visionVersion?.sections || {}),
      [category]: generatedVision
    }

    const { error: versionUpdateError } = await supabase
      .from('vision_versions')
      .update({
        sections: updatedSections,
        ai_generated: true
      })
      .eq('id', vision_id)

    if (versionUpdateError) throw versionUpdateError

    // Detect cross-category themes if multiple categories completed
    let detectedThemes: string[] = []
    if (previousVisions.length >= 2) {
      const themePrompt = `Analyze these life vision statements and identify 2-3 recurring themes or patterns:

${previousVisions.map(pv => `${pv.category}: ${pv.vision}`).join('\n\n')}

New category - ${category}: ${generatedVision}

Return ONLY a JSON array of theme strings (e.g., ["freedom and autonomy", "deep connection", "creative expression"])`

      const themeCompletion = await openai.chat.completions.create({
        model: 'gpt-4',
        messages: [{ role: 'user', content: themePrompt }],
        temperature: 0.5,
        max_tokens: 150,
      })

      try {
        const themesText = themeCompletion.choices[0]?.message?.content || '[]'
        detectedThemes = JSON.parse(themesText)
        
        // Update vision_versions with detected themes
        await supabase
          .from('vision_versions')
          .update({
            cross_category_themes: detectedThemes
          })
          .eq('id', vision_id)
      } catch (e) {
        console.error('Error parsing themes:', e)
      }
    }

    return NextResponse.json({
      vision: generatedVision,
      themes: detectedThemes,
      patterns_detected: previousVisions.length >= 2
    })
  } catch (error) {
    console.error('Error generating vision:', error)
    return NextResponse.json(
      { error: 'Failed to generate vision' },
      { status: 500 }
    )
  }
}
