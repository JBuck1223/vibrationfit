import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveThemeForUser } from '@/lib/app-shell/resolve-theme'
import { getOverlay } from '@/lib/app-shell/overlays'

export const dynamic = 'force-dynamic'

/** The parts of a PostgREST error worth having in the server log. */
function describe(error: { code?: string; message: string; details?: string | null; hint?: string | null }) {
  return { code: error.code, message: error.message, details: error.details, hint: error.hint }
}

/** GET: the signed-in member's resolved theme (slot → url). */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const resolved = await resolveThemeForUser(supabase, user?.id ?? null)
  if (!resolved) {
    return NextResponse.json({ theme: null, images: {} })
  }
  return NextResponse.json(resolved, {
    // Never cache: a theme change (or a test image) should show on the next load.
    headers: { 'Cache-Control': 'no-store' },
  })
}

/** PATCH { themeId?, overlay? } : set the member's theme and/or overlay ('default' clears the overlay). */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { themeId?: string; overlay?: string } | null
  if (!body || (typeof body.themeId !== 'string' && typeof body.overlay !== 'string')) {
    return NextResponse.json({ error: 'themeId or overlay required' }, { status: 400 })
  }

  const what = typeof body.themeId === 'string' ? 'theme' : 'overlay'
  const update: Record<string, string | null> = {}
  if (typeof body.themeId === 'string') {
    const { data: theme, error: lookupError } = await supabase.from('themes').select('id').eq('id', body.themeId).maybeSingle()
    if (lookupError) {
      console.error('[app-shell/theme] theme lookup failed', { userId: user.id, themeId: body.themeId, ...describe(lookupError) })
      return NextResponse.json({ error: `Could not look up that theme: ${lookupError.message}` }, { status: 500 })
    }
    if (!theme) return NextResponse.json({ error: 'That theme is no longer available. Refresh and pick again.' }, { status: 404 })
    update.theme_id = body.themeId
  }
  if (typeof body.overlay === 'string') {
    if (body.overlay !== 'default' && !getOverlay(body.overlay)) {
      return NextResponse.json({ error: 'Unknown overlay' }, { status: 400 })
    }
    update.theme_overlay = body.overlay === 'default' ? null : body.overlay
  }

  // Return the row so a silent no-op (no user_accounts row) is caught, not reported as saved.
  const { data: saved, error } = await supabase.from('user_accounts').update(update).eq('id', user.id).select('id').maybeSingle()
  if (error) {
    console.error('[app-shell/theme] save failed', { userId: user.id, update, ...describe(error) })
    return NextResponse.json({ error: `Could not save your ${what}: ${error.message}` }, { status: 500 })
  }
  if (!saved) {
    console.error('[app-shell/theme] no user_accounts row to save to', { userId: user.id, update })
    return NextResponse.json({ error: `Could not save your ${what}: your account record was not found.` }, { status: 500 })
  }

  const resolved = await resolveThemeForUser(supabase, user.id)
  return NextResponse.json(resolved, { headers: { 'Cache-Control': 'no-store' } })
}
