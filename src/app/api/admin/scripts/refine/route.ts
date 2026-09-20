import { NextResponse } from 'next/server'
import { z } from 'zod'
import { generateText } from 'ai'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { sectionsSchema } from '@/lib/script-studio/schema'
import { SCRIPT_EDITOR_PROMPT } from '@/lib/viva/prompts/script-editor-prompt'

export const maxDuration = 60
const schema = z.object({ sections: sectionsSchema, section_id: z.string().min(1).max(80), instruction: z.string().trim().min(1).max(4000) })
export async function POST(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) return NextResponse.json({ error: auth.error }, { status: auth.status })
  let body: unknown
  try { body = await request.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message }, { status: 400 })
  const selected = parsed.data.sections.find(section => section.id === parsed.data.section_id)
  if (!selected || selected.locked) return NextResponse.json({ error: 'Select an unlocked section to revise' }, { status: 409 })
  try {
    const config = await getAIToolConfig('prompt_suggestions')
    const prompt = JSON.stringify({ script_context: parsed.data.sections, selected_section_id: selected.id, selected_section_title: selected.title, author_request: parsed.data.instruction })
    const maxOutputTokens = Math.min(Math.max(config.max_tokens, 4096), 16000)
    const balance = await validateTokenBalance(auth.user.id, estimateTokensForText(SCRIPT_EDITOR_PROMPT + prompt, config.model_name) + maxOutputTokens, auth.supabase)
    if (balance) return NextResponse.json({ error: balance.error }, { status: balance.status })
    const model = config.model_name.includes('/') ? config.model_name : `${config.model_name.startsWith('gemini') ? 'google' : 'openai'}/${config.model_name}`
    const result = await generateText({ model: gateway(model), system: SCRIPT_EDITOR_PROMPT, prompt, maxOutputTokens })
    await trackTokenUsage({
      user_id: auth.user.id, action_type: 'prompt_suggestions', model_used: config.model_name,
      tokens_used: result.usage.totalTokens || 0, input_tokens: result.usage.inputTokens || 0,
      output_tokens: result.usage.outputTokens || 0, provider: 'vercel_gateway',
      provider_request_id: gatewayGenerationId(result), success: result.finishReason !== 'length',
      metadata: { helper: 'script_studio', section_id: selected.id },
    }, auth.supabase)
    if (result.finishReason === 'length') return NextResponse.json({ error: 'The revision exceeded the response limit. Try editing a shorter script.' }, { status: 422 })
    if (!result.text.trim()) return NextResponse.json({ error: 'VIVA returned an empty revision. Try again.' }, { status: 502 })
    return NextResponse.json({ content: result.text })
  } catch (error) {
    console.error('[Script Studio] VIVA refinement failed', error)
    return NextResponse.json({ error: 'Unable to revise the script. Please try again.' }, { status: 500 })
  }
}
