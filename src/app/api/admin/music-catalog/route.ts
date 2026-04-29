import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('music_catalog')
    .select('*')
    .order('sort_order')
    .order('album')
    .order('track_number')

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const { id, ...updateData } = body

  if (!id) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('music_catalog')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json()
  const admin = createAdminClient()

  // Support bulk tag update
  if (body.bulk_action === 'add_tags') {
    const { ids, tags } = body as { bulk_action: string; ids: string[]; tags: string[] }
    if (!ids?.length || !tags?.length) {
      return NextResponse.json({ error: 'ids and tags are required' }, { status: 400 })
    }

    const { data: existing, error: fetchErr } = await admin
      .from('music_catalog')
      .select('id, tags')
      .in('id', ids)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const updates = (existing || []).map(row => {
      const current = (row.tags || []) as string[]
      const merged = Array.from(new Set([...current, ...tags]))
      return admin
        .from('music_catalog')
        .update({ tags: merged, updated_at: new Date().toISOString() })
        .eq('id', row.id)
    })

    await Promise.all(updates)
    return NextResponse.json({ success: true, updated: ids.length })
  }

  if (body.bulk_action === 'remove_tags') {
    const { ids, tags } = body as { bulk_action: string; ids: string[]; tags: string[] }
    if (!ids?.length || !tags?.length) {
      return NextResponse.json({ error: 'ids and tags are required' }, { status: 400 })
    }

    const { data: existing, error: fetchErr } = await admin
      .from('music_catalog')
      .select('id, tags')
      .in('id', ids)

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 })
    }

    const updates = (existing || []).map(row => {
      const current = (row.tags || []) as string[]
      const filtered = current.filter(t => !tags.includes(t))
      return admin
        .from('music_catalog')
        .update({ tags: filtered, updated_at: new Date().toISOString() })
        .eq('id', row.id)
    })

    await Promise.all(updates)
    return NextResponse.json({ success: true, updated: ids.length })
  }

  // Single track creation
  const { data, error } = await admin
    .from('music_catalog')
    .insert(body)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')

  if (!id) {
    return NextResponse.json({ error: 'Track ID is required' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { error } = await admin
    .from('music_catalog')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
