/**
 * Admin Social VIVA — draft replies to other people's questions.
 *
 * Uses the Conversational Intelligence brain with no admin personal context,
 * no tools, and no memory extraction. Threads are stored as
 * conversation_sessions.mode = admin_social_reply so they never appear on /viva.
 */

import { streamText, type ModelMessage } from 'ai'
import { z } from 'zod'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import {
  COACH_STREAM_META_MARKER,
  COACH_STREAM_PADDING,
} from '@/lib/viva/coach-stream'
import {
  ADMIN_SOCIAL_REPLY_MODE,
  SOCIAL_REPLY_LENGTHS,
  SOCIAL_REPLY_PLATFORMS,
  SOCIAL_REPLY_PROMPT_VERSION,
  SOCIAL_REPLY_VOICES,
  buildSocialReplySystemPrompt,
  buildSocialReplyUserMessage,
  parseSocialReplyIntake,
  parseSocialReplyIntakeJson,
  type SocialReplyIntake,
} from '@/lib/viva/prompts/social-reply-prompts'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 120

const RESPONDER_MODEL = 'openai/gpt-5.6-terra'

const bodySchema = z.object({
  conversationId: z.string().uuid().optional(),
  incomingMessage: z.string().max(8000).optional(),
  platform: z.enum(SOCIAL_REPLY_PLATFORMS).optional(),
  length: z.enum(SOCIAL_REPLY_LENGTHS).optional(),
  voice: z.enum(SOCIAL_REPLY_VOICES).optional(),
  notes: z.string().max(4000).optional(),
  instruction: z.string().max(4000).optional(),
})

type ChatTurn = { role: 'user' | 'assistant'; content: string }

function titleFromIntake(intake: SocialReplyIntake): string {
  const firstLine = intake.incomingMessage.split(/\n/)[0]?.trim() || 'Social reply'
  return firstLine.slice(0, 80)
}

function mergeIntake(base: SocialReplyIntake | null, patch: z.infer<typeof bodySchema>): SocialReplyIntake | null {
  const incomingMessage = (patch.incomingMessage ?? base?.incomingMessage ?? '').trim()
  if (!incomingMessage) return null
  return {
    incomingMessage,
    platform: patch.platform ?? base?.platform ?? 'other',
    length: patch.length ?? base?.length ?? 'medium',
    voice: patch.voice ?? base?.voice ?? 'vanessa_jordan',
    notes: patch.notes !== undefined ? (patch.notes.trim() || null) : (base?.notes ?? null),
  }
}

