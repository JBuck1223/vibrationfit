export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

const LIMIT = 20

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const q = request.nextUrl.searchParams.get('q')?.trim()
    if (!q || q.length < 2) {
      return NextResponse.json({ users: [] })
    }

    const admin = createAdminClient()
    const pattern = `%${q}%`

    const [accountsResult, leadsResult] = await Promise.all([
      admin
        .from('user_accounts')
        .select('id, email, first_name, last_name, phone')
        .or(`email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)
        .limit(LIMIT),
      admin
        .from('leads')
        .select('id, email, first_name, last_name, phone')
        .or(`email.ilike.${pattern},first_name.ilike.${pattern},last_name.ilike.${pattern}`)
        .limit(LIMIT),
    ])

    const seen = new Set<string>()
    const users: { email: string; name: string; type: 'member' | 'lead'; phone?: string }[] = []

    for (const a of accountsResult.data || []) {
      if (!a.email || seen.has(a.email.toLowerCase())) continue
      seen.add(a.email.toLowerCase())
      users.push({
        email: a.email,
        name: [a.first_name, a.last_name].filter(Boolean).join(' ') || a.email,
        type: 'member',
        phone: a.phone || undefined,
      })
    }

    for (const l of leadsResult.data || []) {
      if (!l.email || seen.has(l.email.toLowerCase())) continue
      seen.add(l.email.toLowerCase())
      users.push({
        email: l.email,
        name: [l.first_name, l.last_name].filter(Boolean).join(' ') || l.email,
        type: 'lead',
        phone: l.phone || undefined,
      })
    }

    return NextResponse.json({ users: users.slice(0, LIMIT) })
  } catch (error) {
    console.error('[search-users] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
