// Server-side helpers for the Reset feature shared across the /api/reset routes.

import { detectItem, captureAnchor, type DetectionResult, type ResetAnchor } from './detection'
import { RESET_ITEMS, type ResetItemType } from './reset-config'

type Supa = any

export interface ResetRow {
  id: string
  user_id: string
  household_id: string | null
  title: string | null
  focus_categories: string[]
  status: 'pending' | 'in_progress' | 'completed'
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string
}

export interface ResetItemRow {
  id: string
  reset_id: string
  user_id: string
  item_type: ResetItemType
  label: string | null
  is_selected: boolean
  status: 'pending' | 'completed'
  completed_at: string | null
  anchor: ResetAnchor
  reference_id: string | null
  detected_categories: string[]
  sort_order: number
}

export interface ResetItemWithDetection extends ResetItemRow {
  detection: DetectionResult
}

// Latest non-completed reset for the user (the "active" reset).
export async function getActiveReset(supabase: Supa, userId: string): Promise<ResetRow | null> {
  const { data } = await supabase
    .from('resets')
    .select('*')
    .eq('user_id', userId)
    .neq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  return (data as ResetRow) ?? null
}

export async function getResetById(supabase: Supa, userId: string, id: string): Promise<ResetRow | null> {
  const { data } = await supabase
    .from('resets')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .maybeSingle()
  return (data as ResetRow) ?? null
}

export async function getResetItems(supabase: Supa, resetId: string): Promise<ResetItemRow[]> {
  const { data } = await supabase
    .from('reset_items')
    .select('*')
    .eq('reset_id', resetId)
    .order('sort_order', { ascending: true })
  return (data || []) as ResetItemRow[]
}

// Run live detection for each selected item. Unselected items are returned with
// an inert detection result so the UI can still render them.
export async function detectItems(
  supabase: Supa,
  userId: string,
  reset: ResetRow,
  items: ResetItemRow[]
): Promise<ResetItemWithDetection[]> {
  const results = await Promise.all(
    items.map(async (item): Promise<ResetItemWithDetection> => {
      if (!item.is_selected) {
        return { ...item, detection: { completed: false, completedAt: null, categories: [] } }
      }
      const detection = await detectItem(supabase, userId, item.item_type, item.anchor || {}, reset.started_at)
      return { ...item, detection }
    })
  )
  return results
}

// Persist detection results back onto reset_items (self-heal).
export async function persistDetection(
  supabase: Supa,
  items: ResetItemWithDetection[]
): Promise<void> {
  await Promise.all(
    items
      .filter((item) => item.is_selected)
      .map((item) => {
        const completed = item.detection.completed
        return supabase
          .from('reset_items')
          .update({
            status: completed ? 'completed' : 'pending',
            completed_at: completed ? item.detection.completedAt : null,
            detected_categories: item.detection.categories,
          })
          .eq('id', item.id)
      })
  )
}

// Build the default reset_items for a new reset, capturing anchors for selected ones.
export async function buildInitialItems(
  supabase: Supa,
  userId: string,
  reset: ResetRow,
  selectedTypes: ResetItemType[]
): Promise<void> {
  const rows = await Promise.all(
    RESET_ITEMS.map(async (cfg, index) => {
      const isSelected = selectedTypes.includes(cfg.type)
      const anchor = isSelected
        ? await captureAnchor(supabase, userId, cfg.type, reset.started_at)
        : { startedAt: reset.started_at }
      return {
        reset_id: reset.id,
        user_id: userId,
        item_type: cfg.type,
        label: cfg.label,
        is_selected: isSelected,
        status: 'pending',
        anchor,
        detected_categories: [],
        sort_order: index,
      }
    })
  )
  await supabase.from('reset_items').insert(rows)
}

export function computeProgress(items: ResetItemWithDetection[]): {
  total: number
  completed: number
  percent: number
  allComplete: boolean
} {
  const selected = items.filter((i) => i.is_selected)
  const completed = selected.filter((i) => i.detection.completed).length
  const total = selected.length
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100)
  return { total, completed, percent, allComplete: total > 0 && completed === total }
}
