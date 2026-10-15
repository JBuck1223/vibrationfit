export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import type { VibeNotification } from '@/lib/vibe-tribe/types'

/**
 * GET /api/vibe-tribe/notifications
 * Recent Vibe Tribe notifications for the signed-in member, plus the unread count.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limit = Math.min(parseInt(new URL(request.url).searchParams.get('limit') || '30', 10), 50)
    const admin = createAdminClient()

    const [listResult, countResult] = await Promise.all([
      admin
        .from('vibe_notifications')
        .select('id, type, context, post_id, comment_id, excerpt, read_at, created_at, actor_id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit),
      admin
        .from('vibe_notifications')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .is('read_at', null),
    ])

    if (listResult.error) {
      console.error('Error fetching vibe notifications:', listResult.error)
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 })
    }

    const rows = listResult.data || []
    const actorIds = [...new Set(rows.map(row => row.actor_id))]
    let actors = new Map<string, { id: string; full_name: string | null; profile_picture_url: string | null }>()

    if (actorIds.length > 0) {
      const { data: actorRows } = await admin
        .from('user_accounts')
        .select('id, full_name, profile_picture_url')
        .in('id', actorIds)

      actors = new Map((actorRows || []).map(actor => [actor.id, actor]))
    }

    const notifications: VibeNotification[] = rows.map(row => ({
      id: row.id,
      type: row.type,
      context: row.context,
      post_id: row.post_id,
      comment_id: row.comment_id,
      excerpt: row.excerpt,
      read_at: row.read_at,
      created_at: row.created_at,
      actor: actors.get(row.actor_id) || null,
    }))

    return NextResponse.json({
      notifications,
      unreadCount: countResult.count || 0,
    })
  } catch (error) {
    console.error('Vibe notifications GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/vibe-tribe/notifications
 * Mark one or all notifications read. Body: { ids: string[] } or { all: true }.
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const now = new Date().toISOString()

    if (body.all === true) {
      const { error } = await supabase
        .from('vibe_notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .is('read_at', null)

      if (error) {
        console.error('Error marking vibe notifications read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    if (Array.isArray(body.ids) && body.ids.length > 0) {
      const { error } = await supabase
        .from('vibe_notifications')
        .update({ read_at: now })
        .eq('user_id', user.id)
        .in('id', body.ids)
        .is('read_at', null)

      if (error) {
        console.error('Error marking vibe notifications read:', error)
        return NextResponse.json({ error: 'Failed to mark as read' }, { status: 500 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Provide { ids: [...] } or { all: true }' }, { status: 400 })
  } catch (error) {
    console.error('Vibe notifications PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
