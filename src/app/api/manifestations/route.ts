import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLifeCategories } from '@/lib/manifestations/kit-helpers'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: kits, error } = await supabase
      .from('manifestations')
      .select('*')
      .eq('user_id', user.id)
      .neq('status', 'archived')
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('[Manifestations] list failed:', error)
      return NextResponse.json({ error: 'Failed to load manifestations' }, { status: 500 })
    }

    const ids = (kits || []).map(k => k.id)
    if (ids.length === 0) {
      return NextResponse.json({ kits: [] })
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

    const listed = (kits || []).map(kit => {
      const assets = (assetsResult.data || []).filter(a => a.manifestation_id === kit.id)
      return {
        ...kit,
        asset_ready_count: assets.filter(a => a.status === 'ready' || a.status === 'actualized').length,
        asset_queued_count: assets.filter(a => a.status === 'queued' || a.status === 'handoff').length,
        activations_this_week: (activationsResult.data || []).filter(a => a.manifestation_id === kit.id).length,
        project_count: (projectsResult.data || []).filter(p => p.manifestation_id === kit.id).length,
      }
    })

    return NextResponse.json({ kits: listed })
  } catch (error) {
    console.error('[Manifestations] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const title = typeof body.title === 'string' ? body.title.trim() : ''
    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('manifestations')
      .insert({
        user_id: user.id,
        title,
        chosen_reality: typeof body.chosen_reality === 'string' ? body.chosen_reality.trim() : null,
        life_categories: normalizeLifeCategories(body.life_categories),
        conversation_id: typeof body.conversation_id === 'string' ? body.conversation_id : null,
        status: 'open',
        flow: Array.isArray(body.flow) ? body.flow : [],
      })
      .select()
      .single()

    if (error || !data) {
      console.error('[Manifestations] create failed:', error)
      return NextResponse.json({ error: 'Failed to open manifestation' }, { status: 500 })
    }

    return NextResponse.json({ kit: data }, { status: 201 })
  } catch (error) {
    console.error('[Manifestations] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
