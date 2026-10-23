import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { SeoLandingPage } from '@/components/seo/SeoLandingPage'
import { buildSeoMetadata } from '@/lib/seo/metadata'
import { SEO_PAGES, VARIANT_SEGMENT, getSeoPage, getVariant, getVariants } from '@/content/seo/registry'

type Params = { slug: string[] }

// Every SEO page and every keyword-matched PPC variant is pre-rendered; any
// other path under this catch-all is a 404.
export const dynamicParams = false

export function generateStaticParams(): Params[] {
  return SEO_PAGES.flatMap(page => {
    const base = page.path.split('/')
    return [{ slug: base }, ...getVariants(page).map(variant => ({ slug: [...base, VARIANT_SEGMENT, variant.slug] }))]
  })
}

/** /vision-boards/app → page; /vision-boards/app/k/vision-board-maker → page + variant */
function resolve(slug: string[]) {
  const variantAt = slug.lastIndexOf(VARIANT_SEGMENT)
  if (variantAt > 0 && variantAt === slug.length - 2) {
    const page = getSeoPage(slug.slice(0, variantAt).join('/'))
    const variant = page && getVariant(page, slug[slug.length - 1])
    if (page && variant) return { page, variant }
  }
  const page = getSeoPage(slug.join('/'))
  return page ? { page, variant: undefined } : null
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const resolved = resolve((await params).slug)
  return resolved ? buildSeoMetadata(resolved.page, resolved.variant) : {}
}

export default async function SeoPageRoute({ params }: { params: Promise<Params> }) {
  const resolved = resolve((await params).slug)
  if (!resolved) notFound()
  return <SeoLandingPage page={resolved.page} variant={resolved.variant} />
}
