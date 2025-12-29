// /src/lib/services/imageService.ts
// VIVA image generation for vision boards and journal entries
// Supports fal.ai (primary) and DALL-E 3 (fallback)

import OpenAI from 'openai'
import { fal } from '@fal-ai/client'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

// ============================================================================
// PROVIDER CONFIGURATION
// ============================================================================

// Image generation provider: 'fal' (recommended) or 'dalle'
const IMAGE_PROVIDER = (process.env.IMAGE_PROVIDER || 'fal') as 'fal' | 'dalle'

// Initialize OpenAI (fallback)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// Note: fal.ai is configured per-request in generateImageWithFal()

// S3 client for server-side uploads
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

// ============================================================================
// IMAGE GENERATION
// ============================================================================

// fal.ai model options
export type FalModel = 'schnell' | 'dev' | 'pro'

// Dimension/aspect ratio options (matches fal.ai supported sizes)
export type ImageDimension = 'square' | 'landscape_4_3' | 'landscape_16_9' | 'portrait_4_3' | 'portrait_16_9'

export interface GenerateImageParams {
  userId: string
  prompt: string
  size?: '1024x1024' | '1792x1024' | '1024x1792' // Legacy, prefer dimension
  dimension?: ImageDimension // New: aspect ratio selection
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  context?: 'vision_board' | 'journal' | 'profile' | 'custom'
  provider?: 'fal' | 'dalle' // Override default provider
  model?: FalModel // fal.ai model selection: schnell (fast), dev (balanced), pro (best)
}

export interface GenerateImageResult {
  success: boolean
  imageUrl?: string
  revisedPrompt?: string
  tokensUsed?: number
  galleryId?: string // ID of saved gallery entry
  error?: string
  provider?: 'fal' | 'dalle' // Which provider was used
}

/**
 * Generate an image using the configured provider (fal.ai or DALL-E 3)
 */
export async function generateImage({
  userId,
  prompt,
  size,
  dimension = 'square',
  quality = 'standard',
  style = 'vivid',
  context = 'custom',
  provider,
  model,
}: GenerateImageParams): Promise<GenerateImageResult> {
  const activeProvider = provider || IMAGE_PROVIDER
  
  // Use fal.ai if configured, otherwise fall back to DALL-E
  if (activeProvider === 'fal' && process.env.FAL_KEY) {
    return generateImageWithFal({ userId, prompt, dimension, quality, style, context, model })
  }
  
  // For DALL-E fallback, convert dimension to size
  const dalleSize = dimensionToDalleSize(dimension)
  return generateImageWithDalle({ userId, prompt, size: size || dalleSize, quality, style, context })
}

/**
 * Edit an existing image using fal.ai nano-banana/edit
 */
