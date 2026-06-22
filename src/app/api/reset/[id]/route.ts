import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getResetById, getResetItems, detectItems, computeProgress } from '@/lib/reset/service'

export const dynamic = 'force-dynamic'

export async function GET(
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
    const progress = computeProgress(withDetection)

    return NextResponse.json({ reset, items: withDetection, progress })
  } catch (error) {
    console.error('Error in reset[id] GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

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
    const body = await request.json()
    const updates: Record<string, unknown> = {}
    if (body.title !== undefined) updates.title = body.title
    if (body.status !== undefined) updates.status = body.status
    if (body.focus_categories !== undefined) {
      updates.focus_categories = Array.isArray(body.focus_categories) ? body.focus_categories : []
    }

    const { data: reset, error } = await supabase
      .from('resets')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating reset:', error)
      return NextResponse.json({ error: 'Failed to update reset' }, { status: 500 })
    }

    return NextResponse.json({ reset })
  } catch (error) {
    console.error('Error in reset[id] PATCH:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
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
    const { error } = await supabase
      .from('resets')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      return NextResponse.json({ error: 'Failed to delete reset' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in reset[id] DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
