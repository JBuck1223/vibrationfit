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

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const { id: sequenceId } = await context.params
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    if (!await checkIsAdmin(supabase, user)) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    if (!body.email) {
      return NextResponse.json({ error: 'email is required' }, { status: 400 })
    }

    const { data: firstStep } = await supabase
      .from('sequence_steps')
      .select('delay_minutes')
      .eq('sequence_id', sequenceId)
      .eq('step_order', 1)
      .eq('status', 'active')
      .single()

    const delayMs = (firstStep?.delay_minutes || 0) * 60 * 1000
    const nextStepAt = new Date(Date.now() + delayMs).toISOString()

    const metadata: Record<string, string> = {}
    if (body.email) metadata.email = body.email
    if (body.name) { metadata.name = body.name; metadata.firstName = body.name.split(' ')[0] }

    const { data: enrollment, error } = await supabase
      .from('sequence_enrollments')
      .insert({
        sequence_id: sequenceId,
        user_id: body.user_id || null,
        email: body.email,
        phone: body.phone || null,
        metadata,
        current_step_order: 0,
        status: 'active',
        next_step_at: nextStepAt,
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') {
        return NextResponse.json({ error: 'This email is already enrolled in this sequence' }, { status: 409 })
      }
      console.error('Error enrolling in sequence:', error)
      return NextResponse.json({ error: 'Failed to enroll' }, { status: 500 })
    }

    return NextResponse.json({ enrollment }, { status: 201 })
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
