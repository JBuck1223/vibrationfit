/**
 * VIVA Actions — in-app tools for the unified coach.
 *
 * These let VIVA *do things*, not just talk: queue songs, capture journal
 * entries, add vision board items, log abundance, set Daily Paper tasks,
 * and actualize breakthroughs into activation stories.
 *
 * Ground rules:
 * - Every tool acts as the authenticated member (RLS enforced).
 * - Nothing destructive: tools only create or append.
 * - AI generation inside tools is cost-tracked via trackTokenUsage.
 */

import { tool, generateText } from 'ai'
import { z } from 'zod'
import { SupabaseClient } from '@supabase/supabase-js'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { INCANTATION_SYSTEM_PROMPT, buildIncantationPrompt } from '@/lib/viva/prompts/incantation-prompt'
import { SPARK_QUERY_SYSTEM_PROMPT, buildSparkQueryPrompt } from '@/lib/viva/prompts/spark-query-prompt'
import { MODE_TOOL_ALLOWLIST, type VivaMode } from '@/lib/viva/modes'
import { attachCreatedAssetToKit, buildKitCoachTools, KIT_TOOLS_PROMPT } from '@/lib/viva/coach-kit-tools'
import { buildCoachReadTools, READ_TOOLS_PROMPT } from '@/lib/viva/coach-read-tools'
import type { KitSlot } from '@/lib/manifestations/types'

/** Extracts the first JSON object from a model response (handles code fences). */
function parseJsonObject(raw: string): Record<string, unknown> | null {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }
  const candidates = [text, text.match(/\{[\s\S]*\}/)?.[0]]
  for (const candidate of candidates) {
    if (!candidate) continue
    try {
      const parsed = JSON.parse(candidate)
      if (parsed && typeof parsed === 'object') return parsed as Record<string, unknown>
    } catch { /* try next candidate */ }
  }
  return null
}

const CATEGORY_ENUM = z.enum([
  'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
])

const VIVA_QUEUE_PLAYLIST = 'VIVA Queue'

export interface CoachToolsContext {
  supabase: SupabaseClient
  userId: string
  conversationId: string | null
  /** Recent conversation text, newest last — used by generation tools. */
  getConversationText: () => string
  selectedMode?: VivaMode
  overlay?: 'none' | 'platform_guide' | 'crisis'
  activeKitId?: string | null
  /** Scopes semantic search when the member shares a household lens. */
  householdId?: string | null
}

function filterToolsByMode<T extends Record<string, unknown>>(
  tools: T,
  mode: VivaMode,
  overlay?: 'none' | 'platform_guide' | 'crisis',
): Partial<T> {
  if (overlay === 'crisis') return {}
  const allow = new Set(MODE_TOOL_ALLOWLIST[mode])
  return Object.fromEntries(
    Object.entries(tools).filter(([name]) => allow.has(name))
  ) as Partial<T>
}

