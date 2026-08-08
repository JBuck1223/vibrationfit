import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { parseTravelText } from '@/lib/travel/parse-trip'

export const dynamic = 'force-dynamic'

// POST /api/travel/parse - VIVA reads pasted travel text and returns a structured trip
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { text } = await request.json()
    if (!text?.trim()) {
      return NextResponse.json({ error: 'Paste your travel email or itinerary text' }, { status: 400 })
    }

    // Tool config is DB-driven; fall back to parser defaults if missing.
    let toolConfig: { model_name: string; temperature: number; max_tokens: number } | null = null
    try {
      toolConfig = await getAIToolConfig('travel_parse')
    } catch {
      toolConfig = null
    }

    const estimatedTokens = estimateTokensForText(text, toolConfig?.model_name || 'gpt-4o')
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenValidation) {
      return NextResponse.json(
        { error: tokenValidation.error, tokensRemaining: tokenValidation.tokensRemaining },
        { status: tokenValidation.status }
      )
    }

    const { parsed, usage } = await parseTravelText(text, {
      modelName: toolConfig?.model_name,
      temperature: toolConfig?.temperature,
      maxTokens: toolConfig?.max_tokens,
    })

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'travel_parse',
      model_used: usage.model,
      tokens_used: usage.totalTokens,
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
      provider: 'vercel_gateway',
      provider_request_id: usage.requestId,
      success: true,
      metadata: { text_length: text.length, found_trip: !!parsed },
    }, supabase)

    if (!parsed) {
      return NextResponse.json(
        { error: 'VIVA could not find travel details in that text. Try pasting the full confirmation email.' },
        { status: 422 }
      )
    }

    return NextResponse.json({ parsed })
  } catch (error) {
    console.error('Error in travel parse:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
