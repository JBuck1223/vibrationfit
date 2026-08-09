/**
 * VIVA Semantic Memory (member embeddings)
 *
 * Embeds member artifacts (journal entries, coach messages, stories, songs,
 * vision sections) into member_embeddings and retrieves the most relevant
 * ones at coach time. This is what powers "this connects to what you told
 * me in March" recall.
 *
 * Integration model: syncMemberEmbeddings() runs incrementally after each
 * coach turn (single integration point), so new content from any feature
 * gets picked up without touching every write path in the app.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { GATEWAY_BASE_URL } from '@/lib/ai/gateway'

const EMBEDDING_MODEL = 'text-embedding-3-small'
const MAX_CHARS_PER_ITEM = 4000
const SYNC_BATCH_LIMIT = 40

export interface SemanticMatch {
  user_id: string
  entity_type: string
  entity_id: string
  category: string | null
  content: string
  source_date: string | null
  similarity: number
}

/**
 * Embeds a batch of texts via the Vercel AI Gateway (OpenAI-compatible
 * embeddings endpoint), so embedding spend lands in the same gateway
 * billing ledger as chat completions.
 */
export async function embedTexts(texts: string[], userId?: string): Promise<number[][]> {
  if (texts.length === 0) return []

  const res = await fetch(`${GATEWAY_BASE_URL}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.AI_GATEWAY_API_KEY}`,
    },
    body: JSON.stringify({
      model: `openai/${EMBEDDING_MODEL}`,
      input: texts.map(t => t.slice(0, MAX_CHARS_PER_ITEM)),
    }),
  })

  if (!res.ok) {
    throw new Error(`Embeddings API ${res.status}: ${await res.text()}`)
  }

  const data = await res.json()

  // Cost ledger only — embeddings never deduct member tokens
  if (data.usage?.total_tokens) {
    trackTokenUsage({
      user_id: userId ?? null,
      action_type: 'background_processing',
      model_used: EMBEDDING_MODEL,
      tokens_used: data.usage.total_tokens,
      input_tokens: data.usage.total_tokens,
      output_tokens: 0,
      provider: 'openai',
      billable: false,
      success: true,
      metadata: { helper: 'member_embeddings' },
    }).catch(() => {})
  }

  return data.data.map((d: { embedding: number[] }) => d.embedding)
}

/**
 * Semantic search over a member's embedded artifacts.
 */
export async function searchMemberContext(
  supabase: SupabaseClient,
  userId: string,
  query: string,
  matchCount = 6,
  householdId?: string | null
): Promise<SemanticMatch[]> {
  try {
    const [queryEmbedding] = await embedTexts([query], userId)
    if (!queryEmbedding) return []

    const { data, error } = await supabase.rpc('match_member_embeddings', {
      p_user_id: userId,
      p_query_embedding: JSON.stringify(queryEmbedding),
      p_match_count: matchCount,
      p_min_similarity: 0.25,
      p_household_id: householdId || null,
    })

    if (error) {
      console.error('[VIVA Embeddings] Match error:', error)
      return []
    }
    return data || []
  } catch (err) {
    console.error('[VIVA Embeddings] Search failed:', err)
    return []
  }
}

interface PendingItem {
  entity_type: string
  entity_id: string
  category: string | null
  content: string
  source_date: string | null
}

/**
 * Incrementally embeds member content that doesn't have embeddings yet.
 * Bounded per run; called in the background after coach turns so the
 * index converges without a dedicated pipeline per content type.
 */