export function buildCoachTools(ctx: CoachToolsContext) {
  const { supabase, userId, conversationId, getConversationText } = ctx
  const kitCtx = {
    supabase,
    userId,
    conversationId,
    activeKitId: ctx.activeKitId || null,
  }

  const attach = (slot: KitSlot, entityType: string, entityId: string, kitId?: string | null) =>
    attachCreatedAssetToKit(kitCtx, { kitId, slot, entityType, entityId }).catch(() => {})

  const coreTools = {
    queue_song: tool({
      description:
        "Queue one of the member's own songs into their VIVA Queue playlist so it's ready to play. Use when a song of theirs fits the moment (matching emotional arc or life area) and they say yes to hearing it.",
      inputSchema: z.object({
        song_title: z.string().describe('Title (or distinctive part of the title) of the member song to queue'),
      }),
      execute: async ({ song_title }) => {
        // Find the member's track by title
        const { data: songs } = await supabase
          .from('songs')
          .select('id, title, lyrics, song_tracks(id, mp3_url, duration_ms, cover_url)')
          .eq('user_id', userId)
          .ilike('title', `%${song_title}%`)
          .limit(1)

        interface SongTrackRow { id: string; mp3_url: string | null; duration_ms: number | null; cover_url: string | null }
        const song = songs?.[0]
        const track = (song?.song_tracks as SongTrackRow[] | undefined)?.find(t => t.mp3_url)
        if (!song || !track) {
          return { success: false, message: `No playable song found matching "${song_title}".` }
        }

        // Find or create the VIVA Queue playlist
        let { data: playlist } = await supabase
          .from('user_playlists')
          .select('id')
          .eq('user_id', userId)
          .eq('name', VIVA_QUEUE_PLAYLIST)
          .maybeSingle()

        if (!playlist) {
          const { data: created, error: createError } = await supabase
            .from('user_playlists')
            .insert({ user_id: userId, name: VIVA_QUEUE_PLAYLIST, description: 'Songs VIVA queued for you', sort_order: 0 })
            .select('id')
            .single()
          if (createError || !created) {
            return { success: false, message: 'Could not create the VIVA Queue playlist.' }
          }
          playlist = created
        }

        // Skip if already queued
        const { data: existingTrack } = await supabase
          .from('user_playlist_tracks')
          .select('id')
          .eq('playlist_id', playlist.id)
          .eq('source_id', track.id)
          .maybeSingle()

        if (existingTrack) {
          return { success: true, message: `"${song.title}" is already in the VIVA Queue.`, link: '/audio' }
        }

        const { data: lastTrack } = await supabase
          .from('user_playlist_tracks')
          .select('position')
          .eq('playlist_id', playlist.id)
          .order('position', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { error } = await supabase.from('user_playlist_tracks').insert({
          playlist_id: playlist.id,
          source_type: 'music',
          source_id: track.id,
          position: (lastTrack?.position ?? -1) + 1,
          track_data: {
            id: track.id,
            title: song.title,
            artist: 'You',
            duration: Math.round((track.duration_ms || 0) / 1000),
            url: track.mp3_url,
            thumbnail: track.cover_url || undefined,
            plainLyrics: song.lyrics || undefined,
          },
        })

        if (error) return { success: false, message: 'Could not queue the song.' }
        await attach('song', 'songs', song.id, null)
        return {
          success: true,
          message: `Queued "${song.title}" in your VIVA Queue playlist.`,
          link: '/audio',
        }
      },
    }),

    save_journal_entry: tool({
      description:
        'Save a journal entry for the member, capturing something meaningful they just expressed or realized. Always confirm with the member before saving, and write it in their voice (first person).',
      inputSchema: z.object({
        title: z.string().describe('Short evocative title'),
        content: z.string().describe("The entry, in the member's first-person voice, drawn from what they actually said"),
        category: CATEGORY_ENUM.nullable().describe('Life category if clearly relevant'),
        journal_tag: z.enum(['vision', 'win', 'wobble']).nullable().describe('vision = manifestation seed / chosen reality; win = becoming evidence; wobble = contrast'),
        kit_id: z.string().uuid().nullable(),
      }),
      execute: async ({ title, content, category, journal_tag, kit_id }) => {
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            date: new Date().toISOString().slice(0, 10),
            title,
            content,
            categories: category ? [category] : null,
            journal_tag: journal_tag || null,
          })
          .select('id')
          .single()

        if (error || !data) return { success: false, message: 'Could not save the journal entry.' }
        await attach(journal_tag === 'win' ? 'journal' : 'journal', 'journal_entries', data.id, kit_id)
        return { success: true, message: `Saved "${title}" to your journal.`, link: `/journal/${data.id}` }
      },
    }),

    add_vision_board_item: tool({
      description:
        'Add a desire to the member\'s vision board. Use when they express a clear specific want ("I want to take the kids to Japan"). Confirm before adding.',
      inputSchema: z.object({
        name: z.string().describe('The desire, short and specific'),
        description: z.string().nullable().describe('One or two sentences of detail, in their words'),
        category: CATEGORY_ENUM.nullable(),
        kit_id: z.string().uuid().nullable(),
      }),
      execute: async ({ name, description, category, kit_id }) => {
        const { data, error } = await supabase.from('vision_board_items').insert({
          user_id: userId,
          name,
          description: description || null,
          categories: category ? [category] : null,
          status: 'active',
        }).select('id').single()

        if (error || !data) return { success: false, message: 'Could not add the vision board item.' }
        await attach('vision_board', 'vision_board_items', data.id, kit_id)
        return { success: true, message: `Added "${name}" to your vision board.`, link: '/vision-board' }
      },
    }),

    log_abundance_event: tool({
      description:
        'Log an abundance event (money or value received) the member just mentioned. Use when they share income, a gift, savings, or value they received. Confirm amount before logging.',
      inputSchema: z.object({
        amount: z.number().describe('Dollar amount'),
        value_type: z.enum(['money', 'value']).describe('money = actual dollars received; value = non-cash value received'),
        note: z.string().describe('Short note about what it was'),
        category: CATEGORY_ENUM.nullable(),
        kit_id: z.string().uuid().nullable(),
      }),
      execute: async ({ amount, value_type, note, category, kit_id }) => {
        const { data, error } = await supabase.from('abundance_events').insert({
          user_id: userId,
          date: new Date().toISOString().slice(0, 10),
          amount,
          value_type,
          note,
          vision_category: category,
        }).select('id').single()

        if (error || !data) return { success: false, message: 'Could not log the abundance event.' }
        await attach('abundance', 'abundance_events', data.id, kit_id)
        return {
          success: true,
          message: `Logged $${amount.toLocaleString()} (${value_type}) — "${note}".`,
          link: '/abundance-tracker',
        }
      },
    }),

    add_daily_paper_task: tool({
      description:
        "Add a task to the member's Daily Paper for today (three slots). Use when a concrete next step emerges from the conversation and they want to commit to it.",
      inputSchema: z.object({
        task: z.string().describe('The task, short and actionable'),
      }),
      execute: async ({ task }) => {
        const today = new Date().toISOString().slice(0, 10)
        const { data: paper } = await supabase
          .from('daily_papers')
          .select('id, task_one, task_two, task_three')
          .eq('user_id', userId)
          .eq('entry_date', today)
          .maybeSingle()

        if (!paper) {
          const { error } = await supabase.from('daily_papers').insert({
            user_id: userId,
            entry_date: today,
            task_one: task,
          })
          if (error) return { success: false, message: 'Could not create today\'s Daily Paper.' }
          return { success: true, message: `Added to today's Daily Paper: "${task}".`, link: '/daily-paper' }
        }

        const slot = !paper.task_one ? 'task_one' : !paper.task_two ? 'task_two' : !paper.task_three ? 'task_three' : null
        if (!slot) {
          return { success: false, message: "Today's Daily Paper already has three tasks." }
        }

        const { error } = await supabase
          .from('daily_papers')
          .update({ [slot]: task, updated_at: new Date().toISOString() })
          .eq('id', paper.id)

        if (error) return { success: false, message: 'Could not add the task.' }
        await attach('daily_paper', 'daily_papers', paper.id, null)
        return { success: true, message: `Added to today's Daily Paper: "${task}".`, link: '/daily-paper' }
      },
    }),

    create_activation_story: tool({
      description:
        'Actualize a breakthrough from this conversation into an activation story — a short first-person, present-tense story of the member living the new belief. Offer this at the end of a session where a real shift landed. Confirm before creating.',
      inputSchema: z.object({
        title: z.string().describe('Story title'),
        focus: z.string().describe('The shift or new belief the story should embody, in one sentence'),
      }),
      execute: async ({ title, focus }) => {
        const conversationText = getConversationText()

        const result = await generateText({
          model: gateway('openai/gpt-4o'),
          system: `You write activation stories for VibrationFit members — short first-person, present-tense stories (250-400 words) of the member already living a new belief. Grounded in their real life and words, vivid and sensory, emotionally believable (no fantasy leaps). Use their own phrases from the conversation where possible. No headings, no bullet points — one flowing story.`,
          prompt: `The shift to embody: ${focus}\n\nThe conversation it emerged from:\n\n${conversationText.slice(0, 8000)}\n\nWrite the activation story.`,
          temperature: 0.8,
        })

        if (result.usage?.totalTokens) {
          trackTokenUsage({
            user_id: userId,
            action_type: 'chat_conversation',
            model_used: 'gpt-4o',
            tokens_used: result.usage.totalTokens,
            input_tokens: result.usage.inputTokens || 0,
            output_tokens: result.usage.outputTokens || 0,
            provider: 'vercel_gateway',
            provider_request_id: gatewayGenerationId(result),
            success: true,
            metadata: { helper: 'viva_activation_story' },
          }).catch(() => {})
        }

        const content = result.text.trim()
        if (!content) return { success: false, message: 'Story generation came back empty.' }

        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: userId,
            entity_type: 'custom',
            entity_id: conversationId,
            title,
            content,
            word_count: content.split(/\s+/).length,
            source: 'ai_generated',
            status: 'completed',
            metadata: { created_by: 'viva_coach', focus },
          })
          .select('id')
          .single()

        if (error || !data) return { success: false, message: 'Could not save the story.' }
        await attach('story', 'stories', data.id, null)
        return {
          success: true,
          message: `Created your activation story "${title}".`,
          link: `/story/${data.id}`,
          preview: content.slice(0, 200),
        }
      },
    }),

    create_incantation: tool({
      description:
        'Create an incantation — a short (30-100 word), rhythmic, repeatable declaration for vocal practice — from the energy of this conversation. Offer when a new belief or desire crystallizes and the member wants language to encode it. Ask their framework preference first (self-powered, or invoking a divine name like God/the Universe/Source) unless you already know it. Confirm before creating.',
      inputSchema: z.object({
        focus: z.string().describe('The emotional voltage to build around — the belief or desire to encode, in one sentence'),
        framework: z.enum(['self', 'spiritual']).describe("'self' = identity-as-truth, no external reference; 'spiritual' = seals with a divine name"),
        divine_name: z.string().nullable().describe("The divine name to invoke (e.g. God, the Universe, Source). Required when framework is 'spiritual'."),
      }),
      execute: async ({ focus, framework, divine_name }) => {
        if (framework === 'spiritual' && !divine_name?.trim()) {
          return { success: false, message: 'A spiritual incantation needs a divine name — ask which one they connect with.' }
        }

        const result = await generateText({
          model: gateway('openai/gpt-4o'),
          system: INCANTATION_SYSTEM_PROMPT,
          prompt: buildIncantationPrompt({
            sourceContent: getConversationText().slice(0, 8000),
            sourceLabel: 'VIVA conversation',
            framework,
            divineName: divine_name?.trim() || undefined,
            intent: focus,
          }),
          temperature: 0.8,
        })

        if (result.usage?.totalTokens) {
          trackTokenUsage({
            user_id: userId,
            action_type: 'incantation_generation',
            model_used: 'gpt-4o',
            tokens_used: result.usage.totalTokens,
            input_tokens: result.usage.inputTokens || 0,
            output_tokens: result.usage.outputTokens || 0,
            provider: 'vercel_gateway',
            provider_request_id: gatewayGenerationId(result),
            success: true,
            metadata: { helper: 'viva_coach_incantation' },
          }).catch(() => {})
        }

        const parsed = parseJsonObject(result.text)
        const text = typeof parsed?.text === 'string' ? parsed.text.trim() : ''
        if (!text) return { success: false, message: 'Incantation generation came back empty.' }
        const title = (typeof parsed?.title === 'string' && parsed.title.trim()) || 'Incantation'

        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: userId,
            entity_type: 'custom',
            entity_id: conversationId || crypto.randomUUID(),
            title,
            content: text,
            word_count: text.split(/\s+/).filter(Boolean).length,
            source: 'ai_generated',
            status: 'completed',
            metadata: {
              is_incantation: true,
              source_label: 'VIVA conversation',
              framework,
              divine_name: framework === 'self' ? null : divine_name?.trim() || null,
              intent: focus,
              mode: typeof parsed?.mode === 'string' ? parsed.mode : null,
              force: typeof parsed?.force === 'string' ? parsed.force : null,
              created_by: 'viva_coach',
            },
          })
          .select('id')
          .single()

        if (error || !data) return { success: false, message: 'Could not save the incantation.' }
        await attach('incantation', 'stories', data.id, null)
        return {
          success: true,
          message: `Created your incantation "${title}".`,
          link: `/story/${data.id}`,
          incantation: text,
        }
      },
    }),

    create_spark_query: tool({
      description:
        'Create a SparkQuery set — 3 empowering "Why am I / Why do I / Why does" questions that presuppose the desired reality — from this conversation. Offer when a limiting belief has been flipped or a new self-concept is emerging and daily reinforcement would help. Confirm before creating.',
      inputSchema: z.object({
        focus: z.string().describe('The desired outcome or identity shift the questions should presuppose, in one sentence'),
      }),
      execute: async ({ focus }) => {
        const result = await generateText({
          model: gateway('openai/gpt-4o'),
          system: SPARK_QUERY_SYSTEM_PROMPT,
          prompt: buildSparkQueryPrompt({
            sourceContent: getConversationText().slice(0, 8000),
            sourceLabel: 'VIVA conversation',
            intent: focus,
          }),
          temperature: 0.8,
        })

        if (result.usage?.totalTokens) {
          trackTokenUsage({
            user_id: userId,
            action_type: 'spark_query_generation',
            model_used: 'gpt-4o',
            tokens_used: result.usage.totalTokens,
            input_tokens: result.usage.inputTokens || 0,
            output_tokens: result.usage.outputTokens || 0,
            provider: 'vercel_gateway',
            provider_request_id: gatewayGenerationId(result),
            success: true,
            metadata: { helper: 'viva_coach_spark_query' },
          }).catch(() => {})
        }

        const parsed = parseJsonObject(result.text)
        const questions = Array.isArray(parsed?.questions)
          ? (parsed.questions as unknown[])
              .filter((q): q is string => typeof q === 'string' && q.trim().length > 0)
              .map(q => (q.trim().endsWith('?') ? q.trim() : `${q.trim()}?`))
          : []
        if (questions.length !== 3) return { success: false, message: 'SparkQuery generation came back malformed.' }
        const title = (typeof parsed?.title === 'string' && parsed.title.trim()) || 'SparkQuery™'
        const content = questions.map((q, i) => `${i + 1}. ${q}`).join('\n')

        const { data, error } = await supabase
          .from('stories')
          .insert({
            user_id: userId,
            entity_type: 'custom',
            entity_id: conversationId || crypto.randomUUID(),
            title,
            content,
            word_count: content.split(/\s+/).filter(Boolean).length,
            source: 'ai_generated',
            status: 'completed',
            metadata: {
              is_spark_query: true,
              source_label: 'VIVA conversation',
              intent: focus,
              questions,
              title,
              created_by: 'viva_coach',
            },
          })
          .select('id')
          .single()

        if (error || !data) return { success: false, message: 'Could not save the SparkQuery set.' }
        await attach('spark_query', 'stories', data.id, null)
        return {
          success: true,
          message: `Created your SparkQuery set "${title}".`,
          link: `/story/${data.id}`,
          questions,
        }
      },
    }),
  }

  const kitTools = buildKitCoachTools(kitCtx)
  const readTools = buildCoachReadTools({ supabase, userId, householdId: ctx.householdId })
  const allTools = { ...coreTools, ...kitTools, ...readTools }
  return filterToolsByMode(allTools, ctx.selectedMode || 'auto', ctx.overlay)
}

