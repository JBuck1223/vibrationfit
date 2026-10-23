import { SupabaseClient } from '@supabase/supabase-js'

export type HistoryMessage = { role: 'user' | 'assistant'; content: string }

/**
 * Hard ceiling on messages pulled from the DB per turn. Very few sessions get
 * anywhere near this; it exists so a runaway thread cannot blow the context.
 */
export const CONVERSATION_HISTORY_MAX_MESSAGES = 200

/**
 * Character budget for history sent to the model (~40k tokens). The newest
 * messages are always kept; the oldest are dropped first once the budget is
 * exceeded. Misty's 58-message body love note session was ~62k chars total,
 * so typical long sessions fit in full.
 */
export const CONVERSATION_HISTORY_MAX_CHARS = 160_000

interface LoadOptions {
  maxMessages?: number
  maxChars?: number
}

/**
 * Loads the most recent messages of a conversation in chronological order.
 *
 * Fetches newest-first so the limit keeps the END of the thread, then reverses.
 * (Ordering ascending with a limit returns the FIRST N messages, which froze
 * VIVA's memory at message 20 of every long session.)
 */
export async function loadConversationHistory(
  supabase: SupabaseClient,
  conversationId: string,
  userId: string,
  options: LoadOptions = {}
): Promise<HistoryMessage[]> {
  const maxMessages = options.maxMessages ?? CONVERSATION_HISTORY_MAX_MESSAGES
  const maxChars = options.maxChars ?? CONVERSATION_HISTORY_MAX_CHARS

  const { data } = await supabase
    .from('ai_conversations')
    .select('role, message')
    .eq('conversation_id', conversationId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(maxMessages)

  if (!data || data.length === 0) return []

  const kept: HistoryMessage[] = []
  let chars = 0
  for (const row of data) {
    const content = typeof row.message === 'string' ? row.message : ''
    if (kept.length > 0 && chars + content.length > maxChars) break
    kept.push({ role: row.role === 'assistant' ? 'assistant' : 'user', content })
    chars += content.length
  }

  return kept.reverse()
}

/**
 * Combines DB history with the tail of the client's messages array.
 *
 * The DB is the source of truth for everything that came before; the client's
 * last two messages (previous assistant reply + current user turn) are the
 * source of truth for the current exchange, since the user message may or may
 * not have finished saving by the time history is read. Any trailing history
 * rows that duplicate the incoming tail are dropped so nothing is sent twice.
 */
export function mergeHistoryWithIncoming<T extends HistoryMessage>(
  history: HistoryMessage[],
  incoming: T[]
): (HistoryMessage | T)[] {
  const tail = incoming.slice(-2)
  if (tail.length === 0) return history

  const merged: HistoryMessage[] = [...history]
  const matchesTail = (m: HistoryMessage) =>
    tail.some(t => t.role === m.role && (t.content ?? '').trim() === (m.content ?? '').trim())

  let pops = 0
  while (merged.length > 0 && pops < tail.length && matchesTail(merged[merged.length - 1])) {
    merged.pop()
    pops++
  }

  return [...merged, ...tail]
}
