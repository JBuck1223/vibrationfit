import Link from 'next/link'
import { getRoadmapRows, getOffRoadmapPages, adminPagePath } from '@/lib/seo/admin-data'
import { CLUSTER_LABELS } from '@/content/seo/roadmap'
import type { SeoCluster } from '@/content/seo/types'
import { Panel, Pill, ScorePill, ExtLink, fmt } from '@/components/admin-seo/ui'

export const metadata = { title: 'SEO Pages' }
export const dynamic = 'force-dynamic'

export default function SeoAdminPages() {
  const rows = getRoadmapRows()
  const offRoadmap = getOffRoadmapPages()
  const clusters = [...new Set(rows.map(row => row.entry.cluster))] as SeoCluster[]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Pages</h1>
        <p className="mt-1 text-sm text-neutral-400">
          The 25-page roadmap. Live pages show readiness for SEO, AI search and PPC; click a page for its checklist, keyword variants and ads.
        </p>
      </div>

      {clusters.map(cluster => {
        const clusterRows = rows.filter(row => row.entry.cluster === cluster)
        return (
          <Panel key={cluster} title={CLUSTER_LABELS[cluster]} action={<span className="text-xs text-neutral-500">{clusterRows.filter(r => r.live).length} of {clusterRows.length} live</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[820px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                  <tr>
                    <th className="w-10 pb-3">#</th>
                    <th className="pb-3">Page</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3">Wave</th>
                    <th className="pb-3 text-right">Searches/mo</th>
                    <th className="pb-3 text-right">KD</th>
                    <th className="pb-3 pl-4">SEO</th>
                    <th className="pb-3">AI</th>
                    <th className="pb-3">PPC</th>
                    <th className="pb-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {clusterRows.map(row => (
                    <tr key={row.entry.path} className={row.page ? '' : 'text-neutral-500'}>
                      <td className="py-3 text-neutral-500">{row.entry.n}</td>
                      <td className="py-3">
                        <Link href={adminPagePath(row.entry.path)} className={`font-medium hover:text-[#39FF14] ${row.page ? 'text-white' : 'text-neutral-400'}`}>
                          {row.entry.title}
                        </Link>
                        {row.entry.hub && <Pill>Hub</Pill>}
                        <span className="block text-xs text-neutral-500">/{row.entry.path}</span>
                      </td>
                      <td className="py-3">{row.live ? <Pill tone="success">Live</Pill> : row.page ? <Pill tone="warning">Draft</Pill> : <Pill>Planned</Pill>}</td>
                      <td className="py-3">{row.entry.wave}</td>
                      <td className="py-3 text-right tabular-nums">{fmt(row.volume)}</td>
                      <td className="py-3 text-right tabular-nums">{row.entry.keywords[0].kd ?? '—'}</td>
                      <td className="py-3 pl-4"><ScorePill score={row.scores.seo} /></td>
                      <td className="py-3"><ScorePill score={row.scores.ai} /></td>
                      <td className="py-3"><ScorePill score={row.scores.ppc} /></td>
                      <td className="py-3 text-right">{row.page ? <ExtLink href={`/${row.entry.path}`}>View</ExtLink> : null}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>
        )
      })}

      {offRoadmap.length > 0 && (
        <Panel title="Built pages not on the roadmap">
          <ul className="space-y-2 text-sm">
            {offRoadmap.map(page => (
              <li key={page.path}><Link href={adminPagePath(page.path)} className="text-white hover:text-[#39FF14]">{page.h1}</Link> <span className="text-neutral-500">/{page.path}</span></li>
            ))}
          </ul>
        </Panel>
      )}
    </div>
  )
}
