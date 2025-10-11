// /src/app/api/images/generate/route.ts
// API endpoint for DALL-E image generation

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateImage, generateVisionBoardImage, generateJournalImage } from '@/lib/services/imageService'

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
    const { type, prompt, visionText, category, journalText, mood, size, quality, style } = body

    console.log('🎨 IMAGE GENERATION REQUEST:', {
      userId: user.id,
      type,
      category,
    })

    let result

    // Route to appropriate generation function
    switch (type) {
      case 'vision_board':
        if (!visionText || !category) {
          return NextResponse.json(
            { error: 'Missing visionText or category' },
            { status: 400 }
          )
        }
        result = await generateVisionBoardImage({
          userId: user.id,
          visionText,
          category,
          style,
        })
        break

      case 'journal':
        if (!journalText) {
          return NextResponse.json(
            { error: 'Missing journalText' },
            { status: 400 }
          )
        }
        result = await generateJournalImage({
          userId: user.id,
          journalText,
          mood,
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
          size,
          quality,
          style,
          context: 'custom',
        })
        break

      default:
        return NextResponse.json(
          { error: 'Invalid type. Must be: vision_board, journal, or custom' },
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

