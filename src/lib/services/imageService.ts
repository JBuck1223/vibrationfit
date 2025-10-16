// /src/lib/services/imageService.ts
// DALL-E image generation for vision boards and journal entries

import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

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

    // Calculate cost for DALL-E 3
    // DALL-E 3 pricing: $0.040 per image (standard), $0.080 per image (HD)
    const costInCents = quality === 'hd' ? 8 : 4 // $0.08 or $0.04 in cents

    console.log('🎨 DALL-E: Generating image...', {
      userId,
      size,
      quality,
      costInCents,
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

    // Track token usage
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: 'dall-e-3',
      tokens_used: 1, // 1 image = 1 token equivalent
      input_tokens: prompt.length, // Character count as input tokens
      output_tokens: 0, // Images don't have output tokens
      cost_estimate: costInCents,
      success: true,
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
      costInCents,
      quality,
    })

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      tokensUsed: 1, // 1 image = 1 token equivalent
    }

  } catch (error: any) {
    console.error('❌ DALL-E ERROR:', error)
    
    // Track failed usage
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: 'dall-e-3',
      tokens_used: 0,
      success: false,
      error_message: error.message || 'Failed to generate image',
      metadata: {
        context,
        prompt: prompt.substring(0, 200),
        size,
        quality,
        style,
      },
    })
    
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

