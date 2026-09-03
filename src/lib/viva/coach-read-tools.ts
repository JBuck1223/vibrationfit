/**
 * VIVA Read Tools — on-demand access to everything the member has created.
 *
 * The ambient context stays lean (interpreter philosophy). When the
 * conversation needs the member's actual copy — the full Life Vision text,
 * a journal entry, song lyrics — VIVA fetches it here instead of asking the
 * member to paste in content the platform already stores.
 *
 * Ground rules:
 * - Read-only, always as the authenticated member (RLS enforced).
 * - Returns full copy (capped for prompt safety), not the truncated
 *   summaries used for ambient context.
 * - No AI calls inside these tools; they are pure data fetches.
 */

import { tool } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { searchMemberContext } from '@/lib/viva/embeddings'

const LIFE_CATEGORIES = [
  'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
] as const

const CATEGORY_ENUM = z.enum(LIFE_CATEGORIES)

/** Global cap per read so a single fetch can't blow up the context window. */
const MAX_READ_CHARS = 14000

export interface CoachReadToolsContext {
  supabase: SupabaseClient
  userId: string
  householdId?: string | null
}

function cap(text: string, max = MAX_READ_CHARS): string {
  return text.length > max ? `${text.slice(0, max)}\n\n[...truncated — ask to read a specific section for the rest]` : text
}

function formatVisionSections(
  vision: Record<string, unknown>,
  category?: string | null
): string {
  const cats = category ? [category] : [...LIFE_CATEGORIES]
  const sections: string[] = []
  for (const cat of cats) {
    const content = vision[cat]
    if (typeof content === 'string' && content.trim()) {
      sections.push(`### ${cat}\n${content.trim()}`)
    }
  }
  return sections.length > 0
    ? sections.join('\n\n')
    : category
      ? `No vision text written for "${category}" yet.`
      : 'No vision text written yet.'
}

