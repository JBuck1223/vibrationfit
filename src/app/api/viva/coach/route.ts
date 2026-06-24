/**
 * VIVA Coach API Route — 4-Layer Architecture
 *
 * The complete coaching flow:
 *   1. SAVE the user's message
 *   2. CLASSIFY mode + emotional state (Layer 1 — fast, cheap)
 *   3. RETRIEVE relevant personal context (Layer 2 — parallel queries)
 *   4. RESPOND with streaming (Layer 3 — main model)
 *   5. EXTRACT memories in background (Layer 4 — fire-and-forget)
 */

import { streamText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { buildCoachSystemPrompt, buildRetrievalIndicators } from '@/lib/viva/prompts/coach-system-prompt'
import { loadCoachContext } from '@/lib/viva/coach-context-loader'
import { detectMode, type VivaMode } from '@/lib/viva/mode-detector'
import { loadMemories } from '@/lib/viva/memory-extractor'

export const dynamic = 'force-dynamic'
export const revalidate = 0

const MODEL = process.env.VIVA_COACH_MODEL || process.env.VIVA_MODEL || 'gpt-4o'

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
      isNewSession,
    } = await req.json()

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
          category: selectedCategories?.[0] || null,
          preview_message: userIntent || messages?.[messages.length - 1]?.content?.slice(0, 100) || 'Coaching session',
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
    const lastUserMessage = messages && messages.length > 0
      ? [...messages].reverse().find((m: any) => m.role === 'user')
      : null

    if (lastUserMessage) {
      supabase.from('ai_conversations').insert({
        user_id: user.id,
        conversation_id: currentConversationId || null,
        message: lastUserMessage.content,
        role: 'user',
        context: { mode: 'coach', selectedCategories, userIntent },
        created_at: new Date().toISOString(),
      }).then(({ error }) => {
        if (error) console.error('[VIVA COACH] Error saving user message:', error)
      })
    }

    // =========================================================================
    // LAYER 1: CLASSIFY — Detect mode + emotional state (runs in parallel with Layer 2)
    // =========================================================================

    const userName = user.user_metadata?.full_name?.split(' ')[0] || 'friend'
    const latestContent = lastUserMessage?.content || ''

    // Run classification AND context loading in parallel
    const validModes: VivaMode[] = ['connection', 'coaching', 'momentum', 'crisis', 'guide']
    const hasModeHint = modeHint && validModes.includes(modeHint) && isNewSession

    const [modeResult, contextResult, memoriesResult] = await Promise.all([
      // Layer 1: Skip AI classification when user explicitly chose intent
      hasModeHint
        ? Promise.resolve({ mode: modeHint as VivaMode, emotional_state: 'unclear' as const, confidence: 1, reasoning: 'User selected intent' })
        : detectMode(latestContent, messages?.slice(-4)),

      // Layer 2: Context loading (parallel Supabase queries)
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
      }),
    ])

    const { mode, emotional_state } = modeResult
    const { context: coachContext, loadTimeMs } = contextResult

    console.log(`[VIVA COACH] Mode: ${mode} | Emotion: ${emotional_state} | Context: ${loadTimeMs}ms | Memories: ${memoriesResult.length}`)

    // Inject memories into context
    coachContext.caseNotes = memoriesResult.map(m => ({
      content: `[${m.type}${m.category ? ` / ${m.category}` : ''}] ${m.content}`,
    }))

    // =========================================================================
    // LAYER 2: RETRIEVE — Build retrieval indicators for the UI
    // =========================================================================

    const retrievalIndicators = buildRetrievalIndicators(coachContext)

    // Add mode indicator
    const modeLabels: Record<VivaMode, string> = {
      connection: 'Listening',
      coaching: 'Coaching',
      momentum: 'Celebrating with you',
      guide: 'Finding the way',
      crisis: 'Safe support',
    }
    retrievalIndicators.unshift({ source: 'Mode', detail: modeLabels[mode] })

    if (memoriesResult.length > 0) {
      // Replace the generic notes indicator with a memory-specific one
      const memIdx = retrievalIndicators.findIndex(i => i.source === 'notes')
      if (memIdx >= 0) {
        retrievalIndicators[memIdx] = {
          source: 'memory',
          detail: `Recalling ${memoriesResult.length} things I know about you...`,
        }
      } else {
        retrievalIndicators.push({
          source: 'memory',
          detail: `Recalling ${memoriesResult.length} things I know about you...`,
        })
      }
    }

    // =========================================================================
    // LAYER 3: RESPOND — Build prompt with mode instructions, stream response
    // =========================================================================

    // Build system prompt (with mode-specific behavior injected)
    const basePrompt = buildCoachSystemPrompt(coachContext)
    const modeInstruction = getModeInstruction(mode, emotional_state)
    const systemPrompt = `${basePrompt}\n\n---\n\n## CURRENT MODE: ${mode.toUpperCase()}\n\n${modeInstruction}`

    // Cache prompt for session continuity
    if (currentConversationId) {
      supabase
        .from('conversation_sessions')
        .update({ cached_system_prompt: systemPrompt })
        .eq('id', currentConversationId)
        .then(() => {})
    }

    // Load conversation history
    let conversationHistory: any[] = []
    if (currentConversationId) {
      const { data: historyMessages } = await supabase
        .from('ai_conversations')
        .select('role, message')
        .eq('conversation_id', currentConversationId)
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(20)

      if (historyMessages && historyMessages.length > 0) {
        conversationHistory = historyMessages.map(msg => ({
          role: msg.role,
          content: msg.message,
        }))
      }
    }

    // Token validation
    const messagesText = messages ? messages.map((m: { content: string }) => m.content).join('\n') : ''
    const estimatedTokens = estimateTokensForText(systemPrompt + messagesText, MODEL)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return new Response(
        JSON.stringify({ error: tokenValidation.error, tokensRemaining: tokenValidation.tokensRemaining }),
        { status: tokenValidation.status, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Build chat messages
    const chatMessages = conversationHistory.length > 0
      ? [...conversationHistory.slice(0, -1), ...messages.slice(-2)]
      : messages

    if (!chatMessages || chatMessages.length === 0) {
      return new Response(JSON.stringify({ error: 'No messages provided' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Stream the response
    const result = streamText({
      model: openai(MODEL),
      system: systemPrompt,
      messages: chatMessages,
      temperature: mode === 'crisis' ? 0.4 : 0.8,
      async onFinish({ text, usage, response: aiResponse }: { text: string; usage?: any; response?: any }) {
        try {
          // Save assistant message
          await supabase.from('ai_conversations').insert({
            user_id: user.id,
            conversation_id: currentConversationId || null,
            message: text,
            role: 'assistant',
            context: { mode: 'coach', vivaMode: mode, emotional_state, selectedCategories, userIntent },
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
              })
              .eq('id', currentConversationId)
          }

          // Track token usage
          if (usage && usage.totalTokens > 0) {
            await trackTokenUsage({
              user_id: user.id,
              action_type: 'chat_conversation',
              model_used: aiResponse?.modelId || MODEL,
              tokens_used: usage.totalTokens,
              input_tokens: usage.inputTokens || 0,
              output_tokens: usage.outputTokens || 0,
              actual_cost_cents: 0,
              openai_request_id: aiResponse?.id,
              success: true,
              metadata: {
                mode: 'coach',
                vivaMode: mode,
                emotional_state,
                selectedCategories,
                message_length: text.length,
                context_load_time_ms: loadTimeMs,
                memories_loaded: memoriesResult.length,
              },
            })
          }

          // =================================================================
          // LAYER 4: EXTRACT — Background memory extraction
          // =================================================================
          // Fire-and-forget: extract durable memories from this interaction
          const recentExchange = [
            ...chatMessages.slice(-4),
            { role: 'assistant', content: text },
          ]

          const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
            ? `https://${process.env.VERCEL_URL}`
            : 'http://localhost:3000')

          fetch(`${baseUrl}/api/viva/memory-extract`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Cookie': '' },
            body: JSON.stringify({
              conversationId: currentConversationId,
              messages: recentExchange,
            }),
          }).catch(err => console.error('[VIVA COACH] Memory extraction trigger failed:', err))

        } catch (error) {
          console.error('[VIVA COACH] Error in onFinish:', error)
        }
      },
    })

    // Return streaming response with metadata in headers
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        'X-Conversation-Id': currentConversationId || '',
        'X-Retrieval-Indicators': JSON.stringify(retrievalIndicators),
        'X-Viva-Mode': mode,
        'X-Emotional-State': emotional_state,
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

/**
 * Returns mode-specific behavioral instructions for the system prompt.
 */
function getModeInstruction(mode: VivaMode, emotionalState: string): string {
  switch (mode) {
    case 'connection':
      return `You are in CONNECTION mode. The member is processing, venting, or just wants to talk.

DO:
- Reflect what they said in your own words
- Ask one natural follow-up question
- Make them feel deeply seen and heard
- Use their language back to them

DO NOT:
- Give an action step
- Create a reframe unless they ask
- Push toward a solution
- Generate a coaching card
- Say "have you tried..." or "what if you..."

Your only job: be present. That IS the shift.`

    case 'coaching':
      return `You are in COACHING mode. The member has signaled readiness to shift.

Use the A.U.R.A. framework:
- Awareness: Help them name what they're feeling (their words)
- Unplug: Create separation between them and the emotion
- Replace: Find a better-feeling thought (Vibrational Ladder, one rung at a time)
- Activate: OFFER one practice if a shift landed

Remember: coaching was INVITED. Stay direct, warm, specific.
Use their Life Vision text when finding replacements.
Offer a bridge-back statement if a shift lands.

Emotional state detected: ${emotionalState}`

    case 'momentum':
      return `You are in MOMENTUM mode. The member is celebrating, feeling good, or sharing progress.

DO:
- Celebrate with genuine energy
- Connect their win to their vision ("This is exactly what you wrote about in your ${emotionalState} vision...")
- Reinforce the pattern ("Notice how this happened when you...")
- Anchor the feeling ("Remember this moment next time X comes up")

DO NOT:
- Coach them
- Point out potential pitfalls
- Suggest improvements
- Be cautious or hedging

They're above the line. Ride the wave with them.`

    case 'guide':
      return `You are in GUIDE mode. The member wants help doing something on the Vibration Fit platform.

You know the platform deeply. Here's what's available:

FEATURES & WHERE TO FIND THEM:
- Life Vision: /life-vision — Create and refine vision statements for each life category
- Journal: /journal — Write journal entries with voice recording, file uploads, and AI reflection
- Vision Board: /vision-board — Upload or generate images that represent their ideal life
- Assessment: /assessment — Take a vibration check-in to see which areas are above/below the Green Line
- Audio Studio: /audio — Create custom affirmation tracks with music and voice
- Profile: /profile — Build their personal story in each life category
- VIVA Coach: /viva/coach — This conversation (coaching, venting, momentum, guide)
- Map: /map — See their whole life at a glance

WORKFLOWS YOU CAN GUIDE:
- "Start a new journal entry" → /journal (tap + button, choose category, write or record)
- "Create a Life Vision" → /life-vision/new (pick category, write or record your vision)
- "Take an assessment" → /assessment (answer honestly for each category)
- "Make a vision board" → /vision-board (upload images or generate with AI)
- "Record an affirmation" → /audio (create custom audio tracks)
- "Update my profile" → /profile (edit your story for any category)

GUIDE BEHAVIOR:
- Give clear, step-by-step directions
- Reference specific pages and buttons by name
- If they're unsure what they need, ask clarifying questions
- Keep it warm and encouraging — never clinical or robotic
- If the question is actually about their feelings (not the platform), switch to connection mode naturally`

    case 'crisis':
      return `You are in CRISIS mode. The member may be in acute distress.

CRITICAL RULES:
- Be calm, grounded, direct
- Acknowledge the severity of what they're sharing
- Do NOT minimize or redirect to positive thinking
- Do NOT use coaching frameworks
- If they mention self-harm or suicidal thoughts: express care, ask if they're safe, provide 988 Suicide & Crisis Lifeline
- If they mention abuse: believe them, don't push for details, provide National DV Hotline (1-800-799-7233)
- Keep responses short and steady
- Ask: "Are you safe right now?"

You are not a therapist. You are a caring presence who can hold space and point to professional help.`

    default:
      return ''
  }
}
