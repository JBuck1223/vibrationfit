import type { SupabaseClient } from '@supabase/supabase-js'
import { defaultLayerForSlot } from './kit-helpers'
import type { KitSlot, KitLayer } from './types'

export interface LibraryCandidate {
  slot: KitSlot
  layer: KitLayer
  entity_type: string
  entity_id: string
  label: string
  date: string | null
}

const LIMIT = 8

const VISION_TEXT_CATEGORIES = [
  'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality',
] as const

const STOP = new Set([
  'the', 'and', 'for', 'you', 'your', 'this', 'that', 'with', 'from',
  'into', 'have', 'has', 'are', 'was', 'were', 'will', 'just', 'about',
])

function tokens(query: string) {
  return query
    .toLowerCase()
    .split(/[^a-z0-9$]+/)
    .filter(t => t.length > 2 && !STOP.has(t))
}

function textMatches(text: string | null | undefined, query: string) {
  if (!query || !text) return false
  const hay = text.toLowerCase()
  const needle = query.toLowerCase()
  if (hay.includes(needle)) return true
  return tokens(query).some(t => hay.includes(t))
}

function overlapsCategories(itemCats: string[] | null | undefined, wanted: string[]) {
  if (wanted.length === 0) return false
  if (!itemCats || itemCats.length === 0) return false
  return itemCats.some(c => wanted.includes(c))
}

function includeItem(opts: {
  wanted: string[]
  query: string
  itemCats?: string[] | null
  texts: Array<string | null | undefined>
}) {
  if (overlapsCategories(opts.itemCats, opts.wanted)) return true
  if (opts.query && opts.texts.some(t => textMatches(t, opts.query))) return true
  if (opts.wanted.length === 0 && !opts.query) return true
  return false
}