export async function editImage({
  userId,
  imageUrl,
  prompt,
  dimension = 'square',
  quality = 'standard',
  style = 'vivid',
  context = 'custom',
}: {
  userId: string
  imageUrl: string
  prompt: string
  dimension?: ImageDimension
  quality?: 'standard' | 'hd'
  style?: 'vivid' | 'natural'
  context?: string
}): Promise<GenerateImageResult> {
  const falModel = 'fal-ai/nano-banana/edit'
  
  // Get cost from ai_model_pricing table
  // Cost is calculated as: price_per_unit (in dollars) * 100 = cents
  // Tokens calculated as: cents * 1000 (user's pricing: 1000 tokens per cent)
  const supabase = await createClient()
  const { data: pricingData } = await supabase
    .from('ai_model_pricing')
    .select('price_per_unit')
    .eq('model_name', falModel)
    .eq('is_active', true)
    .single()
  
  const costInCents = pricingData?.price_per_unit ? pricingData.price_per_unit * 100 : 4.0
  const tokensForImage = Math.round(costInCents * 1000)
  const aspectRatio = dimensionToFalSize(dimension)

  try {
    if (!process.env.FAL_KEY) {
      return {
        success: false,
        error: 'FAL_KEY not configured for image editing',
        provider: 'fal',
      }
    }

    console.log('✏️ fal.ai: Editing image...', {
      userId,
      model: falModel,
      dimension: dimension,
      aspectRatio: aspectRatio,
      costInCents,
      tokensCharged: tokensForImage,
    })

    // Ensure fal is configured with credentials
    fal.config({ credentials: process.env.FAL_KEY })

    const result = await fal.subscribe(falModel, {
      input: {
        prompt,
        image_urls: [imageUrl],
        aspect_ratio: aspectRatio,
        num_images: 1,
      },
      logs: false,
    })

    // Handle response structure
    const responseData = (result as any).data || result
    const editedImageUrl = responseData?.images?.[0]?.url

    if (!editedImageUrl) {
      console.error('❌ fal.ai: No image URL in edit response:', result)
      return {
        success: false,
        error: 'No image URL returned from fal.ai edit',
        provider: 'fal',
      }
    }

    // Track token usage
    // Note: tokens_used = cost_in_cents * 1000 (pricing: 1000 tokens per cent)
    // input_tokens = 1 (1 image unit), not prompt length
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation', // Track as image_generation for consistency
      model_used: falModel,
      tokens_used: tokensForImage,
      input_tokens: 1, // 1 image unit (used by calculate_ai_cost with price_per_unit)
      output_tokens: 0,
      success: true,
      metadata: {
        context: `edit_${context}`,
        prompt: prompt.substring(0, 200),
        aspect_ratio: aspectRatio,
        quality,
        style,
        provider: 'fal',
        cost_cents: costInCents,
      },
    })

    console.log('✅ fal.ai: Image edited successfully', { 
      model: falModel, 
      costInCents,
      tokensCharged: tokensForImage,
    })

    // Save edited image to gallery
    const supabase = await createClient()
    if (supabase) {
      const galleryResult = await saveImageToGallery({
        userId,
        imageUrl: editedImageUrl,
        prompt,
        revisedPrompt: undefined,
        size: aspectRatio,
        quality,
        style,
        context: `edit_${context}`,
        provider: 'fal',
      })

      if (galleryResult.galleryId) {
        console.log('✅ Edited image saved to gallery:', galleryResult.galleryId)
      }

      return {
        success: true,
        imageUrl: editedImageUrl,
        revisedPrompt: undefined,
        tokensUsed: tokensForImage,
        galleryId: galleryResult.galleryId,
        provider: 'fal',
      }
    }

    return {
      success: true,
      imageUrl: editedImageUrl,
      tokensUsed: tokensForImage,
      provider: 'fal',
    }
  } catch (error: any) {
    console.error('❌ fal.ai edit error:', error)

    // Track failed usage (don't charge tokens on failure)
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: falModel,
      tokens_used: 0,
      input_tokens: 0,
      output_tokens: 0,
      success: false,
      error_message: error.message || 'Failed to edit image',
      metadata: {
        context: `edit_${context}`,
        prompt: prompt.substring(0, 200),
        aspect_ratio: aspectRatio,
        quality,
        style,
        provider: 'fal',
      },
    })

    return {
      success: false,
      error: error.message || 'Failed to edit image with fal.ai',
      provider: 'fal',
    }
  }
}

/**
 * Convert dimension to DALL-E size format
 */
function dimensionToDalleSize(dimension: ImageDimension): '1024x1024' | '1792x1024' | '1024x1792' {
  switch (dimension) {
    case 'landscape_4_3':
    case 'landscape_16_9':
      return '1792x1024'
    case 'portrait_4_3':
    case 'portrait_16_9':
      return '1024x1792'
    case 'square':
    default:
      return '1024x1024'
  }
}

// ============================================================================
// FAL.AI PROVIDER
// ============================================================================

/**
 * Generate an image using fal.ai (nano-banana model for hyper-realistic results)
 */
