/**
 * Activation category inference.
 *
 * POST /api/activation/[id]/category  { dreamResponse }
 * Saves the Dream Layer answers, infers the primary life category, and
 * records dream_layer_completed. The user confirms (or corrects) the category
 * on the next screen via PATCH /api/activation/[id].
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import {
  ACTIVATION_CATEGORY_SYSTEM_PROMPT,
  buildActivationCategoryPrompt,
} from '@/lib/viva/prompts/activation-experience-prompts'
import { recordActivationEvent } from '@/lib/activation/events'
import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

function parseJson<T>(raw: string): T | null {
  let text = raw.trim()
  if (text.startsWith('```')) text = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  try { return JSON.parse(text) as T } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) { try { return JSON.parse(match[0]) as T } catch { return null } }
    return null
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

    const { data: activation } = await supabase
      .from('activations')
      .select('id, user_id, current_state')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!activation) return NextResponse.json({ error: 'Activation not found' }, { status: 404 })
    if (!activation.current_state?.trim()) {
      return NextResponse.json({ error: 'Complete the current state step first' }, { status: 400 })
    }

    const body = await request.json()
    const dreamResponse = body.dreamResponse && typeof body.dreamResponse === 'object'
      ? body.dreamResponse as Record<string, string>
      : null
    if (!dreamResponse || !Object.values(dreamResponse).some((v) => v?.trim())) {
      return NextResponse.json({ error: 'Share what you would love to be true first' }, { status: 400 })
    }

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('vision_refinement')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const userPrompt = buildActivationCategoryPrompt({
      currentState: activation.current_state,
      dreamResponse,
    })
    const estimate = estimateTokensForText(`${ACTIVATION_CATEGORY_SYSTEM_PROMPT}\n\n${userPrompt}`, toolConfig.model_name)
    const balanceCheck = await validateTokenBalance(user.id, estimate, supabase)
    if (balanceCheck) {
      return NextResponse.json({
        error: balanceCheck.error,
        tokensRemaining: balanceCheck.tokensRemaining,
        insufficientTokens: true,
      }, { status: balanceCheck.status })
    }

    const result = await generateText({
      model: gateway(`openai/${toolConfig.model_name}`),
      system: ACTIVATION_CATEGORY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: toolConfig.supports_temperature ? 0.4 : undefined,
    })

    const parsed = parseJson<{ category?: string; confirmation_line?: string; runner_up?: string | null }>(result.text || '')
    const category = parsed?.category && (LIFE_CATEGORY_KEYS as readonly string[]).includes(parsed.category)
      ? parsed.category
      : null
    if (!category) {
      console.error('[activation/category] unexpected format:', result.text)
      return NextResponse.json({ error: 'VIVA returned an unexpected format. Please try again.' }, { status: 500 })
    }

    await supabase
      .from('activations')
      .update({ dream_response: dreamResponse, category, status: 'dream' })
      .eq('id', activation.id)

    const inputTokens = result.usage?.inputTokens || 0
    const outputTokens = result.usage?.outputTokens || 0
    await trackTokenUsage({
      user_id: user.id,
      action_type: 'chat_conversation',
      model_used: result.response?.modelId || toolConfig.model_name,
      tokens_used: result.usage?.totalTokens || (inputTokens + outputTokens),
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      actual_cost_cents: 0,
      provider: 'vercel_gateway',
      provider_request_id: gatewayGenerationId(result),
      success: true,
      metadata: { feature: 'activation', activation_id: activation.id, step: 'category', category },
    }).catch((err) => console.error('[activation/category] token tracking failed:', err))

    await recordActivationEvent(createAdminClient(), {
      eventType: 'dream_layer_completed',
      activationId: activation.id,
      userId: user.id,
      eventData: { inferred_category: category },
    })

    return NextResponse.json({
      category,
      confirmationLine: parsed?.confirmation_line || null,
      runnerUp: parsed?.runner_up && (LIFE_CATEGORY_KEYS as readonly string[]).includes(parsed.runner_up)
        ? parsed.runner_up
        : null,
    })
  } catch (error) {
    console.error('[activation/category] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
