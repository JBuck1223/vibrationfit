import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { resolveThemeForUser } from '@/lib/app-shell/resolve-theme'

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

/** PATCH { themeId } : set the member's active theme. */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as { themeId?: string | null } | null
  if (!body || typeof body.themeId !== 'string') {
    return NextResponse.json({ error: 'themeId required' }, { status: 400 })
  }

  const { data: theme } = await supabase.from('themes').select('id').eq('id', body.themeId).maybeSingle()
  if (!theme) return NextResponse.json({ error: 'Theme not found' }, { status: 404 })

  const { error } = await supabase.from('user_accounts').update({ theme_id: body.themeId }).eq('id', user.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const resolved = await resolveThemeForUser(supabase, user.id)
  return NextResponse.json(resolved)
}