async function generateImageWithFal({
  userId,
  prompt,
  dimension = 'square',
  quality = 'standard',
  style = 'vivid',
  context = 'custom',
  model: modelPreference,
}: Omit<GenerateImageParams, 'provider' | 'size'>): Promise<GenerateImageResult> {
  // Use nano-banana for hyper-realistic image generation
  const falModel = 'fal-ai/nano-banana'
  
  // Get cost from ai_model_pricing table
  // Cost is calculated as: price_per_unit (in dollars) * 100 = cents
  // Tokens calculated as: cents * 1000 (user's pricing: 1000 tokens per cent)
  const supabase = await createClient()
  const { data: pricingData } = await supabase
    .from('ai_model_pricing')
    .select('price_per_unit')
    .eq('model_name', falModel)
    .eq('is_active', true)
    .single()
  
  const costInCents = pricingData?.price_per_unit ? pricingData.price_per_unit * 100 : 4.0
  const tokensForImage = Math.round(costInCents * 1000)
  
  // Map dimension to fal.ai image_size format (before try block for error handling)
  const falImageSize = dimensionToFalSize(dimension)

  try {
    if (!process.env.FAL_KEY) {
      console.warn('⚠️ FAL_KEY not configured, falling back to DALL-E')
      const dalleSize = dimensionToDalleSize(dimension)
      return generateImageWithDalle({ userId, prompt, size: dalleSize, quality, style, context })
    }

    console.log('🎨 fal.ai: Generating image...', {
      userId,
      model: falModel,
      dimension: dimension,
      aspectRatio: falImageSize,
      costInCents,
    })

    // Ensure fal is configured with credentials
    fal.config({ credentials: process.env.FAL_KEY })

    const result = await fal.subscribe(falModel, {
      input: {
        prompt,
        aspect_ratio: falImageSize, // nano-banana uses aspect_ratio, not image_size
        num_images: 1,
      },
      logs: false,
    })

    // Handle response structure: { data: {...}, requestId: "..." }
    const responseData = (result as any).data || result
    const imageUrl = responseData?.images?.[0]?.url

    if (!imageUrl) {
      console.error('❌ fal.ai: No image URL in response:', result)
      return {
        success: false,
        error: 'No image URL returned from fal.ai',
        provider: 'fal',
      }
    }

    // Track token usage
    // Note: tokens_used = cost_in_cents * 1000 (pricing: 1000 tokens per cent)
    // input_tokens = 1 (1 image unit), not prompt length
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: falModel,
      tokens_used: tokensForImage,
      input_tokens: 1, // 1 image unit (used by calculate_ai_cost with price_per_unit)
      output_tokens: 0,
      success: true,
      metadata: {
        context,
        prompt: prompt.substring(0, 200),
        size: falImageSize,
        quality,
        style,
        provider: 'fal',
        cost_cents: costInCents,
      },
    })

    console.log('✅ fal.ai: Image generated successfully', {
      model: falModel,
      costInCents,
      tokensCharged: tokensForImage,
    })

    // Save to gallery (S3 + database)
    let galleryId: string | undefined
    let permanentImageUrl = imageUrl
    try {
      const galleryResult = await saveImageToGallery({
        userId,
        imageUrl,
        prompt,
        revisedPrompt: undefined,
        size: falImageSize,
        quality,
        style,
        context,
        provider: 'fal',
      })
      galleryId = galleryResult.galleryId
      permanentImageUrl = galleryResult.cdnUrl
      console.log('✅ Image saved to gallery:', galleryId)
    } catch (error) {
      console.error('⚠️ Failed to save image to gallery:', error)
    }

    return {
      success: true,
      imageUrl: permanentImageUrl,
      tokensUsed: tokensForImage,
      galleryId,
      provider: 'fal',
    }

  } catch (error: any) {
    console.error('❌ fal.ai ERROR:', error)
    
    // Don't charge tokens on failure
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: falModel,
      tokens_used: 0,
      input_tokens: 0,
      output_tokens: 0,
      success: false,
      error_message: error.message || 'Failed to generate image',
      metadata: {
        context,
        prompt: prompt.substring(0, 200),
        size: falImageSize,
        quality,
        style,
        provider: 'fal',
      },
    })
    
    return {
      success: false,
      error: error.message || 'Failed to generate image with fal.ai',
      provider: 'fal',
    }
  }
}

/**
 * Map DALL-E size format to fal.ai image_size format
 */
/**
 * Convert dimension to fal.ai image_size format
 */
function dimensionToFalSize(dimension: ImageDimension): '1:1' | '4:3' | '16:9' | '3:4' | '9:16' | '21:9' | '2:3' | '3:2' | '4:5' | '5:4' {
  // nano-banana uses aspect_ratio format like "1:1", "4:3", "16:9", etc.
  switch (dimension) {
    case 'square':
      return '1:1'
    case 'landscape_4_3':
      return '4:3'
    case 'landscape_16_9':
      return '16:9'
    case 'portrait_4_3':
      return '3:4'
    case 'portrait_16_9':
      return '9:16'
    default:
      return '1:1'
  }
}

/**
 * Legacy: Map old size format to fal.ai image_size format
 */
function mapSizeToFal(size: string): string {
  switch (size) {
    case '1792x1024':
      return 'landscape_16_9'
    case '1024x1792':
      return 'portrait_16_9'
    case '1024x1024':
    default:
      return 'square_hd'
  }
}

// ============================================================================
// DALL-E PROVIDER (FALLBACK)
// ============================================================================

/**
 * Generate an image using DALL-E 3
 */
