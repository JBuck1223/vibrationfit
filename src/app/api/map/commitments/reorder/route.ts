import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

interface ReorderItem {
  id: string
  sort_order: number
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { order } = (await request.json()) as { order?: ReorderItem[] }

    if (!Array.isArray(order) || order.length === 0) {
      return NextResponse.json({ error: 'order array required' }, { status: 400 })
    }

    const updates = order.map(({ id, sort_order }) =>
      supabase
        .from('commitments')
        .update({ sort_order })
        .eq('id', id)
        .eq('user_id', user.id),
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in POST /api/map/commitments/reorder:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
