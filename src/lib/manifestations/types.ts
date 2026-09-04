/**
 * Manifestations — the base record for every desire.
 *
 * A manifestation IS a manifestations row (the board is the visualizer).
 * Depth hangs off it via manifestation_assets (journal, stories, songs, …)
 * and projects.manifestation_id (nested action groups with steps).
 */

export const MANIFESTATION_STATUSES = ['active', 'actualized', 'inactive'] as const
export type ManifestationStatus = (typeof MANIFESTATION_STATUSES)[number]

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

/** One manifestation = one manifestations row. */
export interface Manifestation {
  id: string
  user_id: string
  household_id: string | null
  name: string
  description: string | null
  image_url: string | null
  status: ManifestationStatus
  categories: string[] | null
  why_it_matters: string | null
  what_it_feels_like: string | null
  conversation_id: string | null
  actualized_at: string | null
  actualized_image_url: string | null
  actualization_story: string | null
  created_at: string
  updated_at: string
}

export interface ManifestationAsset {
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

export interface ManifestationActivation {
  id: string
  manifestation_id: string
  user_id: string
  area: string
  activation_date: string
  created_at: string
}

export interface ManifestationListItem extends Manifestation {
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
  vision_board: 'Related manifestation',
  journal: 'Journal',
  daily_paper: 'Daily Paper',
  abundance: 'Abundance',
  dream_destination: 'Dream List',
  trip: 'Trip',
  map_target: 'MAP target',
  map_commitment: 'MAP commitment',
  project: 'Action group',
}

/** Where a gathered/pinned item lands on the manifestation page. */
export type SlotDestination = 'essence' | 'journey' | 'living' | 'action'

export const SLOT_DESTINATIONS: Record<KitSlot, SlotDestination> = {
  vision_draft: 'essence',
  journal: 'journey',
  daily_paper: 'journey',
  abundance: 'journey',
  story: 'living',
  incantation: 'living',
  spark_query: 'living',
  song: 'living',
  voice: 'living',
  mix: 'living',
  vision_board: 'living',
  dream_destination: 'living',
  trip: 'living',
  map_target: 'living',
  map_commitment: 'living',
  project: 'action',
}

export const DESTINATION_META: Record<SlotDestination, { title: string; hint: string; anchor: string }> = {
  essence: {
    title: 'The Essence',
    hint: 'VIVA uses this language to name why you want it and what living it feels like.',
    anchor: 'the-essence',
  },
  journey: {
    title: 'The Journey',
    hint: 'Evidence you are becoming this — journal, wins, Daily Papers.',
    anchor: 'the-journey',
  },
  living: {
    title: 'Living it',
    hint: 'Stories, songs, and related desires that already belong to this reality.',
    anchor: 'living-it',
  },
  action: {
    title: 'Inspired Action',
    hint: 'Projects become action groups with steps on this manifestation.',
    anchor: 'inspired-action',
  },
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
      return entityId ? `/manifestations/${entityId}` : '/manifestations'
    case 'daily_paper':
      return '/daily-paper'
    case 'abundance':
      return '/abundance-tracker'
    case 'dream_destination':
    case 'trip':
      return '/travel-tracker/dream'
    case 'project':
      return entityId ? `/projects/${entityId}` : '/manifestations'
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
