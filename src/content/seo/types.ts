/**
 * SEO landing page content model.
 *
 * One `SeoPage` drives the organic page, its Markdown twin, llms.txt, the
 * sitemap, JSON-LD, the keyword-matched PPC variants and the Google Ads
 * Editor export — so ads and pages can never drift apart.
 */

export type SeoCluster =
  | 'vision-board'
  | 'affirmations'
  | 'manifestation'
  | 'journaling'
  | 'law-of-attraction'
  | 'conscious-creation'

export type SeoToolId = 'vision-board-builder' | 'affirmation-generator'

export type SeoStep = {
  title: string
  body: string
  screenshot?: { src: string; alt: string; width: number; height: number }
}

export type SeoFaq = { question: string; answer: string }

export type SeoVideo = {
  url: string
  thumbnailUrl: string
  /** ISO 8601 duration, e.g. PT1M30S */
  duration: string
  uploadDate: string
  transcript: string
}

export type SeoKeywordOverride = {
  h1?: string
  sub?: string
  cta?: string
}

export type SeoPpc = {
  campaign: string
  adGroup: string
  /** Fallback text for {KeyWord:...} in the pinned headline (max 30 chars). */
  defaultHeadline: string
  /** Ad group keywords. Each one gets a pre-rendered landing variant. */
  keywords: string[]
  /** Ad-group-level negatives (cross-negatives that route queries to sibling pages). */
  negatives?: string[]
  /** Subhead template for variants; `{keyword}` is replaced. */
  subTemplate: string
  /** RSA headlines 2–15 (max 30 chars each). */
  headlines: string[]
  /** RSA descriptions (max 90 chars each). */
  descriptions: string[]
  maxCpc: number
  overrides?: Record<string, SeoKeywordOverride>
}

export type SeoPage = {
  /** URL path without leading slash, e.g. 'vision-board/app' */
  path: string
  cluster: SeoCluster
  /** Organic primary keyword; the H1 says this. */
  keyword: string
  secondaryKeywords: string[]
  /** Founder review gate: unreviewed pages are noindex and stay out of the sitemap and llms.txt. */
  status: 'draft' | 'published'
  title: string
  description: string
  h1: string
  eyebrow: string
  /** 40–60 word answer-first paragraph (featured snippet / AI answer target). */
  answer: string
  /** One reusable definition sentence for the core concept (entity clarity). */
  definition: { term: string; text: string }
  heroSub: string
  ctaLabel: string
  video?: SeoVideo
  heroImage: { src: string; alt: string; width: number; height: number }
  tool?: { id: SeoToolId; title: string; intro: string }
  steps: { heading: string; intro?: string; items: SeoStep[] }
  examples?: { heading: string; intro?: string; groups: { title: string; items: string[] }[] }
  founderNote: { heading: string; paragraphs: string[] }
  faqs: SeoFaq[]
  related: string[]
  datePublished: string
  dateModified: string
  ppc?: SeoPpc
}
