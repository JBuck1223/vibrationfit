/**
 * VIVA Memory Extractor (Layer 4)
 *
 * Runs AFTER a coaching response is complete.
 * Analyzes the interaction and extracts durable insights worth remembering.
 *
 * What it saves:
 * - preferences: "responds well to direct language"
 * - patterns: "dips around money when business feels unclear"
 * - triggers: "gets overwhelmed when family expectations stack up"
 * - desires: "deeply wants creative freedom in work"
 * - voice_style: "prefers VIVA to ask before coaching"
 * - life_context: "just started a new business"
 * - coaching_note: "A.U.R.A. landed well when framed as experiment"
 *
 * Key principle: Save only DURABLE insights. Not every detail.
 * If it wouldn't be useful in 2 weeks, don't save it.
 */

import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { SupabaseClient } from '@supabase/supabase-js'

export interface MemoryItem {
  type: 'preference' | 'pattern' | 'trigger' | 'desire' | 'voice_style' | 'life_context' | 'coaching_note'
  category: string | null
  content: string
  confidence: number
}

export interface MemoryExtractionResult {
  memories: MemoryItem[]
  shouldGenerateCoachingCard: boolean
}

const MEMORY_EXTRACTION_PROMPT = `You are VIVA's memory system. After a coaching interaction, you extract DURABLE insights worth remembering for future conversations.

Rules:
- Only extract what would be useful in 2+ weeks
- Never store temporary emotions ("they felt sad today") — store the PATTERN ("tends to feel stuck when alone on weekends")
- Never store the literal conversation — store the INSIGHT
- Prefer updating existing knowledge over creating redundant entries
- Be concise: each memory should be one clear sentence
- Confidence: 0.3 = hunch, 0.5 = likely, 0.7 = clear signal, 0.9 = explicitly stated

Types:
- preference: how they like to be supported ("feels most supported when VIVA listens first")
- pattern: recurring behaviors or cycles ("dips around money when business investment feels unclear")
- trigger: what reliably takes them below the line ("conflict with partner about household responsibilities")
- desire: what they deeply want ("wants to feel financially free before 40")
- voice_style: how VIVA should speak to them ("responds to warm directness, not coddling")
- life_context: important life facts that persist ("has two kids under 5", "works remote")
- coaching_note: what works when coaching them ("responds well to bridge-back statements")

Categories (only if clearly relevant, otherwise null):
fun, health, travel, love, family, social, home, work, money, stuff, giving, spirituality

Also determine: should VIVA generate a Coaching Card for this session?
Only yes if: a meaningful shift happened, or a bridge-back statement was offered and landed.
Most conversations = NO coaching card (just connection).

Return JSON:
{
  "memories": [
    {"type": "...", "category": "..." or null, "content": "...", "confidence": 0.0-1.0}
  ],
  "should_generate_coaching_card": true/false
}

If nothing worth remembering, return: {"memories": [], "should_generate_coaching_card": false}
No markdown fences. JSON only.`

/**
 * Extracts durable memories from a coaching interaction.
 * Designed to run in the background (non-blocking).
 */
export async function extractMemories(
  messages: { role: string; content: string }[],
  existingMemories?: string[]
): Promise<MemoryExtractionResult> {
  try {
    // Format conversation
    const conversationText = messages
      .map(m => `${m.role === 'user' ? 'MEMBER' : 'VIVA'}: ${m.content}`)
      .join('\n\n')

    // Include existing memories so the model doesn't create duplicates
    let contextNote = ''
    if (existingMemories && existingMemories.length > 0) {
      contextNote = `\n\nExisting memories about this person (don't duplicate these):\n${existingMemories.map(m => `- ${m}`).join('\n')}\n\n`
    }

    const result = await generateText({
      model: openai('gpt-4o-mini'),
      system: MEMORY_EXTRACTION_PROMPT,
      prompt: `${contextNote}Conversation:\n\n${conversationText}`,
      temperature: 0.2,
    })

    const cleaned = result.text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    const parsed = JSON.parse(cleaned)

    const validTypes = ['preference', 'pattern', 'trigger', 'desire', 'voice_style', 'life_context', 'coaching_note']
    const validCategories = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']

    const memories: MemoryItem[] = (parsed.memories || [])
      .filter((m: any) => m.content && validTypes.includes(m.type))
      .map((m: any) => ({
        type: m.type,
        category: validCategories.includes(m.category) ? m.category : null,
        content: m.content.slice(0, 500),
        confidence: Math.min(1, Math.max(0, m.confidence || 0.5)),
      }))

    return {
      memories,
      shouldGenerateCoachingCard: parsed.should_generate_coaching_card === true,
    }
  } catch (error) {
    console.error('[VIVA Memory Extractor] Error:', error)
    return { memories: [], shouldGenerateCoachingCard: false }
  }
}

