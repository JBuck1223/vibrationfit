import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'

// ============================================================================
// MAP v1 legacy types (user_maps / user_map_items) — kept for migration
// ============================================================================

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

export function getMapDisplayStatus(map: Pick<UserMap, 'is_draft' | 'is_active'>): 'draft' | 'active' | 'archived' {
  if (map.is_draft) return 'draft'
  if (map.is_active) return 'active'
  return 'archived'
}

// ============================================================================
// MAP v2 types — Living The Vision
// ============================================================================

// -- Cadence ------------------------------------------------------------------

export type CadenceKind = 'daily' | 'days_per_week'

export interface DailyCadence {
  kind: 'daily'
}

export interface DaysPerWeekCadence {
  kind: 'days_per_week'
  count: number
}

export type Cadence = DailyCadence | DaysPerWeekCadence

// -- Vision Targets -----------------------------------------------------------

export type VisionTargetStatus = 'active' | 'achieved' | 'archived'

export interface VisionTarget {
  id: string
  user_id: string
  vision_version_id: string | null
  category: LifeCategoryKey | string
  title: string
  description: string | null
  status: VisionTargetStatus
  achieved_at: string | null
  achievement_note: string | null
  achievement_journal_entry_id: string | null
  created_at: string
  updated_at: string
  commitments?: Commitment[]
}

export interface CreateVisionTargetPayload {
  category: string
  title: string
  description?: string | null
  vision_version_id?: string | null
}

export interface UpdateVisionTargetPayload {
  title?: string
  description?: string | null
  status?: VisionTargetStatus
  achievement_note?: string | null
  achievement_journal_entry_id?: string | null
}

// -- Commitments --------------------------------------------------------------

export type CommitmentType = 'recurring' | 'project'
export type CommitmentStatus = 'active' | 'paused' | 'completed' | 'archived'

export interface Commitment {
  id: string
  user_id: string
  vision_target_id: string | null
  category: LifeCategoryKey | string
  parent_commitment_id: string | null
  type: CommitmentType
  title: string
  description: string | null
  cadence: Cadence | null
  start_date: string | null
  end_date: string | null
  status: CommitmentStatus
  activity_type: string | null
  notify_sms: boolean
  notify_email: boolean
  reminder_time: string | null
  reminder_days: number[] | null
  sort_order: number
  imported_from_map_item_id: string | null
  created_at: string
  updated_at: string
  occurrences?: CommitmentOccurrence[]
}

export interface CreateCommitmentPayload {
  vision_target_id?: string | null
  category: string
  parent_commitment_id?: string | null
  type: CommitmentType
  title: string
  description?: string | null
  cadence?: Cadence | null
  start_date?: string | null
  end_date?: string | null
  activity_type?: string | null
}

export interface UpdateCommitmentPayload {
  title?: string
  description?: string | null
  category?: string
  cadence?: Cadence | null
  start_date?: string | null
  end_date?: string | null
  status?: CommitmentStatus
  notify_sms?: boolean
  notify_email?: boolean
  reminder_time?: string | null
  reminder_days?: number[] | null
  sort_order?: number
}

export type CommitmentChangeEventType =
  | 'created'
  | 'updated'
  | 'archived'
  | 'deleted'
  | 'resumed'

export type CommitmentChangeSource =
  | 'system_activate'
  | 'custom_create'
  | 'custom_update'
  | 'custom_archive'
  | 'custom_delete'
  | 'auto'

export interface CommitmentChangeEvent {
  id: string
  commitment_id: string | null
  user_id: string
  event_type: CommitmentChangeEventType
  state: Commitment
  changed_at: string
  source: CommitmentChangeSource
  map_activation_id: string | null
}

export interface ResolvedMapPlanSnapshotMeta {
  isHistorical: boolean
  earliestDate: string | null
  date: string
}

// -- Occurrences --------------------------------------------------------------

export type OccurrenceStatus = 'pending' | 'yes' | 'no' | 'skipped'

export interface CommitmentOccurrence {
  id: string
  commitment_id: string
  user_id: string
  occurred_on: string
  status: OccurrenceStatus
  verified_at: string | null
  note: string | null
  created_at: string
  updated_at: string
  commitment?: Commitment
}

// -- Constants ----------------------------------------------------------------

export const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const
export const DAY_LABELS_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const

export const CATEGORY_LABELS: Record<MapCategory, string> = {
  activations: 'Activations',
  connections: 'Connections',
  sessions: 'Sessions',
  creations: 'Creations',
}

export const CATEGORY_ORDER: MapCategory[] = ['activations', 'connections', 'sessions', 'creations']
