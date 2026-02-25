import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/middleware/admin'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('sequences')
      .select('*, sequence_steps(count)')
      .order('created_at', { ascending: false })

    if (status) query = query.eq('status', status)

    const { data: sequences, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch sequences' }, { status: 500 })
    }

    return NextResponse.json({ sequences })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.name || !body.trigger_event) {
      return NextResponse.json(
        { error: 'Missing required fields: name, trigger_event' },
        { status: 400 }
      )
    }

    const { data: sequence, error } = await supabase
      .from('sequences')
      .insert({
        name: body.name,
        description: body.description || null,
        trigger_event: body.trigger_event,
        trigger_conditions: body.trigger_conditions || {},
        exit_events: body.exit_events || [],
        status: body.status || 'paused',
        created_by: user.id,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create sequence' }, { status: 500 })
    }

    return NextResponse.json({ sequence }, { status: 201 })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