export async function POST(request: Request) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return new Response(JSON.stringify({ error: auth.error }), {
      status: auth.status,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let raw: unknown
  try {
    raw = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const parsed = bodySchema.safeParse(raw)
  if (!parsed.success) {
    return new Response(JSON.stringify({ error: parsed.error.issues[0]?.message || 'Invalid request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const body = parsed.data
  const instruction = body.instruction?.trim() || null
  const { user, supabase } = auth

  try {
    let conversationId = body.conversationId ?? null
    let storedIntake: SocialReplyIntake | null = null

    if (conversationId) {
      const { data: session, error: sessionError } = await supabase
        .from('conversation_sessions')
        .select('id, mode, cached_system_prompt')
        .eq('id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle()

      if (sessionError || !session || session.mode !== ADMIN_SOCIAL_REPLY_MODE) {
        return new Response(JSON.stringify({ error: 'Conversation not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      storedIntake = parseSocialReplyIntakeJson(session.cached_system_prompt)
    }

    const intake = mergeIntake(storedIntake, body)
    if (!intake) {
      return new Response(JSON.stringify({ error: "Paste the person's question first." }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const isNewThread = !conversationId
    const userMessage = isNewThread
      ? buildSocialReplyUserMessage(intake, instruction)
      : (instruction || 'Revise the latest draft with the current settings.')

    if (!conversationId) {
      const { data: session, error: createError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          title: titleFromIntake(intake),
          mode: ADMIN_SOCIAL_REPLY_MODE,
          preview_message: intake.incomingMessage.slice(0, 140),
          message_count: 0,
          last_message_at: new Date().toISOString(),
          cached_system_prompt: JSON.stringify(intake),
        })
        .select('id')
        .single()

      if (createError || !session) {
        console.error('[Social VIVA] Failed to create session', createError)
        return new Response(JSON.stringify({ error: 'Unable to start this thread.' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      conversationId = session.id
    } else {
      await supabase
        .from('conversation_sessions')
        .update({
          cached_system_prompt: JSON.stringify(intake),
          preview_message: intake.incomingMessage.slice(0, 140),
          last_message_at: new Date().toISOString(),
        })
        .eq('id', conversationId)
        .eq('user_id', user.id)
    }

    await supabase.from('ai_conversations').insert({
      user_id: user.id,
      conversation_id: conversationId,
      role: 'user',
      message: userMessage,
      context: {
        mode: ADMIN_SOCIAL_REPLY_MODE,
        prompt_version: SOCIAL_REPLY_PROMPT_VERSION,
        intake,
      },
    })

    const { data: historyRows } = await supabase
      .from('ai_conversations')
      .select('role, message')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })
      .limit(40)

    const history: ChatTurn[] = (historyRows || []).map((row: { role: string; message: string }) => ({
      role: row.role === 'assistant' ? 'assistant' : 'user',
      content: row.message,
    }))

    const systemPrompt = buildSocialReplySystemPrompt(intake)
    const estimatedTokens = estimateTokensForText(
      systemPrompt + history.map(turn => turn.content).join('\n'),
      'gpt-5.6-terra',
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
              (tokenValidation.error || 'Creation Credits are used up. Add more to keep drafting with VIVA.'),
          )
          return
        }

        const supportsTemperature = !/(^|\/)(gpt-5|o\d)/.test(RESPONDER_MODEL)
        const result = streamText({
          model: gateway(RESPONDER_MODEL),
          system: systemPrompt,
          messages: history as ModelMessage[],
          ...(supportsTemperature ? { temperature: 0.7 } : {}),
          async onFinish(event) {
            const spoken = event.text.trim()
            if (!spoken) return
            try {
              await supabase.from('ai_conversations').insert({
                user_id: user.id,
                conversation_id: conversationId,
                role: 'assistant',
                message: spoken,
                context: {
                  mode: ADMIN_SOCIAL_REPLY_MODE,
                  prompt_version: SOCIAL_REPLY_PROMPT_VERSION,
                  intake,
                },
              })

              const messageCount = history.length + 1
              await supabase
                .from('conversation_sessions')
                .update({
                  last_message_at: new Date().toISOString(),
                  message_count: messageCount,
                })
                .eq('id', conversationId)

              const usage = event.totalUsage?.totalTokens ? event.totalUsage : event.usage
              if (usage?.totalTokens && usage.totalTokens > 0) {
                await trackTokenUsage({
                  user_id: user.id,
                  action_type: 'admin_tool',
                  model_used: event.response?.modelId || RESPONDER_MODEL,
                  tokens_used: usage.totalTokens,
                  input_tokens: usage.inputTokens || 0,
                  output_tokens: usage.outputTokens || 0,
                  provider: 'vercel_gateway',
                  provider_request_id: gatewayGenerationId(event) || event.response?.id,
                  success: true,
                  metadata: {
                    helper: 'social_viva',
                    mode: ADMIN_SOCIAL_REPLY_MODE,
                    platform: intake.platform,
                    voice: intake.voice,
                    conversation_id: conversationId,
                  },
                }, supabase)
              }
            } catch (error) {
              console.error('[Social VIVA] Failed to persist turn', error)
            }
          },
        })

        await write(`${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n`)

        for await (const chunk of result.textStream) {
          await write(chunk)
        }
      } catch (error) {
        console.error('[Social VIVA] Stream error', error)
        try {
          await write('\n\nVIVA had trouble drafting that. Try sending it again.')
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
        'X-Conversation-Id': conversationId,
      },
    })
  } catch (error) {
    console.error('[Social VIVA] Error', error)
    return new Response(JSON.stringify({ error: 'Unable to draft that reply. Please try again.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}
