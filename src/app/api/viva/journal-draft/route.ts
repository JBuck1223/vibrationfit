import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'

/**
 * Turn a VIVA conversation into a journal entry draft, written in the
 * member's own voice, so a flow's "save to Journal" opens the composer
 * already filled in instead of empty. Nothing is saved here; the member
 * reviews and saves it in the journal.
 *
 * POST { threadId, tag?: 'wobble' | 'win' | 'vision' }
 *   -> { title, content, tag }
 */

const MAX_TRANSCRIPT_CHARS = 14000

const DRAFT_MODEL = 'openai/gpt-4o'

interface Draft {
  title: string
  content: string
}

const isDraft = (d: unknown): d is Draft =>
  !!d && typeof (d as Draft).title === 'string' && typeof (d as Draft).content === 'string'

function parseDraft(text: string): Draft | null {
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end < start) return null
  try {
    const parsed: unknown = JSON.parse(cleaned.slice(start, end + 1))
    return isDraft(parsed) ? parsed : null
  } catch {
    return null
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { threadId, tag } = (await request.json().catch(() => ({}))) as { threadId?: string; tag?: string }
    if (!threadId) return NextResponse.json({ error: 'Missing threadId' }, { status: 400 })

    const { data: session } = await supabase
      .from('conversation_sessions')
      .select('id')
      .eq('id', threadId)
      .eq('user_id', user.id)
      .maybeSingle()
    if (!session) return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })

    const { data: rows } = await supabase
      .from('ai_conversations')
      .select('role, message')
      .eq('conversation_id', threadId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    const turns = (rows ?? []).filter((r) => typeof r.message === 'string' && r.message.trim())
    if (!turns.some((r) => r.role === 'user')) {
      return NextResponse.json({ error: 'Nothing to journal yet' }, { status: 422 })
    }

    // Keep the most recent part when a conversation is long.
    let transcript = turns.map((r) => `${r.role === 'user' ? 'Member' : 'VIVA'}: ${r.message.trim()}`).join('\n\n')
    if (transcript.length > MAX_TRANSCRIPT_CHARS) transcript = transcript.slice(-MAX_TRANSCRIPT_CHARS)

    const journalTag = tag === 'wobble' || tag === 'win' || tag === 'vision' ? tag : null
    const focus =
      journalTag === 'wobble'
        ? 'This was a wobble. Capture what happened, the thought underneath it, and the truer, better-feeling thought they found.'
        : journalTag === 'win'
          ? 'This was a win. Capture what is going well and how good it feels, savoring the details.'
          : 'Capture what they explored, how they felt, and the clarity or shift they reached.'

    const prompt = `Write a private journal entry for the member, based on their conversation with VIVA (their coach).

Write it in the first person as the member ("I"), in their own words and tone where possible, as if they wrote it themselves. ${focus}
Do not mention VIVA, a coach, a chat, or a conversation. Do not invent details that are not in the conversation. Never use the words "AI" or "artificial intelligence".
Keep it warm and honest, a few short paragraphs (roughly 120 to 250 words).
Also give it a short title (3 to 7 words).

Return JSON: {"title": string, "content": string}

Conversation:
${transcript}`

    const result = await generateText({
      model: gateway(DRAFT_MODEL),
      system: 'You write private journal entries for VibrationFit members from their own coaching conversations. Return strictly valid JSON only.',
      prompt,
      temperature: 0.6,
    })

    if (result.usage?.totalTokens) {
      trackTokenUsage({
        user_id: user.id,
        action_type: 'chat_conversation',
        model_used: 'gpt-4o',
        tokens_used: result.usage.totalTokens,
        input_tokens: result.usage.inputTokens || 0,
        output_tokens: result.usage.outputTokens || 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        success: true,
        metadata: { helper: 'viva_journal_draft', threadId },
      }).catch(() => {})
    }

    const draft = parseDraft(result.text)
    if (!draft) return NextResponse.json({ error: 'Could not draft the entry' }, { status: 502 })

    return NextResponse.json({ title: draft.title.trim(), content: draft.content.trim(), tag: journalTag })
  } catch (error) {
    console.error('journal-draft error:', error)
    return NextResponse.json({ error: 'Could not draft the entry' }, { status: 500 })
  }
}
