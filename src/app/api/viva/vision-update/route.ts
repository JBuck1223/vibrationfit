/**
 * VIVA Vision Update — streaming endpoint for /life-vision/update.
 *
 * Streams the coach protocol (padding + meta line + tokens). Category
 * proposals are framed inline with <<<VISION key>>> ... <<<END VISION>>>
 * markers (see vision-update-prompts.ts); the client routes marker content
 * into that category's editor as an accept/edit/discard proposal.
 *
 * This endpoint never writes to the draft — accepted proposals save through
 * the existing PATCH /api/vision/draft/update. Create mode does persist
 * Draft Session contrast/clarity notes parsed from SEED markers.
 */

import { streamText, type ModelMessage } from 'ai'
import { after } from 'next/server'
import { gateway } from '@/lib/ai/gateway'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import { buildVisionUpdateSystemPrompt } from '@/lib/viva/prompts/vision-update-prompts'
import { buildVisionCreateSystemPrompt } from '@/lib/viva/prompts/vision-create-prompts'
import { ORDERED_VISION_CATEGORIES } from '@/lib/design-system/vision-categories'
import {
  COACH_STREAM_META_MARKER,
  COACH_STREAM_PADDING,
} from '@/lib/viva/coach-stream'
import { parseVisionUpdateMessage } from '@/lib/life-vision/vision-update-stream'
import {
  ensureDraftSession,
  markDraftSessionComposed,
  persistVivaSeeds,
} from '@/lib/life-vision/draft-session'
import { loadRoster, loadPersona } from '@/lib/roster/store'
import { renderRosterForPrompt, renderPersonaForPrompt } from '@/lib/roster/render'
import { runGetToKnowYouExtraction } from '@/lib/roster/get-to-know-you-extractor'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 120

