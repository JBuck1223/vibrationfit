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
    const rawItems = Array.isArray(body.items) ? body.items : [body]
    const items = rawItems.map((item: Record<string, unknown>) => {
      const slot = item.slot as KitSlot
      const entityId = typeof item.entity_id === 'string' ? item.entity_id : null
      const entityType = typeof item.entity_type === 'string' ? item.entity_type : null
      const layer = (['suite', 'project', 'evidence', 'milestone'] as const).includes(item.layer as string)
        ? (item.layer as KitLayer)
        : slot && KIT_SLOTS.includes(slot) ? defaultLayerForSlot(slot) : null
      return { slot, entityId, entityType, layer }
    })

    if (items.length === 0) {
      return NextResponse.json({ error: 'Nothing to pin' }, { status: 400 })
    }
    for (const item of items) {
      if (!item.slot || !KIT_SLOTS.includes(item.slot)) {
        return NextResponse.json({ error: 'Invalid slot' }, { status: 400 })
      }
      if (!item.entityId || !item.entityType) {
        return NextResponse.json({ error: 'entity_id and entity_type are required' }, { status: 400 })
      }
    }

    const pinned: Array<{ id: string; slot: KitSlot }> = []
    const failed: Array<{ entity_id: string; error: string }> = []

    for (const item of items) {
      const asset = await attachKitAsset(supabase, {
        kitId: id,
        slot: item.slot,
        layer: item.layer || defaultLayerForSlot(item.slot),
        entityId: item.entityId,
        entityType: item.entityType,
        status: 'ready',
        pinnedBy: 'member',
      })
      if (!asset) {
        failed.push({
          entity_id: item.entityId!,
          error: item.slot === 'vision_board' && item.entityId === id
            ? 'Cannot pin a manifestation to itself'
            : 'Could not pin that item',
        })
        continue
      }
      pinned.push({ id: asset.id, slot: item.slot })

      if (item.slot === 'project') {
        await supabase
          .from('projects')
          .update({ manifestation_id: id })
          .eq('id', item.entityId!)
          .eq('created_by', user.id)
      }
    }

    if (pinned.length > 0) {
      try {
        await recordKitActivation(supabase, {
          kitId: id,
          userId: user.id,
          area: kit.categories?.[0] || 'work',
          slot: pinned[0].slot,
        })
      } catch (activationError) {
        console.warn('[Manifestations] pin activation skipped:', activationError)
      }
      await touchKit(supabase, id)
    }

    if (pinned.length === 0) {
      return NextResponse.json({
        error: failed[0]?.error || 'Could not pin those items',
        failed,
      }, { status: 500 })
    }

    return NextResponse.json({
      asset: pinned[0],
      pinned,
      failed,
    }, { status: 201 })
  } catch (error) {
    console.error('[Manifestations] pin asset failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
