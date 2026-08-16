import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  attachKitAsset,
  assetLink,
  ensureVisionDraft,
  findOpenKitForConversation,
  findSimilarOpenKit,
  normalizeLifeCategories,
  recordKitActivation,
  touchKit,
  updateDraftCategories,
} from '@/lib/manifestations/kit-helpers'
import { HANDOFF_SLOTS, KIT_SLOTS, type KitSlot } from '@/lib/manifestations/types'
import { findLibraryCandidates } from '@/lib/manifestations/library-candidates'

const CATEGORY_ENUM = z.enum([
  'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
])

const SLOT_ENUM = z.enum(KIT_SLOTS)

export interface KitToolsContext {
  supabase: SupabaseClient
  userId: string
  conversationId: string | null
  activeKitId: string | null
}

async function resolveKitId(
  ctx: KitToolsContext,
  kitId?: string | null,
): Promise<string | null> {
  if (kitId) return kitId
  if (ctx.activeKitId) return ctx.activeKitId
  const fromThread = await findOpenKitForConversation(ctx.supabase, ctx.userId, ctx.conversationId)
  return fromThread?.id || null
}

async function kitPrimaryArea(supabase: SupabaseClient, kitId: string): Promise<string> {
  const { data } = await supabase
    .from('manifestations')
    .select('life_categories')
    .eq('id', kitId)
    .maybeSingle()
  return data?.life_categories?.[0] || 'work'
}

export async function attachCreatedAssetToKit(
  ctx: KitToolsContext,
  params: {
    kitId?: string | null
    slot: KitSlot
    entityType: string
    entityId: string
    area?: string
  },
): Promise<void> {
  const kitId = await resolveKitId(ctx, params.kitId)
  if (!kitId) return
  await attachKitAsset(ctx.supabase, {
    kitId,
    slot: params.slot,
    entityType: params.entityType,
    entityId: params.entityId,
    status: 'ready',
    pinnedBy: 'viva',
  })
  const area = params.area || await kitPrimaryArea(ctx.supabase, kitId)
  await recordKitActivation(ctx.supabase, {
    kitId,
    userId: ctx.userId,
    area,
    slot: params.slot,
  })
  await touchKit(ctx.supabase, kitId)
}

