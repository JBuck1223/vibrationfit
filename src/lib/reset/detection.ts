// Reset detection: given a per-item anchor captured at reset start, determine
// whether each pillar has been "recommitted" since, and which life categories
// the change touched. Designed to run server-side with a Supabase client that
// can read the member's own rows (user session client or service client).

import { LIFE_CATEGORY_KEYS } from '@/lib/design-system/vision-categories'
import { PROFILE_STATE_FIELDS } from '@/lib/profile/profile-category-map'
import type { ResetItemType } from './reset-config'

type Supa = any

export interface ResetAnchor {
  activeId?: string | null
  count?: number
  startedAt?: string
}

export interface DetectionResult {
  completed: boolean
  completedAt: string | null
  categories: string[]
  detail?: string
}

const LIFE_KEYS = new Set<string>(LIFE_CATEGORY_KEYS as readonly string[])

function uniq(values: (string | null | undefined)[]): string[] {
  return Array.from(new Set(values.filter((v): v is string => !!v)))
}

// ---------------------------------------------------------------------------
// Anchor capture (called when a reset starts or an item is (re)selected)
// ---------------------------------------------------------------------------
export async function captureAnchor(
  supabase: Supa,
  userId: string,
  type: ResetItemType,
  startedAt: string
): Promise<ResetAnchor> {
  switch (type) {
    case 'profile': {
      const { data: active } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()
      const { count } = await supabase
        .from('user_profiles')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_draft', false)
      return { activeId: active?.id ?? null, count: count ?? 0, startedAt }
    }
    case 'life_vision': {
      const { data: active } = await supabase
        .from('vision_versions')
        .select('id')
        .eq('user_id', userId)
        .is('household_id', null)
        .eq('is_active', true)
        .eq('is_draft', false)
        .maybeSingle()
      const { count } = await supabase
        .from('vision_versions')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', userId)
        .is('household_id', null)
        .eq('is_draft', false)
      return { activeId: active?.id ?? null, count: count ?? 0, startedAt }
    }
    default:
      return { startedAt }
  }
}

// ---------------------------------------------------------------------------
// Detection per item type
// ---------------------------------------------------------------------------
async function detectProfile(supabase: Supa, userId: string, anchor: ResetAnchor): Promise<DetectionResult> {
  const stateCols = PROFILE_STATE_FIELDS.map((f) => f.field).join(', ')
  const { data: active } = await supabase
    .from('user_profiles')
    .select(`id, updated_at, ${stateCols}`)
    .eq('user_id', userId)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()

  const { count } = await supabase
    .from('user_profiles')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('is_draft', false)

  const idChanged = !!active?.id && active.id !== anchor.activeId
  const countIncreased = (count ?? 0) > (anchor.count ?? 0)
  const completed = idChanged || countIncreased
  if (!completed) return { completed: false, completedAt: null, categories: [] }

  // Determine which categories changed by diffing against the anchor row
  let anchorRow: any = null
  if (anchor.activeId) {
    const { data } = await supabase
      .from('user_profiles')
      .select(stateCols)
      .eq('id', anchor.activeId)
      .maybeSingle()
    anchorRow = data
  }

  const categories = PROFILE_STATE_FIELDS
    .filter(({ field }) => {
      const now = (active?.[field] ?? '') as string
      const before = (anchorRow?.[field] ?? '') as string
      return now.trim() !== before.trim() && now.trim().length > 0
    })
    .map(({ key }) => key)

  return {
    completed: true,
    completedAt: active?.updated_at ?? new Date().toISOString(),
    categories,
    detail: 'New profile version committed',
  }
}

async function detectLifeVision(supabase: Supa, userId: string, anchor: ResetAnchor): Promise<DetectionResult> {
  const catCols = (LIFE_CATEGORY_KEYS as readonly string[]).join(', ')
  const { data: active } = await supabase
    .from('vision_versions')
    .select(`id, updated_at, refined_categories, ${catCols}`)
    .eq('user_id', userId)
    .is('household_id', null)
    .eq('is_active', true)
    .eq('is_draft', false)
    .maybeSingle()

  const { count } = await supabase
    .from('vision_versions')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .is('household_id', null)
    .eq('is_draft', false)

  const idChanged = !!active?.id && active.id !== anchor.activeId
  const countIncreased = (count ?? 0) > (anchor.count ?? 0)
  const completed = idChanged || countIncreased
  if (!completed) return { completed: false, completedAt: null, categories: [] }

  let categories: string[] = []
  const refined = active?.refined_categories
  if (Array.isArray(refined) && refined.length > 0) {
    categories = (refined as string[]).filter((k) => LIFE_KEYS.has(k))
  } else if (anchor.activeId) {
    const { data: anchorRow } = await supabase
      .from('vision_versions')
      .select(catCols)
      .eq('id', anchor.activeId)
      .maybeSingle()
    categories = (LIFE_CATEGORY_KEYS as readonly string[]).filter((key) => {
      const now = ((active?.[key] ?? '') as string).trim()
      const before = ((anchorRow?.[key] ?? '') as string).trim()
      return now !== before && now.length > 0
    })
  } else {
    categories = (LIFE_CATEGORY_KEYS as readonly string[]).filter(
      (key) => ((active?.[key] ?? '') as string).trim().length > 0
    )
  }

  return {
    completed: true,
    completedAt: active?.updated_at ?? new Date().toISOString(),
    categories,
    detail: 'New life vision version committed',
  }
}

