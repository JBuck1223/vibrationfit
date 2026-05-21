import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { UpdateCommitmentPayload } from '@/lib/map/types'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: commitment, error } = await supabase
      .from('commitments')
      .select('*, commitment_occurrences(*)')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()

    if (error || !commitment) {
      return NextResponse.json({ error: 'Commitment not found' }, { status: 404 })
    }

    return NextResponse.json({ commitment })
  } catch (err) {
    console.error('Error in GET /api/map/commitments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: UpdateCommitmentPayload = await request.json()
    const updates: Record<string, unknown> = {}

    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.description !== undefined) updates.description = body.description?.trim() || null
    if (body.cadence !== undefined) updates.cadence = body.cadence
    if (body.start_date !== undefined) updates.start_date = body.start_date
    if (body.end_date !== undefined) updates.end_date = body.end_date
    if (body.status !== undefined) updates.status = body.status
    if (body.notify_sms !== undefined) updates.notify_sms = body.notify_sms
    if (body.notify_email !== undefined) updates.notify_email = body.notify_email
    if (body.reminder_time !== undefined) updates.reminder_time = body.reminder_time
    if (body.reminder_days !== undefined) updates.reminder_days = body.reminder_days

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    const { data: commitment, error } = await supabase
      .from('commitments')
      .update(updates)
      .eq('id', id)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating commitment:', error)
      return NextResponse.json({ error: 'Failed to update commitment' }, { status: 500 })
    }

    return NextResponse.json({ commitment })
  } catch (err) {
    console.error('Error in PATCH /api/map/commitments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { error } = await supabase
      .from('commitments')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)

    if (error) {
      console.error('Error deleting commitment:', error)
      return NextResponse.json({ error: 'Failed to delete commitment' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Error in DELETE /api/map/commitments/[id]:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
