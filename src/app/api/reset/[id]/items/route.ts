import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResetById } from '@/lib/reset/service'
import { captureAnchor } from '@/lib/reset/detection'
import type { ResetItemType } from '@/lib/reset/reset-config'

export const dynamic = 'force-dynamic'

// PATCH /api/reset/[id]/items - toggle selection of an item; (re)capture anchor on select
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const reset = await getResetById(supabase, user.id, id)
    if (!reset) {
      return NextResponse.json({ error: 'Reset not found' }, { status: 404 })
    }

    const body = await request.json()
    const itemType: ResetItemType | undefined = body.item_type
    const isSelected: boolean = !!body.is_selected
    if (!itemType) {
      return NextResponse.json({ error: 'item_type is required' }, { status: 400 })
    }

    const updates: Record<string, unknown> = { is_selected: isSelected }
    if (isSelected) {
      // Re-anchor against the current state so prior edits don't count.
      updates.anchor = await captureAnchor(supabase, user.id, itemType, reset.started_at)
      updates.status = 'pending'
      updates.completed_at = null
      updates.detected_categories = []
    }

    const { data, error } = await supabase
      .from('reset_items')
      .update(updates)
      .eq('reset_id', reset.id)
      .eq('item_type', itemType)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reset item:', error)
      return NextResponse.json({ error: 'Failed to update item' }, { status: 500 })
    }

    return NextResponse.json({ item: data })
  } catch (error) {
    console.error('Error in reset items PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
