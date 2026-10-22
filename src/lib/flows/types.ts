/**
 * Green Line flows: short guided paths across existing tools, chosen by how a
 * member is arriving today. Definitions live in catalog.ts; runs in flow_runs.
 */

export type ArrivalState = 'below' | 'on' | 'above'

/** Things that happen in the app that can complete a flow step. */
export type FlowSignal =
  | 'journal_saved'
  | 'story_created'
  | 'incantation_created'
  | 'spark_query_created'
  | 'manifestation_created'
  | 'daily_paper_saved'
  | 'vision_audio_played'
  | 'vision_read'
  | 'vision_updated'
  | 'manifestation_touched'
  | 'abundance_logged'
  | 'vibe_post_created'
  | 'viva_action'

/** What a step link can depend on from the run so far. */
export interface FlowContext {
  manifestationId?: string
  manifestationName?: string
}

export interface FlowChoice {
  id: string
  label: string
  description: string
  href: string | ((ctx: FlowContext) => string)
}

export interface FlowStep {
  id: string
  title: string
  body: string
  /** Where the step happens. Omitted when the step is a choice. */
  href?: string | ((ctx: FlowContext) => string)
  /** Several ways to do this step; the member picks one. */
  choices?: FlowChoice[]
  doneWhen: FlowSignal[]
  optional?: boolean
}

export interface FlowDefinition {
  id: string
  state: ArrivalState
  title: string
  bestFor: string
  /** Shown in the sheet before they start. */
  promise: string
  steps: FlowStep[]
  /** The first step needs something picked before it can start (e.g. a manifestation). */
  needs?: 'manifestation'
  completion: { headline: string; body: string }
  nextFlowIds: string[]
}

export interface FlowStepRecord {
  done_at?: string
  skipped_at?: string
  artifact_link?: string | null
  choice?: string
}

export interface FlowRunRow {
  id: string
  flow_id: string
  current_step: string | null
  branch: string | null
  steps: Record<string, FlowStepRecord>
  context: FlowContext
  started_at: string
  completed_at: string | null
  abandoned_at: string | null
}

export interface CheckinRow {
  id: string
  state: ArrivalState
  flow_id: string | null
  created_at: string
}

export interface FlowsResponse {
  run: FlowRunRow | null
  /** The most recent run completed in the last few minutes, for the completion sheet. */
  justCompleted: FlowRunRow | null
  todayCheckin: CheckinRow | null
}
