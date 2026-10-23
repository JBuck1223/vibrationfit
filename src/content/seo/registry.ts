import type { SeoKeywordOverride, SeoPage } from './types'
import { visionBoardApp } from './pages/vision-board-app'
import { positiveAffirmations } from './pages/positive-affirmations'

export const SITE_URL = 'https://vibrationfit.com'

/** Segment that marks a keyword-matched PPC variant: /<page>/k/<keyword-slug> */
export const VARIANT_SEGMENT = 'k'

export const SEO_PAGES: SeoPage[] = [visionBoardApp, positiveAffirmations]

const BY_PATH = new Map(SEO_PAGES.map(page => [page.path, page]))

export function getSeoPage(path: string): SeoPage | undefined {
  return BY_PATH.get(path.replace(/^\/+|\/+$/g, ''))
}

/** Pages that are founder-approved; drafts stay out of the sitemap, llms.txt and the index. */
export function getIndexablePages(): SeoPage[] {
  return SEO_PAGES.filter(page => page.status === 'published')
}

export function pageUrl(page: SeoPage): string {
  return `${SITE_URL}/${page.path}`
}

/**
 * Normalizes an ad keyword (as ValueTrack {keyword} sends it, or as written in
 * the ad group) to a URL slug. Strips match-type symbols: +broad, "phrase", [exact].
 */
export function keywordSlug(keyword: string): string {
  return keyword
    .toLowerCase()
    .replace(/[+"[\]]/g, ' ')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const MINOR_WORDS = new Set(['a', 'an', 'and', 'as', 'at', 'by', 'for', 'in', 'of', 'on', 'or', 'the', 'to', 'with'])

function titleCase(text: string): string {
  return text
    .split(' ')
    .map((word, index) => (index > 0 && MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)))
    .join(' ')
}

export type SeoVariant = {
  keyword: string
  slug: string
  h1: string
  sub: string
  cta: string
}

export function buildVariant(page: SeoPage, keyword: string): SeoVariant {
  const override: SeoKeywordOverride = page.ppc?.overrides?.[keyword] ?? {}
  return {
    keyword,
    slug: keywordSlug(keyword),
    h1: override.h1 ?? titleCase(keyword),
    sub: override.sub ?? (page.ppc?.subTemplate ?? page.heroSub).replace(/\{keyword\}/g, keyword),
    cta: override.cta ?? page.ctaLabel,
  }
}

export function getVariants(page: SeoPage): SeoVariant[] {
  return (page.ppc?.keywords ?? []).map(keyword => buildVariant(page, keyword))
}

export function getVariant(page: SeoPage, slug: string): SeoVariant | undefined {
  return getVariants(page).find(variant => variant.slug === slug)
}

/**
 * Proxy lookup: given a pathname and the raw `kw` param, returns the internal
 * variant path when the keyword is on that page's ad group allowlist. Anything
 * else returns null and the normal page is served, so the raw param is never
 * rendered.
 */
export function resolveKeywordVariantPath(pathname: string, rawKeyword: string): string | null {
  const page = getSeoPage(pathname)
  if (!page?.ppc) return null
  const slug = keywordSlug(rawKeyword)
  if (!slug || !page.ppc.keywords.some(keyword => keywordSlug(keyword) === slug)) return null
  return `/${page.path}/${VARIANT_SEGMENT}/${slug}`
}

export function getRelatedPages(page: SeoPage): SeoPage[] {
  return page.related.map(path => getSeoPage(path)).filter((p): p is SeoPage => Boolean(p))
}
