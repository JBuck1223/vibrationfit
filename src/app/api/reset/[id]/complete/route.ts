import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getResetById, getResetItems, detectItems, persistDetection, computeProgress,
} from '@/lib/reset/service'

export const dynamic = 'force-dynamic'

// POST /api/reset/[id]/complete - guard all selected items complete, then graduate
export async function POST(
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
    if (reset.status === 'completed') {
      return NextResponse.json({ reset, alreadyComplete: true })
    }

    const items = await getResetItems(supabase, reset.id)
    const withDetection = await detectItems(supabase, user.id, reset, items)
    await persistDetection(supabase, withDetection)
    const progress = computeProgress(withDetection)

    if (!progress.allComplete) {
      return NextResponse.json(
        { error: 'Not all selected items are complete', progress },
        { status: 400 }
      )
    }

    const { data: updated, error } = await supabase
      .from('resets')
      .update({ status: 'completed', completed_at: new Date().toISOString() })
      .eq('id', reset.id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error completing reset:', error)
      return NextResponse.json({ error: 'Failed to complete reset' }, { status: 500 })
    }

    return NextResponse.json({ reset: updated, progress, phoenix: true })
  } catch (error) {
    console.error('Error in reset complete POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
