import type { MetadataRoute } from 'next'
import { getIndexablePages } from '@/content/seo/registry'

const BASE_URL = 'https://vibrationfit.com'

// Public marketing routes only — member/app routes are behind auth and
// intentionally excluded.
export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  const routes: Array<{ path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }> = [
    { path: '/', priority: 1.0, changeFrequency: 'weekly' },
    { path: '/system', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/assessment/start', priority: 0.9, changeFrequency: 'monthly' },
    { path: '/demo', priority: 0.8, changeFrequency: 'monthly' },
    { path: '/premium-application', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/referral', priority: 0.7, changeFrequency: 'monthly' },
    { path: '/contact', priority: 0.6, changeFrequency: 'yearly' },
    { path: '/framework/emotional-guidance-scale', priority: 0.6, changeFrequency: 'monthly' },
    { path: '/privacy-policy', priority: 0.3, changeFrequency: 'yearly' },
    { path: '/terms-of-service', priority: 0.3, changeFrequency: 'yearly' },
  ]

  const staticEntries: MetadataRoute.Sitemap = routes.map(({ path, priority, changeFrequency }) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }))

  // Founder-approved SEO landing pages; drafts and keyword variants are excluded.
  const seoEntries: MetadataRoute.Sitemap = getIndexablePages().map(page => ({
    url: `${BASE_URL}/${page.path}`,
    lastModified: new Date(page.dateModified),
    changeFrequency: 'monthly',
    priority: page.path.includes('/') ? 0.7 : 0.8,
    images: [`${BASE_URL}${page.heroImage.src}`],
  }))

  return [...staticEntries, ...seoEntries]
}
