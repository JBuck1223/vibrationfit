export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const query = request.nextUrl.searchParams.get('q')?.trim()
    if (!query || query.length < 2) {
      return NextResponse.json({ contacts: [] })
    }

    const adminClient = createAdminClient()

    const searchPattern = `%${query}%`

    const { data: contacts, error } = await adminClient
      .from('user_accounts')
      .select('id, full_name, first_name, last_name, phone, email')
      .not('phone', 'is', null)
      .or(`full_name.ilike.${searchPattern},first_name.ilike.${searchPattern},last_name.ilike.${searchPattern},email.ilike.${searchPattern}`)
      .limit(10)

    if (error) {
      console.error('Contact search error:', error)
      return NextResponse.json({ contacts: [] })
    }

    return NextResponse.json({ contacts: contacts || [] })
  } catch (error) {
    console.error('Contact search error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
