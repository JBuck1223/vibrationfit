import type { LifeCategoryKey } from '@/lib/design-system/vision-categories'
import type { Commitment, MapCategory } from './types'

export const PILLAR_KEYS: readonly MapCategory[] = [
  'activations',
  'creations',
  'connections',
  'sessions',
] as const

export function isPillarCategory(category: string): category is MapCategory {
  return (PILLAR_KEYS as readonly string[]).includes(category)
}

export function isSystemCommitment(c: Commitment): boolean {
  return isPillarCategory(c.category) && !!c.activity_type
}

export function isCustomCommitment(c: Commitment): boolean {
  return !isSystemCommitment(c)
}

export function groupSystemByPillar(
  commitments: Commitment[],
): Record<MapCategory, Commitment[]> {
  const grouped: Record<MapCategory, Commitment[]> = {
    activations: [],
    creations: [],
    connections: [],
    sessions: [],
  }
  for (const c of commitments) {
    if (isSystemCommitment(c) && isPillarCategory(c.category)) {
      grouped[c.category].push(c)
    }
  }
  return grouped
}

export function groupCustomByLifeCategory(
  commitments: Commitment[],
): Record<string, Commitment[]> {
  const grouped: Record<string, Commitment[]> = {}
  for (const c of commitments) {
    if (!isCustomCommitment(c)) continue
    const key = c.category || 'other'
    if (!grouped[key]) grouped[key] = []
    grouped[key].push(c)
  }
  return grouped
}

export function partitionCommitments(commitments: Commitment[]) {
  const system: Commitment[] = []
  const custom: Commitment[] = []
  for (const c of commitments) {
    if (isSystemCommitment(c)) system.push(c)
    else custom.push(c)
  }
  return { system, custom }
}

export type { LifeCategoryKey }
