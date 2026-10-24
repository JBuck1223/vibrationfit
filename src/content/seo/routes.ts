/**
 * Top-level URL prefixes owned by SEO landing pages. Kept free of page content
 * so client navigation code can import it cheaply.
 */
export const SEO_ROUTE_PREFIXES = [
  '/vision-board',
  '/affirmations',
  '/manifestation',
  '/journaling',
  '/law-of-attraction',
  '/conscious-creation',
] as const

export function isSeoRoute(pathname: string): boolean {
  const clean = pathname.split('?')[0]
  return SEO_ROUTE_PREFIXES.some(prefix => clean === prefix || clean.startsWith(`${prefix}/`) || clean === `${prefix}.md`)
}
