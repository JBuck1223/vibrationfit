export type MapCategory = 'creations' | 'activations' | 'connections' | 'sessions'

export interface UserMap {
  id: string
  user_id: string
  title: string
  is_draft: boolean
  is_active: boolean
  week_start_date: string | null
  version_number: number
  timezone: string
  created_at: string
  updated_at: string
  items?: UserMapItem[]
}

export interface UserMapItem {
  id: string
  map_id: string
  category: MapCategory
  activity_type: string
  label: string
  days_of_week: number[]
  time_of_day: string | null
  notify_sms: boolean
  deep_link: string | null
  notes: string | null
  sort_order: number
  created_at: string
}

export interface CreateMapPayload {
  title: string
  week_start_date?: string | null
  timezone?: string
  items: CreateMapItemPayload[]
}

export interface CreateMapItemPayload {
  category: MapCategory
  activity_type: string
  label: string
  days_of_week: number[]
  time_of_day?: string | null
  notify_sms?: boolean
  deep_link?: string | null
  notes?: string | null
  sort_order?: number
}

export interface UpdateMapPayload {
  title?: string
  is_draft?: boolean
  is_active?: boolean
  week_start_date?: string | null
  timezone?: string
  items?: CreateMapItemPayload[]
}

/**
 * Derive a display status from the is_draft / is_active booleans.
 * - is_draft=true                → 'draft'
 * - is_draft=false, is_active=true  → 'active'
 * - is_draft=false, is_active=false → 'archived'
 */
export function getMapDisplayStatus(map: Pick<UserMap, 'is_draft' | 'is_active'>): 'draft' | 'active' | 'archived' {
  if (map.is_draft) return 'draft'
  if (map.is_active) return 'active'
  return 'archived'
}

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const CATEGORY_LABELS: Record<MapCategory, string> = {
  activations: 'Activations',
  connections: 'Connections',
  sessions: 'Sessions',
  creations: 'Creations',
}

export const CATEGORY_ORDER: MapCategory[] = ['activations', 'connections', 'sessions', 'creations']
