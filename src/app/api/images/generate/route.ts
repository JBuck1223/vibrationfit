// /src/app/api/images/generate/route.ts
// API endpoint for VIVA image generation

import { NextRequest, NextResponse } from 'next/server'

// Image generation (fal/DALL-E) often takes 20-60s; avoid Vercel killing the request
export const maxDuration = 120
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
        const enhancedPrompt = `${prompt}

STYLE DIRECTION:
- Focus entirely on environments, objects, landscapes, architecture, nature, and symbols
- Emphasize rich colors, cinematic lighting, and aspirational atmosphere
- Depict empty scenes — serene spaces, untouched interiors, still-life arrangements, wide vistas
- Keep the composition clean and free of any written text or lettering`
        
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
        const journalPrompt = `${prompt}

STYLE DIRECTION FOR JOURNAL EVIDENCE IMAGE:
- Create one cohesive scene that captures the feeling of the journal moment (symbolic, atmospheric, or photorealistic)
- Focus on environments, people (if relevant), objects, light, and color — not on rendering the journal words themselves
- Do NOT include any written text, words, letters, signs, logos, captions, watermarks, or typography in the image
- Avoid posters, book pages, phone screens, or UI mockups that would require legible text`

        result = await generateImage({
          userId: user.id,
          prompt: journalPrompt,
          quality: quality || 'standard',
          style: style || 'natural',
          context: 'journal',
          model,
          dimension: dimension || 'square',
        })
        break

      case 'album_art':
        if (!prompt) {
          return NextResponse.json(
            { error: 'Missing prompt for album art generation' },
            { status: 400 }
          )
        }
        const albumArtPrompt = `${prompt}

STYLE DIRECTION FOR ALBUM COVER ART:
- Create a striking, professional album cover suitable for music streaming platforms
- Focus on mood, atmosphere, color, and symbolism inspired by the lyrics
- Use bold, evocative imagery — abstract, surreal, photorealistic, or painterly styles are all welcome
- Do NOT include any written text, words, letters, band names, song titles, or typography in the image
- Keep composition clean and visually impactful at both large and thumbnail sizes`

        result = await generateImage({
          userId: user.id,
          prompt: albumArtPrompt,
          quality: quality || 'standard',
          style: style || 'vivid',
          context: 'album_art',
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
          { error: 'Invalid type. Must be: vision_board, journal, album_art, custom, or edit' },
          { status: 400 }
        )
    }

    if (!result.success) {
      const errMsg = result.error || 'Image generation failed'
      if (errMsg === 'Forbidden' || errMsg.includes('fal') || errMsg.includes('credentials')) {
        console.warn('Image generation failed (likely FAL_KEY or fal.ai access):', errMsg)
      }
      return NextResponse.json(
        { error: errMsg },
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

