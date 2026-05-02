/**
 * VIVA Coach Synopsis API
 *
 * Generates a post-session "Coaching Card" — a concise artifact
 * that captures the shift, the bridge-back statement, and any
 * practice offered during a coaching conversation.
 *
 * POST: Generate synopsis for a conversation
 * GET: Fetch existing synopsis for a conversation
 */

import { openai } from '@ai-sdk/openai'
import { generateText } from 'ai'
import { createClient } from '@/lib/supabase/server'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export const dynamic = 'force-dynamic'

const MODEL = process.env.VIVA_COACH_MODEL || process.env.VIVA_MODEL || 'gpt-4o'

const SYNOPSIS_PROMPT = `You are VIVA Coach's synopsis generator. Given a coaching conversation, create a brief "Coaching Card" — something the user can revisit to reconnect with their shift.

Rules:
- Write in second person ("You came in feeling..." / "Your bridge back...")
- Keep it SHORT. The whole card should be readable in 30 seconds.
- Only include sections that actually apply to this conversation.
- If no shift happened (just processing/venting), acknowledge that and note what was explored.
- Never be cheesy or generic. Use THEIR words.
- No markdown headers — use the exact JSON structure below.

Return a JSON object with these fields (omit any that don't apply):

{
  "title": "2-5 word title capturing the session essence",
  "came_in_feeling": "1 sentence — what emotional state they arrived in",
  "explored": "1-2 sentences — what you talked about",
  "shift": "1 sentence — the realization or new perspective (if one happened)",
  "bridge_back": "The personalized bridge-back statement (if offered)",
  "practice": "The specific practice or action (if offered and accepted)",
  "closing_feeling": "1 sentence — where they seemed to land emotionally"
}

If the conversation was just someone processing/venting with no clear shift, return:

{
  "title": "2-5 word title",
  "came_in_feeling": "...",
  "explored": "...",
  "closing_feeling": "Sometimes just being heard is the shift."
}

Return ONLY the JSON object, no markdown fences or other text.`

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { conversationId } = await req.json()

    if (!conversationId) {
      return new Response(JSON.stringify({ error: 'conversationId required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Check if synopsis already exists
    const { data: existing } = await supabase
      .from('coaching_synopses')
      .select('*')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (existing) {
      return new Response(JSON.stringify({ synopsis: existing }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Load conversation messages
    const { data: messages, error: msgError } = await supabase
      .from('ai_conversations')
      .select('role, message, created_at')
      .eq('conversation_id', conversationId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (msgError || !messages || messages.length < 2) {
      return new Response(
        JSON.stringify({ error: 'Not enough conversation history for a synopsis' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Format conversation for the AI
    const conversationText = messages
      .map(msg => `${msg.role === 'user' ? 'MEMBER' : 'VIVA'}: ${msg.message}`)
      .join('\n\n')

    // Generate synopsis
    const result = await generateText({
      model: openai(MODEL),
      system: SYNOPSIS_PROMPT,
      prompt: conversationText,
      temperature: 0.6,
    })

    // Parse the JSON response
    let synopsisData: any
    try {
      const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      synopsisData = JSON.parse(cleaned)
    } catch {
      console.error('[VIVA COACH SYNOPSIS] Failed to parse AI response:', result.text)
      return new Response(
        JSON.stringify({ error: 'Failed to generate synopsis' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      )
    }

    // Save synopsis
    const { data: savedSynopsis, error: saveError } = await supabase
      .from('coaching_synopses')
      .insert({
        user_id: user.id,
        conversation_id: conversationId,
        title: synopsisData.title || 'Coaching Session',
        came_in_feeling: synopsisData.came_in_feeling || null,
        explored: synopsisData.explored || null,
        shift: synopsisData.shift || null,
        bridge_back: synopsisData.bridge_back || null,
        practice: synopsisData.practice || null,
        closing_feeling: synopsisData.closing_feeling || null,
      })
      .select()
      .single()

    if (saveError) {
      // If table doesn't exist, return the data without saving
      if (saveError.code === '42P01' || saveError.message?.includes('does not exist')) {
        return new Response(JSON.stringify({ synopsis: synopsisData, persisted: false }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
      console.error('[VIVA COACH SYNOPSIS] Save error:', saveError)
    }

    // Track token usage
    const usage = result.usage as any
    if (usage && usage.totalTokens > 0) {
      await trackTokenUsage({
        user_id: user.id,
        action_type: 'chat_conversation',
        model_used: MODEL,
        tokens_used: usage.totalTokens,
        input_tokens: usage.inputTokens || 0,
        output_tokens: usage.outputTokens || 0,
        actual_cost_cents: 0,
        success: true,
        metadata: { conversationId, type: 'coach_synopsis' },
      })
    }

    // Also update session title if synopsis has one
    if (synopsisData.title) {
      await supabase
        .from('conversation_sessions')
        .update({ title: synopsisData.title })
        .eq('id', conversationId)
    }

    return new Response(
      JSON.stringify({ synopsis: savedSynopsis || synopsisData, persisted: !!savedSynopsis }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('[VIVA COACH SYNOPSIS] Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = searchParams.get('conversationId')

    if (conversationId) {
      // Get synopsis for specific conversation
      const { data } = await supabase
        .from('coaching_synopses')
        .select('*')
        .eq('conversation_id', conversationId)
        .eq('user_id', user.id)
        .maybeSingle()

      return new Response(JSON.stringify({ synopsis: data }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Get all synopses for user (recent first)
    const { data } = await supabase
      .from('coaching_synopses')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20)

    return new Response(JSON.stringify({ synopses: data || [] }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('[VIVA COACH SYNOPSIS] GET Error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
}
