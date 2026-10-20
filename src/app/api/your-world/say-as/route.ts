/**
 * POST { names: string[] } -> { suggestions: Record<name, say_as> }
 * VIVA's first guess at how each name is said. The member edits or keeps it.
 */

import { NextResponse } from 'next/server'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { normalizeSayAs } from '@/lib/your-world/say-as'
import { SAY_AS_SYSTEM_PROMPT, buildSayAsPrompt } from '@/lib/viva/prompts/say-as-prompt'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

function toGatewayModel(name: string) {
  if (name.includes('/')) return name
  if (name.toLowerCase().includes('gemini')) return `google/${name}`
  return `openai/${name}`
}

export async function POST(req: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const names: string[] = Array.isArray(body?.names)
    ? [...new Set<string>(body.names.map((n: unknown) => String(n || '').trim()).filter(Boolean))].slice(0, 12)
    : []
  if (names.length === 0) return NextResponse.json({ suggestions: {} })

  try {
    const toolConfig = await getAIToolConfig('prompt_suggestions')
    const result = await generateText({
      model: gateway(toGatewayModel(toolConfig.model_name)),
      system: SAY_AS_SYSTEM_PROMPT,
      prompt: buildSayAsPrompt(names),
      temperature: toolConfig.supports_temperature ? 0.2 : undefined,
    })

    const raw = (result.text || '').replace(/^```[a-z]*\n?/i, '').replace(/```$/g, '').trim()
    const parsed = JSON.parse(raw) as { suggestions?: Record<string, string> }
    const suggestions: Record<string, string> = {}
    for (const name of names) {
      const value = normalizeSayAs(parsed.suggestions?.[name])
      if (value) suggestions[name] = value
    }

    if (result.usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'prompt_suggestions',
        model_used: toolConfig.model_name,
        tokens_used: result.usage.totalTokens || 0,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        success: true,
        metadata: { helper: 'say_as_suggest', count: names.length },
      }, supabase).catch((err) => console.error('[SayAs] Token tracking error:', err))
    }

    return NextResponse.json({ suggestions })
  } catch (error) {
    console.error('[SayAs] suggest error:', error)
    return NextResponse.json({ suggestions: {} })
  }
}