export async function syncMemberEmbeddings(
  supabase: SupabaseClient,
  userId: string,
  householdId?: string | null
): Promise<{ embedded: number }> {
  try {
    const pending: PendingItem[] = []

    const [journals, stories, songs, coachMessages, vision, profile] = await Promise.all([
      supabase
        .from('journal_entries')
        .select('id, title, content, categories, date')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(60),
      supabase
        .from('stories')
        .select('id, title, content, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40),
      supabase
        .from('songs')
        .select('id, title, lyrics, song_essence, life_categories, created_at')
        .eq('user_id', userId)
        .not('lyrics', 'is', null)
        .order('created_at', { ascending: false })
        .limit(60),
      supabase
        .from('ai_conversations')
        .select('id, role, message, created_at, context')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(120),
      supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle(),
      supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_draft', false)
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle(),
    ])

    for (const j of journals.data || []) {
      const text = [j.title, j.content].filter(Boolean).join('\n')
      if (text.trim().length < 40) continue
      pending.push({
        entity_type: 'journal_entry',
        entity_id: j.id,
        category: j.categories?.[0] || null,
        content: text,
        source_date: j.date || null,
      })
    }

    for (const s of stories.data || []) {
      const text = [s.title, s.content].filter(Boolean).join('\n')
      if (text.trim().length < 40) continue
      pending.push({
        entity_type: 'story',
        entity_id: s.id,
        category: null,
        content: text,
        source_date: s.created_at || null,
      })
    }

    for (const s of songs.data || []) {
      const essence = s.song_essence || {}
      const text = [
        s.title ? `Song: ${s.title}` : null,
        essence.core_message ? `Core truth: ${essence.core_message}` : null,
        essence.emotional_start && essence.emotional_destination
          ? `Emotional arc: ${essence.emotional_start} to ${essence.emotional_destination}`
          : null,
        s.lyrics,
      ].filter(Boolean).join('\n')
      if (text.trim().length < 40) continue
      pending.push({
        entity_type: 'song',
        entity_id: s.id,
        category: s.life_categories?.[0] || null,
        content: text,
        source_date: s.created_at || null,
      })
    }

    for (const m of coachMessages.data || []) {
      if (!m.message || m.message.length < 80) continue
      const role = m.role === 'user' ? 'MEMBER' : 'VIVA'
      pending.push({
        entity_type: 'coach_message',
        entity_id: m.id,
        category: m.context?.selectedCategories?.[0] || null,
        content: `${role}: ${m.message}`,
        source_date: m.created_at || null,
      })
    }

    const categories = ['fun', 'health', 'travel', 'love', 'family', 'social', 'home', 'work', 'money', 'stuff', 'giving', 'spirituality']

    if (vision.data) {
      for (const cat of categories) {
        const content = vision.data[cat]
        if (!content || String(content).trim().length < 50) continue
        pending.push({
          entity_type: 'vision_section',
          entity_id: `${vision.data.id}:${cat}`,
          category: cat,
          content: `Life Vision (${cat}): ${content}`,
          source_date: vision.data.created_at || null,
        })
      }
    }

    // Profile "current state" snapshots — where they are today, in their own
    // words (state_family, state_love, ...). This is how VIVA knows the
    // member's family landscape without the member re-explaining it.
    if (profile.data) {
      for (const cat of categories) {
        const content = profile.data[`state_${cat}`]
        if (!content || String(content).trim().length < 50) continue
        pending.push({
          entity_type: 'profile_state',
          entity_id: `${profile.data.id}:${cat}`,
          category: cat,
          content: `Where they are today (${cat}), from their profile: ${content}`,
          source_date: profile.data.updated_at || null,
        })
      }
    }

    if (pending.length === 0) return { embedded: 0 }

    // Filter out items that already have embeddings
    const entityIds = pending.map(p => p.entity_id)
    const { data: existing } = await supabase
      .from('member_embeddings')
      .select('entity_type, entity_id')
      .eq('user_id', userId)
      .in('entity_id', entityIds)

    const existingKeys = new Set((existing || []).map(e => `${e.entity_type}:${e.entity_id}`))
    const toEmbed = pending
      .filter(p => !existingKeys.has(`${p.entity_type}:${p.entity_id}`))
      .slice(0, SYNC_BATCH_LIMIT)

    if (toEmbed.length === 0) return { embedded: 0 }

    const embeddings = await embedTexts(toEmbed.map(p => p.content), userId)

    const rows = toEmbed.map((p, i) => ({
      user_id: userId,
      household_id: householdId || null,
      entity_type: p.entity_type,
      entity_id: p.entity_id,
      category: p.category,
      content: p.content.slice(0, MAX_CHARS_PER_ITEM),
      embedding: JSON.stringify(embeddings[i]),
      source_date: p.source_date,
    }))

    const { error } = await supabase
      .from('member_embeddings')
      .upsert(rows, { onConflict: 'entity_type,entity_id' })

    if (error) {
      console.error('[VIVA Embeddings] Upsert error:', error)
      return { embedded: 0 }
    }

    return { embedded: rows.length }
  } catch (err) {
    console.error('[VIVA Embeddings] Sync failed:', err)
    return { embedded: 0 }
  }
}