export function buildCoachReadTools(ctx: CoachReadToolsContext) {
  const { supabase, userId } = ctx

  return {
    read_member_content: tool({
      description:
        "Read the member's actual content from their VibrationFit account: full Life Vision text, open vision draft, journal entries, activation stories, song lyrics, Daily Papers, profile snapshots, vision board, abundance log, or past conversation threads. Use this whenever the conversation needs their real copy — NEVER ask the member to paste or re-type content that lives on the platform.",
      inputSchema: z.object({
        source: z.enum([
          'life_vision',
          'vision_draft',
          'journal',
          'stories',
          'songs',
          'daily_papers',
          'profile',
          'vision_board',
          'abundance',
          'conversations',
        ]),
        category: CATEGORY_ENUM.nullable().describe(
          'Optional life category filter (life_vision section, journal, songs, profile snapshot)'
        ),
        limit: z.number().int().min(1).max(20).nullable().describe(
          'How many items to return for list sources (defaults are sensible)'
        ),
      }),
      execute: async ({ source, category, limit }) => {
        try {
          switch (source) {
            case 'life_vision': {
              const { data: vision } = await supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (!vision) {
                return { success: true, content: 'They have no Life Vision yet. This could be the moment to start one.' }
              }
              return {
                success: true,
                vision_id: vision.id,
                content: cap(`# Their active Life Vision${vision.title ? ` — "${vision.title}"` : ''}\n\n${formatVisionSections(vision, category)}`),
              }
            }

            case 'vision_draft': {
              const { data: draft } = await supabase
                .from('vision_versions')
                .select('*')
                .eq('user_id', userId)
                .eq('is_draft', true)
                .eq('is_active', false)
                .is('household_id', null)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (!draft) {
                return { success: true, content: 'No open vision draft. Drafting a category will create one.' }
              }
              return {
                success: true,
                draft_id: draft.id,
                content: cap(`# Their open vision draft${draft.title ? ` — "${draft.title}"` : ''}\n\n${formatVisionSections(draft, category)}`),
              }
            }

            case 'journal': {
              let query = supabase
                .from('journal_entries')
                .select('date, title, content, categories')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(limit ?? 5)
              if (category) query = query.overlaps('categories', [category])

              const { data } = await query
              if (!data || data.length === 0) {
                return { success: true, content: category ? `No journal entries in "${category}".` : 'No journal entries yet.' }
              }
              const entries = data.map(e =>
                `### ${e.date}${e.title ? ` — ${e.title}` : ''}${e.categories?.length ? ` (${e.categories.join(', ')})` : ''}\n${e.content || ''}`
              )
              return { success: true, content: cap(entries.join('\n\n')) }
            }

            case 'stories': {
              const { data } = await supabase
                .from('stories')
                .select('title, content, status, created_at')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(limit ?? 5)
              if (!data || data.length === 0) {
                return { success: true, content: 'No activation stories yet.' }
              }
              const items = data.map(s =>
                `### ${s.title || 'Untitled'} (${s.status}, ${String(s.created_at).slice(0, 10)})\n${s.content || ''}`
              )
              return { success: true, content: cap(items.join('\n\n')) }
            }

            case 'songs': {
              let query = supabase
                .from('songs')
                .select('title, lyrics, song_essence, life_categories, created_at')
                .eq('user_id', userId)
                .not('lyrics', 'is', null)
                .order('created_at', { ascending: false })
                .limit(limit ?? 3)
              if (category) query = query.overlaps('life_categories', [category])

              const { data } = await query
              if (!data || data.length === 0) {
                return { success: true, content: category ? `No songs in "${category}".` : 'No songs with lyrics yet.' }
              }
              const items = data.map(s => {
                const essence = (s.song_essence || {}) as Record<string, string>
                const head = [
                  essence.core_message ? `Core truth: ${essence.core_message}` : null,
                  essence.emotional_start && essence.emotional_destination
                    ? `Arc: ${essence.emotional_start} → ${essence.emotional_destination}`
                    : null,
                ].filter(Boolean).join(' | ')
                return `### ${s.title || 'Untitled'}${head ? `\n${head}` : ''}\n\n${s.lyrics}`
              })
              return { success: true, content: cap(items.join('\n\n---\n\n')) }
            }

            case 'daily_papers': {
              const { data } = await supabase
                .from('daily_papers')
                .select('entry_date, gratitude, fun_plan')
                .eq('user_id', userId)
                .order('entry_date', { ascending: false })
                .limit(limit ?? 7)
              if (!data || data.length === 0) {
                return { success: true, content: 'No Daily Papers yet.' }
              }
              const items = data.map(p =>
                `### ${p.entry_date}\n${p.gratitude ? `Gratitude: ${p.gratitude}` : ''}${p.fun_plan ? `\nFun plan: ${p.fun_plan}` : ''}`.trim()
              )
              return { success: true, content: cap(items.join('\n\n')) }
            }

            case 'profile': {
              const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .eq('is_draft', false)
                .order('updated_at', { ascending: false })
                .limit(1)
                .maybeSingle()

              if (!profile) return { success: true, content: 'No profile yet.' }

              const facts: string[] = []
              if (profile.relationship_status) {
                facts.push(`Relationship: ${profile.relationship_status}${profile.partner_name ? ` — partner: ${profile.partner_name}` : ''}${profile.relationship_length ? ` (${profile.relationship_length})` : ''}`)
              }
              const children = Array.isArray(profile.children) ? profile.children : []
              if (children.length > 0) {
                const kids = children
                  .map((c: { first_name?: string; birthday?: string }) => {
                    const name = (c.first_name || '').trim()
                    if (!name) return null
                    const age = c.birthday
                      ? Math.floor((Date.now() - new Date(c.birthday).getTime()) / (365.25 * 24 * 3600 * 1000))
                      : null
                    return age !== null && age >= 0 && age < 120 ? `${name} (${age})` : name
                  })
                  .filter(Boolean)
                  .join(', ')
                if (kids) facts.push(`Children: ${kids}`)
              }
              if (profile.occupation) facts.push(`Work: ${profile.occupation}${profile.company ? ` at ${profile.company}` : ''}`)
              if (profile.city || profile.state) facts.push(`Location: ${[profile.city, profile.state].filter(Boolean).join(', ')}`)

              const cats = category ? [category] : [...LIFE_CATEGORIES]
              const snapshots: string[] = []
              for (const cat of cats) {
                const story = profile[`state_${cat}`]
                if (typeof story === 'string' && story.trim()) {
                  snapshots.push(`### Where they are today — ${cat}\n${story.trim()}`)
                }
              }

              return {
                success: true,
                content: cap([facts.join(' | '), snapshots.join('\n\n')].filter(Boolean).join('\n\n')),
              }
            }

            case 'vision_board': {
              const [active, actualized] = await Promise.all([
                supabase
                  .from('manifestations')
                  .select('name, description, categories, created_at')
                  .eq('user_id', userId)
                  .eq('status', 'active')
                  .order('created_at', { ascending: false })
                  .limit(limit ?? 15),
                supabase
                  .from('manifestations')
                  .select('name, actualization_story, categories, actualized_at')
                  .eq('user_id', userId)
                  .eq('status', 'actualized')
                  .order('actualized_at', { ascending: false, nullsFirst: false })
                  .limit(limit ?? 15),
              ])
              const parts: string[] = []
              if (active.data?.length) {
                parts.push(`## Active desires\n${active.data.map(i => `- ${i.name}${i.description ? ` — ${i.description}` : ''}${i.categories?.length ? ` (${i.categories.join(', ')})` : ''}`).join('\n')}`)
              }
              if (actualized.data?.length) {
                parts.push(`## Actualized (their evidence bank)\n${actualized.data.map(i => `- ${i.name}${i.actualization_story ? ` — ${i.actualization_story}` : ''}`).join('\n')}`)
              }
              return { success: true, content: cap(parts.join('\n\n') || 'Vision board is empty.') }
            }

            case 'abundance': {
              const { data } = await supabase
                .from('abundance_events')
                .select('date, value_type, amount, note, vision_category')
                .eq('user_id', userId)
                .order('date', { ascending: false })
                .limit(limit ?? 15)
              if (!data || data.length === 0) {
                return { success: true, content: 'No abundance events logged yet.' }
              }
              let totalMoney = 0
              let totalValue = 0
              for (const e of data) {
                if (e.value_type === 'money') totalMoney += Number(e.amount) || 0
                else totalValue += Number(e.amount) || 0
              }
              const lines = data.map(e =>
                `- ${e.date}: ${e.value_type === 'money' ? '$' : ''}${e.amount}${e.value_type !== 'money' ? ` (${e.value_type})` : ''}${e.note ? ` — ${e.note}` : ''}${e.vision_category ? ` [${e.vision_category}]` : ''}`
              )
              return {
                success: true,
                content: cap(`Recent flow (last ${data.length}): $${totalMoney} money, ${totalValue} value\n${lines.join('\n')}`),
              }
            }

            case 'conversations': {
              const { data } = await supabase
                .from('conversation_sessions')
                .select('title, preview_message, mode, last_message_at, pinned')
                .eq('user_id', userId)
                .order('last_message_at', { ascending: false, nullsFirst: false })
                .limit(limit ?? 10)
              if (!data || data.length === 0) {
                return { success: true, content: 'No past conversations.' }
              }
              const lines = data.map(c =>
                `- ${String(c.title || c.preview_message || 'Untitled').slice(0, 120)}${c.pinned ? ' (pinned)' : ''} — ${c.last_message_at ? String(c.last_message_at).slice(0, 10) : ''}`
              )
              return { success: true, content: cap(lines.join('\n')) }
            }
          }
        } catch (err) {
          console.error('[VIVA Read Tools] read_member_content failed:', err)
          return { success: false, content: 'Could not read that right now.' }
        }
      },
    }),

    search_member_history: tool({
      description:
        "Semantic search across everything the member has ever written on the platform — journals, past coaching conversations, stories, song lyrics, Life Vision sections, profile snapshots. Use when you need to find where they wrote about something specific ('where did I talk about my father', 'what did I say about money fear').",
      inputSchema: z.object({
        query: z.string().min(3).describe('What to search for, in natural language'),
        limit: z.number().int().min(1).max(12).nullable(),
      }),
      execute: async ({ query, limit }) => {
        try {
          const matches = await searchMemberContext(supabase, userId, query, limit ?? 8, ctx.householdId)
          if (matches.length === 0) {
            return { success: true, content: 'Nothing closely related found in their history.' }
          }
          const lines = matches.map(m =>
            `- [${m.entity_type.replace(/_/g, ' ')}${m.source_date ? `, ${String(m.source_date).slice(0, 10)}` : ''}${m.category ? `, ${m.category}` : ''}] ${m.content.slice(0, 500)}`
          )
          return { success: true, content: cap(lines.join('\n')) }
        } catch (err) {
          console.error('[VIVA Read Tools] search_member_history failed:', err)
          return { success: false, content: 'Search is unavailable right now.' }
        }
      },
    }),
  }
}

export const READ_TOOL_NAMES = ['read_member_content', 'search_member_history'] as const

/**
 * System-prompt section describing VIVA's read access.
 */
export const READ_TOOLS_PROMPT = `## WHAT YOU CAN READ (their content, on demand)

You have direct read access to everything this member has created on the platform:

- **read_member_content**: their full Life Vision text (all categories or one), open vision draft, journal entries, activation stories, song lyrics, Daily Papers, profile snapshots, vision board, abundance log, past conversation threads
- **search_member_history**: semantic search across everything they have ever written, when you need to find where they said something

Rules for reading:
- NEVER ask the member to paste, re-type, or summarize content that lives on the platform. If you need their vision, journal, or any of their words — fetch it, then work with it conversationally.
- Fetch silently. Never say "let me search my database" or narrate retrieval. You simply know them; reading is how.
- When editing their Life Vision: read the current wording first (read_member_content with source life_vision), propose changes against their actual words, then draft on their yes.
- Read what the moment needs, not everything you can.`
