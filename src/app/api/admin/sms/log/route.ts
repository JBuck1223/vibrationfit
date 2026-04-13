export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const adminClient = createAdminClient()
    const { searchParams } = new URL(request.url)
    
    const direction = searchParams.get('direction')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const limit = Math.min(parseInt(searchParams.get('limit') || '200'), 500)
    const offset = parseInt(searchParams.get('offset') || '0')

    let query = adminClient
      .from('sms_messages')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (direction && direction !== 'all') {
      query = query.eq('direction', direction)
    }

    if (status && status !== 'all') {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`body.ilike.%${search}%,to_number.ilike.%${search}%,from_number.ilike.%${search}%`)
    }

    const { data: messages, error, count } = await query

    if (error) {
      console.error('Error fetching SMS log:', error)
      return NextResponse.json({ error: 'Failed to fetch SMS log' }, { status: 500 })
    }

    return NextResponse.json({ 
      messages: messages || [],
      total: count || 0,
    })
  } catch (error: any) {
    console.error('Error in SMS log API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
