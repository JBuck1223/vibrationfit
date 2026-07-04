import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const body = await request.json().catch(() => ({})) as {
    slug?: string
    destination?: string
    label?: string
    is_active?: boolean
  }

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() }

  if (body.slug !== undefined) {
    const slug = normalizeSlug(body.slug)
    if (!slug) return NextResponse.json({ error: 'A slug is required' }, { status: 400 })
    updates.slug = slug
  }
  if (body.destination !== undefined) {
    const destination = body.destination.trim()
    try {
      const u = new URL(destination)
      if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad protocol')
    } catch {
      return NextResponse.json({ error: 'Destination must be a valid http(s) URL' }, { status: 400 })
    }
    updates.destination = destination
  }
  if (body.label !== undefined) updates.label = body.label.trim() || null
  if (body.is_active !== undefined) updates.is_active = body.is_active

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('short_links')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'That slug is already taken' }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to update link' }, { status: 500 })
  }

  return NextResponse.json({ link: data })
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const { id } = await params
  const admin = createAdminClient()
  const { error } = await admin.from('short_links').delete().eq('id', id)

  if (error) {
    return NextResponse.json({ error: 'Failed to delete link' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
