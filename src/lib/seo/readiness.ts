import type { SeoPage } from '@/content/seo/types'
import { getSeoPage, getVariants, keywordSlug } from '@/content/seo/registry'
import { adProblems, adHeadlines } from './google-ads-export'

/**
 * Readiness checklists for the three outcomes each landing page exists for:
 * ranking in Google (SEO), being cited by answer engines (AI) and converting
 * paid clicks with a high Quality Score (PPC). Checks are computed from the
 * page config, so they are always in sync with what is deployed.
 */

export type CheckStatus = 'pass' | 'warn' | 'fail'
export type Check = { label: string; status: CheckStatus; detail: string }
export type Pillar = 'seo' | 'ai' | 'ppc'
export type PillarReport = { pillar: Pillar; label: string; score: number; checks: Check[] }

export const PILLAR_LABELS: Record<Pillar, string> = { seo: 'SEO', ai: 'AI search', ppc: 'PPC' }

const words = (text: string) => text.trim().split(/\s+/).filter(Boolean).length

function check(label: string, status: CheckStatus, detail: string): Check {
  return { label, status, detail }
}

function range(label: string, value: number, min: number, max: number, unit: string, soft = true): Check {
  const ok = value >= min && value <= max
  return check(label, ok ? 'pass' : soft ? 'warn' : 'fail', `${value} ${unit} (target ${min}–${max})`)
}

function score(checks: Check[]): number {
  const points = checks.reduce((sum, c) => sum + (c.status === 'pass' ? 1 : c.status === 'warn' ? 0.5 : 0), 0)
  return Math.round((points / checks.length) * 100)
}

function seoChecks(page: SeoPage): Check[] {
  const kw = page.keyword.toLowerCase()
  const screenshots = page.steps.items.filter(step => step.screenshot).length
  const related = page.related.filter(path => getSeoPage(path)).length
  const wordCount = words([
    page.answer, page.heroSub, page.steps.intro ?? '',
    ...page.steps.items.map(s => `${s.title} ${s.body}`),
    ...(page.examples?.groups.flatMap(g => g.items) ?? []),
    ...page.founderNote.paragraphs, ...page.faqs.map(f => `${f.question} ${f.answer}`),
  ].join(' '))
  const hub = page.path.split('/')[0]
  return [
    check('Published and indexable', page.status === 'published' ? 'pass' : 'fail', page.status === 'published' ? 'index, follow · in sitemap.xml' : 'Draft: noindex and left out of the sitemap'),
    range('Title length', page.title.length, 30, 65, 'chars'),
    range('Meta description length', page.description.length, 120, 160, 'chars'),
    check('H1 contains the primary keyword', page.h1.toLowerCase().includes(kw) || kw.includes(page.h1.toLowerCase()) ? 'pass' : 'fail', `H1 "${page.h1}" · keyword "${page.keyword}"`),
    check('Keyword in the URL', keywordSlug(kw).split('-').some(word => word.length > 3 && page.path.includes(word)) ? 'pass' : 'warn', `/${page.path}`),
    range('Body copy depth', wordCount, page.path.includes('/') ? 1000 : 1500, 2500, 'words', true),
    range('Step-by-step section', page.steps.items.length, 3, 8, 'steps'),
    check('Real app screenshots in steps', screenshots >= 2 ? 'pass' : 'warn', `${screenshots} of ${page.steps.items.length} steps have a screenshot`),
    check('Hero product video', page.video ? 'pass' : 'warn', page.video ? 'VideoObject + transcript' : 'Using a screenshot; record a 30–60s feature video'),
    check('Free interactive tool', page.tool ? 'pass' : 'warn', page.tool ? page.tool.title : 'No tool yet'),
    check('Internal links to related pages', related >= 3 ? 'pass' : related >= 1 ? 'warn' : 'fail', `${related} live related page(s); target 3+ (hub, siblings, one cross-cluster)`),
    check('Cluster hub is live', hub === page.path || getSeoPage(hub) ? 'pass' : 'warn', hub === page.path ? 'This page is the hub' : `/${hub} not built yet; the breadcrumb is unlinked`),
    range('FAQ (People Also Ask)', page.faqs.length, 5, 8, 'questions'),
    check('Freshness', (Date.now() - new Date(page.dateModified).getTime()) / 86_400_000 < 120 ? 'pass' : 'warn', `Updated ${page.dateModified}; refresh monthly`),
  ]
}

