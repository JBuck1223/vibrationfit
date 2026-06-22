import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getActiveReset, getResetItems, detectItems, computeProgress, buildInitialItems,
} from '@/lib/reset/service'
import { RESET_ITEMS, type ResetItemType } from '@/lib/reset/reset-config'

export const dynamic = 'force-dynamic'

// GET /api/reset - active reset with live detection + progress
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const reset = await getActiveReset(supabase, user.id)
    if (!reset) {
      return NextResponse.json({ reset: null, items: [], progress: null })
    }

    const items = await getResetItems(supabase, reset.id)
    const withDetection = await detectItems(supabase, user.id, reset, items)
    const progress = computeProgress(withDetection)

    return NextResponse.json({ reset, items: withDetection, progress })
  } catch (error) {
    console.error('Error in reset GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/reset - start a new reset, capturing anchors for selected items
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const title: string | null = body.title || null
    const focusCategories: string[] = Array.isArray(body.focus_categories) ? body.focus_categories : []
    const requestedTypes: ResetItemType[] = Array.isArray(body.item_types) && body.item_types.length > 0
      ? body.item_types
      : RESET_ITEMS.filter((i) => i.defaultSelected).map((i) => i.type)

    const { data: reset, error } = await supabase
      .from('resets')
      .insert({
        user_id: user.id,
        title,
        focus_categories: focusCategories,
        status: 'in_progress',
      })
      .select()
      .single()

    if (error || !reset) {
      console.error('Error creating reset:', error)
      return NextResponse.json({ error: 'Failed to start reset' }, { status: 500 })
    }

    await buildInitialItems(supabase, user.id, reset, requestedTypes)

    const items = await getResetItems(supabase, reset.id)
    const withDetection = await detectItems(supabase, user.id, reset, items)
    const progress = computeProgress(withDetection)

    return NextResponse.json({ reset, items: withDetection, progress }, { status: 201 })
  } catch (error) {
    console.error('Error in reset POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