/**
 * Saves extracted memories to the database.
 * Checks for duplicates by content similarity before inserting.
 */
export async function saveMemories(
  supabase: SupabaseClient,
  userId: string,
  memories: MemoryItem[],
  sourceMessageId?: string,
  sourceConversationId?: string
): Promise<{ saved: number; skipped: number }> {
  if (memories.length === 0) return { saved: 0, skipped: 0 }

  let saved = 0
  let skipped = 0

  for (const memory of memories) {
    try {
      // Check for existing similar memory (same type + similar content)
      const { data: existing } = await supabase
        .from('viva_memory_items')
        .select('id, content, confidence')
        .eq('user_id', userId)
        .eq('type', memory.type)
        .limit(20)

      // Simple duplicate check: if content is very similar, update instead of insert
      const duplicate = existing?.find(e =>
        contentSimilarity(e.content, memory.content) > 0.7
      )

      if (duplicate) {
        // Update confidence and last_used_at if new confidence is higher
        if (memory.confidence > (duplicate.confidence || 0)) {
          await supabase
            .from('viva_memory_items')
            .update({
              content: memory.content,
              confidence: memory.confidence,
              last_used_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq('id', duplicate.id)
        } else {
          await supabase
            .from('viva_memory_items')
            .update({ last_used_at: new Date().toISOString() })
            .eq('id', duplicate.id)
        }
        skipped++
      } else {
        // Insert new memory
        await supabase.from('viva_memory_items').insert({
          user_id: userId,
          type: memory.type,
          category: memory.category,
          content: memory.content,
          confidence: memory.confidence,
          source_message_id: sourceMessageId || null,
          source_conversation_id: sourceConversationId || null,
        })
        saved++
      }
    } catch (error) {
      console.error('[VIVA Memory] Error saving memory:', error)
      skipped++
    }
  }

  return { saved, skipped }
}

/**
 * Loads existing memories for context (used during retrieval layer
 * and to prevent duplicate extraction).
 */
export async function loadMemories(
  supabase: SupabaseClient,
  userId: string,
  options?: {
    category?: string
    types?: string[]
    limit?: number
    minConfidence?: number
  }
): Promise<any[]> {
  try {
    let query = supabase
      .from('viva_memory_items')
      .select('*')
      .eq('user_id', userId)
      .order('confidence', { ascending: false })
      .order('last_used_at', { ascending: false })
      .limit(options?.limit || 20)

    if (options?.category) {
      query = query.or(`category.eq.${options.category},category.is.null`)
    }

    if (options?.types && options.types.length > 0) {
      query = query.in('type', options.types)
    }

    if (options?.minConfidence) {
      query = query.gte('confidence', options.minConfidence)
    }

    const { data, error } = await query

    if (error) {
      if (error.code === '42P01' || error.message?.includes('does not exist')) return []
      console.error('[VIVA Memory] Load error:', error)
      return []
    }

    return data || []
  } catch {
    return []
  }
}

/**
 * Simple content similarity check (word overlap ratio).
 * Not perfect but good enough to prevent obvious duplicates.
 */
function contentSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 3))
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 3))

  if (wordsA.size === 0 || wordsB.size === 0) return 0

  let overlap = 0
  for (const word of wordsA) {
    if (wordsB.has(word)) overlap++
  }

  return overlap / Math.max(wordsA.size, wordsB.size)
}
