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
import { attachAssetToManifestations, attachCreatedAssetToKit, buildKitCoachTools, KIT_TOOLS_PROMPT } from '@/lib/viva/coach-kit-tools'
import { buildCoachReadTools, READ_TOOLS_PROMPT } from '@/lib/viva/coach-read-tools'
import { composeVivaJournalContent } from '@/lib/journal/compose-viva-entry'
import { seedVisionUpdateProposals } from '@/lib/life-vision/seed-vision-update'
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
        'Save a journal entry after the member says yes. Classify from why they asked / why the conversation exists, not from mood. Contrast they came in with — even if clarity landed — is wobble. Evidence that something they have been creating showed up is win. A chosen reality they want to keep is vision. For a wobble, pass wobble_summary (their contrast), clarity (what you noticed — not forced first person), and chosen_truth (their sentence if they have one). Do not also write a Win from the same wobble turn.',
      inputSchema: z.object({
        title: z.string().describe('Short evocative title'),
        content: z.string().describe('Win/vision body in their first-person voice. For a wobble, the contrast if wobble_summary is empty.'),
        wobble_summary: z.string().nullable().describe('The wobble in their words — what they were experiencing'),
        clarity: z.string().nullable().describe('The insight you noticed. Second person is fine. Do not force first person.'),
        chosen_truth: z.string().nullable().describe('The sentence they chose, first person, if they landed one'),
        recommended_tool: z.string().nullable().describe('Next experience you already offered this turn, if any: viva, vision_audio, activation_story, incantation, spark_query, song, manifestations, daily_paper, abundance, vibe_tribe, alignment_gym'),
        category: CATEGORY_ENUM.nullable().describe('Life category if clearly relevant'),
        journal_tag: z.enum(['vision', 'win', 'wobble']).nullable().describe('vision = chosen reality; win = becoming evidence; wobble = the journey through contrast'),
        manifestation_ids: z.array(z.string().uuid()).nullable().describe('Manifestations this entry documents — confirm before attaching'),
        kit_id: z.string().uuid().nullable().describe('Legacy single-manifestation attach; prefer manifestation_ids'),
      }),
      execute: async ({
        title,
        content,
        wobble_summary,
        clarity,
        chosen_truth,
        recommended_tool,
        category,
        journal_tag,
        manifestation_ids,
        kit_id,
      }) => {
        const composed = composeVivaJournalContent({
          journalTag: journal_tag || null,
          content,
          wobbleSummary: wobble_summary,
          clarity,
          chosenTruth: chosen_truth,
          conversationId,
        })
        const { data, error } = await supabase
          .from('journal_entries')
          .insert({
            user_id: userId,
            date: new Date().toISOString().slice(0, 10),
            title,
            content: composed,
            categories: category ? [category] : null,
            journal_tag: journal_tag || null,
            conversation_id: conversationId,
            wobble_summary: journal_tag === 'wobble' ? (wobble_summary || content || null) : null,
            clarity: journal_tag === 'wobble' ? (clarity || null) : null,
            chosen_truth: journal_tag === 'wobble' ? (chosen_truth || null) : null,
            recommended_tool: recommended_tool || null,
          })
          .select('id')
          .single()

        if (error || !data) return { success: false, message: 'Could not save the journal entry.' }

        const ids = [...new Set([...(manifestation_ids || []), ...(kit_id ? [kit_id] : [])])]
        let attachedIds: string[] = []
        if (ids.length > 0) {
          attachedIds = await attachAssetToManifestations(kitCtx, {
            manifestationIds: ids,
            slot: 'journal',
            entityType: 'journal_entries',
            entityId: data.id,
          })
        } else {
          await attach('journal', 'journal_entries', data.id, null)
        }

        let attachedNames: string[] = []
        if (attachedIds.length > 0) {
          const { data: named } = await supabase
            .from('manifestations')
            .select('id, name')
            .in('id', attachedIds)
            .eq('user_id', userId)
          attachedNames = (named || []).map((row) => row.name).filter(Boolean)
        }

        return {
          success: true,
          kind: 'journal',
          title,
          chosen_truth: chosen_truth || null,
          attached_names: attachedNames,
          message: attachedNames.length > 0
            ? `Saved "${title}" to your journal and attached it to ${attachedNames.join(', ')}.`
            : `Saved "${title}" to your journal.`,
          link: `/journal/${data.id}`,
        }
      },
    }),

    seed_vision_update: tool({
      description:
        'After they say yes, seed pending Life Vision Update proposals they can accept, edit, or discard. Does not write the draft or the active vision. Pass the full replacement text for each affected category in their voice, present tense — incorporate the new language into the existing category, do not send a lone sentence unless that category was empty.',
      inputSchema: z.object({
        proposals: z.array(z.object({
          category: CATEGORY_ENUM,
          content: z.string().describe('Full replacement category text in their voice, present tense'),
        })).min(1),
      }),
      execute: async ({ proposals }) => {
        const result = await seedVisionUpdateProposals(supabase, userId, proposals)
        if (!result.success) return result
        return {
          success: true,
          message: `Proposed ${proposals.length} Life Vision update${proposals.length === 1 ? '' : 's'} for you to review.`,
          link: result.link,
        }
      },
    }),

    log_abundance_event: tool({
      description:
        'Log an abundance event (money or value received) the member just mentioned. Use only when they named income, a gift, savings, or value that actually arrived — not after a money wobble with no receipt. Confirm amount before logging.',
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

Recognition does not equal recommendation. You may see several useful opportunities in one conversation. Handle the immediate intent first. Surface only the next relevant action. Other recognitions wait — or never get said. If clarity landed and they are good, let it land. Do not end every meaningful turn with a CTA.

Four distinct recognitions:
1. Contrast worth capturing → save_journal_entry with journal_tag wobble. The entry is the journey (wobble + what became clear + chosen truth), not a Win. Classify from why they asked and why the conversation exists, not from mood. A resolved wobble is still a wobble. A Win is evidence that something they have been creating showed up.
2. Their vision just evolved → offer, then seed_vision_update. Never write the draft or the active vision from this chat. They review accept / edit / discard on Life Vision Update.
3. They need something next → one experience whose job creates that shift. You are Flip the Frequency in this conversation — do not send them to flip again. After the coaching, prescribe embodiment if it would actually help: Vision / Vision Audio, Activation Story, Incantation, SparkQuery, Song, a Manifestation (the living hub — not just the image), Vibe Tribe / Alignment Gym, or stay here.
4. They don't need another thing → do nothing.

Journal = where they have been. Abundance = what is arriving (money or value received — never after a money wobble with no receipt). Life Vision = what they choose. Manifestations = one chosen reality they are living into (why they want it, what it feels like, inspired action, and the journaled journey — the image is only the visualizer). Activation = what they want to focus on and feel now. Daily Paper = how they live today (gratitude, Top 3, fun) — orientation after a shift, not a wobble intervention.

- **Save a journal entry** (save_journal_entry): after yes. Wobble = contrast they came in with. Win = becoming evidence. Vision = a chosen reality to keep. For a wobble pass wobble_summary, clarity, and chosen_truth.
- **Propose Life Vision updates** (seed_vision_update): after yes, seed pending category proposals. Link them to [Life Vision Update](/life-vision/update). They accept, edit, or discard. Do not call draft_vision_categories for this.
- **Log abundance** (log_abundance_event): only when they named money or value that arrived. Confirm the amount.
- **Queue a song** (queue_song): one of THEIR songs, after yes
- **Add a Daily Paper task / gratitude**: after a shift, to orient today or tomorrow — not to pull them through a wobble
- **Create an activation story** (create_activation_story): after a real shift, so they can rehearse the new reality
- **Create an incantation** (create_incantation): embody and charge a chosen belief
- **Create a SparkQuery set** (create_spark_query): questions that point the mind at evidence
- **Add or continue a manifestation** (add_manifestation): when a clear active desire surfaces, or when they asked you to create one. Fill why_it_matters and what_it_feels_like from this conversation. A manifestation is the hub — why it matters, what it feels like, inspired action, and the journaled journey — not only a board image. Continue an existing one; never open a second for the same reality.
- **When they ask you to create a manifestation AND a journal and attach them:** that is one request. In this turn: add_manifestation (or continue the existing one), then save_journal_entry with manifestation_ids set to that id. Do not call find_asset or find_kit_candidates when they said create / make it. Do not stop after only one of the two.

${KIT_TOOLS_PROMPT}

Rules for actions:
- Stay with them first. Do not prescribe in the opening turns of a wobble.
- OFFER, then act on their yes. Never act on ambiguous consent.
- One *unsolicited* offer at a time. Never dump extra CTAs they did not ask for. If they already asked you to do two things together (journal + manifestation, attach them), finish that whole request in this turn. If they pressed Suggest tools or asked what you could do from here, name a small fitting set (2–4) and wait for yes — that is not an unsolicited dump.
- After tools run, speak in your coaching voice: what you understood, what you made, and the links. Do not reply with only the raw tool line ("Added X." / "I could not find anything").
- Never end a turn with only a tool call. Always speak after the tool result. If you stay silent, the member thinks nothing happened.
- If a tool fails, say so simply and move on — never fake success.
- Most conversations need zero actions. Permission to do nothing is part of the job.
- For anything you can't do directly, point them to the right page as a markdown link (e.g. [your Life Vision](/life-vision) or [My Manifestations](/manifestations)).
- To turn this conversation's shift into a NEW song, send them to the [Songwriter](/audio/songwriter). Queue the manifestation slot as a handoff; do not fake success.`
