import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway, VISION_MODEL } from '@/lib/ai/gateway'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { getAIToolConfig } from '@/lib/ai/database-config'
import {
  VIBRATIONAL_GRAMMAR_RULES,
  GOLDEN_RULES,
  FORBIDDEN_PATTERNS,
  STYLE_GUARDRAILS,
} from '@/lib/viva/prompts/shared/vibrational-grammar'

export const maxDuration = 60
export const dynamic = 'force-dynamic'

const SYSTEM_PROMPT = `You are a vibrational grammar proofreader. Your ONLY job is to identify violations of vibrational grammar rules in the user's life vision text and suggest specific fixes.

${VIBRATIONAL_GRAMMAR_RULES}

${GOLDEN_RULES}

${FORBIDDEN_PATTERNS}

${STYLE_GUARDRAILS}

IMPORTANT CONSTRAINTS:
- Only flag vibrational grammar violations (tense, framing, forbidden patterns, negative constructions).
- Do NOT rewrite for style, tone, creativity, or content. Preserve the user's voice exactly.
- Each edit should be the smallest change needed to fix the violation.
- If the text already follows vibrational grammar perfectly, return an empty edits array.
- The "original" field must be an EXACT substring of the input text (copy-paste precision).

Respond with ONLY a JSON object in this exact format (no markdown, no code fences):
{
  "edits": [
    {
      "original": "exact text span from the input that violates the rules",
      "suggested": "corrected version following vibrational grammar",
      "reason": "Brief explanation, e.g. Future tense -> present tense"
    }
  ]
}`

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { text, category } = body

    if (!text?.trim()) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 })
    }

    console.log(`[Proofread] Starting vibrational grammar check for category: ${category || 'unknown'}`)

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('vibrational_proofread')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const userPrompt = `Proofread the following life vision text for vibrational grammar violations:\n\n${text}`
    const estimatedTokens = estimateTokensForText(SYSTEM_PROMPT + userPrompt, VISION_MODEL)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining,
      }, { status: tokenValidation.status })
    }

    const result = await generateText({
      model: gateway(VISION_MODEL),
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      temperature: 0.3,
    })

    console.log(`[Proofread] Generation complete`)

    // Track token usage
    if (result.usage) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'vibrational_analysis',
        model_used: VISION_MODEL,
        tokens_used: result.usage.totalTokens || 0,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        success: true,
      }).catch(err => console.error('[Proofread] Token tracking error:', err))
    }

    let parsed: { edits: Array<{ original: string; suggested: string; reason: string }> }
    try {
      let jsonText = result.text.trim()
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
      }
      parsed = JSON.parse(jsonText)

      if (!parsed.edits || !Array.isArray(parsed.edits)) {
        parsed = { edits: [] }
      }

      // Validate each edit has the required fields and original is in the source text
      parsed.edits = parsed.edits.filter(edit =>
        edit.original && edit.suggested && edit.reason &&
        typeof edit.original === 'string' &&
        typeof edit.suggested === 'string' &&
        text.includes(edit.original)
      )
    } catch (parseError) {
      console.error('[Proofread] Failed to parse response:', parseError)
      console.error('[Proofread] Raw response:', result.text)
      return NextResponse.json({ edits: [] })
    }

    console.log(`[Proofread] Found ${parsed.edits.length} vibrational grammar suggestions`)

    return NextResponse.json(parsed)
  } catch (error: any) {
    console.error('[Proofread] Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
