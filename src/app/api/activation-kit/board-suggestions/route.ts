import { generateText } from 'ai'
import { NextRequest, NextResponse } from 'next/server'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { createClient } from '@/lib/supabase/server'
import { LIFE_CATEGORY_KEYS, getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { sanitizeBoardSuggestions, type KitBoardSuggestion } from '@/lib/activation-kit/orchestrator'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import {
  KIT_BOARD_SUGGESTIONS_SYSTEM_PROMPT,
  buildKitBoardSuggestionsPrompt,
} from '@/lib/viva/prompts/activation-kit-prompts'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 60

const norm = (value: unknown) =>
  typeof value === 'string' ? value.replace(/\r\n/g, '\n').trim() : ''

function parseSuggestions(raw: string): KitBoardSuggestion[] {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }
  let parsed: { suggestions?: unknown } = {}
  try {
    parsed = JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return []
    try {
      parsed = JSON.parse(match[0])
    } catch {
      return []
    }
  }
  return sanitizeBoardSuggestions(parsed.suggestions, 12).map((item, index) => ({
    ...item,
    id: item.id || `${item.category}-${index}`,
  }))
}

/**
 * POST /api/activation-kit/board-suggestions
 *
 * Lean VIVA pass: propose specific board scenes from this vision, favoring
 * what changed versus the previous committed version. The member picks which
 * scenes to generate in the kit dialog.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { visionId } = await request.json()
    if (!visionId || typeof visionId !== 'string') {
      return NextResponse.json({ error: 'Missing visionId' }, { status: 400 })
    }

    const { data: vision } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', visionId)
      .single()
    if (!vision || vision.user_id !== user.id) {
      return NextResponse.json({ error: 'Vision not found' }, { status: 404 })
    }

    let previousQuery = supabase
      .from('vision_versions')
      .select('*')
      .eq('is_draft', false)
      .neq('id', visionId)
      .order('created_at', { ascending: false })
      .limit(1)
    previousQuery = vision.household_id
      ? previousQuery.eq('household_id', vision.household_id)
      : previousQuery.eq('user_id', user.id).is('household_id', null)
    const { data: previous } = await previousQuery.maybeSingle()

    const categories = LIFE_CATEGORY_KEYS
      .map((key) => ({
        key,
        label: getVisionCategoryLabel(key as VisionCategoryKey),
        current: norm(vision[key]),
        previous: previous ? norm(previous[key]) : '',
      }))
      .filter((cat) => cat.current.length > 0)

    if (categories.length === 0) {
      return NextResponse.json({ suggestions: [] })
    }

    const balanceCheck = await validateTokenBalance(user.id, 3_000, supabase)
    if (balanceCheck) {
      return NextResponse.json(
        { error: balanceCheck.error, tokensRemaining: balanceCheck.tokensRemaining },
        { status: balanceCheck.status || 402 },
      )
    }

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('vision_refinement')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const result = await generateText({
      model: gateway(`openai/${toolConfig.model_name}`),
      system: KIT_BOARD_SUGGESTIONS_SYSTEM_PROMPT,
      prompt: buildKitBoardSuggestionsPrompt({ categories }),
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
    })

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'vision_generation',
      model_used: result.response?.modelId || toolConfig.model_name,
      tokens_used: result.usage?.totalTokens || 0,
      input_tokens: result.usage?.inputTokens || 0,
      output_tokens: result.usage?.outputTokens || 0,
      actual_cost_cents: 0,
      provider: 'vercel_gateway',
      provider_request_id: gatewayGenerationId(result),
      success: true,
      metadata: { feature: 'activation_kit', step: 'board_suggestions', vision_id: visionId },
    }).catch(() => {})

    return NextResponse.json({ suggestions: parseSuggestions(result.text || '') })
  } catch (error) {
    console.error('[activation-kit] board-suggestions failed:', error)
    return NextResponse.json({ error: 'Failed to load board suggestions' }, { status: 500 })
  }
}
