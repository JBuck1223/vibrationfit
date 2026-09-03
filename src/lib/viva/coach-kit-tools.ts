import { tool } from 'ai'
import { z } from 'zod'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  attachKitAsset,
  assetLink,
  ensureVisionDraft,
  findManifestationVisionDraftId,
  findOpenKitForConversation,
  findSimilarOpenKit,
  normalizeLifeCategories,
  recordKitActivation,
  touchKit,
  updateDraftCategories,
} from '@/lib/manifestations/kit-helpers'
import { HANDOFF_SLOTS, KIT_SLOTS, type KitSlot } from '@/lib/manifestations/types'
import { findLibraryCandidates } from '@/lib/manifestations/library-candidates'
import { generateImage } from '@/lib/services/imageService'
import { createAdminClient } from '@/lib/supabase/admin'
import { extractAndStoreMentions } from '@/lib/vibe-tribe/mention-utils'
import { autoVerifyOccurrenceByActivityType } from '@/lib/map/auto-verify'

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
    .select('categories')
    .eq('id', kitId)
    .maybeSingle()
  return data?.categories?.[0] || 'work'
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

/** Attach an entity to several manifestations at once (e.g. one journal entry, many desires). */
export async function attachAssetToManifestations(
  ctx: KitToolsContext,
  params: {
    manifestationIds: string[]
    slot: KitSlot
    entityType: string
    entityId: string
  },
): Promise<string[]> {
  const attached: string[] = []
  for (const rawId of params.manifestationIds) {
    const { data: item } = await ctx.supabase
      .from('manifestations')
      .select('id')
      .eq('id', rawId)
      .eq('user_id', ctx.userId)
      .maybeSingle()
    if (!item) continue
    await attachCreatedAssetToKit(ctx, {
      kitId: item.id,
      slot: params.slot,
      entityType: params.entityType,
      entityId: params.entityId,
    })
    attached.push(item.id)
  }
  return attached
}

