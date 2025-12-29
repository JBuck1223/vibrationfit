// /src/app/api/images/generate/route.ts
// API endpoint for VIVA image generation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage, generateVisionBoardImage, generateJournalImage, editImage } from '@/lib/services/imageService'
import { validateTokenBalance, getDefaultTokenEstimate } from '@/lib/tokens/tracking'

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { type, prompt, visionText, category, journalText, mood, size, quality, style, model, dimension, imageUrl, imageDataUri } = body

    console.log('🎨 IMAGE GENERATION REQUEST:', {
      userId: user.id,
      type,
      dimension,
      model,
      quality,
      style,
      prompt: prompt ? prompt.substring(0, 100) + '...' : 'No prompt',
    })

    // Validate token balance (image generation uses override token value)
    const estimatedTokens = await getDefaultTokenEstimate('image_generation', supabase)
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

    let result

    // Route to appropriate generation function
    switch (type) {
      case 'vision_board':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Missing prompt for vision board generation' },
            { status: 400 }
          )
        }
        // Enhance prompt to explicitly exclude people and text
        const enhancedPrompt = `${prompt}

CRITICAL REQUIREMENTS:
- NO people, faces, or human figures in the image
- NO text, words, or letters in the image
- Focus on objects, places, nature, symbols, and abstract visuals
- Pure visual representation without any textual elements`
        
        result = await generateImage({
          userId: user.id,
          prompt: enhancedPrompt,
          quality: quality || 'standard',
          style: style || 'vivid',
          context: 'vision_board',
          model,
          dimension: dimension || 'landscape_16_9',
        })
        break

      case 'journal':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Missing prompt for journal generation' },
            { status: 400 }
          )
        }
        result = await generateImage({
          userId: user.id,
          prompt,
          quality: quality || 'standard',
          style: style || 'vivid',
          context: 'journal',
          model,
          dimension: dimension || 'square',
        })
        break

      case 'custom':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Missing prompt' },
            { status: 400 }
          )
        }
        result = await generateImage({
          userId: user.id,
          prompt,
          quality,
          style,
          context: 'custom',
          model,
          dimension,
        })
        break

      case 'edit':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Missing edit prompt' },
            { status: 400 }
          )
        }
        
        // Use imageDataUri (base64) or imageUrl - fal.ai accepts both
        const finalImageUrl = imageDataUri || imageUrl
        
        if (!finalImageUrl) {
          return NextResponse.json(
            { error: 'Missing image for editing' },
            { status: 400 }
          )
        }
        
        result = await editImage({
          userId: user.id,
          imageUrl: finalImageUrl,
          prompt,
          quality: quality || 'standard',
          style: style || 'vivid',
          context: 'edit',
          dimension: dimension || 'square',
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: vision_board, journal, custom, or edit' },
          { status: 400 }
        )
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Image generation failed' },
        { status: result.error === 'Insufficient tokens' ? 402 : 500 }
      )
    }

    return NextResponse.json({
      success: true,
      imageUrl: result.imageUrl,
      revisedPrompt: result.revisedPrompt,
      tokensUsed: result.tokensUsed,
    })

  } catch (error: any) {
    console.error('❌ IMAGE GENERATION API ERROR:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate image' },
      { status: 500 }
    )
  }
}