function aiChecks(page: SeoPage): Check[] {
  const answerWords = words(page.answer)
  return [
    check('Crawlable by AI search bots', 'pass', 'robots.txt allows GPTBot, OAI-SearchBot, ClaudeBot, PerplexityBot, Google-Extended and more'),
    check('Listed in llms.txt and llms-full.txt', page.status === 'published' ? 'pass' : 'fail', page.status === 'published' ? 'Included' : 'Drafts are excluded'),
    check('Markdown twin', 'pass', `/${page.path}.md`),
    range('Answer-first paragraph', answerWords, 40, 60, 'words'),
    check('Quotable definition sentence', page.definition.text.length > 40 ? 'pass' : 'warn', `${page.definition.term}: ${page.definition.text}`),
    check('Structured data', 'pass', `Organization, Article, BreadcrumbList, FAQPage, HowTo, SoftwareApplication${page.video ? ', VideoObject' : ''}`),
    check('First-hand founder experience', page.founderNote.paragraphs.length >= 2 ? 'pass' : 'warn', page.founderNote.heading),
    check('Named authors (E-E-A-T)', 'pass', 'Jordan & Vanessa Buckingham in Article JSON-LD'),
    check('Video transcript for answer engines', page.video?.transcript ? 'pass' : 'warn', page.video ? 'Transcript present' : 'Add with the hero video'),
    check('Static HTML (no JS needed to read)', 'pass', 'Pre-rendered at build; tools enhance on top'),
  ]
}

function ppcChecks(page: SeoPage): Check[] {
  const ppc = page.ppc
  if (!ppc) return [check('Ad group configured', 'fail', 'No ppc block on this page')]
  const problems = adProblems(page)
  const variants = getVariants(page)
  const keywordInH1 = variants.filter(v => v.h1.toLowerCase().includes(v.keyword.toLowerCase()) || ppc.overrides?.[v.keyword]?.h1).length
  const gadsId = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_ID)
  const leadLabel = Boolean(process.env.NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL)
  const offline = Boolean(process.env.GOOGLE_ADS_DEVELOPER_TOKEN && process.env.GOOGLE_ADS_CUSTOMER_ID)
  return [
    check('Landing page live', page.status === 'published' ? 'pass' : 'fail', page.status),
    range('Ad group keywords', ppc.keywords.length, 5, 20, 'keywords'),
    check('Keyword-matched landing variants', variants.length === ppc.keywords.length ? 'pass' : 'fail', `${variants.length} pre-rendered variants at /${page.path}/k/*`),
    check('Keyword appears in each variant H1', keywordInH1 === variants.length ? 'pass' : 'warn', `${keywordInH1} of ${variants.length}`),
    check('Pinned keyword-insertion headline', 'pass', adHeadlines(page)[0]),
    range('RSA headlines', adHeadlines(page).length, 10, 15, 'headlines'),
    range('RSA descriptions', ppc.descriptions.length, 3, 4, 'descriptions'),
    check('Ad text within Google limits', problems.length === 0 ? 'pass' : 'fail', problems.length === 0 ? 'All headlines ≤ 30, descriptions ≤ 90' : problems.join(' · ')),
    check('Cross-negatives to sibling pages', (ppc.negatives?.length ?? 0) > 0 ? 'pass' : 'warn', `${ppc.negatives?.length ?? 0} ad-group negatives + shared list`),
    check('Max CPC set', ppc.maxCpc > 0 ? 'pass' : 'fail', `$${ppc.maxCpc.toFixed(2)}`),
    check('Google Ads tag', gadsId ? 'pass' : 'fail', gadsId ? 'NEXT_PUBLIC_GOOGLE_ADS_ID set' : 'Set NEXT_PUBLIC_GOOGLE_ADS_ID'),
    check('Lead conversion label', leadLabel ? 'pass' : 'warn', leadLabel ? 'Set' : 'Set NEXT_PUBLIC_GOOGLE_ADS_LEAD_LABEL (conversion tracking branch)'),
    check('Offline purchase upload', offline ? 'pass' : 'warn', offline ? 'Google Ads API configured' : 'Set GOOGLE_ADS_* API credentials (conversion tracking branch)'),
  ]
}

export function getReadiness(page: SeoPage): PillarReport[] {
  return (['seo', 'ai', 'ppc'] as const).map(pillar => {
    const checks = pillar === 'seo' ? seoChecks(page) : pillar === 'ai' ? aiChecks(page) : ppcChecks(page)
    return { pillar, label: PILLAR_LABELS[pillar], score: score(checks), checks }
  })
}

export function verdict(scoreValue: number): { label: string; tone: 'success' | 'warning' | 'danger' } {
  if (scoreValue >= 85) return { label: 'Ready', tone: 'success' }
  if (scoreValue >= 60) return { label: 'Almost', tone: 'warning' }
  return { label: 'Not ready', tone: 'danger' }
}
