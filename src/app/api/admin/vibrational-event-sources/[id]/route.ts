import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { clearVibrationalSourceCache } from '@/lib/vibration/sources'

const ADMIN_EMAILS = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']

function isAdminUser(user: { email?: string | null; user_metadata?: Record<string, any> } | null): boolean {
  if (!user) return false
  const email = user.email?.toLowerCase() || ''
  if (ADMIN_EMAILS.includes(email)) return true
  return Boolean(user.user_metadata?.is_admin)
}

async function getAdminSupabase() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return { supabase, user: null }
  }

  if (!isAdminUser(user)) {
    return { supabase, user: null }
  }

  return { supabase, user }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, user } = await getAdminSupabase()

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json().catch(() => null)
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const updates: Record<string, any> = {}

    if ('source_key' in body) {
      if (typeof body.source_key !== 'string') {
        return NextResponse.json({ error: 'source_key must be a string' }, { status: 400 })
      }
      updates.source_key = body.source_key
    }

    if ('label' in body) {
      if (typeof body.label !== 'string') {
        return NextResponse.json({ error: 'label must be a string' }, { status: 400 })
      }
      updates.label = body.label
    }

    if ('description' in body) {
      if (body.description !== null && typeof body.description !== 'string') {
        return NextResponse.json({ error: 'description must be a string or null' }, { status: 400 })
      }
      updates.description = body.description
    }

    if ('enabled' in body) {
      updates.enabled = Boolean(body.enabled)
    }

    if ('default_category' in body) {
      if (body.default_category !== null && typeof body.default_category !== 'string') {
        return NextResponse.json({ error: 'default_category must be a string or null' }, { status: 400 })
      }
      updates.default_category = body.default_category
    }

    if ('field_map' in body) {
      if (typeof body.field_map !== 'object' || Array.isArray(body.field_map)) {
        return NextResponse.json({ error: 'field_map must be an object' }, { status: 400 })
      }
      updates.field_map = body.field_map
    }

    if ('analyzer_config' in body) {
      if (typeof body.analyzer_config !== 'object' || Array.isArray(body.analyzer_config)) {
        return NextResponse.json({ error: 'analyzer_config must be an object' }, { status: 400 })
      }
      updates.analyzer_config = body.analyzer_config
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    const { data, error } = await supabase
      .from('vibrational_event_sources')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error && error.code === 'PGRST116') {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 })
    }

    if (error || !data) {
      console.error('Failed to update vibrational event source:', error)
      return NextResponse.json({ error: 'Failed to update source' }, { status: 500 })
    }

    clearVibrationalSourceCache()

    return NextResponse.json({ source: data })
  } catch (error) {
    console.error('Failed to update vibrational event source:', error)
    return NextResponse.json({ error: 'Failed to update source' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const { supabase, user } = await getAdminSupabase()

    if (!user) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { error } = await supabase
      .from('vibrational_event_sources')
      .delete()
      .eq('id', id)

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Source not found' }, { status: 404 })
      }
      console.error('Failed to delete vibrational event source:', error)
      return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
    }

    clearVibrationalSourceCache()

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete vibrational event source:', error)
    return NextResponse.json({ error: 'Failed to delete source' }, { status: 500 })
  }
}