async function generateImageWithDalle({
  userId,
  prompt,
  size = '1024x1024',
  quality = 'standard',
  style = 'vivid',
  context = 'custom',
}: Omit<GenerateImageParams, 'provider'>): Promise<GenerateImageResult> {
  try {
    if (!openai) {
      return {
        success: false,
        error: 'OpenAI not configured',
        provider: 'dalle',
      }
    }

    // Calculate cost for DALL-E 3
    // DALL-E 3 pricing: $0.040 per image (standard), $0.080 per image (HD)
    const costInCents = quality === 'hd' ? 8 : 4

    console.log('🎨 DALL-E: Generating image...', {
      userId,
      size,
      quality,
      costInCents,
    })

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
        provider: 'dalle',
      }
    }

    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: 'dall-e-3',
      tokens_used: 1,
      input_tokens: prompt.length,
      output_tokens: 0,
      actual_cost_cents: costInCents,
      success: true,
      metadata: {
        context,
        prompt: prompt.substring(0, 200),
        revised_prompt: revisedPrompt?.substring(0, 200),
        size,
        quality,
        style,
        provider: 'dalle',
      },
    })

    console.log('✅ DALL-E: Image generated successfully', {
      costInCents,
      quality,
    })

    let galleryId: string | undefined
    let permanentImageUrl = imageUrl
    try {
      const galleryResult = await saveImageToGallery({
        userId,
        imageUrl,
        prompt,
        revisedPrompt,
        size,
        quality,
        style,
        context,
        provider: 'dalle',
      })
      galleryId = galleryResult.galleryId
      permanentImageUrl = galleryResult.cdnUrl
      console.log('✅ Image saved to gallery:', galleryId)
    } catch (error) {
      console.error('⚠️ Failed to save image to gallery:', error)
    }

    return {
      success: true,
      imageUrl: permanentImageUrl,
      revisedPrompt,
      tokensUsed: 1,
      galleryId,
      provider: 'dalle',
    }

  } catch (error: any) {
    console.error('❌ DALL-E ERROR:', error)
    
    await trackTokenUsage({
      user_id: userId,
      action_type: 'image_generation',
      model_used: 'dall-e-3',
      tokens_used: 0,
      actual_cost_cents: 0,
      success: false,
      error_message: error.message || 'Failed to generate image',
      metadata: {
        context,
        prompt: prompt.substring(0, 200),
        size,
        quality,
        style,
        provider: 'dalle',
      },
    })
    
    return {
      success: false,
      error: error.message || 'Failed to generate image',
      provider: 'dalle',
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

Style: Modern, aspirational, emotionally uplifting. Use vibrant colors and clear imagery that captures the essence of this vision. The image should feel like a beacon of possibility and achievement.

CRITICAL REQUIREMENTS:
- NO people, faces, or human figures in the image
- NO text, words, or letters in the image
- Focus on objects, places, nature, symbols, and abstract visuals
- Pure visual representation without any textual elements`

  return generateImage({
    userId,
    prompt,
    size: '1792x1024', // Landscape format for vision boards
    quality: 'standard',
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
  provider?: 'fal' | 'dalle'
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
  provider = 'fal',
}: SaveImageToGalleryParams): Promise<{ galleryId: string; cdnUrl: string }> {
  try {
    // Download the image from provider
    const imageResponse = await fetch(imageUrl)
    if (!imageResponse.ok) {
      throw new Error(`Failed to download image from ${provider}`)
    }
    
    const imageBuffer = await imageResponse.arrayBuffer()
    const imageData = new Uint8Array(imageBuffer)
    
    // Generate filename and S3 key based on context
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(2, 8)
    const fileName = `${timestamp}-${randomId}-generated.png`
    
    // Determine S3 path based on context
    let s3Path: string
    switch (context) {
      case 'journal':
        s3Path = `user-uploads/${userId}/journal/generated/${timestamp}-${randomId}-${fileName}`
        break
      case 'vision_board':
        s3Path = `user-uploads/${userId}/vision-board/generated/${timestamp}-${randomId}-${fileName}`
        break
      default:
        s3Path = `user-uploads/${userId}/generated/${timestamp}-${randomId}-${fileName}`
    }
    
    const s3Key = s3Path
    
    // Upload directly to S3 (server-side)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: Buffer.from(imageData),
      ContentType: 'image/png',
      CacheControl: 'max-age=31536000',
    })
    
    await s3Client.send(command)
    console.log(`✅ Image uploaded to S3: ${s3Key}`)
    
    // Generate CDN URL
    const cdnUrl = `https://media.vibrationfit.com/${s3Key}`
    
    // Save to database
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('generated_images')
      .insert({
        user_id: userId,
        image_url: cdnUrl,
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
    
    return {
      galleryId: data.id,
      cdnUrl,
    }
    
  } catch (error) {
    console.error('❌ Failed to save image to gallery:', error)
    throw error
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

