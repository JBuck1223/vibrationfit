import type { SupabaseClient } from '@supabase/supabase-js'
import type { KitAssetStatus, KitLayer, KitSlot, Manifestation } from './types'
import { HANDOFF_SLOTS, SLOT_TO_TRACKING_AREA } from './types'
export { assetLink } from './types'

const LIFE_CATEGORIES = [
  'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
] as const

export function normalizeLifeCategories(values: unknown): string[] {
  if (!Array.isArray(values)) return []
  return values
    .filter((v): v is string => typeof v === 'string')
    .map(v => v.trim().toLowerCase())
    .filter(v => (LIFE_CATEGORIES as readonly string[]).includes(v))
}

export async function findOpenKitForConversation(
  supabase: SupabaseClient,
  userId: string,
  conversationId: string | null,
): Promise<Manifestation | null> {
  if (!conversationId) return null
  const { data } = await supabase
    .from('manifestations')
    .select('*')
    .eq('user_id', userId)
    .eq('conversation_id', conversationId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as Manifestation | null) ?? null
}

export async function findSimilarOpenKit(
  supabase: SupabaseClient,
  userId: string,
  title: string,
  lifeCategories: string[],
): Promise<Manifestation | null> {
  const { data } = await supabase
    .from('manifestations')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(30)

  const items = (data || []) as Manifestation[]
  const needle = title.trim().toLowerCase()
  const overlap = (item: Manifestation) => {
    const cats = item.categories || []
    return lifeCategories.some(c => cats.includes(c))
  }

  const exact = items.find(i => i.name.trim().toLowerCase() === needle)
  if (exact) return exact

  const titled = items.find(i => {
    const t = i.name.trim().toLowerCase()
    return (t.includes(needle) || needle.includes(t)) && overlap(i)
  })
  return titled || null
}

