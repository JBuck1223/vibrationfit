import { SEO_PAGES, pageUrl } from '@/content/seo/registry'
import type { SeoPage } from '@/content/seo/types'

/**
 * Google Ads Editor export built from the SEO page registry. Used by the
 * admin download route and `scripts/seo/generate-google-ads.ts`.
 */

/** Applied to every campaign; mirrors the plan's shared negative list. */
export const SHARED_NEGATIVES = [
  'jobs', 'job', 'salary', 'certification', 'near me', 'amazon', 'etsy', 'kit', 'supplies',
  'poster board', 'cork', 'frame', 'magazine', 'magazines', 'book', 'tattoo', 'lyrics', 'song',
  'bible verse', 'church', 'worksheet',
]

export const CAMPAIGN_DAILY_BUDGET: Record<string, number> = {
  'VF – Brand': 5,
  'VF – Vision Board – Commercial': 40,
  'VF – Vision Board – Learn': 10,
  'VF – Affirmations': 15,
  'VF – Manifestation': 10,
  'VF – Journaling': 10,
  'VF – LOA & Life Design': 10,
}

export const FINAL_URL_SUFFIX =
  'kw={keyword}&mt={matchtype}&ag={adgroupid}&cr={creative}&dev={device}&utm_source=google&utm_medium=cpc&utm_campaign={campaignid}&utm_term={keyword}'

export const HEADLINE_MAX = 30
export const DESCRIPTION_MAX = 90
const MAX_HEADLINES = 15
const MAX_DESCRIPTIONS = 4

export type ExportFile = 'campaigns' | 'ad-groups' | 'keywords' | 'ads' | 'negatives'
export const EXPORT_FILES: ExportFile[] = ['campaigns', 'ad-groups', 'keywords', 'ads', 'negatives']

/** Length Google Ads counts for {KeyWord:Default} insertion: the default text. */
export function adTextLength(text: string): number {
  return text.replace(/\{KeyWord:([^}]*)\}/gi, '$1').length
}

export function pinnedHeadline(page: SeoPage): string {
  return `{KeyWord:${page.ppc!.defaultHeadline}}`
}

export function adHeadlines(page: SeoPage): string[] {
  return [pinnedHeadline(page), ...page.ppc!.headlines].slice(0, MAX_HEADLINES)
}

export function adProblems(page: SeoPage): string[] {
  const ppc = page.ppc
  if (!ppc) return []
  const problems: string[] = []
  adHeadlines(page).forEach((headline, i) => {
    if (adTextLength(headline) > HEADLINE_MAX) problems.push(`Headline ${i + 1} is ${adTextLength(headline)} chars (max ${HEADLINE_MAX}): ${headline}`)
  })
  ppc.descriptions.forEach((description, i) => {
    if (description.length > DESCRIPTION_MAX) problems.push(`Description ${i + 1} is ${description.length} chars (max ${DESCRIPTION_MAX}): ${description}`)
  })
  if (adHeadlines(page).length < 3) problems.push('Needs at least 3 headlines')
  if (ppc.descriptions.length < 2) problems.push('Needs at least 2 descriptions')
  return problems
}

export function adPaths(page: SeoPage): [string, string] {
  const [path1 = '', path2 = ''] = page.path.split('/').map(part => part.slice(0, 15))
  return [path1, path2]
}

function toCsv(rows: (string | number)[][]): string {
  return rows
    .map(row => row.map(cell => {
      const text = String(cell)
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
    }).join(','))
    .join('\n') + '\n'
}

export function buildGoogleAdsExport(pages: SeoPage[] = SEO_PAGES): { files: Record<ExportFile, string>; problems: string[]; counts: Record<string, number> } {
  const ppcPages = pages.filter(page => page.ppc)
  const campaigns = [...new Set(ppcPages.map(page => page.ppc!.campaign))]
  const problems = ppcPages.flatMap(page => adProblems(page).map(problem => `${page.ppc!.adGroup}: ${problem}`))

  const campaignRows: (string | number)[][] = [
    ['Campaign', 'Campaign Type', 'Networks', 'Budget', 'Budget type', 'Bid Strategy Type', 'Languages', 'Location', 'Final URL suffix', 'Campaign Status'],
    ...campaigns.map(name => [
      name, 'Search', 'Google search', CAMPAIGN_DAILY_BUDGET[name] ?? 10, 'Daily', 'Maximize clicks', 'en', 'United States', FINAL_URL_SUFFIX, 'Paused',
    ]),
  ]
  const adGroupRows: (string | number)[][] = [['Campaign', 'Ad Group', 'Max CPC', 'Ad Group Status', 'Landing Page Status']]
  const keywordRows: (string | number)[][] = [['Campaign', 'Ad Group', 'Keyword', 'Criterion Type', 'Max CPC', 'Final URL', 'Status']]
  const negativeRows: (string | number)[][] = [['Campaign', 'Ad Group', 'Keyword', 'Criterion Type']]
  const adRows: (string | number)[][] = [[
    'Campaign', 'Ad Group', 'Ad type',
    ...Array.from({ length: MAX_HEADLINES }, (_, i) => `Headline ${i + 1}`),
    'Headline 1 position',
    ...Array.from({ length: MAX_DESCRIPTIONS }, (_, i) => `Description ${i + 1}`),
    'Path 1', 'Path 2', 'Final URL', 'Status',
  ]]

  for (const page of ppcPages) {
    const ppc = page.ppc!
    const url = pageUrl(page)
    adGroupRows.push([ppc.campaign, ppc.adGroup, ppc.maxCpc.toFixed(2), 'Enabled', page.status])
    for (const keyword of ppc.keywords) {
      for (const matchType of ['Exact', 'Phrase'] as const) {
        keywordRows.push([ppc.campaign, ppc.adGroup, keyword, matchType, ppc.maxCpc.toFixed(2), url, 'Enabled'])
      }
    }
    for (const negative of ppc.negatives ?? []) negativeRows.push([ppc.campaign, ppc.adGroup, negative, 'Negative Phrase'])
    const headlines = adHeadlines(page)
    adRows.push([
      ppc.campaign, ppc.adGroup, 'Responsive search ad',
      ...Array.from({ length: MAX_HEADLINES }, (_, i) => headlines[i] ?? ''),
      '1',
      ...Array.from({ length: MAX_DESCRIPTIONS }, (_, i) => ppc.descriptions[i] ?? ''),
      ...adPaths(page), url, 'Enabled',
    ])
  }
  for (const campaign of campaigns) {
    for (const negative of SHARED_NEGATIVES) negativeRows.push([campaign, '', negative, 'Campaign Negative Phrase'])
  }

  return {
    files: {
      campaigns: toCsv(campaignRows),
      'ad-groups': toCsv(adGroupRows),
      keywords: toCsv(keywordRows),
      ads: toCsv(adRows),
      negatives: toCsv(negativeRows),
    },
    problems,
    counts: {
      campaigns: campaigns.length,
      adGroups: ppcPages.length,
      keywords: keywordRows.length - 1,
      ads: adRows.length - 1,
      negatives: negativeRows.length - 1,
    },
  }
}
