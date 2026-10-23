import { SEO_PAGES, getSeoPage } from '@/content/seo/registry'
import { pageToMarkdown } from '@/content/seo/markdown'

// Markdown twins of SEO pages. The proxy rewrites /<page>.md here.
export const dynamicParams = false

export function generateStaticParams() {
  return SEO_PAGES.map(page => ({ slug: page.path.split('/') }))
}

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string[] }> }) {
  const page = getSeoPage((await params).slug.join('/'))
  if (!page) return new Response('Not found', { status: 404 })
  return new Response(pageToMarkdown(page), {
    headers: {
      'Content-Type': 'text/markdown; charset=utf-8',
      'X-Robots-Tag': page.status === 'published' ? 'noindex, follow' : 'noindex, nofollow',
      Link: `<https://vibrationfit.com/${page.path}>; rel="canonical"`,
    },
  })
}
