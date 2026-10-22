import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

/**
 * GET: every theme the member can pick (published system themes plus their own),
 * each with its backdrop and home hero for the picker's preview tiles.
 */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [{ data: themes }, { data: account }] = await Promise.all([
    supabase.from('themes').select('id, slug, name, kind, tint, sort_order').order('sort_order'),
    user ? supabase.from('user_accounts').select('theme_id').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  const ids = (themes ?? []).map((t) => t.id)
  const { data: images } = ids.length
    ? await supabase
        .from('theme_images')
        .select('theme_id, slot, image_url')
        .in('theme_id', ids)
        .in('slot', ['area.backdrop', 'home.hero'])
    : { data: [] as { theme_id: string; slot: string; image_url: string }[] }

  const byTheme = new Map<string, { backdrop?: string; hero?: string }>()
  for (const img of images ?? []) {
    const entry = byTheme.get(img.theme_id) ?? {}
    if (img.slot === 'area.backdrop' && !entry.backdrop) entry.backdrop = img.image_url
    if (img.slot === 'home.hero' && !entry.hero) entry.hero = img.image_url
    byTheme.set(img.theme_id, entry)
  }

  return NextResponse.json({
    activeThemeId: (account as { theme_id?: string | null } | null)?.theme_id ?? null,
    themes: (themes ?? []).map((t) => ({ ...t, preview: byTheme.get(t.id)?.hero ?? byTheme.get(t.id)?.backdrop ?? null })),
  })
}