export function buildKitCoachTools(ctx: KitToolsContext) {
  const { supabase, userId, conversationId } = ctx

  return {
    add_manifestation: tool({
      description:
        'Add an active desire to the member\'s Manifestations (their vision board is the visualizer). Use when a clear specific want surfaces in conversation ("I want to take the kids to Japan"). Offer first — e.g. "This sounds like an active desire. Let\'s add it to Manifestations. Want me to generate an image for this?" — and act only on their yes. Never create a duplicate for the same reality.',
      inputSchema: z.object({
        name: z.string().describe('The desire, short and specific — this is the manifestation title'),
        description: z.string().nullable().describe('One or two sentences of detail, in their words'),
        why_it_matters: z.string().nullable().describe('Why they want it, in their first-person voice (may draw on their Life Vision language)'),
        what_it_feels_like: z.string().nullable().describe('What living it feels like, first-person present tense'),
        life_categories: z.array(CATEGORY_ENUM).nullable().describe('Life categories this desire plays into'),
        generate_image: z.boolean().nullable().describe('true only when they said yes to a generated image'),
      }),
      execute: async ({ name, description, why_it_matters, what_it_feels_like, life_categories, generate_image }) => {
        const categories = normalizeLifeCategories(life_categories || [])
        const existing = await findSimilarOpenKit(supabase, userId, name, categories)

        if (existing) {
          await supabase
            .from('manifestations')
            .update({
              conversation_id: conversationId || existing.conversation_id,
              why_it_matters: existing.why_it_matters || why_it_matters?.trim() || null,
              what_it_feels_like: existing.what_it_feels_like || what_it_feels_like?.trim() || null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', existing.id)
          return {
            success: true,
            continued: true,
            manifestation_id: existing.id,
            message: `"${existing.name}" is already on your Manifestations — continuing with it.`,
            link: `/manifestations/${existing.id}`,
          }
        }

        let imageUrl: string | null = null
        if (generate_image) {
          try {
            const imageResult = await generateImage({
              userId,
              prompt: `${name}. ${description || why_it_matters || ''}`.trim(),
              dimension: 'landscape_4_3',
              quality: 'standard',
              style: 'vivid',
              context: 'vision_board',
            })
            if (imageResult.success && imageResult.imageUrl) {
              imageUrl = imageResult.imageUrl
            }
          } catch (error) {
            console.error('[VIVA] manifestation image generation failed:', error)
          }
        }

        const { data, error } = await supabase
          .from('manifestations')
          .insert({
            user_id: userId,
            name: name.trim(),
            description: description?.trim() || null,
            why_it_matters: why_it_matters?.trim() || null,
            what_it_feels_like: what_it_feels_like?.trim() || null,
            categories,
            conversation_id: conversationId,
            image_url: imageUrl,
            status: 'active',
          })
          .select('id, name')
          .single()

        if (error || !data) {
          console.error('[VIVA] add manifestation failed:', error)
          return { success: false, message: 'Could not add the manifestation.' }
        }

        return {
          success: true,
          continued: false,
          manifestation_id: data.id,
          image_generated: Boolean(imageUrl),
          message: imageUrl
            ? `Added "${data.name}" to your Manifestations with a generated image.`
            : `Added "${data.name}" to your Manifestations.`,
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
          await touchKit(supabase, kitId)
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
        'Commit a Life Vision draft as the new active vision. Only after a separate, explicit yes. Never implied from adding a manifestation or drafting.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        draft_id: z.string().uuid().nullable(),
      }),
      execute: async ({ kit_id, draft_id }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        let draftId = draft_id
        if (!draftId && kitId) {
          draftId = await findManifestationVisionDraftId(supabase, kitId)
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
          await attachKitAsset(supabase, {
            kitId,
            slot: 'vision_draft',
            entityType: 'vision_versions',
            entityId: draftId,
            status: 'actualized',
            pinnedBy: 'viva',
          })
          await touchKit(supabase, kitId)
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
        if (!kitId) return { success: false, message: 'Add the manifestation first.' }

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
        'Pin an existing journal win, related manifestation, Daily Paper, abundance event, or Dream List destination onto a manifestation as Becoming. Offer first. Does not write a foreign key onto those tables.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        slot: z.enum(['journal', 'vision_board', 'daily_paper', 'abundance', 'dream_destination', 'trip']),
        entity_id: z.string().uuid(),
      }),
      execute: async ({ kit_id, slot, entity_id }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Add the manifestation first.' }

        const tableBySlot: Record<string, { table: string; userCol: string }> = {
          journal: { table: 'journal_entries', userCol: 'user_id' },
          vision_board: { table: 'manifestations', userCol: 'user_id' },
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
        'Capture inspired action as an action group nested on the active manifestation (with steps added later). Confirm the title first.',
      inputSchema: z.object({
        kit_id: z.string().uuid().nullable(),
        title: z.string(),
        description: z.string().nullable(),
        life_categories: z.array(CATEGORY_ENUM).nullable(),
      }),
      execute: async ({ kit_id, title, description, life_categories }) => {
        const kitId = await resolveKitId(ctx, kit_id)
        if (!kitId) return { success: false, message: 'Add the manifestation first.' }

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
          console.error('[VIVA] add manifestation action group failed:', error)
          return { success: false, message: 'Could not create the action group.' }
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
          message: `Captured "${data.title}" as inspired action on this manifestation.`,
          link: `/manifestations/${kitId}`,
        }
      },
    }),

    actualize_manifestation: tool({
      description:
        'Mark a manifestation Actualized. Only on an explicit yes that this reality is real. Never infer from scores or event counts. After it succeeds, offer to share the win in the Vibe Tribe (draft_vibe_post).',
      inputSchema: z.object({
        manifestation_id: z.string().uuid().nullable(),
        story: z.string().nullable().describe('Optional short first-person note of how it became real — saved as the actualization story'),
      }),
      execute: async ({ manifestation_id, story }) => {
        const kitId = await resolveKitId(ctx, manifestation_id)
        if (!kitId) return { success: false, message: 'Which manifestation are we Actualizing?' }

        const { data: item } = await supabase
          .from('manifestations')
          .select('id, name, status')
          .eq('id', kitId)
          .eq('user_id', userId)
          .maybeSingle()

        if (!item) return { success: false, message: 'Manifestation not found.' }
        if (item.status === 'actualized') {
          return { success: true, message: `"${item.name}" is already Actualized.`, link: `/manifestations/${kitId}` }
        }

        if (story?.trim()) {
          const { data: entry } = await supabase
            .from('journal_entries')
            .insert({
              user_id: userId,
              date: new Date().toISOString().slice(0, 10),
              title: `Actualized: ${item.name}`,
              content: story.trim(),
              journal_tag: 'win',
              categories: [],
            })
            .select('id')
            .single()
          if (entry?.id) {
            await attachKitAsset(supabase, {
              kitId,
              slot: 'journal',
              layer: 'evidence',
              entityType: 'journal_entries',
              entityId: entry.id,
              status: 'ready',
              pinnedBy: 'viva',
            })
          }
        }

        const { error } = await supabase
          .from('manifestations')
          .update({
            status: 'actualized',
            actualized_at: new Date().toISOString(),
            actualization_story: story?.trim() || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', kitId)

        if (error) return { success: false, message: 'Could not Actualize this manifestation.' }

        return {
          success: true,
          message: `"${item.name}" is Actualized. Offer to share this win in the Vibe Tribe — you can draft the post from this conversation for them to check.`,
          link: `/manifestations/${kitId}`,
        }
      },
    }),

    draft_vibe_post: tool({
      description:
        'Publish a Vibe Tribe post for the member. ALWAYS show them the exact draft text in conversation first and get an explicit yes before calling this — e.g. after a manifestation is Actualized: "Want to share this in the Vibe Tribe? I can create a post based on our convo you can check." Never post without approval.',
      inputSchema: z.object({
        content: z.string().describe('The approved post text, in their first-person voice'),
        vibe_tag: z.enum(['win', 'wobble', 'vision', 'collaboration']).describe('win for actualized manifestations'),
        manifestation_id: z.string().uuid().nullable().describe('Attach the manifestation image to the post when relevant'),
        life_categories: z.array(CATEGORY_ENUM).nullable(),
      }),
      execute: async ({ content, vibe_tag, manifestation_id, life_categories }) => {
        const text = content.trim()
        if (!text) return { success: false, message: 'The post needs content.' }

        let mediaUrls: string[] = []
        if (manifestation_id) {
          const { data: item } = await supabase
            .from('manifestations')
            .select('image_url, actualized_image_url')
            .eq('id', manifestation_id)
            .eq('user_id', userId)
            .maybeSingle()
          const image = item?.actualized_image_url || item?.image_url
          if (image) mediaUrls = [image]
        }

        const mediaType = mediaUrls.length > 0 ? 'image' : 'none'

        const { data: newPost, error } = await supabase
          .from('vibe_posts')
          .insert({
            user_id: userId,
            content: text,
            media_urls: mediaUrls,
            media_type: mediaType,
            vibe_tag,
            life_categories: normalizeLifeCategories(life_categories || []),
          })
          .select('id')
          .single()

        if (error || !newPost) {
          console.error('[VIVA] vibe post failed:', error)
          return { success: false, message: 'Could not create the post.' }
        }

        try {
          const adminClient = createAdminClient()
          await extractAndStoreMentions(adminClient, text, userId, { post_id: newPost.id })
        } catch { /* mentions are best-effort */ }
        autoVerifyOccurrenceByActivityType(userId, 'vibe_tribe_post').catch(() => {})

        return {
          success: true,
          post_id: newPost.id,
          message: 'Shared in the Vibe Tribe.',
          link: '/vibe-tribe',
        }
      },
    }),

    find_kit_candidates: tool({
      description:
        'Search the member library for existing stories, journal wins, manifestations, songs, abundance, action groups, and dream destinations that could belong in a manifestation. Read-only. Say what you found in their words, then wait for yes before adding or pinning. Do not dump the whole library.',
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
        'Find an existing story, journal entry, manifestation, song, or action group and return a link. Do not generate anything new.',
      inputSchema: z.object({
        query: z.string(),
        kind: z.enum(['story', 'journal', 'manifestation', 'song', 'vision_board', 'project', 'any']).nullable(),
      }),
      execute: async ({ query, kind }) => {
        const q = query.trim()
        if (!q) return { success: false, message: 'What should I look for?' }
        const pattern = `%${q}%`
        const normalizedKind = kind === 'vision_board' ? 'manifestation' : kind
        const want = normalizedKind && normalizedKind !== 'any'
          ? [normalizedKind]
          : ['story', 'journal', 'manifestation', 'song', 'project']
        const hits: Array<{ label: string; link: string }> = []

        if (want.includes('manifestation')) {
          const { data } = await supabase
            .from('manifestations')
            .select('id, name')
            .eq('user_id', userId)
            .or(`name.ilike.${pattern},why_it_matters.ilike.${pattern},description.ilike.${pattern}`)
            .limit(3)
          for (const row of data || []) {
            hits.push({ label: `Manifestation: ${row.name}`, link: `/manifestations/${row.id}` })
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
        if (want.includes('project')) {
          const { data } = await supabase
            .from('projects')
            .select('id, title, manifestation_id')
            .eq('created_by', userId)
            .ilike('title', pattern)
            .limit(3)
          for (const row of data || []) {
            hits.push({
              label: `Action group: ${row.title}`,
              link: row.manifestation_id ? `/manifestations/${row.manifestation_id}` : '/manifestations',
            })
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

A manifestation is one desire on the member's board: image, Active/Actualized state, why they want it, what it feels like, inspired action steps, and the journey documented in their journal.

When Builder (or Auto, if they are ready) and a destination is live:
- find_kit_candidates — read-only search of what they already have. Say what you found. Do not pin yet.
- add_manifestation — when a clear active desire surfaces, offer: "This sounds like an active desire. Let's add it to Manifestations. Want me to generate an image for this?" Create only after yes; set generate_image true only if they said yes to the image. Never create a second one for the same reality.
- draft_vision_categories — write the previewed edit into a draft; never the active vision
- commit_vision_draft — only after a second, explicit yes
- queue_kit_asset — next suite slot; voice/mix/new song are handoffs
- pin_kit_evidence — attach an existing win / paper / abundance item after yes
- add_kit_project — inspired action (an action group with steps) on this manifestation
- actualize_manifestation — only when they say it is real. Right after, offer: "Want to share this in the Vibe Tribe? I can create a post based on our convo you can check."
- draft_vibe_post — ONLY after showing the exact draft and getting an explicit yes

If they already have stories, journal, or manifestations and the desire is new, offer to gather what they have. Call find_kit_candidates, name a few, then on yes: add_manifestation, pin_kit_evidence for wins/abundance/dreams, queue_kit_asset with the existing entity_id for stories/songs, add_kit_project only when they want new action. Never silent-attach. Never dump the whole library. Never say "kit" to the member.

Coach mode may also: flip_constraint, save_journal_entry, save_daily_paper_gratitude, add_daily_paper_task.
Assistant mode may only: find_asset.
Friend mode: no tools.

When a manifestation is active in this thread, new creates (story, incantation, SparkQuery, journal, song, Daily Paper) attach to that manifestation.`
