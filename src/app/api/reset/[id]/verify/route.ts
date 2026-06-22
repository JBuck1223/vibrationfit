import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getResetById, getResetItems, detectItems, persistDetection, computeProgress,
} from '@/lib/reset/service'

export const dynamic = 'force-dynamic'

// POST /api/reset/[id]/verify - re-run detection for each selected item and self-heal
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

    const items = await getResetItems(supabase, reset.id)
    const withDetection = await detectItems(supabase, user.id, reset, items)
    await persistDetection(supabase, withDetection)
    const progress = computeProgress(withDetection)

    return NextResponse.json({ reset, items: withDetection, progress })
  } catch (error) {
    console.error('Error in reset verify POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