export function buildKitCoachTools(ctx: KitToolsContext) {
  const { supabase, userId, conversationId } = ctx

  return {
    open_manifestation_kit: tool({
      description:
        'Open a My Manifestations hub for one chosen reality, or continue the open manifestation that already holds this idea. Confirm first. Never create a second one for the same reality.',
      inputSchema: z.object({
        title: z.string().describe('Short name of the chosen reality, e.g. "$1M Vibration Fit" or "Japan"'),
        chosen_reality: z.string().describe('One-sentence identity they are practicing'),
        life_categories: z.array(CATEGORY_ENUM).min(1).describe('Life Vision categories that play into this'),
        flow: z.array(z.string()).nullable().describe('Ordered 3-5 activation slots they agreed to, e.g. vision draft then story then song'),
      }),
      execute: async ({ title, chosen_reality, life_categories, flow }) => {
        const categories = normalizeLifeCategories(life_categories)
        const existing =
          (await findOpenKitForConversation(supabase, userId, conversationId)) ||
          (await findSimilarOpenKit(supabase, userId, title, categories))

        if (existing) {
          await supabase
            .from('manifestations')
            .update({
              conversation_id: conversationId || existing.conversation_id,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
          return {
            success: true,
            continued: true,
            kit_id: existing.id,
            message: `Continuing your manifestation "${existing.title}".`,
            link: `/manifestations/${existing.id}`,
          }
        }

        const { data, error } = await supabase
          .from('manifestations')
          .insert({
            user_id: userId,
            title: title.trim(),
            chosen_reality: chosen_reality.trim(),
            life_categories: categories,
            conversation_id: conversationId,
            status: 'open',
            flow: flow && flow.length > 0 ? flow : [],
          })
          .select('id, title')
          .single()

        if (error || !data) {
          console.error('[VIVA] open kit failed:', error)
          return { success: false, message: 'Could not open the manifestation.' }
        }

        return {
          success: true,
          continued: false,
          kit_id: data.id,
          message: `Opened "${data.title}" in My Manifestations.`,
          link: `/manifestations/${data.id}`,
        }
      },
    }),

    draft_vision_categories: tool({
      description:
        'Write Life Vision category text into a draft (never the active vision). Attach the draft to the manifestation. Confirm the previewed wording first.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        categories: z.array(z.object({
          category: CATEGORY_ENUM,
          content: z.string().describe('Draft text in their voice, present tense'),
        })).min(1),
      }),
      execute: async ({ kit_id, categories }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        const draft = await ensureVisionDraft(supabase, userId)
        if ('error' in draft) return { success: false, message: draft.error }

        const updated = await updateDraftCategories(supabase, draft.id, categories)
        if (updated.error) return { success: false, message: updated.error }

        if (kitId) {
          await supabase
            .from('manifestations')
            .update({ vision_draft_id: draft.id, updated_at: new Date().toISOString() })
            .eq('id', kitId)
            .eq('user_id', userId)
          await attachKitAsset(supabase, {
            kitId,
            slot: 'vision_draft',
            entityType: 'vision_versions',
            entityId: draft.id,
            status: 'ready',
            pinnedBy: 'viva',
          })
          await recordKitActivation(supabase, {
            kitId,
            userId,
            area: categories[0]?.category || await kitPrimaryArea(supabase, kitId),
            slot: 'vision_draft',
          })
        }

        return {
          success: true,
          draft_id: draft.id,
          message: `Drafted ${updated.categories.join(', ')} on your Life Vision. The active vision is unchanged until you say to commit.`,
          link: `/life-vision/${draft.id}`,
        }
      },
    }),

    commit_vision_draft: tool({
      description:
        'Commit a Life Vision draft as the new active vision. Only after a separate, explicit yes. Never implied from opening a manifestation or drafting.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        draft_id: z.string().uuid().nullable(),
      }),
      execute: async ({ kit_id, draft_id }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        let draftId = draft_id
        if (!draftId && kitId) {
          const { data: kit } = await supabase
            .from('manifestations')
            .select('vision_draft_id')
            .eq('id', kitId)
            .maybeSingle()
          draftId = kit?.vision_draft_id || null
        }
        if (!draftId) return { success: false, message: 'No draft to commit.' }

        const { data: commitResult, error } = await supabase.rpc('commit_vision_draft_as_active', {
          p_draft_vision_id: draftId,
          p_user_id: userId,
        })

        if (error) {
          console.error('[VIVA] commit draft failed:', error)
          return { success: false, message: 'Could not commit the draft.' }
        }

        if (kitId) {
          await supabase
            .from('manifestations')
            .update({
              vision_version_id: draftId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', kitId)
          await attachKitAsset(supabase, {
            kitId,
            slot: 'vision_draft',
            entityType: 'vision_versions',
            entityId: draftId,
            status: 'actualized',
            pinnedBy: 'viva',
          })
        }

        return {
          success: true,
          message: 'Your Life Vision draft is now the active vision.',
          link: `/life-vision/${draftId}`,
          result: commitResult,
        }
      },
    }),

    queue_kit_asset: tool({
      description:
        'Queue the next suite slot on a manifestation. Ready slots attach a created entity. Voice, mix, and new-song slots are handoffs to the studio — never fake those as generated.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        slot: SLOT_ENUM,
        entity_id: z.string().uuid().nullable(),
        entity_type: z.string().nullable(),
        handoff_path: z.string().nullable(),
      }),
      execute: async ({ kit_id, slot, entity_id, entity_type, handoff_path }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Open a manifestation first.' }

        const isHandoff = Boolean(HANDOFF_SLOTS[slot]) && !entity_id
        const asset = await attachKitAsset(supabase, {
          kitId,
          slot,
          entityId: entity_id,
          entityType: entity_type,
          handoffPath: handoff_path || HANDOFF_SLOTS[slot] || null,
          status: entity_id ? 'ready' : isHandoff ? 'handoff' : 'queued',
          pinnedBy: 'viva',
        })
        if (!asset) return { success: false, message: 'Could not queue that slot.' }

        if (slot === 'project' && entity_id) {
          await supabase
            .from('projects')
            .update({ manifestation_id: kitId })
            .eq('id', entity_id)
            .eq('created_by', userId)
        }

        await recordKitActivation(supabase, {
          kitId,
          userId,
          area: await kitPrimaryArea(supabase, kitId),
          slot,
        })
        await touchKit(supabase, kitId)

        const link = assetLink(slot, entity_id, handoff_path || HANDOFF_SLOTS[slot] || null)
        if (isHandoff) {
          return {
            success: true,
            message: `Queued ${slot.replace(/_/g, ' ')} as a handoff — finish it in the studio.`,
            link,
          }
        }
        return {
          success: true,
          message: `Queued ${slot.replace(/_/g, ' ')} on this manifestation.`,
          link: `/manifestations/${kitId}`,
        }
      },
    }),

    pin_kit_evidence: tool({
      description:
        'Pin an existing journal win, vision board item, Daily Paper, abundance event, or Dream List destination onto a manifestation as Becoming. Offer first. Does not write a foreign key onto those tables.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        slot: z.enum(['journal', 'vision_board', 'daily_paper', 'abundance', 'dream_destination', 'trip']),
        entity_id: z.string().uuid(),
      }),
      execute: async ({ kit_id, slot, entity_id }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Open a manifestation first.' }

        const tableBySlot: Record<string, { table: string; userCol: string }> = {
          journal: { table: 'journal_entries', userCol: 'user_id' },
          vision_board: { table: 'vision_board_items', userCol: 'user_id' },
          daily_paper: { table: 'daily_papers', userCol: 'user_id' },
          abundance: { table: 'abundance_events', userCol: 'user_id' },
          dream_destination: { table: 'dream_destinations', userCol: 'user_id' },
          trip: { table: 'trips', userCol: 'user_id' },
        }
        const lookup = tableBySlot[slot]
        const { data: row } = await supabase
          .from(lookup.table)
          .select('id')
          .eq('id', entity_id)
          .eq(lookup.userCol, userId)
          .maybeSingle()

        if (!row) return { success: false, message: 'Could not find that item to pin.' }

        await attachKitAsset(supabase, {
          kitId,
          slot,
          layer: 'evidence',
          entityType: lookup.table,
          entityId: entity_id,
          status: 'ready',
          pinnedBy: 'viva',
        })
        await recordKitActivation(supabase, {
          kitId,
          userId,
          area: await kitPrimaryArea(supabase, kitId),
          slot,
        })
        await touchKit(supabase, kitId)

        return {
          success: true,
          message: 'Pinned to Becoming on this manifestation.',
          link: `/manifestations/${kitId}`,
        }
      },
    }),

    add_kit_project: tool({
      description:
        'Capture an inspired action as a project nested on the active manifestation. Confirm the title first.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        title: z.string(),
        description: z.string().nullable(),
        life_categories: z.array(CATEGORY_ENUM).nullable(),
      }),
      execute: async ({ kit_id, title, description, life_categories }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Open a manifestation first.' }

        const { data: maxRow } = await supabase
          .from('projects')
          .select('sort_order')
          .eq('created_by', userId)
          .order('sort_order', { ascending: false })
          .limit(1)
          .maybeSingle()

        const { data, error } = await supabase
          .from('projects')
          .insert({
            title: title.trim(),
            description: description || null,
            type: 'project',
            life_categories: life_categories || [],
            status: 'active',
            priority: 'medium',
            sort_order: (maxRow?.sort_order ?? 0) + 1,
            created_by: userId,
            manifestation_id: kitId,
          })
          .select('id, title')
          .single()

        if (error || !data) {
          console.error('[VIVA] add kit project failed:', error)
          return { success: false, message: 'Could not create the project.' }
        }

        await attachKitAsset(supabase, {
          kitId,
          slot: 'project',
          layer: 'project',
          entityType: 'projects',
          entityId: data.id,
          status: 'ready',
          pinnedBy: 'viva',
        })
        await recordKitActivation(supabase, {
          kitId,
          userId,
          area: await kitPrimaryArea(supabase, kitId),
          slot: 'project',
        })
        await touchKit(supabase, kitId)

        return {
          success: true,
          message: `Captured "${data.title}" as a project on this manifestation.`,
          link: `/projects/${data.id}`,
        }
      },
    }),

    actualize_kit: tool({
      description:
        'Mark a manifestation Actualized. Only on an explicit yes that this reality is real. Never infer from scores or event counts.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        story: z.string().nullable().describe('Optional short first-person note of how it became real'),
      }),
      execute: async ({ kit_id, story }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Which manifestation are we Actualizing?' }

        const { data: kit } = await supabase
          .from('manifestations')
          .select('id, title, status')
          .eq('id', kitId)
          .eq('user_id', userId)
          .maybeSingle()

        if (!kit) return { success: false, message: 'Manifestation not found.' }
        if (kit.status === 'actualized') {
          return { success: true, message: `"${kit.title}" is already Actualized.`, link: `/manifestations/${kitId}` }
        }

        let storyId: string | null = null
        if (story?.trim()) {
          const { data: entry } = await supabase
            .from('journal_entries')
            .insert({
              user_id: userId,
              date: new Date().toISOString().slice(0, 10),
              title: `Actualized: ${kit.title}`,
              content: story.trim(),
              journal_tag: 'win',
              categories: [],
            })
            .select('id')
            .single()
          storyId = entry?.id || null
        }

        const { error } = await supabase
          .from('manifestations')
          .update({
            status: 'actualized',
            actualized_at: new Date().toISOString(),
            actualization_story_id: storyId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kitId)

        if (error) return { success: false, message: 'Could not Actualize this manifestation.' }

        return {
          success: true,
          message: `"${kit.title}" is Actualized.`,
          link: `/manifestations/${kitId}`,
        }
      },
    }),

    find_kit_candidates: tool({
      description:
        'Search the member library for existing stories, journal wins, board items, songs, abundance, projects, and dream destinations that could belong in a manifestation. Read-only. Say what you found in their words, then wait for yes before opening a manifestation or pinning. Do not dump the whole library.',
      inputSchema: z.object({
        query: z.string().nullable(),
        categories: z.array(CATEGORY_ENUM).nullable(),
        kit_id: z.string().uuid().nullable(),
      }),
      execute: async ({ query, categories, kit_id }) => {
        const candidates = await findLibraryCandidates(supabase, userId, {
          query: query || undefined,
          categories: categories || undefined,
          kitId: kit_id,
          slots: [
            'story', 'incantation', 'spark_query', 'journal', 'vision_board',
            'song', 'abundance', 'project', 'dream_destination',
          ],
        })
        if (candidates.length === 0) {
          return { success: false, message: 'I did not find matching items in their library yet.' }
        }
        const preview = candidates.slice(0, 16).map(c =>
          `${c.label} (${c.slot}${c.date ? `, ${String(c.date).slice(0, 10)}` : ''})`
        )
        return {
          success: true,
          message: `Found ${candidates.length} items they already have. Offer a short list, then pin only after yes.`,
          candidates: candidates.slice(0, 24),
          preview,
        }
      },
    }),

    find_asset: tool({
      description:
        'Find an existing story, journal entry, manifestation, song, vision board item, or project and return a link. Do not generate anything new.',
      inputSchema: z.object({
        query: z.string(),
        kind: z.enum(['story', 'journal', 'manifestation', 'song', 'vision_board', 'project', 'any']).nullable(),
      }),
      execute: async ({ query, kind }) => {
        const q = query.trim()
        if (!q) return { success: false, message: 'What should I look for?' }
        const pattern = `%${q}%`
        const want = kind && kind !== 'any' ? [kind] : ['story', 'journal', 'manifestation', 'song', 'vision_board', 'project']
        const hits: Array<{ label: string; link: string }> = []

        if (want.includes('manifestation')) {
          const { data } = await supabase
            .from('manifestations')
            .select('id, title')
            .eq('user_id', userId)
            .or(`title.ilike.${pattern},chosen_reality.ilike.${pattern}`)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Manifestation: ${row.title}`, link: `/manifestations/${row.id}` })
          }
        }
        if (want.includes('story')) {
          const { data } = await supabase
            .from('stories')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Story: ${row.title}`, link: `/story/${row.id}` })
          }
        }
        if (want.includes('journal')) {
          const { data } = await supabase
            .from('journal_entries')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Journal: ${row.title || 'Untitled'}`, link: `/journal/${row.id}` })
          }
        }
        if (want.includes('song')) {
          const { data } = await supabase
            .from('songs')
            .select('id, title')
            .eq('user_id', userId)
            .ilike('title', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Song: ${row.title}`, link: '/audio' })
          }
        }
        if (want.includes('vision_board')) {
          const { data } = await supabase
            .from('vision_board_items')
            .select('id, name')
            .eq('user_id', userId)
            .ilike('name', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Board: ${row.name}`, link: '/vision-board' })
          }
        }
        if (want.includes('project')) {
          const { data } = await supabase
            .from('projects')
            .select('id, title')
            .eq('created_by', userId)
            .ilike('title', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Project: ${row.title}`, link: `/projects/${row.id}` })
          }
        }

        if (hits.length === 0) {
          return { success: false, message: `I could not find anything matching "${q}".` }
        }

        const first = hits[0]
        return {
          success: true,
          message: hits.map(h => `${h.label} — ${h.link}`).join('\n'),
          link: first.link,
          results: hits,
        }
      },
    }),

    flip_constraint: tool({
      description:
        'Record the flipped replacement belief on a vibrational constraint the member just landed. Confirm the flipped wording first.',
      inputSchema: z.object({
        constraint_id: z.string().uuid().nullable(),
        statement: z.string().nullable().describe('The old belief, if you do not have the id'),
        flipped_statement: z.string().describe('The replacement belief in their first-person present-tense words'),
      }),
      execute: async ({ constraint_id, statement, flipped_statement }) => {
        let id = constraint_id
        if (!id && statement) {
          const { data } = await supabase
            .from('vibrational_constraints')
            .select('id')
            .eq('user_id', userId)
            .ilike('statement', `%${statement.slice(0, 80)}%`)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          id = data?.id || null
        }
        if (!id) return { success: false, message: 'I could not find that constraint to flip.' }

        const { error } = await supabase
          .from('vibrational_constraints')
          .update({
            flipped_statement: flipped_statement.trim(),
            status: 'flipped',
            updated_at: new Date().toISOString(),
          })
          .eq('id', id)
          .eq('user_id', userId)

        if (error) return { success: false, message: 'Could not flip the constraint.' }
        return { success: true, message: 'Flipped. The new belief is on your ledger.' }
      },
    }),

    save_daily_paper_gratitude: tool({
      description:
        "Write today's Daily Paper gratitude in their voice. Confirm first. Creates today's paper if needed.",
      inputSchema: z.object({
        gratitude: z.string(),
        kit_id: z.string().uuid().nullable(),
      }),
      execute: async ({ gratitude, kit_id }) => {
        const today = new Date().toISOString().slice(0, 10)
        const { data: paper } = await supabase
          .from('daily_papers')
          .select('id')
          .eq('user_id', userId)
          .eq('entry_date', today)
          .maybeSingle()

        let paperId = paper?.id
        if (!paperId) {
          const { data: created, error } = await supabase
            .from('daily_papers')
            .insert({ user_id: userId, entry_date: today, gratitude })
            .select('id')
            .single()
          if (error || !created) return { success: false, message: "Could not save today's gratitude." }
          paperId = created.id
        } else {
          const { error } = await supabase
            .from('daily_papers')
            .update({ gratitude, updated_at: new Date().toISOString() })
            .eq('id', paperId)
          if (error) return { success: false, message: "Could not save today's gratitude." }
        }

        const kitId = await resolveKitId(ctx, kit_id)
        if (kitId && paperId) {
          await attachCreatedAssetToKit(ctx, {
            kitId,
            slot: 'daily_paper',
            entityType: 'daily_papers',
            entityId: paperId,
          })
        }

        return { success: true, message: "Saved gratitude on today's Daily Paper.", link: '/daily-paper' }
      },
    }),
  }
}

