/**
 * SparkQuery™ Generation API
 *
 * Generates exactly 3 SPARK-validated empowering questions (non-streaming) from
 * the user's own source material (Life Vision, journal entry, vision board
 * item, or custom). Returns structured JSON so the UI can let the user edit.
 *
 * SparkQueries are short presuppositional questions designed to engage the
 * brain's search function — NOT affirmations, stories, or incantations.
 *
 * POST /api/stories/spark-query
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import {
  trackTokenUsage,
  validateTokenBalance,
  estimateTokensForText,
} from '@/lib/tokens/tracking'
import {
  SPARK_QUERY_SYSTEM_PROMPT,
  buildSparkQueryPrompt,
} from '@/lib/viva/prompts/spark-query-prompt'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

interface RequestBody {
  sourceContent: string
  sourceLabel?: string
  intent?: string
}

function normalizeQuestions(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null
  const questions = raw
    .filter((q): q is string => typeof q === 'string')
    .map(q => q.trim())
    .filter(Boolean)
    .map(q => (q.endsWith('?') ? q : `${q}?`))

  if (questions.length !== 3) return null
  return questions
}

function safeParseResult(raw: string): { title: string; questions: string[] } | null {
  let jsonText = raw.trim()
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }

  function tryParse(str: string) {
    try {
      const parsed = JSON.parse(str)
      const questions = normalizeQuestions(parsed?.questions)
      if (!questions) return null
      return {
        title: typeof parsed.title === 'string' ? parsed.title.trim() : '',
        questions,
      }
    } catch {
      return null
    }
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
    const { sourceContent, sourceLabel, intent } = body

    if (!sourceContent || !sourceContent.trim()) {
      return NextResponse.json({ error: 'Source content is required' }, { status: 400 })
    }

    const userPrompt = buildSparkQueryPrompt({
      sourceContent: sourceContent.trim(),
      sourceLabel: sourceLabel?.trim(),
      intent: intent?.trim(),
    })

    const promptForEstimate = `${SPARK_QUERY_SYSTEM_PROMPT}\n\n${userPrompt}`
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('spark_query_generation')
    } catch {
      console.log('[SparkQuery API] Tool not configured, falling back to vision_refinement')
      try {
        toolConfig = await getAIToolConfig('vision_refinement')
      } catch {
        toolConfig = await getAIToolConfig('master_vision_assembly')
      }
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

    console.log(`[SparkQuery API] Using model ${toolConfig.model_name}`)

    const result = await generateText({
      model: gateway(`openai/${toolConfig.model_name}`),
      system: SPARK_QUERY_SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
    })

    const rawText = result.text || ''
    const sparkQuery = safeParseResult(rawText)

    if (!sparkQuery) {
      console.error('[SparkQuery API] Failed to parse result. Raw output:', rawText)
      return NextResponse.json({
        error: 'VIVA returned an unexpected format. Please try again.',
        rawResponse: rawText,
      }, { status: 500 })
    }

    const inputTokens = result.usage?.inputTokens || 0
    const outputTokens = result.usage?.outputTokens || 0
    const totalTokens = result.usage?.totalTokens || (inputTokens + outputTokens)

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'spark_query_generation',
      model_used: result.response?.modelId || toolConfig.model_name,
      tokens_used: totalTokens,
      actual_cost_cents: 0,
      input_tokens: inputTokens,
      output_tokens: outputTokens,
      provider: 'vercel_gateway',
      provider_request_id: gatewayGenerationId(result),
      success: true,
      metadata: {
        source_label: sourceLabel || null,
        question_count: sparkQuery.questions.length,
        title: sparkQuery.title || null,
      },
    })

    return NextResponse.json({
      title: sparkQuery.title,
      questions: sparkQuery.questions,
      usage: { inputTokens, outputTokens, totalTokens },
    })
  } catch (err) {
    console.error('[SparkQuery API] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate SparkQuery™',
    }, { status: 500 })
  }
}
