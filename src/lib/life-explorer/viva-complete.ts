/**
 * Shared VIVA compose call for Life Explorer JSON (map, arc, week) and
 * plain-text diction. Prompts live in src/lib/viva/prompts/.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { gatewayClient, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'

export function parseJsonObject<T>(text: string): T {
  const cleaned = text.replace(/^```json\s*/i, '').replace(/```$/i, '').trim()
  try {
    return JSON.parse(cleaned) as T
  } catch {
    const match = cleaned.match(/\{[\s\S]*\}/)
    if (!match) throw new Error('VIVA response contained no JSON')
    return JSON.parse(match[0]) as T
  }
}

export async function vivaComplete(input: {
  supabase: SupabaseClient
  userId: string
  system: string
  user: string
  actionType: 'life_explorer_compose' | 'life_explorer_sidekick'
  maxTokens?: number
  temperature?: number
  metadata?: Record<string, unknown>
}): Promise<{ text: string; tokens: number }> {
  const model = 'openai/gpt-4o-mini'
  const estimated = estimateTokensForText(input.user, model)
  const tokenValidation = await validateTokenBalance(input.userId, estimated, input.supabase)
  if (tokenValidation) {
    throw new Error(tokenValidation.error)
  }

  const completion = await gatewayClient.chat.completions.create({
    model,
    temperature: input.temperature ?? 0.6,
    max_tokens: input.maxTokens ?? 3500,
    messages: [
      { role: 'system', content: input.system },
      { role: 'user', content: input.user },
    ],
  })

  const text = completion.choices[0]?.message?.content
  if (!text) throw new Error('VIVA returned an empty response')

  const tokens =
    (completion.usage?.prompt_tokens || 0) + (completion.usage?.completion_tokens || 0)

  await trackTokenUsage(
    {
      user_id: input.userId,
      action_type: input.actionType,
      model_used: model.replace(/^openai\//, '') || VISION_MODEL,
      tokens_used: tokens,
      input_tokens: completion.usage?.prompt_tokens || 0,
      output_tokens: completion.usage?.completion_tokens || 0,
      openai_request_id: completion.id,
      success: true,
      metadata: input.metadata || {},
    },
    input.supabase
  )

  return { text, tokens }
}
