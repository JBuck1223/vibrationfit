/**
 * VIVA Coach API Route — Conversational Brain Architecture
 *
 * The complete coaching flow:
 *   1. SAVE the member's message
 *   2. RETRIEVE personal context in parallel
 *   3. INTERPRET the moment and select only relevant context
 *   4. RESPOND conversationally with the main model
 *   5. EXTRACT memories and sync embeddings in the background
 */

import { streamText, generateText, stepCountIs, type ModelMessage } from 'ai'
import { after } from 'next/server'
import { gateway } from '@/lib/ai/gateway'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildCoachSystemPrompt, buildRetrievalIndicators } from '@/lib/viva/prompts/coach-system-prompt'
import { loadCoachContext } from '@/lib/viva/coach-context-loader'
import {
  interpretCoachTurn,
  buildInterpretationSection,
  buildOverlaySection,
} from '@/lib/viva/coach-interpreter'
import { loadMemories, extractMemories, saveMemories, saveConstraints, loadConstraints } from '@/lib/viva/memory-extractor'
import { searchMemberContext, syncMemberEmbeddings } from '@/lib/viva/embeddings'
import { buildCoachTools, COACH_TOOLS_PROMPT } from '@/lib/viva/coach-tools'
import { getVivaHouseholdLens } from '@/lib/viva/household-lens'
import { checkIsAdmin } from '@/middleware/admin'
import { parseVivaMode } from '@/lib/viva/modes'
import { buildModeContract } from '@/lib/viva/prompts/mode-contracts'
import { PLATFORM_MAP_PROMPT } from '@/lib/viva/prompts/platform-map'
import { findOpenKitForConversation } from '@/lib/manifestations/kit-helpers'
import {
  COACH_STREAM_META_MARKER,
  COACH_STREAM_PADDING,
} from '@/lib/viva/coach-stream'

export const dynamic = 'force-dynamic'
export const revalidate = 0
export const maxDuration = 120

const RESPONDER_MODEL = 'openai/gpt-5.6-terra'

type CoachChatMessage = { role: 'user' | 'assistant'; content: string }

function toCoachChatMessage(role: string, content: string): CoachChatMessage {
  return {
    role: role === 'assistant' ? 'assistant' : 'user',
    content,
  }
}

/**
 * Resolves which model powers this coaching turn.
 * gpt-5.6-terra is the production conversational responder. Admins may use a
 * per-request override only for explicit model diagnostics.
 */