async function detectVisionBoard(supabase: Supa, userId: string, startedAt: string): Promise<DetectionResult> {
  const { data } = await supabase
    .from('vision_board_items')
    .select('categories, created_at, updated_at')
    .eq('user_id', userId)
    .or(`created_at.gt.${startedAt},updated_at.gt.${startedAt}`)

  const rows = data || []
  if (rows.length === 0) return { completed: false, completedAt: null, categories: [] }

  const categories = uniq(rows.flatMap((r: any) => (Array.isArray(r.categories) ? r.categories : [])))
  const latest = rows
    .map((r: any) => r.updated_at || r.created_at)
    .sort()
    .pop()

  return {
    completed: true,
    completedAt: latest ?? new Date().toISOString(),
    categories: categories.filter((c) => LIFE_KEYS.has(c)),
    detail: `${rows.length} vision board update${rows.length === 1 ? '' : 's'}`,
  }
}

async function detectAudio(supabase: Supa, userId: string, startedAt: string): Promise<DetectionResult> {
  const { data } = await supabase
    .from('audio_tracks')
    .select('section_key, created_at, status')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gt('created_at', startedAt)

  const rows = data || []
  if (rows.length === 0) return { completed: false, completedAt: null, categories: [] }

  const categories = uniq(rows.map((r: any) => r.section_key)).filter((c) => LIFE_KEYS.has(c))
  const latest = rows.map((r: any) => r.created_at).sort().pop()

  return {
    completed: true,
    completedAt: latest ?? new Date().toISOString(),
    categories,
    detail: `${rows.length} new audio track${rows.length === 1 ? '' : 's'}`,
  }
}

async function detectProject(supabase: Supa, userId: string, startedAt: string): Promise<DetectionResult> {
  const { data } = await supabase
    .from('projects')
    .select('life_categories, created_at, updated_at, status')
    .eq('created_by', userId)
    .gt('created_at', startedAt)

  const rows = data || []
  if (rows.length === 0) return { completed: false, completedAt: null, categories: [] }

  const categories = uniq(rows.flatMap((r: any) => (Array.isArray(r.life_categories) ? r.life_categories : []))).filter(
    (c) => LIFE_KEYS.has(c)
  )
  const latest = rows.map((r: any) => r.created_at).sort().pop()

  return {
    completed: true,
    completedAt: latest ?? new Date().toISOString(),
    categories,
    detail: `${rows.length} project${rows.length === 1 ? '' : 's'} started`,
  }
}

async function detectMap(supabase: Supa, userId: string, startedAt: string): Promise<DetectionResult> {
  const { data } = await supabase
    .from('commitments')
    .select('category, created_at, status')
    .eq('user_id', userId)
    .gt('created_at', startedAt)

  const rows = data || []
  if (rows.length === 0) return { completed: false, completedAt: null, categories: [] }

  const categories = uniq(rows.map((r: any) => r.category)).filter((c) => LIFE_KEYS.has(c))
  const latest = rows.map((r: any) => r.created_at).sort().pop()

  return {
    completed: true,
    completedAt: latest ?? new Date().toISOString(),
    categories,
    detail: `${rows.length} new habit${rows.length === 1 ? '' : 's'} committed`,
  }
}

export async function detectItem(
  supabase: Supa,
  userId: string,
  type: ResetItemType,
  anchor: ResetAnchor,
  startedAt: string
): Promise<DetectionResult> {
  switch (type) {
    case 'profile':
      return detectProfile(supabase, userId, anchor)
    case 'life_vision':
      return detectLifeVision(supabase, userId, anchor)
    case 'vision_board':
      return detectVisionBoard(supabase, userId, anchor.startedAt || startedAt)
    case 'audio':
      return detectAudio(supabase, userId, anchor.startedAt || startedAt)
    case 'project':
      return detectProject(supabase, userId, anchor.startedAt || startedAt)
    case 'map':
      return detectMap(supabase, userId, anchor.startedAt || startedAt)
    default:
      return { completed: false, completedAt: null, categories: [] }
  }
}
