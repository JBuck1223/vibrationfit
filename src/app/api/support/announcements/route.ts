// /src/app/api/support/announcements/route.ts
// Support announcements API - list (public) and create (admin only)

export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const limit = parseInt(searchParams.get('limit') || '50', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)
    const includeDrafts = searchParams.get('include_drafts') === 'true'

    // If requesting drafts, verify admin access and use admin client to bypass RLS
    let dbClient = supabase
    if (includeDrafts) {
      const auth = await verifyAdminAccess()
      if ('error' in auth) {
        return NextResponse.json({ error: auth.error }, { status: auth.status })
      }
      dbClient = createAdminClient() as any
    }

    let query = dbClient
      .from('support_announcements')
      .select('*')

    if (!includeDrafts) {
      query = query.not('published_at', 'is', null)
    }

    query = query
      .order('is_pinned', { ascending: false })
      .order('pin_order', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (category && category !== 'all') {
      query = query.eq('category', category)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ error: 'Failed to fetch announcements' }, { status: 500 })
    }

    return NextResponse.json({ announcements: data })
  } catch (error) {
    console.error('Announcements GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()

    if (!body.title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    const { data, error } = await adminClient
      .from('support_announcements')
      .insert({
        title: body.title,
        content: body.content || '',
        category: body.category || 'update',
        attachments: body.attachments || [],
        is_pinned: body.is_pinned || false,
        published_at: body.publish ? new Date().toISOString() : null,
        created_by: auth.user.id,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating announcement:', error)
      return NextResponse.json({ error: 'Failed to create announcement' }, { status: 500 })
    }

    return NextResponse.json({ announcement: data }, { status: 201 })
  } catch (error) {
    console.error('Announcements POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
