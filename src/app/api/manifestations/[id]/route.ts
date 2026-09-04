import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { normalizeLifeCategories, recordKitActivation } from '@/lib/manifestations/kit-helpers'
import { resolveAssetLabels } from '@/lib/manifestations/library-candidates'

export const dynamic = 'force-dynamic'

/**
 * GET /api/manifestations/[id]
 * One manifestation with its depth: assets (journal/stories/…), activations,
 * and nested action groups (projects) with their steps (tasks).
 */
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

    // RLS also allows household-shared items; scope to visible row
    const { data: manifestation, error } = await supabase
      .from('manifestations')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !manifestation) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const [assetsResult, activationsResult, projectsResult, versionsResult] = await Promise.all([
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
        .select('id, title, description, status, life_categories, due_date, created_at, sort_order, project_tasks(id, title, description, is_complete, parent_task_id, sort_order)')
        .eq('manifestation_id', id)
        .neq('status', 'archived')
        .order('sort_order', { ascending: false }),
      supabase
        .from('manifestation_essence_versions')
        .select('*')
        .eq('manifestation_id', id)
        .order('version_number', { ascending: false })
        .limit(30),
    ])

    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    const weekAgoStr = weekAgo.toISOString().slice(0, 10)
    const activations = activationsResult.data || []
    const assets = assetsResult.data || []
    const labels = await resolveAssetLabels(supabase, assets)

    // Journal + abundance linked to this manifestation, hydrated for The Journey
    const journalIds = assets
      .filter(a => a.slot === 'journal' && a.entity_id)
      .map(a => a.entity_id as string)
    const abundanceIds = assets
      .filter(a => a.slot === 'abundance' && a.entity_id)
      .map(a => a.entity_id as string)
    const [journalResult, abundanceResult] = await Promise.all([
      journalIds.length > 0
        ? supabase
            .from('journal_entries')
            .select('id, title, content, date, journal_tag, categories')
            .in('id', journalIds)
            .order('date', { ascending: false })
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
      abundanceIds.length > 0
        ? supabase
            .from('abundance_events')
            .select('id, note, date, vision_category, amount')
            .in('id', abundanceIds)
            .order('date', { ascending: false })
        : Promise.resolve({ data: [] as Array<Record<string, unknown>> }),
    ])

    return NextResponse.json({
      manifestation,
      assets: assets.map(asset => ({
        ...asset,
        label: (asset.entity_id && labels[asset.entity_id]) || null,
      })),
      journal_entries: journalResult.data || [],
      abundance_events: abundanceResult.data || [],
      activations,
      activations_this_week: activations.filter(a => a.activation_date >= weekAgoStr).length,
      activations_since_opened: activations.length,
      essence_versions: versionsResult.data || [],
      projects: (projectsResult.data || []).map(p => ({
        ...p,
        project_tasks: (p.project_tasks || []).sort(
          (a: { sort_order: number }, b: { sort_order: number }) => a.sort_order - b.sort_order,
        ),
      })),
    })
  } catch (error) {
    console.error('[Manifestations] detail error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/manifestations/[id]
 * Update manifestation fields, including Actualization.
 */
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

    const name = typeof body.name === 'string' ? body.name : typeof body.title === 'string' ? body.title : null
    if (name && name.trim()) updates.name = name.trim()
    if (typeof body.description === 'string') updates.description = body.description.trim() || null
    if (typeof body.why_it_matters === 'string') updates.why_it_matters = body.why_it_matters.trim() || null
    if (typeof body.chosen_reality === 'string') updates.why_it_matters = body.chosen_reality.trim() || null
    if (typeof body.what_it_feels_like === 'string') updates.what_it_feels_like = body.what_it_feels_like.trim() || null
    if (typeof body.actualization_story === 'string') updates.actualization_story = body.actualization_story.trim() || null
    if (typeof body.image_url === 'string') updates.image_url = body.image_url || null
    if (typeof body.actualized_image_url === 'string') updates.actualized_image_url = body.actualized_image_url || null
    if (Array.isArray(body.categories) || Array.isArray(body.life_categories)) {
      updates.categories = normalizeLifeCategories(body.categories ?? body.life_categories)
    }
    if (body.status === 'actualized') {
      updates.status = 'actualized'
      updates.actualized_at = new Date().toISOString()
    } else if (body.status === 'active' || body.status === 'inactive' || body.status === 'open') {
      updates.status = body.status === 'open' ? 'active' : body.status
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

    return NextResponse.json({ manifestation: data })
  } catch (error) {
    console.error('[Manifestations] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/manifestations/[id]  { action: 'activate' }
 * Record a "showed up" activation.
 */
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

    const { data: item } = await supabase
      .from('manifestations')
      .select('id, categories')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!item) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const area = typeof body.area === 'string' && body.area
      ? body.area
      : item.categories?.[0] || 'work'

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
