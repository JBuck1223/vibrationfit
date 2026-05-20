/**
 * Incantation Generation API
 *
 * Generates THREE incantation variants in a single call (non-streaming) from
 * the user's own source material (Life Vision, journal entry, vision board
 * item, or custom). Returns structured JSON so the UI can let the user pick.
 *
 * Incantations are short (30-100 words), rhythmic, repeatable declarations
 * designed for vocal practice — NOT day-in-the-life stories.
 *
 * POST /api/stories/incantation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getAIToolConfig } from '@/lib/ai/database-config'
import {
  trackTokenUsage,
  validateTokenBalance,
  estimateTokensForText,
} from '@/lib/tokens/tracking'
import {
  INCANTATION_SYSTEM_PROMPT,
  buildIncantationPrompt,
  type IncantationFramework,
} from '@/lib/viva/prompts/incantation-prompt'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface RequestBody {
  sourceContent: string
  sourceLabel?: string
  framework: IncantationFramework
  divineName?: string
  intent?: string
}

const VALID_FRAMEWORKS: IncantationFramework[] = ['self', 'spiritual', 'custom']

function countWords(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length
}

function safeParseResult(raw: string): { text: string; mode: string; force: string; title: string } | null {
  let jsonText = raw.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }

  function tryParse(str: string) {
    try {
      const parsed = JSON.parse(str)
      if (parsed && typeof parsed.text === 'string' && parsed.text.trim()) {
        return {
          text: parsed.text.trim(),
          mode: typeof parsed.mode === 'string' ? parsed.mode : 'Cascade',
          force: typeof parsed.force === 'string' ? parsed.force : '',
          title: typeof parsed.title === 'string' ? parsed.title : '',
        }
      }
      if (parsed && Array.isArray(parsed.variants) && parsed.variants[0]?.text) {
        const v = parsed.variants[0]
        return {
          text: v.text.trim(),
          mode: v.label || 'Cascade',
          force: '',
          title: '',
        }
      }
    } catch {
      return null
    }
    return null
  }

  const direct = tryParse(jsonText)
  if (direct) return direct

  const match = jsonText.match(/\{[\s\S]*\}/)
  if (match) {
    const fromMatch = tryParse(match[0])
    if (fromMatch) return fromMatch
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body: RequestBody = await req.json()
    const { sourceContent, sourceLabel, framework, divineName, intent } = body

    if (!sourceContent || !sourceContent.trim()) {
      return NextResponse.json({ error: 'Source content is required' }, { status: 400 })
    }
    if (!framework || !VALID_FRAMEWORKS.includes(framework)) {
      return NextResponse.json({ error: 'Invalid or missing framework' }, { status: 400 })
    }
    if (framework === 'spiritual' && !divineName?.trim()) {
      return NextResponse.json({ error: 'Spiritual framework requires a divine name' }, { status: 400 })
    }
    if (framework === 'custom' && !divineName?.trim()) {
      return NextResponse.json({ error: 'Custom framework requires custom closing phrasing' }, { status: 400 })
    }

    const userPrompt = buildIncantationPrompt({
      sourceContent: sourceContent.trim(),
      sourceLabel: sourceLabel?.trim(),
      framework,
      divineName: divineName?.trim(),
      intent: intent?.trim(),
    })

    // Token validation
    const promptForEstimate = `${INCANTATION_SYSTEM_PROMPT}\n\n${userPrompt}`
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('vision_refinement')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const tokenEstimate = estimateTokensForText(promptForEstimate, toolConfig.model_name)
    const balanceCheck = await validateTokenBalance(user.id, tokenEstimate, supabase)
    if (balanceCheck) {
      return NextResponse.json({
        error: balanceCheck.error,
        tokensRemaining: balanceCheck.tokensRemaining,
        insufficientTokens: true,
      }, { status: balanceCheck.status })
    }

    console.log(`[Incantation API] Using model ${toolConfig.model_name}`)

    const result = await generateText({
      model: openai(toolConfig.model_name),
      system: INCANTATION_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
    })

    const rawText = result.text || ''
    const incantation = safeParseResult(rawText)

    if (!incantation) {
      console.error('[Incantation API] Failed to parse result. Raw output:', rawText)
      return NextResponse.json({
        error: 'VIVA returned an unexpected format. Please try again.',
        rawResponse: rawText,
      }, { status: 500 })
    }

    // Token tracking
    const inputTokens = result.usage?.inputTokens || 0
    const outputTokens = result.usage?.outputTokens || 0
    const totalTokens = result.usage?.totalTokens || (inputTokens + outputTokens)

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'incantation_generation',
      model_used: result.response?.modelId || toolConfig.model_name,
      tokens_used: totalTokens,
      actual_cost_cents: 0,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      success: true,
      metadata: {
        source_label: sourceLabel || null,
        framework,
        divine_name: divineName || null,
        mode: incantation.mode,
        force: incantation.force,
      },
    })

    return NextResponse.json({
      text: incantation.text,
      mode: incantation.mode,
      force: incantation.force,
      title: incantation.title,
      wordCount: countWords(incantation.text),
      usage: { inputTokens, outputTokens, totalTokens },
    })
  } catch (err) {
    console.error('[Incantation API] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate incantation',
    }, { status: 500 })
  }
}
