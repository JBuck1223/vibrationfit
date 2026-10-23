import { ROADMAP, clusterVolume, type RoadmapEntry } from '@/content/seo/roadmap'
import { SEO_PAGES, getSeoPage, getVariants } from '@/content/seo/registry'
import type { SeoPage } from '@/content/seo/types'
import { getReadiness, type Pillar, type PillarReport } from './readiness'

export type RoadmapRow = {
  entry: RoadmapEntry
  page?: SeoPage
  readiness?: PillarReport[]
  scores: Record<Pillar, number | null>
  volume: number
  live: boolean
}

export function getRoadmapRows(): RoadmapRow[] {
  return ROADMAP.map(entry => {
    const page = getSeoPage(entry.path)
    const readiness = page ? getReadiness(page) : undefined
    const scoreOf = (pillar: Pillar) => readiness?.find(r => r.pillar === pillar)?.score ?? null
    return {
      entry,
      page,
      readiness,
      scores: { seo: scoreOf('seo'), ai: scoreOf('ai'), ppc: scoreOf('ppc') },
      volume: clusterVolume(entry),
      live: page?.status === 'published',
    }
  })
}

/** Built pages that are not on the roadmap (kept visible so nothing is orphaned). */
export function getOffRoadmapPages(): SeoPage[] {
  const planned = new Set(ROADMAP.map(entry => entry.path))
  return SEO_PAGES.filter(page => !planned.has(page.path))
}

export function getTotals() {
  const rows = getRoadmapRows()
  const built = rows.filter(row => row.page)
  const avg = (pillar: Pillar) => {
    const scores = built.map(row => row.scores[pillar]).filter((s): s is number => s !== null)
    return scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : null
  }
  return {
    rows,
    planned: rows.length,
    built: built.length,
    live: rows.filter(row => row.live).length,
    avg: { seo: avg('seo'), ai: avg('ai'), ppc: avg('ppc') },
    adGroups: SEO_PAGES.filter(page => page.ppc).length,
    ppcKeywords: SEO_PAGES.reduce((sum, page) => sum + (page.ppc?.keywords.length ?? 0), 0),
    variants: SEO_PAGES.reduce((sum, page) => sum + getVariants(page).length, 0),
    liveVolume: rows.filter(row => row.live).reduce((sum, row) => sum + row.volume, 0),
    plannedVolume: rows.reduce((sum, row) => sum + row.volume, 0),
  }
}

export function adminPagePath(path: string) {
  return `/admin/seo/pages/${path}`
}
