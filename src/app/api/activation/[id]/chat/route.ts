/**
 * Bounded Activation intake chat.
 *
 * Same Conversational Intelligence brain as /viva, no member history.
 * Hidden field markers are parsed on the server and stripped from the stream.
 */

import { streamText, type ModelMessage } from 'ai'
import { NextRequest } from 'next/server'
import { gateway } from '@/lib/ai/gateway'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { COACH_STREAM_META_MARKER, COACH_STREAM_PADDING } from '@/lib/viva/coach-stream'
import {
  ACTIVATION_CHAT_PROMPT_VERSION,
  buildActivationChatSystemPrompt,
} from '@/lib/viva/prompts/activation-chat-prompts'
import {
  isIntakeReady,
  mergeDream,
  parseIntakeMarkers,
  stripIntakeMarkers,
  stripIntakeMarkersLive,
} from '@/lib/activation/intake-markers'
import { recordActivationEvent } from '@/lib/activation/events'
import type { ActivationChatMessage, ActivationRow } from '@/lib/activation/orchestrator'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 120

const MAX_TURNS = 8
const HARD_STOP_TURNS = 10
const FALLBACK_MODEL = 'openai/gpt-5.6-terra'

function asMessages(value: unknown): ActivationChatMessage[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((m): m is ActivationChatMessage =>
      !!m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string',
    )
    .map((m) => ({ role: m.role, content: m.content }))
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401 })

    const { data: activation } = await supabase
      .from('activations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!activation) return new Response(JSON.stringify({ error: 'Activation not found' }), { status: 404 })

    const row = activation as ActivationRow
    if (['ready', 'opened', 'entered', 'generating'].includes(row.status)) {
      return new Response(JSON.stringify({ error: 'This Activation is already past intake' }), { status: 409 })
    }
    if (!row.category) {
      return new Response(JSON.stringify({ error: 'Choose a life category first' }), { status: 409 })
    }

    const body = await request.json().catch(() => ({}))
    const incoming = typeof body.message === 'string' ? body.message.trim() : ''
    if (!incoming) {
      return new Response(JSON.stringify({ error: 'A message is required' }), { status: 400 })
    }

    const prior = asMessages(row.conversation)
    const turnCount = (row.intake_turn_count || 0) + 1
    if (turnCount > HARD_STOP_TURNS) {
      return new Response(JSON.stringify({
        error: 'VIVA has what she needs from this conversation. Create your Activation when you are ready.',
        ready: isIntakeReady(row),
      }), { status: 409 })
    }

    const conversation: ActivationChatMessage[] = [...prior, { role: 'user', content: incoming }]
    const firstName =
      (user.user_metadata?.first_name as string | undefined) ||
      (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
      null

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('activation_chat')
    } catch {
      toolConfig = null
    }
    const gatewayModelId = toolConfig?.model_name
      ? (toolConfig.model_name.includes('/') ? toolConfig.model_name : `openai/${toolConfig.model_name}`)
      : FALLBACK_MODEL

    const systemPrompt = buildActivationChatSystemPrompt({
      firstName,
      turnCount,
      maxTurns: MAX_TURNS,
      hardStop: turnCount >= HARD_STOP_TURNS,
      currentState: row.current_state,
      dreamResponse: row.dream_response,
      category: row.category,
    })

    const estimatedTokens = estimateTokensForText(
      systemPrompt + conversation.map((m) => m.content).join('\n'),
      gatewayModelId.split('/').pop() || 'gpt-5.6-terra',
    )
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    const encoder = new TextEncoder()
    const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
    const writer = writable.getWriter()
    const write = async (text: string) => {
      if (!text) return
      await writer.write(encoder.encode(text))
    }

    void (async () => {
      try {
        await write(COACH_STREAM_PADDING)
        if (tokenValidation) {
          await write(
            `${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n` +
            (tokenValidation.error || "You've used your available Creation Credits. Add more to keep talking with VIVA."),
          )
          return
        }

        const supportsTemperature = !/(^|\/)(gpt-5|o\d)/.test(gatewayModelId)
        const result = streamText({
          model: gateway(gatewayModelId),
          system: systemPrompt,
          messages: conversation as ModelMessage[],
          ...(supportsTemperature ? { temperature: toolConfig?.temperature ?? 0.8 } : {}),
          async onFinish({ text, usage, totalUsage, response }) {
            const billed = totalUsage?.totalTokens ? totalUsage : usage
            const extract = parseIntakeMarkers(text || '')
            const visible = stripIntakeMarkers(text || '')
            const nextConversation: ActivationChatMessage[] = [
              ...conversation,
              { role: 'assistant', content: visible },
            ]
            const dream = mergeDream(row.dream_response, extract.dream)
            const currentState = extract.current_state || row.current_state
            const reflection = extract.reflection || row.reflection
            const category = row.category
            const needsSupport = extract.needs_support || row.needs_support || false
            const ready = extract.ready || isIntakeReady({
              current_state: currentState,
              dream_response: dream,
              category,
            })

            const updates: Record<string, unknown> = {
              conversation: nextConversation,
              intake_turn_count: turnCount,
              prompt_version: ACTIVATION_CHAT_PROMPT_VERSION,
              current_state: currentState,
              reflection,
              dream_response: dream,
              needs_support: needsSupport,
              status: row.status === 'started' ? 'oriented' : row.status,
            }
            if (ready && !row.intake_ready_at) {
              updates.intake_ready_at = new Date().toISOString()
            }

            const { error } = await supabase.from('activations').update(updates).eq('id', row.id)
            if (error) console.error('[activation/chat] persist failed:', error)

            if (ready && !row.intake_ready_at) {
              const fieldsFilled = [
                currentState ? 'current_state' : null,
                dream.want ? 'dream.want' : null,
                dream.why ? 'dream.why' : null,
                dream.feel ? 'dream.feel' : null,
                dream.become ? 'dream.become' : null,
                category ? 'category' : null,
              ].filter(Boolean)
              await recordActivationEvent(createAdminClient(), {
                eventType: 'activation_intake_ready',
                activationId: row.id,
                userId: user.id,
                eventData: { turns: turnCount, fields_filled: fieldsFilled, category },
              })
            }

            if (billed?.totalTokens && billed.totalTokens > 0) {
              await trackTokenUsage({
                user_id: user.id,
                action_type: 'chat_conversation',
                model_used: response?.modelId || gatewayModelId,
                tokens_used: billed.totalTokens,
                input_tokens: billed.inputTokens || 0,
                output_tokens: billed.outputTokens || 0,
                actual_cost_cents: 0,
                provider: 'vercel_gateway',
                provider_request_id: response?.id,
                openai_request_id: response?.id,
                success: true,
                metadata: {
                  feature: 'activation',
                  activation_id: row.id,
                  prompt_version: ACTIVATION_CHAT_PROMPT_VERSION,
                },
              })
            }
          },
        })

        await write(`${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n`)
        let raw = ''
        let lastVisible = ''
        for await (const chunk of result.textStream) {
          raw += chunk
          const visible = stripIntakeMarkersLive(raw)
          const delta = visible.slice(lastVisible.length)
          if (delta) {
            lastVisible = visible
            await write(delta)
          }
        }
        const finalVisible = stripIntakeMarkers(raw)
        if (finalVisible.length > lastVisible.length) {
          await write(finalVisible.slice(lastVisible.length))
        }
      } catch (error) {
        console.error('[activation/chat] stream error:', error)
        try {
          await write("\n\nI'm having trouble connecting right now. Let's try again in a moment.")
        } catch {
          /* writer may already be closed */
        }
      } finally {
        try {
          await writer.close()
        } catch {
          /* already closed */
        }
      }
    })()

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, no-transform',
        'X-Accel-Buffering': 'no',
      },
    })
  } catch (error) {
    console.error('[activation/chat] error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
