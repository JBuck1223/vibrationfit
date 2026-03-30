export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const admin = createAdminClient()

    const { data: segment, error } = await admin
      .from('blast_segments')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !segment) {
      return NextResponse.json({ error: 'Segment not found' }, { status: 404 })
    }

    return NextResponse.json({ segment })
  } catch (error) {
    console.error('[segments] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const { name, description, filters, excludeSegmentId } = (await request.json()) as {
      name?: string
      description?: string
      filters?: BlastFilters
      excludeSegmentId?: string | null
    }

    const admin = createAdminClient()
    const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

    if (name !== undefined) updates.name = name.trim()
    if (description !== undefined) updates.description = description?.trim() || null
    if (filters !== undefined) updates.filters = filters
    if (excludeSegmentId !== undefined) updates.exclude_segment_id = excludeSegmentId || null

    if (filters) {
      const recipients = await queryRecipients({
        ...filters,
        exclude_segment_id: excludeSegmentId ?? undefined,
      })
      updates.recipient_count = recipients.length
    }

    const { data: segment, error } = await admin
      .from('blast_segments')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !segment) {
      return NextResponse.json({ error: error?.message || 'Segment not found' }, { status: error ? 500 : 404 })
    }

    return NextResponse.json({ segment })
  } catch (error) {
    console.error('[segments] PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { id } = await params
    const admin = createAdminClient()

    const { error } = await admin
      .from('blast_segments')
      .delete()
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[segments] DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
