// /src/app/api/support/announcements/[id]/route.ts
// Single announcement: GET detail, PUT update, DELETE

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('support_announcements')
      .select('*')
      .eq('id', id)
      .not('published_at', 'is', null)
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Announcement not found' }, { status: 404 })
    }

    return NextResponse.json({ announcement: data })
  } catch (error) {
    console.error('Announcement GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const adminClient = createAdminClient()

    const updateData: Record<string, unknown> = {}
    if (body.title !== undefined) updateData.title = body.title
    if (body.content !== undefined) updateData.content = body.content
    if (body.category !== undefined) updateData.category = body.category
    if (body.attachments !== undefined) updateData.attachments = body.attachments
    if (body.is_pinned !== undefined) updateData.is_pinned = body.is_pinned
    if (body.publish === true) updateData.published_at = new Date().toISOString()
    if (body.unpublish === true) updateData.published_at = null

    const { data, error } = await adminClient
      .from('support_announcements')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating announcement:', error)
      return NextResponse.json({ error: 'Failed to update announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: data })
  } catch (error) {
    console.error('Announcement PUT error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('support_announcements')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting announcement:', error)
      return NextResponse.json({ error: 'Failed to delete announcement' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Announcement DELETE error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
