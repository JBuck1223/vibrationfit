import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { FEELINGS, getFlow, nextStepId } from '@/lib/flows/catalog'
import { applySignal } from '@/lib/flows/server'
import type { ArrivalState, FlowContext, FlowRunRow, FlowSignal, FlowsResponse } from '@/lib/flows/types'

export const dynamic = 'force-dynamic'

const RUN_COLUMNS = 'id, flow_id, current_step, branch, steps, context, started_at, completed_at, abandoned_at'
const STATES: ArrivalState[] = ['below', 'on', 'above']
const SIGNALS: FlowSignal[] = [
  'journal_saved', 'story_created', 'incantation_created', 'spark_query_created', 'manifestation_created', 'daily_paper_saved', 'vision_audio_played', 'vision_read',
  'vision_updated', 'manifestation_touched', 'abundance_logged', 'vibe_post_created', 'viva_action', 'meditation_completed',
]

async function load(supabase: Awaited<ReturnType<typeof createClient>>, userId: string): Promise<FlowsResponse> {
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const tenMinutesAgo = new Date(Date.now() - 10 * 60_000).toISOString()
  const [open, done, checkin] = await Promise.all([
    supabase.from('flow_runs').select(RUN_COLUMNS).eq('user_id', userId)
      .is('completed_at', null).is('abandoned_at', null)
      .order('started_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('flow_runs').select(RUN_COLUMNS).eq('user_id', userId)
      .gte('completed_at', tenMinutesAgo).is('context->>completion_seen', null)
      .order('completed_at', { ascending: false }).limit(1).maybeSingle(),
    supabase.from('green_line_checkins').select('id, state, feeling, flow_id, created_at').eq('user_id', userId)
      .gte('created_at', startOfDay.toISOString())
      .order('created_at', { ascending: false }).limit(1).maybeSingle(),
  ])
  return {
    run: (open.data as FlowRunRow | null) ?? null,
    justCompleted: (done.data as FlowRunRow | null) ?? null,
    todayCheckin: checkin.data ?? null,
  }
}

/** GET: the member's open flow, a just-completed one, and today's check-in. */
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  return NextResponse.json(await load(supabase, user.id))
}

/** POST { state, flowId?, context? }: record a check-in; with flowId, start that flow. */
export async function POST(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as
    | { state?: string; feeling?: string; flowId?: string; context?: FlowContext }
    | null
  const state = body?.state as ArrivalState
  if (!STATES.includes(state)) return NextResponse.json({ error: 'state required' }, { status: 400 })
  const flow = body?.flowId ? getFlow(body.flowId) : null
  if (body?.flowId && !flow) return NextResponse.json({ error: 'Unknown flow' }, { status: 400 })

  const { data: checkin, error: checkinError } = await supabase
    .from('green_line_checkins')
    .insert({
      user_id: user.id,
      state,
      feeling: FEELINGS.some((f) => f.id === body?.feeling && f.state === state) ? body!.feeling : null,
      flow_id: flow?.id ?? null,
    })
    .select('id')
    .single()
  if (checkinError) return NextResponse.json({ error: checkinError.message }, { status: 500 })

  if (flow) {
    // One open flow at a time: starting a new one sets the old one aside.
    await supabase.from('flow_runs').update({ abandoned_at: new Date().toISOString() })
      .eq('user_id', user.id).is('completed_at', null).is('abandoned_at', null)
    const context: FlowContext = {
      ...(body?.context?.manifestationId ? { manifestationId: body.context.manifestationId } : {}),
      ...(body?.context?.manifestationName ? { manifestationName: body.context.manifestationName } : {}),
    }
    const { error } = await supabase.from('flow_runs').insert({
      user_id: user.id,
      checkin_id: checkin.id,
      flow_id: flow.id,
      current_step: flow.steps[0]?.id ?? null,
      steps: {},
      context,
    })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json(await load(supabase, user.id))
}

type PatchBody = {
  runId?: string
  action?: 'complete_step' | 'skip_step' | 'choose' | 'complete' | 'abandon' | 'seen' | 'signal'
  stepId?: string
  choice?: string
  signal?: FlowSignal
  artifactLink?: string
}

/** PATCH: move a run along (step done / skipped / branch chosen), finish it, or leave it. */
export async function PATCH(request: Request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Authentication required' }, { status: 401 })

  const body = (await request.json().catch(() => null)) as PatchBody | null
  if (!body?.action) return NextResponse.json({ error: 'action required' }, { status: 400 })

  // Client-reported activity (e.g. a story saved in the studio): apply to the open run.
  if (body.action === 'signal') {
    if (!body.signal || !SIGNALS.includes(body.signal)) return NextResponse.json({ error: 'Unknown signal' }, { status: 400 })
    const { data: open } = await supabase.from('flow_runs').select(RUN_COLUMNS).eq('user_id', user.id)
      .is('completed_at', null).is('abandoned_at', null)
      .order('started_at', { ascending: false }).limit(1).maybeSingle()
    if (open) {
      const update = applySignal(open as FlowRunRow, body.signal, body.artifactLink ?? null)
      if (update) await supabase.from('flow_runs').update(update).eq('id', open.id)
    }
    return NextResponse.json(await load(supabase, user.id))
  }

  if (!body.runId) return NextResponse.json({ error: 'runId required' }, { status: 400 })
  const { data: row } = await supabase.from('flow_runs').select(RUN_COLUMNS).eq('id', body.runId).eq('user_id', user.id).maybeSingle()
  if (!row) return NextResponse.json({ error: 'Flow not found' }, { status: 404 })
  const run = row as FlowRunRow
  const flow = getFlow(run.flow_id)
  if (!flow) return NextResponse.json({ error: 'Unknown flow' }, { status: 400 })
  const now = new Date().toISOString()
  const steps = { ...(run.steps ?? {}) }
  let update: Record<string, unknown> = {}

  switch (body.action) {
    case 'complete_step':
    case 'skip_step': {
      const stepId = body.stepId ?? run.current_step
      if (!stepId || !flow.steps.some((s) => s.id === stepId)) return NextResponse.json({ error: 'Unknown step' }, { status: 400 })
      steps[stepId] = { ...steps[stepId], ...(body.action === 'complete_step' ? { done_at: now } : { skipped_at: now }) }
      const next = nextStepId(flow, steps, stepId)
      update = { steps, current_step: next, completed_at: next ? null : now }
      break
    }
    case 'choose': {
      const stepId = body.stepId ?? run.current_step
      if (!stepId) return NextResponse.json({ error: 'Unknown step' }, { status: 400 })
      steps[stepId] = { ...steps[stepId], choice: body.choice }
      update = { steps, ...(stepId === flow.steps[0]?.id ? { branch: body.choice ?? null } : {}) }
      break
    }
    case 'complete':
      update = { completed_at: now, current_step: null }
      break
    case 'abandon':
      update = { abandoned_at: now }
      break
    case 'seen':
      update = { context: { ...(run.context ?? {}), completion_seen: true } }
      break
  }

  const { error } = await supabase.from('flow_runs').update(update).eq('id', run.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(await load(supabase, user.id))
}
