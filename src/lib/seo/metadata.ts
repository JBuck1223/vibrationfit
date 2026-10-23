import type { Metadata } from 'next'
import type { SeoPage } from '@/content/seo/types'
import type { SeoVariant } from '@/content/seo/registry'

/**
 * Metadata for an SEO landing page. Keyword variants share the main page's
 * canonical and are never indexed; drafts are noindex until founder review.
 */
export function buildSeoMetadata(page: SeoPage, variant?: SeoVariant): Metadata {
  const canonical = `/${page.path}`
  const indexable = page.status === 'published' && !variant
  const title = variant ? `${variant.h1}: ${page.title.split(':').slice(1).join(':').trim() || page.title}` : page.title

  return {
    title: { absolute: `${title} | Vibration Fit` },
    description: page.description,
    keywords: [page.keyword, ...page.secondaryKeywords],
    alternates: { canonical, types: { 'text/markdown': `${canonical}.md` } },
    robots: indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: {
      title,
      description: page.description,
      url: canonical,
      type: 'article',
      siteName: 'Vibration Fit',
      publishedTime: page.datePublished,
      modifiedTime: page.dateModified,
      images: [{ url: `/og/${page.path}`, width: 1200, height: 630, alt: page.h1 }],
    },
    twitter: { card: 'summary_large_image', title, description: page.description, images: [`/og/${page.path}`] },
  }
}
