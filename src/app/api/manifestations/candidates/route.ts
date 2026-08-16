import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { findLibraryCandidates } from '@/lib/manifestations/library-candidates'
import { KIT_SLOTS, type KitSlot } from '@/lib/manifestations/types'
import { normalizeLifeCategories } from '@/lib/manifestations/kit-helpers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const categories = normalizeLifeCategories(
      (searchParams.get('categories') || '').split(',').filter(Boolean),
    )
    const query = searchParams.get('q') || ''
    const kitId = searchParams.get('kitId')
    const slots = (searchParams.get('slots') || '')
      .split(',')
      .filter((s): s is KitSlot => (KIT_SLOTS as readonly string[]).includes(s))

    const candidates = await findLibraryCandidates(supabase, user.id, {
      categories,
      query,
      kitId,
      slots: slots.length > 0 ? slots : undefined,
    })

    return NextResponse.json({ candidates })
  } catch (error) {
    console.error('[Manifestations] candidates failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
