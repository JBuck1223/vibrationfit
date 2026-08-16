export const KIT_STATUSES = ['open', 'actualized', 'archived'] as const
export type KitStatus = (typeof KIT_STATUSES)[number]

export const KIT_LAYERS = ['suite', 'project', 'evidence', 'milestone'] as const
export type KitLayer = (typeof KIT_LAYERS)[number]

export const KIT_SLOTS = [
  'vision_draft',
  'story',
  'incantation',
  'spark_query',
  'song',
  'voice',
  'mix',
  'vision_board',
  'journal',
  'daily_paper',
  'abundance',
  'dream_destination',
  'trip',
  'map_target',
  'map_commitment',
  'project',
] as const
export type KitSlot = (typeof KIT_SLOTS)[number]

export const KIT_ASSET_STATUSES = ['queued', 'ready', 'handoff', 'skipped', 'actualized'] as const
export type KitAssetStatus = (typeof KIT_ASSET_STATUSES)[number]

export interface ManifestationKit {
  id: string
  user_id: string
  household_id: string | null
  title: string
  chosen_reality: string | null
  life_categories: string[]
  conversation_id: string | null
  vision_draft_id: string | null
  vision_version_id: string | null
  status: KitStatus
  actualized_at: string | null
  actualization_story_id: string | null
  flow: unknown
  created_at: string
  updated_at: string
}

export interface ManifestationKitAsset {
  id: string
  manifestation_id: string
  layer: KitLayer
  slot: KitSlot
  status: KitAssetStatus
  entity_type: string | null
  entity_id: string | null
  handoff_path: string | null
  pinned_by: 'viva' | 'member' | null
  sort_order: number
  created_at: string
}

export interface ManifestationKitActivation {
  id: string
  manifestation_id: string
  user_id: string
  area: string
  activation_date: string
  created_at: string
}

export interface KitListItem extends ManifestationKit {
  asset_ready_count: number
  asset_queued_count: number
  activations_this_week: number
  project_count: number
}

export const SLOT_LABELS: Record<KitSlot, string> = {
  vision_draft: 'Vision draft',
  story: 'Story',
  incantation: 'Incantation',
  spark_query: 'SparkQuery',
  song: 'Song',
  voice: 'Voice',
  mix: 'Mix',
  vision_board: 'Vision board',
  journal: 'Journal',
  daily_paper: 'Daily Paper',
  abundance: 'Abundance',
  dream_destination: 'Dream List',
  trip: 'Trip',
  map_target: 'MAP target',
  map_commitment: 'MAP commitment',
  project: 'Project',
}

export const HANDOFF_SLOTS: Partial<Record<KitSlot, string>> = {
  voice: '/audio',
  mix: '/audio/mix',
  song: '/audio/songwriter',
}

export function assetLink(slot: KitSlot, entityId: string | null, handoffPath: string | null): string {
  if (handoffPath) return handoffPath
  switch (slot) {
    case 'vision_draft':
      return entityId ? `/life-vision/${entityId}` : '/life-vision'
    case 'story':
    case 'incantation':
    case 'spark_query':
      return entityId ? `/story/${entityId}` : '/story'
    case 'journal':
      return entityId ? `/journal/${entityId}` : '/journal'
    case 'vision_board':
      return '/vision-board'
    case 'daily_paper':
      return '/daily-paper'
    case 'abundance':
      return '/abundance-tracker'
    case 'dream_destination':
    case 'trip':
      return '/travel-tracker/dream'
    case 'project':
      return entityId ? `/projects/${entityId}` : '/projects'
    case 'song':
      return '/audio'
    case 'voice':
      return '/audio'
    case 'mix':
      return '/audio/mix'
    case 'map_target':
    case 'map_commitment':
      return '/map'
    default:
      return '/manifestations'
  }
}

export const SLOT_TO_TRACKING_AREA: Partial<Record<KitSlot, string>> = {
  journal: 'journal',
  daily_paper: 'daily-paper',
  vision_board: 'vision-board',
  abundance: 'abundance-tracker',
  story: 'story-listen',
  incantation: 'story-listen',
  spark_query: 'story-listen',
  song: 'music-listen',
  vision_draft: 'journal',
}
