// /src/lib/services/imageService.ts
// DALL-E image generation for vision boards and journal entries

import OpenAI from 'openai'
import { deductTokens, TOKEN_EQUIVALENTS } from '@/lib/tokens/token-tracker'

const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ============================================================================
// IMAGE GENERATION
// ============================================================================

export interface GenerateImageParams {
  userId: string
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792'
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  context?: 'vision_board' | 'journal' | 'profile' | 'custom'
}

export interface GenerateImageResult {
  success: boolean
  imageUrl?: string
  revisedPrompt?: string
  tokensUsed?: number
  error?: string
}

/**
 * Generate an image using DALL-E 3
 */
export async function generateImage({
  userId,
  prompt,
  size = '1024x1024',
  quality = 'standard',
  style = 'vivid',
  context = 'custom',
}: GenerateImageParams): Promise<GenerateImageResult> {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI not configured',
      }
    }

    // Calculate token cost equivalent
    const tokenCost = quality === 'hd' 
      ? TOKEN_EQUIVALENTS.DALLE3_HD 
      : TOKEN_EQUIVALENTS.DALLE3_STANDARD

    // Check if user has enough tokens
    const { hasEnough, balance } = await checkBalance(userId, tokenCost)
    
    if (!hasEnough) {
      return {
        success: false,
        error: `Insufficient tokens. Need ${tokenCost}, have ${balance}`,
      }
    }

    console.log('🎨 DALL-E: Generating image...', {
      userId,
      size,
      quality,
      tokenCost,
    })

    // Generate image with DALL-E 3
    const response = await openai.images.generate({
      model: 'dall-e-3',
      prompt,
      n: 1,
      size,
      quality,
      style,
    })

    const imageUrl = response.data?.[0]?.url
    const revisedPrompt = response.data?.[0]?.revised_prompt

    if (!imageUrl) {
      return {
        success: false,
        error: 'No image URL returned',
      }
    }

    // Deduct tokens
    await deductTokens({
      userId,
      actionType: 'image_generation',
      tokensUsed: tokenCost,
      model: 'dall-e-3',
      metadata: {
        context,
        prompt: prompt.substring(0, 200), // First 200 chars
        revised_prompt: revisedPrompt?.substring(0, 200),
        size,
        quality,
        style,
      },
    })

    console.log('✅ DALL-E: Image generated successfully', {
      tokensUsed: tokenCost,
      quality,
    })

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      tokensUsed: tokenCost,
    }

  } catch (error: any) {
    console.error('❌ DALL-E ERROR:', error)
    
    return {
      success: false,
      error: error.message || 'Failed to generate image',
    }
  }
}

/**
 * Generate vision board image from life vision data
 */
export async function generateVisionBoardImage({
  userId,
  visionText,
  category,
  style = 'vivid',
}: {
  userId: string
  visionText: string
  category: string
  style?: 'vivid' | 'natural'
}): Promise<GenerateImageResult> {
  // Create optimized prompt for vision board
  const prompt = `Create an inspiring, photorealistic vision board image representing this life vision:

Category: ${category}
Vision: ${visionText.substring(0, 500)}

Style: Modern, aspirational, emotionally uplifting. Use vibrant colors and clear imagery that captures the essence of this vision. The image should feel like a beacon of possibility and achievement.`

  return generateImage({
    userId,
    prompt,
    size: '1024x1024',
    quality: 'standard', // HD for vision boards
    style,
    context: 'vision_board',
  })
}

/**
 * Generate journal entry illustration
 */
export async function generateJournalImage({
  userId,
  journalText,
  mood,
}: {
  userId: string
  journalText: string
  mood?: string
}): Promise<GenerateImageResult> {
  // Create prompt for journal illustration
  const moodContext = mood ? `Mood: ${mood}. ` : ''
  const prompt = `Create a thoughtful, artistic illustration for this journal entry:

${moodContext}Entry: ${journalText.substring(0, 400)}

Style: Contemplative, artistic, emotionally resonant. Abstract or symbolic imagery that captures the feeling and essence of this moment. Warm, inviting colors.`

  return generateImage({
    userId,
    prompt,
    size: '1024x1024',
    quality: 'standard',
    style: 'natural',
    context: 'journal',
  })
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

async function checkBalance(userId: string, tokensNeeded: number) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    
    const { data } = await supabase
      .from('user_profiles')
      .select('vibe_assistant_tokens_remaining')
      .eq('user_id', userId)
      .single()
    
    const balance = data?.vibe_assistant_tokens_remaining || 0
    
    return {
      hasEnough: balance >= tokensNeeded,
      balance,
    }
  } catch (error) {
    return { hasEnough: false, balance: 0 }
  }
}

