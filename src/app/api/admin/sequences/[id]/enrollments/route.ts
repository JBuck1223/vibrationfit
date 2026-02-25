import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkIsAdmin } from '@/middleware/admin'

interface RouteContext { params: Promise<{ id: string }> }

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')

    let query = supabase
      .from('sequence_enrollments')
      .select('*')
      .eq('sequence_id', id)
      .order('enrolled_at', { ascending: false })
      .limit(100)

    if (status) query = query.eq('status', status)

    const { data: enrollments, error } = await query
    if (error) {
      return NextResponse.json({ error: 'Failed to fetch enrollments' }, { status: 500 })
    }

    return NextResponse.json({ enrollments })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.enrollment_id || !body.action) {
      return NextResponse.json(
        { error: 'enrollment_id and action required' },
        { status: 400 }
      )
    }

    if (body.action === 'cancel') {
      const { error } = await supabase
        .from('sequence_enrollments')
        .update({
          status: 'cancelled',
          cancelled_at: new Date().toISOString(),
          cancel_reason: 'admin_cancelled',
        })
        .eq('id', body.enrollment_id)

      if (error) {
        return NextResponse.json({ error: 'Failed to cancel enrollment' }, { status: 500 })
      }
    } else if (body.action === 'pause') {
      await supabase
        .from('sequence_enrollments')
        .update({ status: 'paused' })
        .eq('id', body.enrollment_id)
    } else if (body.action === 'resume') {
      await supabase
        .from('sequence_enrollments')
        .update({
          status: 'active',
          next_step_at: new Date().toISOString(),
        })
        .eq('id', body.enrollment_id)
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
