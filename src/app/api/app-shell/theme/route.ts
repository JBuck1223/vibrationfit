import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveThemeForUser } from '@/lib/app-shell/resolve-theme'
import { getOverlay } from '@/lib/app-shell/overlays'

export const dynamic = 'force-dynamic'

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

  const update: Record<string, string | null> = {}
  if (typeof body.themeId === 'string') {
    const { data: theme } = await supabase.from('themes').select('id').eq('id', body.themeId).maybeSingle()
    if (!theme) return NextResponse.json({ error: 'Theme not found' }, { status: 404 })
    update.theme_id = body.themeId
  }
  if (typeof body.overlay === 'string') {
    if (body.overlay !== 'default' && !getOverlay(body.overlay)) {
      return NextResponse.json({ error: 'Unknown overlay' }, { status: 400 })
    }
    update.theme_overlay = body.overlay === 'default' ? null : body.overlay
  }

  const { error } = await supabase.from('user_accounts').update(update).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const resolved = await resolveThemeForUser(supabase, user.id)
  return NextResponse.json(resolved, { headers: { 'Cache-Control': 'no-store' } })
}
