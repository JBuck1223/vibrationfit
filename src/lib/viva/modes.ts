export const VIVA_MODES = ['auto', 'friend', 'coach', 'builder', 'assistant'] as const

export type VivaMode = (typeof VIVA_MODES)[number]

export const VIVA_MODE_LABELS: Record<VivaMode, string> = {
  auto: 'Auto',
  friend: 'Friend',
  coach: 'Coach',
  builder: 'Builder',
  assistant: 'Assistant',
}

export function isVivaMode(value: unknown): value is VivaMode {
  return typeof value === 'string' && (VIVA_MODES as readonly string[]).includes(value)
}

export function parseVivaMode(value: unknown, fallback: VivaMode = 'auto'): VivaMode {
  if (value === 'kit') return 'builder'
  return isVivaMode(value) ? value : fallback
}

/** Read-only member-content tools — safe (and wanted) in every mode. */
export const READ_TOOLS = ['read_member_content', 'search_member_history'] as const

/** Tools Terra may call in each in-thread mode. Crisis overlay uses none. */
export const MODE_TOOL_ALLOWLIST: Record<VivaMode, readonly string[]> = {
  auto: [
    ...READ_TOOLS,
    'queue_song',
    'save_journal_entry',
    'log_abundance_event',
    'add_daily_paper_task',
    'save_daily_paper_gratitude',
    'create_activation_story',
    'create_incantation',
    'create_spark_query',
    'flip_constraint',
    'add_manifestation',
    'draft_vision_categories',
    'commit_vision_draft',
    'queue_kit_asset',
    'pin_kit_evidence',
    'add_kit_project',
    'actualize_manifestation',
    'draft_vibe_post',
    'find_asset',
    'find_kit_candidates',
  ],
  friend: [...READ_TOOLS],
  coach: [
    ...READ_TOOLS,
    'save_journal_entry',
    'flip_constraint',
    'save_daily_paper_gratitude',
    'add_daily_paper_task',
  ],
  builder: [
    ...READ_TOOLS,
    'queue_song',
    'save_journal_entry',
    'log_abundance_event',
    'add_daily_paper_task',
    'save_daily_paper_gratitude',
    'create_activation_story',
    'create_incantation',
    'create_spark_query',
    'add_manifestation',
    'draft_vision_categories',
    'commit_vision_draft',
    'queue_kit_asset',
    'pin_kit_evidence',
    'add_kit_project',
    'actualize_manifestation',
    'draft_vibe_post',
    'find_asset',
    'find_kit_candidates',
  ],
  assistant: [...READ_TOOLS, 'find_asset'],
}

export type KitMove =
  | 'none'
  | 'propose_kit'
  | 'offer_first_domino'
  | 'continue_kit'
  | 'find_asset'
  | 'find_kit_candidates'
