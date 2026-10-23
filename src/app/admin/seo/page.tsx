import Link from 'next/link'
import { getTotals, adminPagePath } from '@/lib/seo/admin-data'
import { VISION_BOARD_DEADLINE, CLUSTER_LABELS } from '@/content/seo/roadmap'
import { SITE_URL } from '@/content/seo/registry'
import { PILLAR_LABELS, verdict } from '@/lib/seo/readiness'
import { Panel, Pill, Stat, ScorePill, StatusIcon, ExtLink, fmt } from '@/components/admin-seo/ui'

export const metadata = { title: 'SEO & PPC' }
// Reads runtime env (tracking setup) and today's date (deadline countdown).
export const dynamic = 'force-dynamic'

function daysUntil(date: string) {
  return Math.ceil((new Date(`${date}T00:00:00Z`).getTime() - Date.now()) / 86_400_000)
}

export default function SeoAdminOverview() {
  const totals = getTotals()
  const deadlineDays = daysUntil(VISION_BOARD_DEADLINE)
  const visionRows = totals.rows.filter(row => row.entry.cluster === 'vision-board')
  const visionLive = visionRows.filter(row => row.live).length

  // Everything not yet passing on built pages, worst first.
  const attention = totals.rows
    .flatMap(row => (row.readiness ?? []).flatMap(report =>
      report.checks.filter(c => c.status !== 'pass').map(c => ({ row, pillar: report.label, check: c }))))
    .sort((a, b) => (a.check.status === 'fail' ? 0 : 1) - (b.check.status === 'fail' ? 0 : 1))

  const env = {
    gads: Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID),
    leadLabel: Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL),
    purchaseLabel: Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL || process.env.NEXT_PUBLIC_GOOGLE_ADS_CONVERSION_LABEL),
    offline: Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID),
    ga4: Boolean(process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID),
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white md:text-3xl">SEO, AI search &amp; PPC</h1>
        <p className="mt-1 text-sm text-neutral-400">
          One landing page per search intent, built to rank in Google, get cited by answer engines, and convert Google Ads clicks.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Pages live" value={`${totals.live} / ${totals.planned}`} sub={`${fmt(totals.liveVolume)} of ${fmt(totals.plannedVolume)} monthly searches covered`} />
        {(['seo', 'ai', 'ppc'] as const).map(pillar => {
          const score = totals.avg[pillar]
          return (
            <Stat
              key={pillar}
              label={`${PILLAR_LABELS[pillar]} readiness`}
              value={score === null ? '—' : `${score}%`}
              sub={score === null ? 'No pages built' : `${verdict(score).label} · average of live pages`}
            />
          )
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Panel title="Vision board season" className="lg:col-span-1">
          <p className="text-3xl font-bold text-white">{deadlineDays > 0 ? `${deadlineDays} days` : 'Now'}</p>
          <p className="mt-1 text-sm text-neutral-400">until {VISION_BOARD_DEADLINE}, the go-live target before New Year searches spike.</p>
          <p className="mt-4 text-sm text-neutral-300">{visionLive} of {visionRows.length} vision board pages live</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className="h-full bg-[#39FF14]" style={{ width: `${(visionLive / visionRows.length) * 100}%` }} />
          </div>
        </Panel>

        <Panel title="Google Ads" className="lg:col-span-1" action={<ExtLink href="/admin/seo/ads">Open ads</ExtLink>}>
          <dl className="grid grid-cols-3 gap-3 text-center">
            <div><dt className="text-xs text-neutral-500">Ad groups</dt><dd className="text-xl font-bold text-white">{totals.adGroups}</dd></div>
            <div><dt className="text-xs text-neutral-500">Keywords</dt><dd className="text-xl font-bold text-white">{totals.ppcKeywords}</dd></div>
            <div><dt className="text-xs text-neutral-500">Matched pages</dt><dd className="text-xl font-bold text-white">{totals.variants}</dd></div>
          </dl>
          <p className="mt-4 text-xs text-neutral-500">Each keyword has its own pre-rendered landing variant whose H1 is that keyword.</p>
        </Panel>

        <Panel title="Tracking setup" className="lg:col-span-1">
          <ul className="space-y-2 text-sm">
            {[
              ['Google Ads tag', env.gads],
              ['Lead conversion label', env.leadLabel],
              ['Purchase conversion label', env.purchaseLabel],
              ['Offline purchase upload (Ads API)', env.offline],
              ['GA4 (tool-use events)', env.ga4],
            ].map(([label, ok]) => (
              <li key={label as string} className="flex items-center gap-2">
                <StatusIcon status={ok ? 'pass' : 'fail'} />
                <span className="text-neutral-200">{label as string}</span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-neutral-500">Conversion code ships on branch claude/gifted-perlman-b548a9; env vars go in Vercel.</p>
        </Panel>
      </div>

      <Panel title="Pages" action={<ExtLink href="/admin/seo/pages">All 25 pages</ExtLink>}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
              <tr><th className="pb-3">Page</th><th className="pb-3">Cluster</th><th className="pb-3">SEO</th><th className="pb-3">AI</th><th className="pb-3">PPC</th><th className="pb-3" /></tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {totals.rows.filter(row => row.page).map(row => (
                <tr key={row.entry.path}>
                  <td className="py-3">
                    <Link href={adminPagePath(row.entry.path)} className="font-medium text-white hover:text-[#39FF14]">{row.page!.h1}</Link>
                    <span className="block text-xs text-neutral-500">/{row.entry.path}</span>
                  </td>
                  <td className="py-3 text-neutral-400">{CLUSTER_LABELS[row.entry.cluster]}</td>
                  <td className="py-3"><ScorePill score={row.scores.seo} /></td>
                  <td className="py-3"><ScorePill score={row.scores.ai} /></td>
                  <td className="py-3"><ScorePill score={row.scores.ppc} /></td>
                  <td className="py-3 text-right"><ExtLink href={`/${row.entry.path}`}>View</ExtLink></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-xs text-neutral-500">{totals.planned - totals.built} more pages are planned on the roadmap.</p>
      </Panel>

      <div className="grid gap-6 lg:grid-cols-2">
        <Panel title={`Needs attention (${attention.length})`}>
          {attention.length === 0 ? (
            <p className="text-sm text-neutral-400">Every check on every live page is passing.</p>
          ) : (
            <ul className="space-y-3">
              {attention.slice(0, 12).map(({ row, pillar, check }) => (
                <li key={`${row.entry.path}-${pillar}-${check.label}`} className="flex gap-2.5 text-sm">
                  <StatusIcon status={check.status} />
                  <span>
                    <span className="text-neutral-100">{check.label}</span> <Pill>{pillar}</Pill>
                    <Link href={adminPagePath(row.entry.path)} className="block text-xs text-neutral-500 hover:text-neutral-300">{row.page!.h1} · {check.detail}</Link>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Crawl files & tools">
          <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            <ExtLink href="/sitemap.xml">sitemap.xml</ExtLink>
            <ExtLink href="/robots.txt">robots.txt</ExtLink>
            <ExtLink href="/llms.txt">llms.txt</ExtLink>
            <ExtLink href="/llms-full.txt">llms-full.txt</ExtLink>
            <ExtLink href="https://search.google.com/search-console">Google Search Console</ExtLink>
            <ExtLink href="https://www.bing.com/webmasters">Bing Webmaster Tools</ExtLink>
            <ExtLink href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(SITE_URL + '/affirmations')}`}>Rich Results Test</ExtLink>
            <ExtLink href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL + '/affirmations')}`}>PageSpeed Insights</ExtLink>
            <ExtLink href="https://ads.google.com">Google Ads</ExtLink>
            <ExtLink href="https://www.semrush.com/projects/">Semrush projects</ExtLink>
          </div>
        </Panel>
      </div>
    </div>
  )
}