export async function loadOpenKitsSummary(
  supabase: SupabaseClient,
  userId: string,
): Promise<Array<{
  id: string
  title: string
  chosen_reality: string | null
  life_categories: string[]
  conversation_id: string | null
  slots: Array<{ slot: string; status: string }>
}>> {
  const { data: items } = await supabase
    .from('manifestations')
    .select('id, name, why_it_matters, categories, conversation_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .not('conversation_id', 'is', null)
    .order('updated_at', { ascending: false })
    .limit(8)

  if (!items || items.length === 0) return []

  const ids = items.map(i => i.id)
  const { data: assets } = await supabase
    .from('manifestation_assets')
    .select('manifestation_id, slot, status')
    .in('manifestation_id', ids)

  return items.map(item => ({
    id: item.id,
    title: item.name,
    chosen_reality: item.why_it_matters,
    life_categories: item.categories || [],
    conversation_id: item.conversation_id,
    slots: (assets || [])
      .filter(a => a.manifestation_id === item.id)
      .map(a => ({ slot: a.slot, status: a.status })),
  }))
}

export async function attachKitAsset(
  supabase: SupabaseClient,
  params: {
    kitId: string
    slot: KitSlot
    layer?: KitLayer
    status?: KitAssetStatus
    entityType?: string | null
    entityId?: string | null
    handoffPath?: string | null
    pinnedBy?: 'viva' | 'member'
    sortOrder?: number
  },
): Promise<{ id: string } | null> {
  const layer = params.layer || defaultLayerForSlot(params.slot)
  const status = params.status || (params.entityId ? 'ready' : HANDOFF_SLOTS[params.slot] ? 'handoff' : 'queued')
  const handoffPath = params.handoffPath ?? HANDOFF_SLOTS[params.slot] ?? null

  // Never pin a manifestation to itself
  if (params.slot === 'vision_board' && params.entityId === params.kitId) return null

  if (params.entityId) {
    const { data: existing } = await supabase
      .from('manifestation_assets')
      .select('id')
      .eq('manifestation_id', params.kitId)
      .eq('slot', params.slot)
      .eq('entity_id', params.entityId)
      .maybeSingle()

    if (existing) {
      await supabase
        .from('manifestation_assets')
        .update({ status, entity_type: params.entityType || null, handoff_path: handoffPath })
        .eq('id', existing.id)
      return existing
    }
  }

  const { data, error } = await supabase
    .from('manifestation_assets')
    .insert({
      manifestation_id: params.kitId,
      layer,
      slot: params.slot,
      status,
      entity_type: params.entityType || null,
      entity_id: params.entityId || null,
      handoff_path: handoffPath,
      pinned_by: params.pinnedBy || 'viva',
      sort_order: params.sortOrder ?? 0,
    })
    .select('id')
    .single()

  if (error || !data) {
    console.error('[Manifestations] attach asset failed:', error)
    return null
  }
  return data
}

export function defaultLayerForSlot(slot: KitSlot): KitLayer {
  if (slot === 'project') return 'project'
  if (['journal', 'abundance', 'daily_paper', 'trip', 'dream_destination'].includes(slot)) {
    return 'evidence'
  }
  return 'suite'
}

export async function recordKitActivation(
  supabase: SupabaseClient,
  params: {
    kitId: string
    userId: string
    area: string
    slot?: KitSlot
  },
): Promise<void> {
  const today = new Date().toISOString().slice(0, 10)
  await supabase.from('manifestation_activations').upsert(
    {
      manifestation_id: params.kitId,
      user_id: params.userId,
      area: params.area,
      activation_date: today,
    },
    { onConflict: 'manifestation_id,area,activation_date', ignoreDuplicates: true },
  )

  const trackingArea = params.slot ? SLOT_TO_TRACKING_AREA[params.slot] : null
  if (trackingArea) {
    await supabase.from('area_activations').upsert(
      { user_id: params.userId, area: trackingArea, activation_date: today },
      { onConflict: 'user_id,area,activation_date', ignoreDuplicates: true },
    )
  }
}

export async function touchKit(supabase: SupabaseClient, kitId: string): Promise<void> {
  await supabase
    .from('manifestations')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', kitId)
}

/** Latest Life Vision draft attached to a manifestation (via assets, not a column). */
export async function findManifestationVisionDraftId(
  supabase: SupabaseClient,
  manifestationId: string,
): Promise<string | null> {
  const { data } = await supabase
    .from('manifestation_assets')
    .select('entity_id')
    .eq('manifestation_id', manifestationId)
    .eq('slot', 'vision_draft')
    .not('entity_id', 'is', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.entity_id || null
}

const VISION_CATEGORY_COLUMNS = [
  'forward', 'fun', 'travel', 'home', 'family', 'love', 'health',
  'money', 'work', 'social', 'stuff', 'giving', 'spirituality', 'conclusion',
] as const

export async function ensureVisionDraft(
  supabase: SupabaseClient,
  userId: string,
): Promise<{ id: string; existed: boolean } | { error: string }> {
  const { data: existing } = await supabase
    .from('vision_versions')
    .select('id')
    .eq('user_id', userId)
    .eq('is_draft', true)
    .eq('is_active', false)
    .is('household_id', null)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing) return { id: existing.id, existed: true }

  const { data: source } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .is('household_id', null)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const now = new Date().toISOString()
  const { data: draft, error } = await supabase
    .from('vision_versions')
    .insert({
      user_id: userId,
      household_id: null,
      title: source?.title ? `${source.title} (Draft)` : 'Draft Vision',
      perspective: source?.perspective || 'singular',
      forward: source?.forward || '',
      fun: source?.fun || '',
      travel: source?.travel || '',
      home: source?.home || '',
      family: source?.family || '',
      love: source?.love || '',
      health: source?.health || '',
      money: source?.money || '',
      work: source?.work || '',
      social: source?.social || '',
      stuff: source?.stuff || '',
      giving: source?.giving || '',
      spirituality: source?.spirituality || '',
      conclusion: source?.conclusion || '',
      is_active: false,
      is_draft: true,
      parent_id: source?.id || null,
      refined_categories: [],
      created_at: now,
      updated_at: now,
    })
    .select('id')
    .single()

  if (error || !draft) {
    console.error('[Manifestations] ensure draft failed:', error)
    return { error: 'Could not open a Life Vision draft.' }
  }
  return { id: draft.id, existed: false }
}

export async function updateDraftCategories(
  supabase: SupabaseClient,
  draftId: string,
  updates: Array<{ category: string; content: string }>,
): Promise<{ error?: string; categories: string[] }> {
  const valid = updates.filter(u =>
    (VISION_CATEGORY_COLUMNS as readonly string[]).includes(u.category)
  )
  if (valid.length === 0) return { error: 'No valid Life Vision categories to draft.', categories: [] }

  const { data: current } = await supabase
    .from('vision_versions')
    .select('refined_categories, is_draft, is_active')
    .eq('id', draftId)
    .single()

  if (!current || !current.is_draft || current.is_active) {
    return { error: 'That vision is not a draft.', categories: [] }
  }

  const refined = new Set<string>(current.refined_categories || [])
  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  for (const item of valid) {
    patch[item.category] = item.content
    refined.add(item.category)
  }
  patch.refined_categories = Array.from(refined)

  const { error } = await supabase
    .from('vision_versions')
    .update(patch)
    .eq('id', draftId)

  if (error) {
    console.error('[Manifestations] update draft failed:', error)
    return { error: 'Could not update the draft.', categories: [] }
  }
  return { categories: valid.map(v => v.category) }
}
