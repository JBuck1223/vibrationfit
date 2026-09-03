import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { attachKitAsset, defaultLayerForSlot, recordKitActivation, touchKit } from '@/lib/manifestations/kit-helpers'
import { KIT_SLOTS, type KitLayer, type KitSlot } from '@/lib/manifestations/types'

export const dynamic = 'force-dynamic'

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

    const { data: kit } = await supabase
      .from('manifestations')
      .select('id, categories')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!kit) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const body = await request.json()
    const slot = body.slot as KitSlot
    if (!KIT_SLOTS.includes(slot)) {
      return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
    }
    const entityId = typeof body.entity_id === 'string' ? body.entity_id : null
    const entityType = typeof body.entity_type === 'string' ? body.entity_type : null
    if (!entityId || !entityType) {
      return NextResponse.json({ error: 'entity_id and entity_type are required' }, { status: 400 })
    }

    const layer = (['suite', 'project', 'evidence', 'milestone'] as const).includes(body.layer)
      ? (body.layer as KitLayer)
      : defaultLayerForSlot(slot)

    const asset = await attachKitAsset(supabase, {
      kitId: id,
      slot,
      layer,
      entityId,
      entityType,
      status: 'ready',
      pinnedBy: 'member',
    })
    if (!asset) {
      return NextResponse.json({ error: 'Could not pin that item' }, { status: 500 })
    }

    if (slot === 'project') {
      await supabase
        .from('projects')
        .update({ manifestation_id: id })
        .eq('id', entityId)
        .eq('created_by', user.id)
    }

    await recordKitActivation(supabase, {
      kitId: id,
      userId: user.id,
      area: kit.categories?.[0] || 'work',
      slot,
    })
    await touchKit(supabase, id)

    return NextResponse.json({ asset }, { status: 201 })
  } catch (error) {
    console.error('[Manifestations] pin asset failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
