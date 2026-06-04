import { getActivityDefinition } from '@/lib/map/activities'
import { INTENSIVE_DEFAULT_SELECTIONS } from '@/lib/map/intensive-map-config'
import { PILLAR_ORDER } from '@/lib/map/map-pillar-config'
import type { MapCategory, MapPillarActive } from '@/lib/map/types'

export function emptyMapPillarActive(): MapPillarActive {
  return {
    activations: false,
    creations: false,
    connections: false,
    sessions: false,
  }
}

function isMapPillar(category: string | null | undefined): category is MapCategory {
  return !!category && PILLAR_ORDER.includes(category as MapCategory)
}

function resolvePillar(
  category: string | null | undefined,
  activityType: string | null | undefined,
): MapCategory | null {
  if (isMapPillar(category)) return category
  if (!activityType) return null
  const activity = getActivityDefinition(activityType)
  return activity?.category ?? null
}

export interface MapCommitmentRow {
  category: string | null
  activity_type: string | null
}

/**
 * Derives per-pillar activity from active MAP commitments.
 * Falls back to intensive starter pillars when the MAP step is marked complete.
 */
export function computeMapPillarStats(
  commitments: MapCommitmentRow[],
  options?: { intensiveMapStepCompleted?: boolean },
): {
  map_pillar_active: MapPillarActive
  map_commitments_count: number
  map_all_pillars_active: boolean
} {
  const mapPillarActive = emptyMapPillarActive()

  for (const row of commitments) {
    const pillar = resolvePillar(row.category, row.activity_type)
    if (pillar) mapPillarActive[pillar] = true
  }

  if (options?.intensiveMapStepCompleted) {
    for (const def of INTENSIVE_DEFAULT_SELECTIONS) {
      const activity = getActivityDefinition(def.activityType)
      if (activity) mapPillarActive[activity.category] = true
    }
  }

  return {
    map_pillar_active: mapPillarActive,
    map_commitments_count: commitments.length,
    map_all_pillars_active: PILLAR_ORDER.every(p => mapPillarActive[p]),
  }
}
