// /src/lib/services/imageService.ts
// VIVA image generation for vision boards and journal entries

import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { createClient } from '@/lib/supabase/server'

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
  galleryId?: string // ID of saved gallery entry
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

    // Save to gallery (S3 + database)
    let galleryId: string | undefined
    try {
      galleryId = await saveImageToGallery({
        userId,
        imageUrl,
        prompt,
        revisedPrompt,
        size,
        quality,
        style,
        context,
      })
      console.log('✅ Image saved to gallery:', galleryId)
    } catch (error) {
      console.error('⚠️ Failed to save image to gallery:', error)
      // Don't fail the whole operation if gallery save fails
    }

    return {
      success: true,
      imageUrl,
      revisedPrompt,
      tokensUsed: 1, // 1 image = 1 token equivalent
      galleryId,
    }

  } catch (error: any) {
    console.error('❌ DALL-E ERROR:', error)
    
    // Track failed usage
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: 'dall-e-3',
      tokens_used: 0,
      cost_estimate: 0,
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
// GALLERY FUNCTIONS
// ============================================================================

interface SaveImageToGalleryParams {
  userId: string
  imageUrl: string
  prompt: string
  revisedPrompt?: string
  size: string
  quality: string
  style: string
  context: string
}

/**
 * Save generated image to S3 and database gallery
 */
async function saveImageToGallery({
  userId,
  imageUrl,
  prompt,
  revisedPrompt,
  size,
  quality,
  style,
  context,
}: SaveImageToGalleryParams): Promise<string> {
  try {
    // Download the image from provider
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error('Failed to download image from OpenAI')
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageData = new Uint8Array(imageBuffer)
    
    // Generate S3 key
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomId}-generated.png`
    const s3Key = `user-uploads/${userId}/vision-board/generated/${fileName}`
    
    // Upload to S3 using the existing storage service
    const { uploadUserFile } = await import('@/lib/storage/s3-storage-presigned')
    
    const file = new File([imageData], fileName, { type: 'image/png' })
    const uploadResult = await uploadUserFile('visionBoardGenerated', file, userId)
    
    if (!uploadResult.url) {
      throw new Error('Failed to upload image to S3')
    }
    
    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        image_url: uploadResult.url,
        s3_key: s3Key,
        file_name: fileName,
        file_size: imageData.length,
        mime_type: 'image/png',
        prompt,
        revised_prompt: revisedPrompt,
        style_used: style,
        size,
        quality,
        context,
      })
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`Database error: ${error.message}`)
    }
    
    return data.id
    
  } catch (error) {
    console.error('❌ Failed to save image to gallery:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

