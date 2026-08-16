import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { touchKit } from '@/lib/manifestations/kit-helpers'

export const dynamic = 'force-dynamic'

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; assetId: string }> },
) {
  try {
    const { id, assetId } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: kit } = await supabase
      .from('manifestations')
      .select('id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!kit) {
      return NextResponse.json({ error: 'Manifestation not found' }, { status: 404 })
    }

    const { data: asset } = await supabase
      .from('manifestation_assets')
      .select('id, slot, entity_id')
      .eq('id', assetId)
      .eq('manifestation_id', id)
      .maybeSingle()

    if (!asset) {
      return NextResponse.json({ error: 'Asset not found' }, { status: 404 })
    }

    const { error } = await supabase
      .from('manifestation_assets')
      .delete()
      .eq('id', assetId)
      .eq('manifestation_id', id)

    if (error) {
      return NextResponse.json({ error: 'Could not unlink' }, { status: 500 })
    }

    if (asset.slot === 'project' && asset.entity_id) {
      await supabase
        .from('projects')
        .update({ manifestation_id: null })
        .eq('id', asset.entity_id)
        .eq('created_by', user.id)
        .eq('manifestation_id', id)
    }

    await touchKit(supabase, id)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('[Manifestations] unpin failed:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
