/**
 * World Map — what of the universe he'll taste.
 * Ours. Not a publisher's unit list. Not the 12 life categories.
 *
 * Generate only honest hits: the taste must belong in the current world.
 * Penguins do not become planets.
 */

import type { WorldCluster, WorldMapStatus } from './types'

export const WORLD_CLUSTERS: Array<{ key: WorldCluster; label: string; hint: string }> = [
  { key: 'sky', label: 'Sky', hint: 'Sun, moon, weather, stars, air' },
  { key: 'earth', label: 'Earth', hint: 'Rocks, soil, ice, mountains, dirt under nails' },
  { key: 'water', label: 'Water', hint: 'Ocean, rivers, ice, rain, what floats' },
  { key: 'motion', label: 'Motion', hint: 'Push, pull, spin, freeze, melt, fly' },
  { key: 'living', label: 'Living', hint: 'Animals, plants, bodies, habitats' },
  { key: 'places', label: 'Places', hint: 'Maps, globes, here vs there, people who live there' },
  { key: 'making', label: 'Making', hint: 'Build, draw, cook, invent, fix' },
  { key: 'people', label: 'People', hint: 'Family, explorers, helpers, stories of humans' },
]

export function clusterLabel(cluster: WorldCluster): string {
  return WORLD_CLUSTERS.find((c) => c.key === cluster)?.label || cluster
}

export function statusLabel(status: WorldMapStatus): string {
  if (status === 'unvisited') return 'Not yet'
  if (status === 'tasted') return 'Tasted'
  if (status === 'wobbly') return 'Still settling'
  return 'Solid'
}

/** Honest-hit rule for the composer: skip tastes that do not belong in this world. */
export function honestHitInstruction(expeditionTitle: string, tastes: Array<{ cluster: string; name: string }>): string {
  if (tastes.length === 0) {
    return `No World Map tastes are queued. Do not invent a planet or a far-away unit that does not belong in ${expeditionTitle}. Stay in this world.`
  }
  return `World Map tastes that may belong in ${expeditionTitle} (use only an honest hit — skip any that do not belong in THIS world):
${tastes.map((t) => `- [${t.cluster}] ${t.name}`).join('\n')}
If none belong today, omit world_taste. Never bolt on an unrelated cluster.`
}
