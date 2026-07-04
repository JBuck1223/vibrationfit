import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

// Normalize a user-entered slug into a safe, url-friendly, lowercase token.
function normalizeSlug(raw: string): string {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-_]+/g, '-') // spaces/punctuation -> hyphen
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

export async function GET() {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('short_links')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    return NextResponse.json({ error: 'Failed to load links' }, { status: 500 })
  }

  return NextResponse.json({ links: data || [] })
}

export async function POST(request: NextRequest) {
  const auth = await verifyAdminAccess()
  if ('error' in auth) {
    return NextResponse.json({ error: auth.error }, { status: auth.status })
  }

  const body = await request.json().catch(() => ({})) as {
    slug?: string
    destination?: string
    label?: string
    is_active?: boolean
  }

  const slug = normalizeSlug(body.slug || '')
  const destination = (body.destination || '').trim()

  if (!slug) {
    return NextResponse.json({ error: 'A slug is required' }, { status: 400 })
  }
  if (!destination) {
    return NextResponse.json({ error: 'A destination URL is required' }, { status: 400 })
  }
  // Destination must be a valid absolute URL (so redirects can't be tricked).
  try {
    const u = new URL(destination)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') throw new Error('bad protocol')
  } catch {
    return NextResponse.json({ error: 'Destination must be a valid http(s) URL' }, { status: 400 })
  }

  const admin = createAdminClient()
  const { data, error } = await admin
    .from('short_links')
    .insert({
      slug,
      destination,
      label: body.label?.trim() || null,
      is_active: body.is_active ?? true,
      created_by: auth.user.id,
    })
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: `Slug "${slug}" is already taken` }, { status: 409 })
    }
    return NextResponse.json({ error: 'Failed to create link' }, { status: 500 })
  }

  return NextResponse.json({ link: data })
}