/**
 * System-prompt section describing VIVA's in-app abilities.
 */
export const COACH_TOOLS_PROMPT = `${READ_TOOLS_PROMPT}

## WHAT YOU CAN DO IN THE APP (actions)

You can take real actions in the member's VibrationFit account, right from this conversation — only the tools available in this thread's mode will work.

- **Queue a song** (queue_song): when one of THEIR songs fits this moment, offer to queue it
- **Save a journal entry** (save_journal_entry): when they express something worth keeping, offer to capture it. Use journal_tag vision for a manifestation seed, win for becoming evidence.
- **Add a vision board item** (add_vision_board_item): when a clear desire surfaces
- **Log abundance** (log_abundance_event): when they mention money or value received
- **Add a Daily Paper task** (add_daily_paper_task): when a concrete next step emerges
- **Create an activation story** (create_activation_story): when a real shift lands, offer to actualize it into a story they can rehearse
- **Create an incantation** (create_incantation): when a new belief crystallizes and they want charged, repeatable language to encode it — ask whether they want it self-powered or sealed with a divine name (God, the Universe, Source) unless you already know
- **Create a SparkQuery set** (create_spark_query): when a limiting belief has been flipped or a new self-concept is emerging — three "Why am I...?" questions that presuppose the new reality for daily practice

${KIT_TOOLS_PROMPT}

Rules for actions:
- OFFER, then act on their yes. Never act on ambiguous consent.
- After a tool runs, confirm in one short natural sentence and include the returned link as a markdown link. Don't narrate the mechanics.
- If a tool fails, say so simply and move on — never fake success.
- Actions serve the conversation, not the other way around. Most conversations need zero actions.
- For anything you can't do directly, point them to the right page as a markdown link (e.g. [your Life Vision](/life-vision) or [My Manifestations](/manifestations)).
- To turn this conversation's shift into a NEW song, send them to the [Songwriter](/audio/songwriter) — you can suggest the emotional arc and core message to use. Queue the manifestation slot as a handoff; do not fake success.`