export const KIT_TOOLS_PROMPT = `## MANIFESTATIONS AND MODE ACTIONS

When Builder (or Auto, if they are ready) and a destination is live:
- find_kit_candidates — read-only search of what they already have. Say what you found. Do not pin yet.
- open_manifestation_kit — create or continue one manifestation for this reality (after yes)
- draft_vision_categories — write the previewed edit into a draft; never the active vision
- commit_vision_draft — only after a second, explicit yes
- queue_kit_asset — next suite slot; voice/mix/new song are handoffs
- pin_kit_evidence — attach an existing win / board / paper / abundance item after yes
- add_kit_project — inspired action on this manifestation
- actualize_kit — only they say it is real

If they already have stories, journal, or board items and no manifestation yet, offer to gather what they have. Call find_kit_candidates, name a few, then on yes: open_manifestation_kit, pin_kit_evidence for wins/board/abundance/dreams, queue_kit_asset with the existing entity_id for stories/songs/board, add_kit_project only when they want a new project. Never silent-attach. Never dump the whole library. Never say "kit" to the member.

Coach mode may also: flip_constraint, save_journal_entry, save_daily_paper_gratitude, add_daily_paper_task.
Assistant mode may only: find_asset.
Friend mode: no tools.

When a manifestation is active, new creates (story, incantation, SparkQuery, journal, board, song, Daily Paper) attach to that manifestation.`
