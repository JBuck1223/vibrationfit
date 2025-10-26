// src/app/api/viva/vision-generate/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { analyzeProfile, analyzeAssessment, analyzeCategory, generateConversationalPrompt } from '@/lib/viva/profile-analyzer'
import { generateCustomOpening } from '@/lib/viva/conversation-generator'
import { ConversationManager } from '@/lib/viva/conversation-manager'
import { composeVisionParagraph, VisionGenerationInput } from '@/lib/viva/vision-composer'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Get user from session
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    // Parse request body once
    const body = await request.json()
    const { action } = body
    
    if (action === 'analyze') {
      // Analyze profile and assessment data
      const [profileInsights, assessmentInsights] = await Promise.all([
        analyzeProfile(user.id, supabase),
        analyzeAssessment(user.id, supabase)
      ])
      
      return NextResponse.json({
        profileInsights,
        assessmentInsights
      })
    }
    
    if (action === 'start_conversation') {
      const { category } = body
      
      console.log('🔄 Starting conversation for category:', category)
      
      try {
        const conversationManager = new ConversationManager(supabase, user.id)
        const sessionId = await conversationManager.createSession(category)
        
        console.log('✅ Session created:', sessionId)
        
        // Get profile and assessment insights
        console.log('📊 Analyzing profile...')
        const profileInsights = await analyzeProfile(user.id, supabase)
        console.log('✅ Profile insights:', profileInsights)
        
        console.log('📊 Analyzing assessment...')
        const assessmentInsights = await analyzeAssessment(user.id, supabase)
        console.log('✅ Assessment insights:', assessmentInsights)
        
        // Generate first conversational prompt
        console.log('💬 Generating conversational prompt...')
        const conversationData = generateConversationalPrompt(category, profileInsights, assessmentInsights, [])
        console.log('✅ Generated prompt:', conversationData.prompt)
        
        // Save the first turn
        console.log('💾 Saving conversation turn...')
        await conversationManager.addTurn(sessionId, category, 1, conversationData.prompt)
        console.log('✅ Turn saved')
        
        return NextResponse.json({
          sessionId,
          prompt: conversationData.prompt,
          isComplete: conversationData.isComplete,
          nextCycle: conversationData.nextCycle
        })
      } catch (error) {
        console.error('❌ Error in start_conversation:', error)
        throw error
      }
    }
    
    if (action === 'continue_conversation') {
      const { sessionId, category, userResponse } = body
      
      const conversationManager = new ConversationManager(supabase, user.id)
      
      // Update user response for current turn
      await conversationManager.updateUserResponse(sessionId, userResponse)
      
      // Get conversation history
      const history = await conversationManager.getSessionHistory(sessionId)
      const conversationHistory = history.map(turn => turn.user_response || '')
      
      // Get profile and assessment insights
      const profileInsights = await analyzeProfile(user.id, supabase)
      const assessmentInsights = await analyzeAssessment(user.id, supabase)
      
      // Generate next conversational prompt
      const conversationData = generateConversationalPrompt(category, profileInsights, assessmentInsights, conversationHistory)
      
      // Save the next turn
      await conversationManager.addTurn(sessionId, category, conversationData.nextCycle, conversationData.prompt)
      
      return NextResponse.json({
        prompt: conversationData.prompt,
        isComplete: conversationData.isComplete,
        nextCycle: conversationData.nextCycle
      })
    }
    
    if (action === 'generate_vision_from_conversation') {
      const { sessionId, category, wants, not_wants, vent } = body
      
      const conversationManager = new ConversationManager(supabase, user.id)
      const conversationContext = await conversationManager.getConversationContext(category)
      
      // Get profile and assessment insights for context
      const profileInsights = await analyzeProfile(user.id, supabase)
      const assessmentInsights = await analyzeAssessment(user.id, supabase)
      
      // Generate vision content using Vision Composer
      const visionContent = await generateVisionFromConversation(
        category, 
        conversationContext,
        profileInsights,
        assessmentInsights,
        { wants, not_wants, vent }
      )
      
      // Check if active vision exists
      const { data: existingVision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()
      
      let error = null
      
      if (existingVision) {
        // Update existing vision
        const { error: updateError } = await supabase
          .from('vision_versions')
          .update({ [category]: visionContent })
          .eq('user_id', user.id)
          .eq('is_active', true)
        error = updateError
      } else {
        // Create new vision with title
        const { error: insertError } = await supabase
          .from('vision_versions')
          .insert({
            user_id: user.id,
            title: 'My Life Vision',
            version_number: 1,
            is_active: true,
            [category]: visionContent
          })
        error = insertError
      }
      
      if (error) {
        throw new Error('Failed to save vision')
      }
      
      // Log to refinements table
      const { error: logError } = await supabase
        .from('refinements')
        .insert({
          user_id: user.id,
          category,
          operation_type: 'vision_generation',
          input_text: conversationContext,
          output_text: visionContent,
          total_tokens: estimateTokens(conversationContext + visionContent),
          cost_usd: estimateCost(conversationContext + visionContent)
        })
      
      if (logError) {
        console.error('Failed to log refinement:', logError)
      }
      
      return NextResponse.json({ visionContent })
    }
    
    if (action === 'generate_conversation') {
      // Generate custom opening conversation
      const profileInsights = await analyzeProfile(user.id, supabase)
      const assessmentInsights = await analyzeAssessment(user.id, supabase)
      const conversation = await generateCustomOpening(profileInsights, assessmentInsights)
      
      return NextResponse.json({ conversation })
    }
    
    if (action === 'generate_vision') {
      const { category, inputType, userInput } = body
      
      // Load member snapshot
      const profileInsights = await analyzeProfile(user.id, supabase)
      const assessmentInsights = await analyzeAssessment(user.id, supabase)
      
      // Generate vision content based on input type
      let visionContent = ''
      
      if (inputType === 'contrast' || inputType === 'vent') {
        visionContent = await transformClarityToVision(category, userInput, profileInsights, assessmentInsights)
      } else if (inputType === 'clarity') {
        visionContent = await transformClarityToVision(category, userInput, profileInsights, assessmentInsights)
      }
      
      // Update vision_versions table
      const { error: updateError } = await supabase
        .from('vision_versions')
        .update({ [category]: visionContent })
        .eq('user_id', user.id)
        .eq('is_active', true)
      
      if (updateError) {
        throw new Error('Failed to update vision')
      }
      
      // Log to refinements table
      const { error: logError } = await supabase
        .from('refinements')
        .insert({
          user_id: user.id,
          category,
          operation_type: 'vision_generation',
          input_text: userInput,
          output_text: visionContent,
          total_tokens: estimateTokens(userInput + visionContent),
          cost_usd: estimateCost(userInput + visionContent)
        })
      
      if (logError) {
        console.error('Failed to log refinement:', logError)
      }
      
      return NextResponse.json({ visionContent })
    }
    
    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    
  } catch (error) {
    console.error('VIVA API error:', error)
    
    // Log full error details for debugging
    if (error instanceof Error) {
      console.error('Error message:', error.message)
      console.error('Error stack:', error.stack)
    }
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

/**
 * Generates vision content from conversation context using Vision Composer
 */
async function generateVisionFromConversation(
  category: string, 
  conversationContext: string, 
  profileInsights?: any, 
  assessmentInsights?: any,
  userInput?: { wants?: string[], not_wants?: string[], vent?: string }
): Promise<string> {
  
  const input: VisionGenerationInput = {
    category,
    conversationContext,
    profileInsights: profileInsights || {},
    assessmentInsights: assessmentInsights || {},
    wants: userInput?.wants || [],
    not_wants: userInput?.not_wants || [],
    vent: userInput?.vent || '',
    values: profileInsights?.values || [],
    toneHints: ['warm', 'grounded', 'supportive']
  }
  
  const result = await composeVisionParagraph(input)
  
  // Return the polished paragraph (120-150 words, present tense, first person)
  return result.paragraph
}

/**
 * Transforms clarity input into vision
 */
async function transformClarityToVision(
  category: string, 
  clarityText: string, 
  profileInsights: any, 
  assessmentInsights: any
): Promise<string> {
  const prompt = `
You are VIVA, a vibrational coach. Refine this clarity into a compelling vision.

Category: ${category}
User's clarity: ${clarityText}

User Context:
- Strengths: ${profileInsights.strengths.join(', ')}
- Values: ${profileInsights.values.join(', ')}
- Lifestyle: ${profileInsights.lifestyle}
- Assessment Score: ${assessmentInsights.overallScore}%

Rules:
- Write in present tense, first person
- Use vibrational vocabulary (alignment, actualization, conscious creation)
- Enhance and expand their clarity
- Keep it 2-3 sentences
- Make it feel powerful and achievable
- Reference their strengths and values when possible

Refine this clarity into their vision for ${category}:`

  // This would call your LLM API
  return await callLLM('gpt-5', prompt, category)
}

/**
 * Placeholder for LLM API call
 */
async function callLLM(model: string, prompt: string, category?: string): Promise<string> {
  // This would be replaced with actual API call
  // For now, return a placeholder based on the category
  const categoryVisions = {
    forward: "I am stepping into my highest potential, aligned with my deepest values and ready to create the life I truly desire. This vision represents my conscious choice to live above the green line, embracing growth, joy, and fulfillment in every area of my life.",
    fun: "I am living a life filled with joy, laughter, and playful moments that light up my soul. I make time for hobbies and activities that bring me pure happiness and help me feel alive and energized.",
    health: "I am vibrant and energetic, with a body that feels strong and alive. I prioritize my wellness and feel amazing in my own skin every day.",
    travel: "I am exploring the world with curiosity and wonder, experiencing new cultures and creating lasting memories. Travel enriches my life and expands my perspective.",
    romance: "I am deeply connected with my partner, sharing love, laughter, and growth together. Our relationship is a source of joy and mutual support.",
    family: "I am a loving parent who creates a warm, supportive home environment. My children feel safe, loved, and encouraged to be their best selves.",
    social: "I have deep, meaningful friendships with people who support and inspire me. My social connections bring joy and fulfillment to my life.",
    home: "I live in a beautiful, peaceful space that reflects my values and supports my growth. My home is a sanctuary where I feel completely at ease.",
    business: "I am thriving in my work, using my talents to make a meaningful impact. I feel fulfilled and excited about what I do every day.",
    money: "I am financially free and abundant, with money flowing effortlessly into my life. I use my wealth to create positive impact and live with complete financial security.",
    possessions: "I surround myself with things that bring me joy and support my lifestyle. My possessions reflect my values and enhance my daily experience.",
    giving: "I make a positive difference in the world through my actions and contributions. I use my resources to help others and create lasting impact.",
    spirituality: "I am connected to something greater than myself, finding meaning and purpose in my spiritual practice. I feel aligned with my highest self.",
    conclusion: "This is the life I choose - a life of conscious creation, joyful growth, and deep fulfillment. I am living above the green line, creating my reality with intention, love, and vibrational alignment. This vision is my reality now."
  }
  
  return categoryVisions[category as keyof typeof categoryVisions] || "I am living my ideal life in this area, feeling aligned and fulfilled."
}

/**
 * Estimate tokens for cost tracking
 */
function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4) // Rough estimate
}

/**
 * Estimate cost for tracking
 */
function estimateCost(text: string): number {
  const tokens = estimateTokens(text)
  return (tokens / 1000) * 0.03 // Rough estimate for GPT-5
}
