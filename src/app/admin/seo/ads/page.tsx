import Link from 'next/link'
import { Download } from 'lucide-react'
import { SEO_PAGES } from '@/content/seo/registry'
import { adminPagePath } from '@/lib/seo/admin-data'
import {
  buildGoogleAdsExport, adHeadlines, adPaths, adProblems,
  CAMPAIGN_DAILY_BUDGET, EXPORT_FILES, FINAL_URL_SUFFIX, SHARED_NEGATIVES,
} from '@/lib/seo/google-ads-export'
import { AdPreview, ExtLink, Panel, Pill, Stat, money } from '@/components/admin-seo/ui'

export const metadata = { title: 'Google Ads' }

export default function SeoAdminAds() {
  const { counts, problems } = buildGoogleAdsExport()
  const ppcPages = SEO_PAGES.filter(page => page.ppc)
  const campaigns = [...new Set(ppcPages.map(page => page.ppc!.campaign))]
  const dailyBudget = campaigns.reduce((sum, name) => sum + (CAMPAIGN_DAILY_BUDGET[name] ?? 10), 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Google Ads</h1>
        <p className="mt-1 text-sm text-neutral-400">
          Campaigns, ad groups and ads generated from the landing pages, so keyword, ad and page always match.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Stat label="Campaigns" value={counts.campaigns} />
        <Stat label="Ad groups" value={counts.adGroups} />
        <Stat label="Keyword rows" value={counts.keywords} sub="exact + phrase" />
        <Stat label="Daily budget" value={`$${dailyBudget}`} sub="starting test budget" />
        <Stat label="Ad text problems" value={problems.length} sub={problems.length ? 'Fix before export' : 'All within limits'} />
      </div>

      <Panel title="Export to Google Ads Editor">
        <div className="flex flex-wrap gap-3">
          {EXPORT_FILES.map((file, i) => (
            <a key={file} href={`/api/admin/seo/ads-export?file=${file}`} className="inline-flex items-center gap-2 rounded-full border border-white/15 px-4 py-2 text-sm text-neutral-100 hover:border-[#39FF14]/60 hover:text-[#39FF14]">
              <Download className="h-4 w-4" /> {i + 1}. {file}.csv
            </a>
          ))}
        </div>
        <ol className="mt-5 list-decimal space-y-1.5 pl-5 text-sm text-neutral-300">
          <li>In Google Ads Editor: Account → Import → From file. Import the files in the order above.</li>
          <li>Campaigns import paused. Review, then enable the ad groups whose landing page is live.</li>
          <li>Set the account-level Final URL suffix below (it is also on each campaign row).</li>
          <li>Post the changes, then check Quality Score by keyword after a week of impressions (target 7+).</li>
        </ol>
        <p className="mt-5 text-xs uppercase tracking-wide text-neutral-500">Final URL suffix</p>
        <code className="mt-1 block overflow-x-auto whitespace-nowrap rounded-lg border border-white/10 bg-black p-3 text-xs text-[#39FF14]">{FINAL_URL_SUFFIX}</code>
        {problems.length > 0 && <ul className="mt-4 list-disc pl-5 text-sm text-red-400">{problems.map(p => <li key={p}>{p}</li>)}</ul>}
      </Panel>

      {campaigns.map(campaign => (
        <Panel key={campaign} title={campaign} action={<span className="text-xs text-neutral-500">${CAMPAIGN_DAILY_BUDGET[campaign] ?? 10}/day · Search only · US · Maximize clicks</span>}>
          <div className="space-y-6">
            {ppcPages.filter(page => page.ppc!.campaign === campaign).map(page => {
              const ppc = page.ppc!
              const [path1, path2] = adPaths(page)
              const issues = adProblems(page)
              return (
                <div key={page.path} className="grid gap-5 border-t border-white/5 pt-5 first:border-0 first:pt-0 lg:grid-cols-[1fr_1fr]">
                  <div>
                    <p className="font-semibold text-white">
                      {ppc.adGroup} {page.status === 'published' ? <Pill tone="success">Page live</Pill> : <Pill tone="warning">Page draft</Pill>}
                      {issues.length > 0 && <> <Pill tone="danger">{issues.length} ad issue(s)</Pill></>}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      Lands on <Link href={adminPagePath(page.path)} className="text-neutral-300 hover:text-[#39FF14]">/{page.path}</Link> · max CPC {money(ppc.maxCpc)}
                    </p>
                    <div className="mt-3"><AdPreview headlines={adHeadlines(page)} descriptions={ppc.descriptions} displayPath={[path1, path2].filter(Boolean).join('/')} /></div>
                    <div className="mt-3 flex flex-wrap gap-4">
                      <ExtLink href={`/${page.path}?kw=${encodeURIComponent(ppc.keywords[0])}`}>Open landing page as ad click</ExtLink>
                      <ExtLink href={adminPagePath(page.path)}>Readiness &amp; variants</ExtLink>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Keywords ({ppc.keywords.length})</p>
                      <ul className="mt-2 space-y-1 text-sm">
                        {ppc.keywords.map(keyword => (
                          <li key={keyword}>
                            <a href={`/${page.path}?kw=${encodeURIComponent(keyword)}`} className="text-neutral-200 hover:text-[#39FF14]">[{keyword}]</a>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-neutral-500">Ad group negatives</p>
                      <p className="mt-2 text-sm text-neutral-400">{(ppc.negatives ?? []).join(', ') || 'None'}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </Panel>
      ))}

      <Panel title={`Shared negative keywords (${SHARED_NEGATIVES.length})`}>
        <p className="text-sm text-neutral-400">{SHARED_NEGATIVES.join(', ')}</p>
        <p className="mt-3 text-xs text-neutral-500">Applied to every campaign. Review the search-terms report weekly and add new negatives in <code className="text-neutral-300">src/lib/seo/google-ads-export.ts</code>.</p>
      </Panel>

      <Panel title="Policy guardrails">
        <ul className="list-disc space-y-1 pl-5 text-sm text-neutral-300">
          <li>No guaranteed-income claims (&ldquo;manifest $X&rdquo;): Google&rsquo;s unreliable claims policy.</li>
          <li>No mental-health treatment claims; anxiety and depression terms stay out of ads.</li>
          <li>No &ldquo;AI&rdquo; wording anywhere in ad or page copy.</li>
        </ul>
      </Panel>
    </div>
  )
}
