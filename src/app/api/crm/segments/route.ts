export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'
import { queryRecipients, type BlastFilters } from '@/lib/crm/blast-filters'

export async function GET() {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const admin = createAdminClient()
    const { data: segments, error } = await admin
      .from('blast_segments')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ segments: segments || [] })
  } catch (error) {
    console.error('[segments] GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { user } = auth

    const { name, description, filters, excludeSegmentId } = (await request.json()) as {
      name: string
      description?: string
      filters: BlastFilters
      excludeSegmentId?: string
    }

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }
    if (!filters?.audience) {
      return NextResponse.json({ error: 'Audience is required' }, { status: 400 })
    }

    const recipients = await queryRecipients({
      ...filters,
      exclude_segment_id: excludeSegmentId,
    })

    const admin = createAdminClient()
    const now = new Date().toISOString()

    const { data: segment, error } = await admin
      .from('blast_segments')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
        filters,
        exclude_segment_id: excludeSegmentId || null,
        recipient_count: recipients.length,
        created_by: user.id,
        created_at: now,
        updated_at: now,
      })
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ segment }, { status: 201 })
  } catch (error) {
    console.error('[segments] POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
