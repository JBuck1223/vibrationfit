import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ROADMAP, CLUSTER_LABELS } from '@/content/seo/roadmap'
import { SITE_URL, getSeoPage, getVariants, pageUrl } from '@/content/seo/registry'
import { getReadiness } from '@/lib/seo/readiness'
import { adHeadlines, adPaths, adProblems, adTextLength, HEADLINE_MAX, DESCRIPTION_MAX } from '@/lib/seo/google-ads-export'
import { AdPreview, ExtLink, Panel, Pill, PillarCard, ScorePill, fmt, money } from '@/components/admin-seo/ui'
import { SeoIdeaCapture } from '@/components/admin-seo/SeoIdeaCapture'

export const dynamic = 'force-dynamic'

type Params = { path: string[] }

export async function generateMetadata({ params }: { params: Promise<Params> }) {
  const path = (await params).path.join('/')
  return { title: getSeoPage(path)?.h1 ?? ROADMAP.find(entry => entry.path === path)?.title ?? 'SEO page' }
}

export default async function SeoAdminPageDetail({ params }: { params: Promise<Params> }) {
  const path = (await params).path.join('/')
  const page = getSeoPage(path)
  const entry = ROADMAP.find(item => item.path === path)
  if (!page && !entry) notFound()

  const keywordTable = entry && (
    <Panel title="Keyword research (Semrush, US)">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
            <tr><th className="pb-2">Keyword</th><th className="pb-2 text-right">Searches/mo</th><th className="pb-2 text-right">KD</th><th className="pb-2 text-right">CPC</th></tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {entry.keywords.map(k => (
              <tr key={k.keyword}>
                <td className="py-2 text-neutral-200">{k.keyword} {k.spiky && <Pill tone="warning">spike</Pill>}</td>
                <td className="py-2 text-right tabular-nums">{fmt(k.vol)}</td>
                <td className="py-2 text-right tabular-nums">{k.kd ?? '—'}</td>
                <td className="py-2 text-right tabular-nums">{money(k.cpc)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {entry.note && <p className="mt-3 text-xs text-neutral-400">{entry.note}</p>}
    </Panel>
  )

  if (!page) {
    return (
      <div className="space-y-6">
        <Link href="/admin/seo/pages" className="text-sm text-neutral-500 hover:text-neutral-300">← All pages</Link>
        <div>
          <h1 className="text-2xl font-bold text-white">{entry!.title} <Pill>Planned</Pill></h1>
          <p className="mt-1 text-sm text-neutral-400">/{entry!.path} · {CLUSTER_LABELS[entry!.cluster]} · Wave {entry!.wave}</p>
        </div>
        <Panel title="Plan">
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <div><dt className="text-xs text-neutral-500">Feature to showcase</dt><dd className="text-neutral-100">{entry!.feature}</dd></div>
            <div><dt className="text-xs text-neutral-500">Free on-page tool</dt><dd className="text-neutral-100">{entry!.tool ?? '—'}</dd></div>
            <div><dt className="text-xs text-neutral-500">To build it</dt><dd className="text-neutral-100">Add <code className="text-[#39FF14]">src/content/seo/pages/…</code> and register it</dd></div>
          </dl>
        </Panel>
        <SeoIdeaCapture path={path} description="Talk through the page before it is built: angle, free tool, examples, the founder story, what the CTA should promise." />
        {keywordTable}
      </div>
    )
  }

  const readiness = getReadiness(page)
  const variants = getVariants(page)
  const url = pageUrl(page)
  const ppc = page.ppc
  const headlines = ppc ? adHeadlines(page) : []
  const problems = adProblems(page)
  const [path1, path2] = adPaths(page)
  const displayPath = [path1, path2].filter(Boolean).join('/')

  return (
    <div className="space-y-6">
      <Link href="/admin/seo/pages" className="text-sm text-neutral-500 hover:text-neutral-300">← All pages</Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">{page.h1} {page.status === 'published' ? <Pill tone="success">Live</Pill> : <Pill tone="warning">Draft</Pill>}</h1>
          <p className="mt-1 text-sm text-neutral-400">
            /{page.path} · {CLUSTER_LABELS[page.cluster]}{entry ? ` · Wave ${entry.wave}` : ''} · primary keyword “{page.keyword}” · updated {page.dateModified}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {readiness.map(report => <ScorePill key={report.pillar} label={report.label} score={report.score} />)}
          </div>
        </div>
        <div className="flex flex-wrap gap-x-5 gap-y-2">
          <ExtLink href={`/${page.path}`}>View page</ExtLink>
          <ExtLink href={url}>Production</ExtLink>
          <ExtLink href={`/${page.path}.md`}>Markdown twin</ExtLink>
          <ExtLink href={`https://search.google.com/test/rich-results?url=${encodeURIComponent(url)}`}>Rich Results Test</ExtLink>
          <ExtLink href={`https://pagespeed.web.dev/analysis?url=${encodeURIComponent(url)}`}>PageSpeed</ExtLink>
          <ExtLink href={`https://www.google.com/search?q=${encodeURIComponent(`site:${SITE_URL.replace('https://', '')}/${page.path}`)}`}>Indexed?</ExtLink>
        </div>
      </div>

      <SeoIdeaCapture path={path} title="Redesign ideas" description="What should change on this page? Speak it; the transcript is saved here for the next rewrite." />

      <div className="grid gap-6 lg:grid-cols-3">
        {readiness.map(report => <PillarCard key={report.pillar} report={report} />)}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <Panel title="Search appearance">
          <div className="rounded-xl border border-white/10 bg-white p-4 font-sans">
            <p className="text-xs text-neutral-600">vibrationfit.com › {page.path.split('/').join(' › ')}</p>
            <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{page.title}</p>
            <p className="mt-1 text-sm text-neutral-700">{page.description}</p>
          </div>
          <p className="mt-4 text-xs uppercase tracking-wide text-neutral-500">Featured-snippet / AI answer</p>
          <p className="mt-1 text-sm text-neutral-300">{page.answer}</p>
        </Panel>
        <Panel title="Share image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={`/og/${page.path}`} alt={`Open Graph image for ${page.h1}`} className="w-full rounded-lg border border-white/10" width={1200} height={630} />
        </Panel>
      </div>

      {ppc && (
        <Panel
          title={<>Google Ads · {ppc.campaign} › {ppc.adGroup}</>}
          action={<ExtLink href="/admin/seo/ads">All ads &amp; export</ExtLink>}
        >
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="space-y-3">
              <p className="text-xs uppercase tracking-wide text-neutral-500">Ad preview (default keyword)</p>
              <AdPreview headlines={headlines} descriptions={ppc.descriptions} displayPath={displayPath} />
              <p className="text-xs uppercase tracking-wide text-neutral-500">Ad preview for “{variants[1]?.keyword ?? page.keyword}”</p>
              <AdPreview keyword={variants[1]?.keyword} headlines={headlines} descriptions={ppc.descriptions} displayPath={displayPath} />
              <p className="text-xs text-neutral-500">Max CPC {money(ppc.maxCpc)} · {ppc.keywords.length} keywords × exact + phrase · negatives: {(ppc.negatives ?? []).join(', ') || 'none'}</p>
              {problems.length > 0 && <p className="text-xs text-red-400">{problems.join(' · ')}</p>}
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-neutral-500">Headlines &amp; descriptions</p>
              <ul className="mt-2 space-y-1 text-sm">
                {headlines.map((headline, i) => (
                  <li key={headline} className="flex justify-between gap-3">
                    <span className="text-neutral-200">{i === 0 && <Pill>Pinned</Pill>} {headline}</span>
                    <span className={`tabular-nums text-xs ${adTextLength(headline) > HEADLINE_MAX ? 'text-red-400' : 'text-neutral-500'}`}>{adTextLength(headline)}/{HEADLINE_MAX}</span>
                  </li>
                ))}
                {ppc.descriptions.map(description => (
                  <li key={description} className="flex justify-between gap-3 pt-1">
                    <span className="text-neutral-400">{description}</span>
                    <span className={`tabular-nums text-xs ${description.length > DESCRIPTION_MAX ? 'text-red-400' : 'text-neutral-500'}`}>{description.length}/{DESCRIPTION_MAX}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Panel>
      )}

      {variants.length > 0 && (
        <Panel title={`Keyword-matched landing pages (${variants.length})`}>
          <p className="mb-4 text-xs text-neutral-500">
            When an ad click arrives with <code className="text-neutral-300">?kw=</code> set to one of these keywords, the visitor sees this version. Variants are noindex with a canonical to the main page.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-neutral-500">
                <tr><th className="pb-2">Ad keyword</th><th className="pb-2">Landing H1</th><th className="pb-2">CTA</th><th className="pb-2" /></tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {variants.map(variant => (
                  <tr key={variant.slug}>
                    <td className="py-2 text-neutral-200">{variant.keyword}{ppc?.overrides?.[variant.keyword] && <> <Pill>custom</Pill></>}</td>
                    <td className="py-2 font-medium text-white">{variant.h1}</td>
                    <td className="py-2 text-neutral-400">{variant.cta}</td>
                    <td className="py-2 text-right"><ExtLink href={`/${page.path}?kw=${encodeURIComponent(variant.keyword)}`}>Open as ad click</ExtLink></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      )}

      {keywordTable}

      <Panel title="Content outline">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-neutral-300">
          {page.tool && <li>Free tool: {page.tool.title}</li>}
          <li>{page.steps.heading} ({page.steps.items.length} steps)</li>
          {page.examples && <li>{page.examples.heading} ({page.examples.groups.reduce((n, g) => n + g.items.length, 0)} examples)</li>}
          <li>Founder note: {page.founderNote.heading}</li>
          <li>FAQ: {page.faqs.map(f => f.question).join(' · ')}</li>
        </ol>
        <p className="mt-3 text-xs text-neutral-500">Edit in <code className="text-neutral-300">src/content/seo/pages/</code>; ads and variants regenerate from the same file.</p>
      </Panel>
    </div>
  )
}
