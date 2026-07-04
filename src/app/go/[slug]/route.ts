import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

/**
 * First-party branded short links: vibrationfit.com/go/<slug>
 *
 * Looks up the slug, counts the click, and 302-redirects to the stored
 * destination (which carries the UTM params). Because the visitor lands on our
 * own domain WITH the utm_* query string intact, the normal TrackingProvider
 * session capture attributes the visit — so attribution stays fully in tact.
 *
 * Unknown/inactive slugs fall back to the homepage rather than 404, so a
 * mistyped or retired link never dead-ends a prospect.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params
  const origin = request.nextUrl.origin
  const homepage = new URL('/', origin)

  if (!slug) return NextResponse.redirect(homepage, { status: 302 })

  try {
    const admin = createAdminClient()
    const { data: link } = await admin
      .from('short_links')
      .select('destination, is_active')
      .eq('slug', slug.toLowerCase())
      .maybeSingle()

    if (!link || !link.is_active || !link.destination) {
      return NextResponse.redirect(homepage, { status: 302 })
    }

    // Count the click. Awaited (not fire-and-forget) because a route handler's
    // pending promises are dropped once the response returns. Guarded so a
    // counter failure can never block the redirect.
    try {
      await admin.rpc('increment_short_link_click', { p_slug: slug.toLowerCase() })
    } catch {
      // best-effort click count only
    }

    // Build the destination; support both absolute URLs and site-relative paths.
    let destination: URL
    try {
      destination = new URL(link.destination)
    } catch {
      destination = new URL(link.destination, origin)
    }

    // Pass through any extra params on the /go link (e.g. ad-network click ids
    // like gclid/fbclid) without clobbering the destination's own params.
    request.nextUrl.searchParams.forEach((value, key) => {
      if (!destination.searchParams.has(key)) destination.searchParams.set(key, value)
    })

    return NextResponse.redirect(destination, { status: 302 })
  } catch {
    return NextResponse.redirect(homepage, { status: 302 })
  }
}
