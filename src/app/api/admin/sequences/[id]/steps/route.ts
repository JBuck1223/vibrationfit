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

    const { data: steps, error } = await supabase
      .from('sequence_steps')
      .select('*')
      .eq('sequence_id', id)
      .order('step_order', { ascending: true })

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch steps' }, { status: 500 })
    }

    return NextResponse.json({ steps })
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
    if (!body.channel || !body.template_id) {
      return NextResponse.json(
        { error: 'Missing required fields: channel, template_id' },
        { status: 400 }
      )
    }

    // Auto-calculate step_order
    const { data: existing } = await supabase
      .from('sequence_steps')
      .select('step_order')
      .eq('sequence_id', sequenceId)
      .order('step_order', { ascending: false })
      .limit(1)

    const nextOrder = existing && existing.length > 0 ? existing[0].step_order + 1 : 1

    const { data: step, error } = await supabase
      .from('sequence_steps')
      .insert({
        sequence_id: sequenceId,
        step_order: body.step_order ?? nextOrder,
        channel: body.channel,
        template_id: body.template_id,
        delay_minutes: body.delay_minutes || 0,
        delay_from: body.delay_from || 'previous_step',
        subject_override: body.subject_override || null,
        conditions: body.conditions || {},
        status: body.status || 'active',
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to create step' }, { status: 500 })
    }

    return NextResponse.json({ step }, { status: 201 })
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
    if (!body.id) {
      return NextResponse.json({ error: 'Step id is required' }, { status: 400 })
    }

    const { data: step, error } = await supabase
      .from('sequence_steps')
      .update({
        step_order: body.step_order,
        channel: body.channel,
        template_id: body.template_id,
        delay_minutes: body.delay_minutes,
        delay_from: body.delay_from,
        subject_override: body.subject_override,
        conditions: body.conditions,
        status: body.status,
      })
      .eq('id', body.id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: 'Failed to update step' }, { status: 500 })
    }

    return NextResponse.json({ step })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
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

    const { searchParams } = new URL(request.url)
    const stepId = searchParams.get('stepId')
    if (!stepId) {
      return NextResponse.json({ error: 'stepId query param required' }, { status: 400 })
    }

    const { error } = await supabase.from('sequence_steps').delete().eq('id', stepId)
    if (error) {
      return NextResponse.json({ error: 'Failed to delete step' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
