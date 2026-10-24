import type { SeoPage } from '@/content/seo/types'
import { SITE_URL, getSeoPage, pageUrl } from '@/content/seo/registry'

const CLUSTER_LABELS: Record<SeoPage['cluster'], { name: string; hub?: string }> = {
  'vision-board': { name: 'Vision Boards', hub: 'vision-board' },
  affirmations: { name: 'Affirmations', hub: 'affirmations' },
  manifestation: { name: 'Manifestation', hub: 'manifestation' },
  journaling: { name: 'Journaling', hub: 'journaling' },
  'law-of-attraction': { name: 'Law of Attraction', hub: 'law-of-attraction' },
  'conscious-creation': { name: 'Conscious Creation', hub: 'conscious-creation' },
}

export type Crumb = { name: string; path: string | null }

/** Home › Cluster hub (only linked once the hub exists) › Page */
export function getBreadcrumbs(page: SeoPage): Crumb[] {
  const crumbs: Crumb[] = [{ name: 'Home', path: '/' }]
  const cluster = CLUSTER_LABELS[page.cluster]
  if (cluster.hub !== page.path) {
    crumbs.push({ name: cluster.name, path: cluster.hub && getSeoPage(cluster.hub) ? `/${cluster.hub}` : null })
  }
  crumbs.push({ name: page.h1, path: `/${page.path}` })
  return crumbs
}

const ORGANIZATION = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: 'Vibration Fit',
  url: SITE_URL,
  logo: `${SITE_URL}/icon.png`,
  slogan: 'Conscious Creation on Autopilot',
  founder: [
    { '@type': 'Person', name: 'Jordan Buckingham' },
    { '@type': 'Person', name: 'Vanessa Buckingham' },
  ],
}

function buildGraph(page: SeoPage) {
  const url = pageUrl(page)
  const graph: Record<string, unknown>[] = [
    ORGANIZATION,
    {
      '@type': 'Article',
      '@id': `${url}#article`,
      headline: page.h1,
      description: page.description,
      about: { '@type': 'Thing', name: page.definition.term, description: page.definition.text },
      author: ORGANIZATION.founder,
      publisher: { '@id': ORGANIZATION['@id'] },
      datePublished: page.datePublished,
      dateModified: page.dateModified,
      mainEntityOfPage: url,
      image: `${SITE_URL}${page.heroImage.src}`,
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: getBreadcrumbs(page)
        .filter(crumb => crumb.path)
        .map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: `${SITE_URL}${crumb.path === '/' ? '' : crumb.path}`,
        })),
    },
    {
      '@type': 'FAQPage',
      mainEntity: page.faqs.map(faq => ({
        '@type': 'Question',
        name: faq.question,
        acceptedAnswer: { '@type': 'Answer', text: faq.answer },
      })),
    },
    {
      '@type': 'HowTo',
      name: page.steps.heading,
      step: page.steps.items.map((step, index) => ({
        '@type': 'HowToStep',
        position: index + 1,
        name: step.title,
        text: step.body,
        ...(step.screenshot ? { image: `${SITE_URL}${step.screenshot.src}` } : {}),
      })),
    },
    {
      '@type': 'SoftwareApplication',
      name: 'Vibration Fit',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web, iOS, Android',
      url: SITE_URL,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD', description: 'Free Activation' },
      publisher: { '@id': ORGANIZATION['@id'] },
    },
  ]
  if (page.video) {
    graph.push({
      '@type': 'VideoObject',
      name: page.h1,
      description: page.answer,
      thumbnailUrl: page.video.thumbnailUrl,
      contentUrl: page.video.url,
      uploadDate: page.video.uploadDate,
      duration: page.video.duration,
      transcript: page.video.transcript,
    })
  }
  return { '@context': 'https://schema.org', '@graph': graph }
}

export function SeoJsonLd({ page }: { page: SeoPage }) {
  // Escape `<` so page copy can never close the script tag.
  const json = JSON.stringify(buildGraph(page)).replace(/</g, '\\u003c')
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
}
