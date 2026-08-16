import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLifeCategories, recordKitActivation } from '@/lib/manifestations/kit-helpers'
import { resolveAssetLabels } from '@/lib/manifestations/library-candidates'

export const dynamic = 'force-dynamic'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: kit, error } = await supabase
      .from('manifestations')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (error || !kit) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const [assetsResult, activationsResult, projectsResult] = await Promise.all([
      supabase
        .from('manifestation_assets')
        .select('*')
        .eq('manifestation_id', id)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true }),
      supabase
        .from('manifestation_activations')
        .select('*')
        .eq('manifestation_id', id)
        .order('activation_date', { ascending: false }),
      supabase
        .from('projects')
        .select('id, title, description, status, life_categories, due_date, created_at')
        .eq('manifestation_id', id)
        .neq('status', 'archived')
        .order('sort_order', { ascending: false }),
    ])

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)
    const activations = activationsResult.data || []
    const assets = assetsResult.data || []
    const labels = await resolveAssetLabels(supabase, assets)

    return NextResponse.json({
      kit,
      assets: assets.map(asset => ({
        ...asset,
        label: (asset.entity_id && labels[asset.entity_id]) || null,
      })),
      activations,
      activations_this_week: activations.filter(a => a.activation_date >= weekAgoStr).length,
      activations_since_opened: activations.length,
      projects: projectsResult.data || [],
    })
  } catch (error) {
    console.error('[Manifestations] detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (typeof body.title === 'string' && body.title.trim()) updates.title = body.title.trim()
    if (typeof body.chosen_reality === 'string') updates.chosen_reality = body.chosen_reality.trim()
    if (Array.isArray(body.life_categories)) updates.life_categories = normalizeLifeCategories(body.life_categories)
    if (body.status === 'actualized') {
      updates.status = 'actualized'
      updates.actualized_at = new Date().toISOString()
    } else if (body.status === 'archived' || body.status === 'open') {
      updates.status = body.status
    }

    const { data, error } = await supabase
      .from('manifestations')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error || !data) {
      console.error('[Manifestations] patch failed:', error)
      return NextResponse.json({ error: 'Failed to update manifestation' }, { status: 500 })
    }

    return NextResponse.json({ kit: data })
  } catch (error) {
    console.error('[Manifestations] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    if (body.action !== 'activate') {
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    }

    const { data: kit } = await supabase
      .from('manifestations')
      .select('id, life_categories')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!kit) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const area = typeof body.area === 'string' && body.area
      ? body.area
      : kit.life_categories?.[0] || 'work'

    await recordKitActivation(supabase, {
      kitId: id,
      userId: user.id,
      area,
      slot: body.slot,
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Manifestations] activate error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