async function resolveCoachModel(
  supabase: Awaited<ReturnType<typeof createClient>>,
  user: { id: string; email?: string },
  modelOverride?: unknown
): Promise<string> {
  if (typeof modelOverride === 'string' && /^[\w.\-/:]{1,80}$/.test(modelOverride)) {
    const isAdmin = await checkIsAdmin(supabase, { id: user.id, email: user.email })
    if (isAdmin) {
      return modelOverride.includes('/') ? modelOverride : `openai/${modelOverride}`
    }
  }

  return RESPONDER_MODEL
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const {
      messages,
      conversationId,
      selectedCategories,
      userIntent,
      modeHint,
      modelOverride,
    } = await req.json()

    const selectedMode = parseVivaMode(modeHint)
    const chatTurns: CoachChatMessage[] = Array.isArray(messages)
      ? messages
          .filter((m: { role?: string; content?: string }) => typeof m?.content === 'string')
          .map((m: { role: string; content: string }) => toCoachChatMessage(m.role, m.content))
      : []

    // =========================================================================
    // LAYER 0: SAVE — Create session + persist user message
    // =========================================================================

    let currentConversationId = conversationId

    if (!currentConversationId) {
      const { data: newSession, error: sessionError } = await supabase
        .from('conversation_sessions')
        .insert({
          user_id: user.id,
          mode: 'coach',
          viva_mode: selectedMode,
          category: selectedCategories?.[0] || null,
          preview_message: userIntent || chatTurns[chatTurns.length - 1]?.content?.slice(0, 100) || 'Coaching session',
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (!sessionError && newSession) {
        currentConversationId = newSession.id
      }
    }

    // Save user message
    const lastUserMessage = [...chatTurns].reverse().find(m => m.role === 'user') || null

    if (lastUserMessage) {
      supabase.from('ai_conversations').insert({
        user_id: user.id,
        conversation_id: currentConversationId || null,
        message: lastUserMessage.content,
        role: 'user',
        context: { mode: 'coach', selected_mode: selectedMode, selectedCategories, userIntent },
        created_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error('[VIVA COACH] Error saving user message:', error)
      })
    }

    // Return headers + padding immediately so mobile WebKit does not drop the
    // request during retrieve + Luna (those used to run before any bytes).
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
        await runCoachTurn({
          write,
          supabase,
          user,
          messages: chatTurns,
          selectedCategories,
          userIntent,
          selectedMode,
          modelOverride,
          currentConversationId,
          lastUserMessage,
        })
      } catch (error) {
        console.error('[VIVA COACH] Stream error:', error)
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
        'X-Conversation-Id': currentConversationId || '',
      },
    })
  } catch (error) {
    console.error('[VIVA COACH] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

async function runCoachTurn({
  write,
  supabase,
  user,
  messages,
  selectedCategories,
  userIntent,
  selectedMode,
  modelOverride,
  currentConversationId,
  lastUserMessage,
}: {
  write: (text: string) => Promise<void>
  supabase: Awaited<ReturnType<typeof createClient>>
  user: { id: string; email?: string; user_metadata?: { full_name?: string } }
  messages: CoachChatMessage[]
  selectedCategories?: string[]
  userIntent?: string
  selectedMode: ReturnType<typeof parseVivaMode>
  modelOverride?: unknown
  currentConversationId: string | null
  lastUserMessage: CoachChatMessage | null
}) {
    // =========================================================================
    // LAYER 1: RETRIEVE — Load everything in parallel (interpretation follows)
    // =========================================================================

    const userName = user.user_metadata?.full_name?.split(' ')[0] || 'friend'
    const latestContent = lastUserMessage?.content || ''

    // Household lens first (fast) — it scopes memory/constraint/recall loads
    const householdLens = await getVivaHouseholdLens(supabase, user.id)

    const [contextResult, memoriesResult, constraintsResult, semanticRecallResult, gatewayModelId] = await Promise.all([
      // Context loading (parallel Supabase queries)
      loadCoachContext({
        supabase,
        userId: user.id,
        userName,
        selectedCategories,
        userIntent,
      }),

      // Also load memories (the "gold")
      loadMemories(supabase, user.id, {
        category: selectedCategories?.[0] || undefined,
        limit: 15,
        minConfidence: 0.3,
        householdId: householdLens?.householdId,
      }),

      // Constraint ledger (limiting beliefs and their status arc)
      loadConstraints(supabase, user.id, {
        category: selectedCategories?.[0] || undefined,
        limit: 8,
        householdId: householdLens?.householdId,
      }),

      // Semantic recall across their whole footprint (journals, past coaching,
      // stories, songs, vision) — most relevant to what they just said
      latestContent.length > 20
        ? searchMemberContext(supabase, user.id, latestContent, 6, householdLens?.householdId)
        : Promise.resolve([]),

      // Terra in production; an authenticated admin can explicitly override it.
      resolveCoachModel(supabase, user, modelOverride),
    ])

    const { context: coachContext, loadTimeMs } = contextResult

    // =========================================================================
    // LAYER 2: INTERPRET — Read the moment, select the context that matters
    // =========================================================================

    // Compact candidate lines (indices are what the interpreter selects by)
    const memoryLines = memoriesResult.map(m => {
      const owner = m.user_id !== user.id && householdLens
        ? ` / about ${householdLens.nameByUserId[m.user_id] || 'household member'}`
        : ''
      return `[${m.type}${m.category ? ` / ${m.category}` : ''}${owner}] ${m.content}`
    })
    const constraintLines = constraintsResult.map(c => {
      const owner = c.user_id !== user.id && householdLens
        ? `${householdLens.nameByUserId[c.user_id] || 'household member'}'s `
        : ''
      return `${owner}[${c.status}] "${c.statement}"${c.category ? ` (${c.category})` : ''}`
    })
    const recallLines = semanticRecallResult.map(r =>
      `(${r.entity_type}${r.source_date ? `, ${r.source_date.slice(0, 10)}` : ''}) ${r.content.slice(0, 280)}`
    )

    const lensParts: string[] = []
    if (coachContext.visionData) lensParts.push('their Life Vision')
    if (coachContext.journalEntries?.length) lensParts.push(`${coachContext.journalEntries.length} recent journal entries`)
    if (coachContext.dailyPapers?.length) lensParts.push('recent Daily Papers')
    if (coachContext.songs?.length) lensParts.push('their songs')
    if (coachContext.visionBoard?.active?.length) lensParts.push('active vision board desires')
    if (coachContext.abundance?.events?.length) lensParts.push('abundance events')
    if (coachContext.mapCommitments?.length || coachContext.mapItems?.length) lensParts.push('MAP commitments')
    if (coachContext.openKits?.length) {
      lensParts.push(`open kits: ${coachContext.openKits.map(k => k.title).join(', ')}`)
    }
    if (coachContext.openVisionDraft) lensParts.push('an open Life Vision draft')

    const interpretation = await interpretCoachTurn({
      latestMessage: latestContent,
      recentMessages: messages?.slice(-8),
      memoryCandidates: memoryLines,
      constraintCandidates: constraintLines,
      recallCandidates: recallLines,
      lensSummary: lensParts.length > 0 ? lensParts.join(', ') : undefined,
      selectedMode,
      userId: user.id,
    })

    const responseDesign = interpretation.response_design
    const overlay = interpretation.overlay
    const mode = overlay === 'none' ? responseDesign.stance : overlay
    const emotional_state = interpretation.emotional_state

    console.log(
      `[VIVA COACH] Design: ${responseDesign.stance}/${responseDesign.approach}/${responseDesign.response_length} | ` +
      `Overlay: ${overlay} | Emotion: ${emotional_state} | Context: ${loadTimeMs}ms | ` +
      `Selected: ${interpretation.selected_memories.length}/${memoriesResult.length} memories, ` +
      `${interpretation.selected_constraints.length}/${constraintsResult.length} constraints, ` +
      `${interpretation.selected_recall.length}/${semanticRecallResult.length} recall${interpretation.fallback ? ' (fallback)' : ''}`
    )

    // Inject ONLY the selected context — the interpreter's job is to hand the
    // coach the 3 things that matter, not 57 things we know
    const selectedMemories = interpretation.selected_memories.map(i => memoriesResult[i])
    const selectedConstraints = interpretation.selected_constraints.map(i => constraintsResult[i])
    const selectedRecall = interpretation.selected_recall.map(i => semanticRecallResult[i])

    coachContext.caseNotes = selectedMemories.map(m => {
      const owner = m.user_id !== user.id && householdLens
        ? ` / about ${householdLens.nameByUserId[m.user_id] || 'household member'}`
        : ''
      return {
        content: `[${m.type}${m.category ? ` / ${m.category}` : ''}${owner}] ${m.content}`,
      }
    })

    coachContext.constraints = selectedConstraints.map(c => ({
      ...c,
      owner_name: c.user_id !== user.id && householdLens
        ? householdLens.nameByUserId[c.user_id] || 'household member'
        : null,
    }))

    coachContext.semanticRecall = selectedRecall.map(r => ({
      ...r,
      owner_name: r.user_id !== user.id && householdLens
        ? householdLens.nameByUserId[r.user_id] || 'household member'
        : null,
    }))

    coachContext.selectedMode = selectedMode

    // Household lens: shared family story
    if (householdLens) {
      coachContext.householdLens = {
        householdName: householdLens.householdName,
        sharedMemberNames: householdLens.sharedMembers.map(m => m.name),
      }
    }

    // Build a tiny friend-facing continuity cue for the UI. This never includes
    // VIVA's internal stance, classification, or coaching machinery.
    const retrievalIndicators = buildRetrievalIndicators(coachContext)

    // =========================================================================
    // LAYER 3: RESPOND — Build prompt with the interpretation, stream response
    // =========================================================================

    const basePrompt = buildCoachSystemPrompt(coachContext)
    const interpretationSection = buildInterpretationSection(interpretation)
    const overlaySection = buildOverlaySection(overlay)
    const systemPrompt = [
      basePrompt,
      buildModeContract(selectedMode),
      PLATFORM_MAP_PROMPT,
      COACH_TOOLS_PROMPT,
      overlaySection,
      interpretationSection,
    ]
      .filter(Boolean)
      .join('\n\n---\n\n')

    // Cache prompt for session continuity
    if (currentConversationId) {
      supabase
        .from('conversation_sessions')
        .update({ cached_system_prompt: systemPrompt })
        .eq('id', currentConversationId)
        .then(() => {})
    }

    // Load conversation history
    let conversationHistory: CoachChatMessage[] = []
    if (currentConversationId) {
      const { data: historyMessages } = await supabase
        .from('ai_conversations')
        .select('role, message')
        .eq('conversation_id', currentConversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (historyMessages && historyMessages.length > 0) {
        conversationHistory = historyMessages.map(msg =>
          toCoachChatMessage(msg.role, msg.message)
        )
      }
    }

    // Token validation
    const messagesText = messages ? messages.map((m: { content: string }) => m.content).join('\n') : ''
    const estimatedTokens = estimateTokensForText(systemPrompt + messagesText, gatewayModelId.split('/').pop() || 'gpt-5.6-terra')
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      await write(
        `${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n` +
        (tokenValidation.error || "You've used your available Creation Credits. Add more to keep talking with VIVA.")
      )
      return
    }

    // Build chat messages
    const chatMessages = conversationHistory.length > 0
      ? [...conversationHistory.slice(0, -1), ...messages.slice(-2)]
      : messages

    if (!chatMessages || chatMessages.length === 0) {
      await write(
        `${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: [] })}\n` +
        "I didn't catch a message there. Try sending that again."
      )
      return
    }

    const activeKit = await findOpenKitForConversation(
      supabase,
      user.id,
      currentConversationId || null,
    )

    // In-app actions (queue songs, capture entries, create stories, ...)
    const tools = buildCoachTools({
      supabase,
      userId: user.id,
      conversationId: currentConversationId || null,
      selectedMode,
      overlay,
      activeKitId: activeKit?.id || coachContext.openKits?.[0]?.id || null,
      householdId: householdLens?.householdId,
      getConversationText: () =>
        chatMessages
          .slice(-12)
          .map((m: { role: string; content: string }) => `${m.role === 'user' ? 'MEMBER' : 'VIVA'}: ${m.content}`)
          .join('\n\n'),
    })

    // Reasoning models (gpt-5 family, o-series) reject custom temperature
    const supportsTemperature = !/(^|\/)(gpt-5|o\d)/.test(gatewayModelId)

    // Stream the response
    const result = streamText({
      // Routed through the Vercel AI Gateway for exact per-request billing
      model: gateway(gatewayModelId),
      system: systemPrompt,
      messages: chatMessages as ModelMessage[],
      ...(supportsTemperature ? { temperature: overlay === 'crisis' ? 0.4 : 0.8 } : {}),
      tools,
      // Allow tool call -> result -> narration (and one follow-up action)
      // Room for read → (read|write) → narrate chains
      stopWhen: stepCountIs(6),
      async onFinish({ text, usage: stepUsage, totalUsage, response: aiResponse }: {
        text: string
        usage?: { totalTokens?: number; inputTokens?: number; outputTokens?: number }
        totalUsage?: { totalTokens?: number; inputTokens?: number; outputTokens?: number }
        response?: { id?: string; modelId?: string }
      }) {
        try {
          // With tool calling the response spans multiple steps; bill for all of them
          const usage = totalUsage?.totalTokens ? totalUsage : stepUsage
          // Save assistant message
          await supabase.from('ai_conversations').insert({
            user_id: user.id,
            conversation_id: currentConversationId || null,
            message: text,
            role: 'assistant',
            context: { mode: 'coach', selected_mode: selectedMode, vivaMode: mode, responseDesign, overlay, emotional_state, selectedCategories, userIntent },
            created_at: new Date().toISOString(),
          })

          // Update session metadata
          if (currentConversationId) {
            await supabase
              .from('conversation_sessions')
              .update({
                last_message_at: new Date().toISOString(),
                message_count: (conversationHistory.length || 0) + 2,
                preview_message: messages[messages.length - 1]?.content?.slice(0, 100) || '',
                viva_mode: selectedMode,
              })
              .eq('id', currentConversationId)
          }

          // Track token usage
          if (usage?.totalTokens && usage.totalTokens > 0) {
            await trackTokenUsage({
              user_id: user.id,
              action_type: 'chat_conversation',
              model_used: aiResponse?.modelId || gatewayModelId,
              tokens_used: usage.totalTokens,
              input_tokens: usage.inputTokens || 0,
              output_tokens: usage.outputTokens || 0,
              actual_cost_cents: 0,
              provider: 'vercel_gateway',
              provider_request_id: aiResponse?.id,
              openai_request_id: aiResponse?.id,
              success: true,
              metadata: {
                mode: 'coach',
                vivaMode: mode,
                responseDesign,
                overlay,
                emotional_state,
                selectedCategories,
                message_length: text.length,
                context_load_time_ms: loadTimeMs,
                memories_loaded: memoriesResult.length,
              },
            })
          }

          // =================================================================
          // LAYER 4: EXTRACT — Background memory extraction (in-process)
          // =================================================================
          // Runs in-process via after() instead of an HTTP self-call: the old
          // fetch sent an empty Cookie header, so the extract endpoint rejected
          // every request as unauthenticated and no memories were ever saved.
          const recentExchange = [
            ...chatMessages.slice(-4),
            { role: 'assistant', content: text },
          ]

          after(async () => {
            try {
              // Auto-title new threads after the first exchange
              if (currentConversationId) {
                const { data: session } = await supabase
                  .from('conversation_sessions')
                  .select('title')
                  .eq('id', currentConversationId)
                  .single()

                if (session && !session.title) {
                  try {
                    const titleResult = await generateText({
                      model: gateway('openai/gpt-4o-mini'),
                      prompt: `Write a short title (3-6 words, no quotes, no punctuation at the end) for this conversation. Capture the emotional topic, not generic words like "chat" or "conversation".\n\nMEMBER: ${lastUserMessage?.content?.slice(0, 500) || ''}\n\nVIVA: ${text.slice(0, 300)}`,
                      temperature: 0.3,
                    })
                    const title = titleResult.text.trim().replace(/^["']|["']$/g, '').slice(0, 80)
                    if (title) {
                      await supabase
                        .from('conversation_sessions')
                        .update({ title })
                        .eq('id', currentConversationId)
                    }
                  } catch (titleErr) {
                    console.error('[VIVA COACH] Auto-title failed:', titleErr)
                  }
                }
              }

              const existingMemories = await loadMemories(supabase, user.id, { limit: 30 })
              const { memories, constraints } = await extractMemories(
                recentExchange,
                existingMemories.map(m => m.content),
                user.id
              )
              if (memories.length > 0) {
                const saveResult = await saveMemories(
                  supabase,
                  user.id,
                  memories,
                  undefined,
                  currentConversationId || undefined,
                  householdLens?.householdId
                )
                console.log(`[VIVA COACH] Memories: saved ${saveResult.saved}, skipped ${saveResult.skipped}`)
              }
              if (constraints.length > 0) {
                const constraintResult = await saveConstraints(
                  supabase,
                  user.id,
                  constraints,
                  currentConversationId || undefined,
                  householdLens?.householdId
                )
                console.log(`[VIVA COACH] Constraints: saved ${constraintResult.saved}, updated ${constraintResult.updated}`)
              }

              // Keep the semantic index converged with new member content
              const syncResult = await syncMemberEmbeddings(supabase, user.id, householdLens?.householdId)
              if (syncResult.embedded > 0) {
                console.log(`[VIVA COACH] Embedded ${syncResult.embedded} new items`)
              }
            } catch (err) {
              console.error('[VIVA COACH] Memory extraction failed:', err)
            }
          })

        } catch (error) {
          console.error('[VIVA COACH] Error in onFinish:', error)
        }
      },
    })

    await write(`${COACH_STREAM_META_MARKER}${JSON.stringify({ indicators: retrievalIndicators })}\n`)

    for await (const chunk of result.textStream) {
      await write(chunk)
    }
}
