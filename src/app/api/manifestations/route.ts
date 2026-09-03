import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLifeCategories } from '@/lib/manifestations/kit-helpers'

export const dynamic = 'force-dynamic'

/**
 * GET /api/manifestations
 * List the member's manifestations (manifestations) with depth counts.
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: items, error } = await supabase
      .from('manifestations')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'inactive')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Manifestations] list failed:', error)
      return NextResponse.json({ error: 'Failed to load manifestations' }, { status: 500 })
    }

    const ids = (items || []).map(i => i.id)
    if (ids.length === 0) {
      return NextResponse.json({ manifestations: [] })
    }

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)

    const [assetsResult, activationsResult, projectsResult] = await Promise.all([
      supabase.from('manifestation_assets').select('manifestation_id, status').in('manifestation_id', ids),
      supabase
        .from('manifestation_activations')
        .select('manifestation_id, activation_date')
        .in('manifestation_id', ids)
        .gte('activation_date', weekAgoStr),
      supabase.from('projects').select('id, manifestation_id').in('manifestation_id', ids).neq('status', 'archived'),
    ])

    const listed = (items || []).map(item => {
      const assets = (assetsResult.data || []).filter(a => a.manifestation_id === item.id)
      return {
        ...item,
        asset_ready_count: assets.filter(a => a.status === 'ready' || a.status === 'actualized').length,
        asset_queued_count: assets.filter(a => a.status === 'queued' || a.status === 'handoff').length,
        activations_this_week: (activationsResult.data || []).filter(a => a.manifestation_id === item.id).length,
        project_count: (projectsResult.data || []).filter(p => p.manifestation_id === item.id).length,
      }
    })

    return NextResponse.json({ manifestations: listed })
  } catch (error) {
    console.error('[Manifestations] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/manifestations
 * Create a manifestation (a manifestations row).
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const name = typeof body.name === 'string' && body.name.trim()
      ? body.name.trim()
      : typeof body.title === 'string' ? body.title.trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('manifestations')
      .insert({
        user_id: user.id,
        name,
        description: typeof body.description === 'string' ? body.description.trim() || null : null,
        why_it_matters: typeof body.why_it_matters === 'string'
          ? body.why_it_matters.trim() || null
          : typeof body.chosen_reality === 'string' ? body.chosen_reality.trim() || null : null,
        what_it_feels_like: typeof body.what_it_feels_like === 'string' ? body.what_it_feels_like.trim() || null : null,
        categories: normalizeLifeCategories(body.categories ?? body.life_categories),
        conversation_id: typeof body.conversation_id === 'string' ? body.conversation_id : null,
        status: 'active',
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[Manifestations] create failed:', error)
      return NextResponse.json({ error: 'Failed to create manifestation' }, { status: 500 })
    }

    return NextResponse.json({ manifestation: data }, { status: 201 })
  } catch (error) {
    console.error('[Manifestations] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
