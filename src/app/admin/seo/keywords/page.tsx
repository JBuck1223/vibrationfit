import Link from 'next/link'
import { ROADMAP, PARKED_KEYWORDS, CLUSTER_LABELS, SEMRUSH_PULLED_AT, clusterVolume } from '@/content/seo/roadmap'
import { getSeoPage } from '@/content/seo/registry'
import { adminPagePath } from '@/lib/seo/admin-data'
import type { SeoCluster } from '@/content/seo/types'
import { Panel, Pill, Stat, fmt, money } from '@/components/admin-seo/ui'

export const metadata = { title: 'SEO Keywords' }

function kdTone(kd: number | null) {
  if (kd === null) return 'neutral' as const
  if (kd < 30) return 'success' as const
  if (kd < 50) return 'warning' as const
  return 'danger' as const
}

export default function SeoAdminKeywords() {
  const rows = ROADMAP.flatMap(entry => entry.keywords.map(keyword => ({ entry, ...keyword })))
  const clusters = [...new Set(ROADMAP.map(entry => entry.cluster))] as SeoCluster[]
  const easyWins = rows.filter(row => !row.spiky && row.kd !== null && row.kd < 30 && row.vol >= 1000).sort((a, b) => b.vol - a.vol)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Keyword research</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Semrush US data pulled {SEMRUSH_PULLED_AT}. KD is difficulty (0–100; under 30 is a realistic win for a new domain). Volumes marked “spike” come from a single-month surge.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        {clusters.map(cluster => (
          <Stat key={cluster} label={CLUSTER_LABELS[cluster]} value={fmt(ROADMAP.filter(e => e.cluster === cluster).reduce((s, e) => s + clusterVolume(e), 0))} sub="searches / month" />
        ))}
      </div>

      <Panel title={`Easy wins (${easyWins.length})`}>
        <p className="mb-3 text-xs text-neutral-500">1,000+ searches a month with difficulty under 30.</p>
        <div className="flex flex-wrap gap-2">
          {easyWins.map(row => (
            <Link key={row.keyword} href={adminPagePath(row.entry.path)} className="rounded-full border border-[#39FF14]/30 px-3 py-1 text-sm text-neutral-200 hover:border-[#39FF14]">
              {row.keyword} <span className="text-neutral-500">{fmt(row.vol)} · KD {row.kd}</span>
            </Link>
          ))}
        </div>
      </Panel>

      <Panel title={`All target keywords (${rows.length})`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="pb-2">Keyword</th><th className="pb-2">Page</th><th className="pb-2">Cluster</th><th className="pb-2 text-right">Searches/mo</th><th className="pb-2 text-right">KD</th><th className="pb-2 text-right">CPC</th></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.sort((a, b) => b.vol - a.vol).map(row => (
                <tr key={`${row.entry.path}-${row.keyword}`}>
                  <td className="py-2 text-neutral-100">{row.keyword} {row.spiky && <Pill tone="warning">spike</Pill>}</td>
                  <td className="py-2">
                    <Link href={adminPagePath(row.entry.path)} className="text-neutral-300 hover:text-[#39FF14]">#{row.entry.n} {row.entry.title}</Link>
                    {getSeoPage(row.entry.path)?.status === 'published' && <> <Pill tone="success">Live</Pill></>}
                  </td>
                  <td className="py-2 text-neutral-400">{CLUSTER_LABELS[row.entry.cluster]}</td>
                  <td className="py-2 text-right tabular-nums">{fmt(row.vol)}</td>
                  <td className="py-2 text-right"><Pill tone={kdTone(row.kd)}>{row.kd ?? '—'}</Pill></td>
                  <td className="py-2 text-right tabular-nums">{money(row.cpc)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Parked (too competitive for now)">
        <div className="flex flex-wrap gap-2">
          {PARKED_KEYWORDS.map(k => (
            <span key={k.keyword} className="rounded-full border border-white/10 px-3 py-1 text-sm text-neutral-400">
              {k.keyword} <span className="text-neutral-600">{fmt(k.vol)} · KD {k.kd}</span>
            </span>
          ))}
        </div>
      </Panel>
    </div>
  )
}