export async function findLibraryCandidates(
  supabase: SupabaseClient,
  userId: string,
  opts: {
    categories?: string[]
    query?: string
    kitId?: string | null
    slots?: KitSlot[]
  } = {},
): Promise<LibraryCandidate[]> {
  const categories = (opts.categories || []).map(c => c.toLowerCase())
  const query = opts.query?.trim() || ''
  const slotFilter = opts.slots && opts.slots.length > 0 ? new Set(opts.slots) : null
  const allow = (slot: KitSlot) => !slotFilter || slotFilter.has(slot)

  let pinnedIds = new Set<string>()
  if (opts.kitId) {
    const { data } = await supabase
      .from('manifestation_assets')
      .select('entity_id')
      .eq('manifestation_id', opts.kitId)
      .not('entity_id', 'is', null)
    pinnedIds = new Set((data || []).map(r => r.entity_id).filter(Boolean) as string[])
  }

  const results: LibraryCandidate[] = []

  const push = (candidate: LibraryCandidate) => {
    if (pinnedIds.has(candidate.entity_id)) return
    results.push(candidate)
  }

  const jobs: Promise<void>[] = []

  if (allow('vision_draft')) {
    jobs.push((async () => {
      const { data: vision } = await supabase
        .from('vision_versions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .is('household_id', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (!vision) return

      const matched = VISION_TEXT_CATEGORIES.filter(key => {
        const text = typeof vision[key] === 'string' ? vision[key] : ''
        if (!text.trim()) return false
        return includeItem({
          wanted: categories,
          query,
          itemCats: [key],
          texts: [text, vision.title],
        })
      })

      if (matched.length === 0) return

      const first = String(vision[matched[0]] || '').replace(/\s+/g, ' ').trim()
      const labels = matched.map(k => k.charAt(0).toUpperCase() + k.slice(1))
      push({
        slot: 'vision_draft',
        layer: 'suite',
        entity_type: 'vision_versions',
        entity_id: vision.id,
        label: `Life Vision · ${labels.join(', ')}${first ? ` — ${first.slice(0, 90)}` : ''}`,
        date: vision.updated_at || vision.created_at,
      })
    })())
  }

  if (allow('journal')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('journal_entries')
        .select('id, title, content, date, categories, journal_tag')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(40)
      const rows = (data || []).slice().sort((a, b) => {
        const rank = (tag: string | null) => tag === 'win' ? 0 : tag === 'vision' ? 1 : 2
        return rank(a.journal_tag) - rank(b.journal_tag)
      })
      for (const row of rows) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: row.categories,
          texts: [row.title, row.content],
        })) continue
        push({
          slot: 'journal',
          layer: row.journal_tag === 'vision' ? 'suite' : 'evidence',
          entity_type: 'journal_entries',
          entity_id: row.id,
          label: row.title || 'Untitled entry',
          date: row.date,
        })
        if (results.filter(r => r.entity_type === 'journal_entries').length >= LIMIT) break
      }
    })())
  }

  if (allow('vision_board')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('manifestations')
        .select('id, name, description, created_at, categories')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40)
      for (const row of data || []) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: row.categories,
          texts: [row.name, row.description],
        })) continue
        push({
          slot: 'vision_board',
          layer: 'suite',
          entity_type: 'manifestations',
          entity_id: row.id,
          label: row.name,
          date: row.created_at,
        })
        if (results.filter(r => r.entity_type === 'manifestations').length >= LIMIT) break
      }
    })())
  }

  if (allow('story') || allow('incantation') || allow('spark_query')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('stories')
        .select('id, title, content, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(40)
      for (const row of data || []) {
        const meta = (row.metadata || {}) as Record<string, unknown>
        const slot: KitSlot = meta.is_incantation
          ? 'incantation'
          : meta.is_spark_query
            ? 'spark_query'
            : 'story'
        if (!allow(slot)) continue
        const storyCats = Array.isArray(meta.selected_categories)
          ? (meta.selected_categories as unknown[]).filter((c): c is string => typeof c === 'string')
          : []
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: storyCats,
          texts: [row.title, row.content],
        })) continue
        push({
          slot,
          layer: 'suite',
          entity_type: 'stories',
          entity_id: row.id,
          label: row.title || 'Untitled story',
          date: row.created_at,
        })
      }
    })())
  }

  if (allow('song')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('songs')
        .select('id, title, created_at, life_categories')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(24)
      for (const row of data || []) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: row.life_categories,
          texts: [row.title],
        })) continue
        push({
          slot: 'song',
          layer: 'suite',
          entity_type: 'songs',
          entity_id: row.id,
          label: row.title || 'Untitled song',
          date: row.created_at,
        })
        if (results.filter(r => r.slot === 'song').length >= LIMIT) break
      }
    })())
  }

  if (allow('abundance')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('abundance_events')
        .select('id, note, date, vision_category')
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(24)
      for (const row of data || []) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: row.vision_category ? [row.vision_category] : [],
          texts: [row.note],
        })) continue
        push({
          slot: 'abundance',
          layer: 'evidence',
          entity_type: 'abundance_events',
          entity_id: row.id,
          label: row.note || 'Abundance event',
          date: row.date,
        })
        if (results.filter(r => r.slot === 'abundance').length >= LIMIT) break
      }
    })())
  }

  if (allow('project')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('projects')
        .select('id, title, description, created_at, life_categories')
        .eq('created_by', userId)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(24)
      for (const row of data || []) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: row.life_categories,
          texts: [row.title, row.description],
        })) continue
        push({
          slot: 'project',
          layer: 'project',
          entity_type: 'projects',
          entity_id: row.id,
          label: row.title,
          date: row.created_at,
        })
        if (results.filter(r => r.slot === 'project').length >= LIMIT) break
      }
    })())
  }

  if (allow('dream_destination')) {
    jobs.push((async () => {
      const { data } = await supabase
        .from('dream_destinations')
        .select('id, name, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(16)
      for (const row of data || []) {
        if (!includeItem({
          wanted: categories,
          query,
          itemCats: ['travel'],
          texts: [row.name],
        })) continue
        push({
          slot: 'dream_destination',
          layer: 'evidence',
          entity_type: 'dream_destinations',
          entity_id: row.id,
          label: row.name,
          date: row.created_at,
        })
      }
    })())
  }

  await Promise.all(jobs)

  const scored = results.map(c => {
    const queryHit = textMatches(c.label, query) ? 2 : 0
    const visionBoost = c.slot === 'vision_draft' ? 3 : 0
    return { c, score: queryHit + visionBoost }
  })
  scored.sort((a, b) => b.score - a.score)

  const perType = new Map<string, number>()
  return scored
    .map(s => s.c)
    .filter(c => {
      const count = perType.get(c.slot) || 0
      if (count >= LIMIT) return false
      perType.set(c.slot, count + 1)
      return true
    })
}

export async function resolveAssetLabels(
  supabase: SupabaseClient,
  assets: Array<{ entity_type: string | null; entity_id: string | null }>,
): Promise<Record<string, string>> {
  const labels: Record<string, string> = {}
  const byType = new Map<string, string[]>()
  for (const asset of assets) {
    if (!asset.entity_type || !asset.entity_id) continue
    const list = byType.get(asset.entity_type) || []
    list.push(asset.entity_id)
    byType.set(asset.entity_type, list)
  }

  const lookups: Array<{ table: string; labelCol: string }> = [
    { table: 'journal_entries', labelCol: 'title' },
    { table: 'manifestations', labelCol: 'name' },
    { table: 'stories', labelCol: 'title' },
    { table: 'songs', labelCol: 'title' },
    { table: 'abundance_events', labelCol: 'note' },
    { table: 'projects', labelCol: 'title' },
    { table: 'dream_destinations', labelCol: 'name' },
    { table: 'daily_papers', labelCol: 'gratitude' },
    { table: 'vision_versions', labelCol: 'title' },
  ]

  await Promise.all(lookups.map(async ({ table, labelCol }) => {
    const ids = byType.get(table)
    if (!ids || ids.length === 0) return
    const { data } = await supabase.from(table).select('*').in('id', ids)
    for (const row of (data || []) as Array<Record<string, unknown>>) {
      const id = row.id
      if (typeof id !== 'string') continue
      const raw = row[labelCol]
      labels[id] = (typeof raw === 'string' && raw.trim()) ? raw.trim().slice(0, 120) : 'Untitled'
    }
  }))

  return labels
}

export { defaultLayerForSlot }
