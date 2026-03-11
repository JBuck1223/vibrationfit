import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const admin = createAdminClient()
    const now = new Date().toISOString()

    if (body.all === true) {
      const { error } = await admin
        .from('admin_notifications')
        .update({ is_read: true, read_at: now })
        .eq('is_read', false)

      if (error) {
        console.error('Error marking all as read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const { error } = await admin
        .from('admin_notifications')
        .update({ is_read: true, read_at: now })
        .in('id', body.ids)

      if (error) {
        console.error('Error marking notifications as read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide { ids: [...] } or { all: true }' }, { status: 400 })
  } catch (error) {
    console.error('Admin notifications read PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