const RESPONDER_MODEL = 'openai/gpt-5.6-terra'
const CATEGORY_KEYS = ORDERED_VISION_CATEGORIES.map((c) => c.key)

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { messages, draftId, sessionSeed, conversationId, mode } = await req.json()
    const isCreate = mode === 'create'
    if (!draftId) {
      return new Response(JSON.stringify({ error: 'Missing draftId' }), { status: 400 })
    }

    const chatTurns: ChatMessage[] = Array.isArray(messages)
      ? messages
          .filter((m: { role?: string; content?: string }) => typeof m?.content === 'string' && m.content.trim())
          .map((m: { role: string; content: string }) => ({
            role: m.role === 'assistant' ? ('assistant' as const) : ('user' as const),
            content: m.content,
          }))
      : []
    if (chatTurns.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages' }), { status: 400 })
    }

    // Load the draft (must be the member's own open draft)
    const { data: draft } = await supabase
      .from('vision_versions')
      .select('*')
      .eq('id', draftId)
      .eq('is_draft', true)
      .single()
    if (!draft || draft.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Draft not found' }), { status: 404 })
    }

    // Active vision in the same scope → which categories already changed
    let activeQuery = supabase
      .from('vision_versions')
      .select('*')
      .eq('is_active', true)
      .eq('is_draft', false)
    activeQuery = draft.household_id
      ? activeQuery.eq('household_id', draft.household_id)
      : activeQuery.eq('user_id', user.id).is('household_id', null)
    const { data: active } = await activeQuery.maybeSingle()

    const norm = (v: unknown) => (typeof v === 'string' ? v.replace(/\r\n/g, '\n').trim() : '')
    const draftText: Record<string, string> = {}
    const changedCategories: string[] = []
    for (const key of CATEGORY_KEYS) {
      draftText[key] = norm(draft[key])
      if (active && norm(draft[key]) !== norm(active[key])) changedCategories.push(key)
    }

    // Fail fast when the balance can't cover the turn
    const balanceCheck = await validateTokenBalance(user.id, 5_000, supabase)
    if (balanceCheck) {
      return new Response(
        JSON.stringify({ error: balanceCheck.error, tokensRemaining: balanceCheck.tokensRemaining }),
        { status: balanceCheck.status || 402, headers: { 'Content-Type': 'application/json' } },
      )
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name')
      .eq('user_id', user.id)
      .maybeSingle()

    // Get to Know You context: account prefill + whatever the roster/persona
    // already hold, so VIVA never re-asks what we know (both modes).
    const [{ data: account }, roster, persona] = await Promise.all([
      supabase.from('user_accounts').select('first_name, date_of_birth').eq('id', user.id).maybeSingle(),
      loadRoster(supabase, user.id),
      loadPersona(supabase, user.id),
    ])
    const accountFirstName = account?.first_name || null
    const dateOfBirth = account?.date_of_birth || null
    const rosterBlock = renderRosterForPrompt(roster) || null
    const personaBlock = renderPersonaForPrompt(persona) || null

    const seededCategory = CATEGORY_KEYS.find((key) => draftText[key]) || null
    const draftSession = isCreate
      ? await ensureDraftSession(supabase, user.id, draftId, {
          draftHasText: CATEGORY_KEYS.some((key) => Boolean(draftText[key])),
        }).catch((err) => {
          console.error('[VIVA VISION UPDATE] Draft session', err)
          return null
        })
      : null
    const system = isCreate
      ? buildVisionCreateSystemPrompt({
          firstName: profile?.first_name || accountFirstName,
          draft: draftText,
          perspective: draft.perspective === 'plural' ? 'plural' : 'singular',
          seededCategory,
          sessionSeed: typeof sessionSeed === 'string' ? sessionSeed : null,
          sessionStatus: draftSession?.status,
          sessionNotes: draftSession?.notes,
          dateOfBirth,
          rosterBlock,
          personaBlock,
        })
      : buildVisionUpdateSystemPrompt({
          firstName: profile?.first_name || accountFirstName,
          draft: draftText,
          changedCategories,
          perspective: draft.perspective === 'plural' ? 'plural' : 'singular',
          sessionSeed: typeof sessionSeed === 'string' ? sessionSeed : null,
          rosterBlock,
          personaBlock,
        })
    const sessionMode = isCreate ? 'vision_create' : 'vision_update'

    // ------------------------------------------------------------------
    // Thread persistence (same tables as VIVA coach) so a refresh of
    // /life-vision/update restores the conversation. Session is keyed to
    // the draft via vision_id.
    // ------------------------------------------------------------------
    const lastUserMessage = [...chatTurns].reverse().find((m) => m.role === 'user') || null

    let currentConversationId: string | null =
      typeof conversationId === 'string' && conversationId ? conversationId : null

    if (!currentConversationId) {
      const { data: newSession } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          mode: sessionMode,
          vision_id: draftId,
          title: isCreate ? 'Life Vision' : 'Vision Update',
          preview_message: lastUserMessage?.content?.slice(0, 100) || (isCreate ? 'Life Vision session' : 'Vision update session'),
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select('id')
        .single()
      currentConversationId = newSession?.id || null
    }

    if (lastUserMessage && currentConversationId) {
      supabase
        .from('ai_conversations')
        .insert({
          user_id: user.id,
          conversation_id: currentConversationId,
          role: 'user',
          message: lastUserMessage.content,
          context: { mode: sessionMode, draft_id: draftId },
        })
        .then(({ error }) => {
          if (error) console.error('[VIVA VISION UPDATE] Error saving user message:', error)
        })
    }

    // Stream: padding first (mobile WebKit), then meta line, then tokens
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
        await write(`${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n`)

        const result = streamText({
          model: gateway(RESPONDER_MODEL),
          system,
          messages: chatTurns as ModelMessage[],
        })

        let assistantText = ''
        for await (const chunk of result.textStream) {
          assistantText += chunk
          await write(chunk)
        }

        // Persist the assistant reply (raw text incl. proposal markers so a
        // restored thread re-renders proposals exactly as streamed)
        if (assistantText.trim() && currentConversationId) {
          const { error: saveError } = await supabase.from('ai_conversations').insert({
            user_id: user.id,
            conversation_id: currentConversationId,
            role: 'assistant',
            message: assistantText,
            context: { mode: sessionMode, draft_id: draftId },
          })
          if (saveError) console.error('[VIVA VISION UPDATE] Error saving assistant message:', saveError)

          await supabase
            .from('conversation_sessions')
            .update({
              message_count: chatTurns.length + 1,
              preview_message: lastUserMessage?.content?.slice(0, 100) || (isCreate ? 'Life Vision session' : 'Vision update session'),
              last_message_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', currentConversationId)
        }

        if (isCreate && draftSession && assistantText.trim()) {
          const parsed = parseVisionUpdateMessage(assistantText)
          await persistVivaSeeds(supabase, draftSession.id, parsed.seeds)
          if (parsed.proposals.some((p) => p.complete)) {
            await markDraftSessionComposed(supabase, draftSession.id)
          }

          // Get to Know You: background roster/persona extraction from the
          // latest exchange. In-process via after() — never an HTTP self-call,
          // never blocks the stream, never deducts member tokens.
          const recentExchange = [
            ...chatTurns.slice(-4),
            { role: 'assistant', content: assistantText },
          ]
          const knownContext = [rosterBlock, personaBlock].filter(Boolean).join('\n')
          after(async () => {
            try {
              await runGetToKnowYouExtraction(supabase, user.id, recentExchange, knownContext)
            } catch (err) {
              console.error('[VIVA VISION UPDATE] Get to Know You extraction:', err)
            }
          })
        }

        let usage: { totalTokens?: number; inputTokens?: number; outputTokens?: number } | null = null
        try {
          usage = await result.usage
        } catch {
          usage = null
        }
        if (usage) {
          await trackTokenUsage({
            user_id: user.id,
            action_type: 'vision_refinement',
            model_used: RESPONDER_MODEL,
            tokens_used: usage.totalTokens || 0,
            input_tokens: usage.inputTokens || 0,
            output_tokens: usage.outputTokens || 0,
            actual_cost_cents: 0,
            provider: 'vercel_gateway',
            success: true,
            metadata: { feature: isCreate ? 'vision_create' : 'vision_update', draft_id: draftId },
          }).catch(() => {})
        }
      } catch (error) {
        console.error('[VIVA VISION UPDATE] Stream error:', error)
        try {
          await write("\n\nI'm having trouble connecting right now. Let's try again in a moment.")
        } catch {
          /* writer may already be closed */
        }
      } finally {
        try { await writer.close() } catch { /* already closed */ }
      }
    })()

    const headers: Record<string, string> = {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, no-transform',
      'X-Accel-Buffering': 'no',
    }
    if (currentConversationId) headers['X-Conversation-Id'] = currentConversationId

    return new Response(readable, { headers })
  } catch (error) {
    console.error('[VIVA VISION UPDATE] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
}
