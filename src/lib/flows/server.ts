/**
 * Server side of flows: when something happens in the app, advance the
 * member's open flow run if that thing completes a step. Called from the
 * shared activity choke points (MAP auto-verify, VIVA coach tools) and from
 * the flows API for client-reported events. Best-effort: never throws.
 */

import { createAdminClient } from '@/lib/supabase/admin'
import { getFlow, nextStepId } from './catalog'
import type { FlowRunRow, FlowSignal, FlowStepRecord } from './types'

/** MAP activity types and legacy area keys that also mean a flow signal. */
const ACTIVITY_TO_SIGNAL: Record<string, FlowSignal> = {
  vision_audio: 'vision_audio_played',
  morning_vision: 'vision_audio_played',
  night_immersion: 'vision_audio_played',
  realtime_activation: 'vision_audio_played',
  'vision-audio': 'vision_audio_played',
  vision_read: 'vision_read',
  'life-vision': 'vision_read',
  vision_board_view: 'manifestation_touched',
  vision_board_update: 'manifestation_touched',
  'vision-board': 'manifestation_touched',
  journal_entry: 'journal_saved',
  journal: 'journal_saved',
  daily_paper: 'daily_paper_saved',
  'daily-paper': 'daily_paper_saved',
  vibe_tribe_post: 'vibe_post_created',
  abundance_tracker: 'abundance_logged',
  'abundance-tracker': 'abundance_logged',
}

/** VIVA coach tools whose success means a flow signal. */
const COACH_TOOL_TO_SIGNAL: Record<string, FlowSignal> = {
  save_journal_entry: 'journal_saved',
  create_activation_story: 'story_created',
  create_incantation: 'incantation_created',
  create_spark_query: 'spark_query_created',
  add_manifestation: 'manifestation_created',
  add_daily_paper_task: 'daily_paper_saved',
  save_daily_paper_gratitude: 'daily_paper_saved',
  log_abundance_event: 'abundance_logged',
  draft_vibe_post: 'vibe_post_created',
  seed_vision_update: 'vision_updated',
  add_kit_project: 'viva_action',
  queue_kit_asset: 'viva_action',
  pin_kit_evidence: 'viva_action',
  actualize_manifestation: 'viva_action',
}

export function signalForActivity(activityOrArea: string): FlowSignal | null {
  return ACTIVITY_TO_SIGNAL[activityOrArea] ?? null
}

export function signalForCoachTool(toolName: string): FlowSignal | null {
  return COACH_TOOL_TO_SIGNAL[toolName] ?? null
}

/**
 * Apply a signal to a run. The first unfinished step (from the current one
 * on) that this signal completes is marked done; optional steps passed over
 * on the way are skipped, required ones stay open. The run then points at the
 * first unfinished step. Returns the updated fields, or null when the signal
 * completes nothing.
 */
export function applySignal(run: FlowRunRow, signal: FlowSignal, artifactLink?: string | null) {
  const flow = getFlow(run.flow_id)
  if (!flow) return null
  const steps: Record<string, FlowStepRecord> = { ...(run.steps ?? {}) }
  const startIndex = Math.max(0, flow.steps.findIndex((s) => s.id === run.current_step))
  const now = new Date().toISOString()

  for (let i = startIndex; i < flow.steps.length; i++) {
    const step = flow.steps[i]
    const record = steps[step.id]
    if (record?.done_at || record?.skipped_at) continue
    if (step.doneWhen.includes(signal)) {
      // Optional steps passed over are skipped. Required ones stay open: the
      // member can do steps out of order (e.g. VIVA makes the Incantation
      // before the Story) and the path waits on whatever is still missing.
      for (let j = startIndex; j < i; j++) {
        const earlier = flow.steps[j]
        if (earlier.optional && !steps[earlier.id]?.done_at && !steps[earlier.id]?.skipped_at) {
          steps[earlier.id] = { ...steps[earlier.id], skipped_at: now }
        }
      }
      steps[step.id] = { ...record, done_at: now, artifact_link: artifactLink ?? record?.artifact_link ?? null }
      const next = nextStepId(flow, steps)
      return { steps, current_step: next, completed_at: next ? null : now }
    }
  }
  return null
}

export async function recordFlowSignal(userId: string, signal: FlowSignal | null, artifactLink?: string | null): Promise<void> {
  if (!signal) return
  try {
    const supabase = createAdminClient()
    const { data: run } = await supabase
      .from('flow_runs')
      .select('id, flow_id, current_step, branch, steps, context, started_at, completed_at, abandoned_at')
      .eq('user_id', userId)
      .is('completed_at', null)
      .is('abandoned_at', null)
      .order('started_at', { ascending: false })
      .limit(1)
      .maybeSingle()
    if (!run) return
    const update = applySignal(run as FlowRunRow, signal, artifactLink)
    if (!update) return
    await supabase.from('flow_runs').update(update).eq('id', run.id)
  } catch {
    // Flows are guidance; never disturb the action that triggered this.
  }
}
