export type LifeCategoryKey =
  | 'fun'
  | 'health'
  | 'travel'
  | 'love'
  | 'family'
  | 'social'
  | 'home'
  | 'work'
  | 'money'
  | 'stuff'
  | 'giving'
  | 'spirituality'

export type ExpeditionStatus = 'active' | 'paused' | 'completed'
export type WonderKind = 'know' | 'wonder' | 'learned'
export type WonderStatus = 'unexplored' | 'exploring' | 'answered'
export type LessonStatus = 'ready' | 'in_progress' | 'completed' | 'skipped'
export type RecordStatus = 'completed' | 'partial' | 'skipped'
export type Direction = 'continue' | 'deepen' | 'change'
/** Expedition-level steering set from the lead explorer's console. */
export type SteerDirection = 'continue' | 'deepen' | 'wrap_up'
export type SkillStatus = 'emerging' | 'developing' | 'secure' | 'needs_support'
export type EvidenceType =
  | 'photo'
  | 'writing'
  | 'experiment_record'
  | 'build'
  | 'presentation'
  | 'drawing'
  | 'journal'
  | 'recording'
  | 'other'

export interface LeStudent {
  id: string
  created_by: string
  household_id: string | null
  name: string
  grade_level: string
  current_age: number | null
  interests: string[]
  strengths: string[]
  skills_needing_support: string[]
  active: boolean
  created_at: string
  updated_at: string
  /** Two-letter state for the State Requirements Engine (default FL). */
  state_code?: string | null
}

export interface LeExpedition {
  id: string
  student_id: string
  created_by: string
  household_id: string | null
  life_category: LifeCategoryKey
  title: string
  status: ExpeditionStatus
  start_date: string
  essential_questions: string[]
  core_resources: unknown[]
  notes: string | null
  created_at: string
  updated_at: string
  /** Lead-explorer steering console state. */
  steer?: { direction?: SteerDirection; updated_at?: string } | null
}

export interface LeWonderItem {
  id: string
  expedition_id: string
  created_by: string
  household_id: string | null
  kind: WonderKind
  statement: string
  interest_level: number | null
  status: WonderStatus
  source: string
  original_language: boolean
  evidence_id: string | null
  recorded_at: string
  created_at: string
  updated_at: string
  /** Spaced-retrieval tracking (Expedition Flashback) — learned items only. */
  review_count?: number | null
  last_reviewed_at?: string | null
  next_review_at?: string | null
  /** Up Next queue position (1 = next lesson's primary question). */
  priority?: number | null
  /** Manual position within its column on the Wonder Wall. */
  sort_order?: number | null
}

/** Resource curation tiers — see curation.ts for the quality gates. */
export type EngagementTier = 'franchise' | 'verified' | 'vf_original'
export type ResourceLinkStatus = 'verified_url' | 'needs_parent_link' | 'vf_original'

export interface CoreResource {
  title?: string
  url?: string | null
  resource_type?: string
  runtime?: string | null
  why_selected?: string
  question_it_answers?: string | null
  pause_points?: string[]
  needs_parent_link?: boolean
  engagement_tier?: EngagementTier
  age_band?: string
  duration_minutes?: number | null
  materials?: string[]
}

/** Fun Contract — every generated lesson must satisfy all six beats. */
export interface FunContract {
  hook: string
  story_mission: string
  embodiment: string
  artifact: string
  choice_point: string
  celebration_close: string
}

/** 15-minute minimum viable lesson — sick day / meltdown day fallback. */
export interface LowBatteryMode {
  total_minutes: number
  steps: string[]
  log_title: string
}

export interface ParentAnswerKey {
  expected_answers: string[]
  likely_questions: Array<{ question: string; kid_answer: string }>
  unknown_script: string
}

/** One spaced-retrieval prompt pulled from the Learned column. */
export interface FlashbackItem {
  prompt: string
  learned_statement: string
  wonder_item_id?: string | null
  age_days?: number
}

export interface LessonFlashback {
  game: string
  items: FlashbackItem[]
}

export interface SiblingTagAlong {
  activity: string
  adaptation: string
}

export interface LessonBlockTime {
  block: string
  minutes: number
  optional?: boolean
}

/**
 * Optional one-page recording sheet for a lesson — emitted ONLY when the
 * hands-on activity genuinely needs one (predictions, measurements).
 * Rendered on-brand by /api/life-explorer/print/lesson.
 */
export interface LessonPrintable {
  title: string
  question: string
  prediction_prompt?: string | null
  steps?: string[]
  chart?: { rows: string[]; columns: string[] } | null
  result_prompt?: string | null
  draw_prompt?: string | null
}

export interface LessonPayload {
  identity: {
    life_category: string
    expedition: string
    lesson_title: string
    lesson_number: number
    recommended_age_grade: string
    estimated_total_minutes: number
    essential_question: string
  }
  parent_prep: {
    prep_minutes: number
    materials: string[]
    books?: string[]
    links?: CoreResource[]
    beforehand?: string[]
    cleanup?: string
    safety?: string[]
  }
  objectives: Array<{ area: string; objective: string }>
  teacher_script: {
    opening: string
    mystery_or_question: string
    transitions: string[]
    core_concept: string
    closing: string
  }
  wonder_wall: {
    know_prompt: string
    wonder_prompts: string[]
    learned_guidance: string
    likely_follow_ups: string[]
  }
  core_resource: CoreResource
  hands_on: Record<string, unknown> | null
  foundational_skills: {
    subject: string
    activity: string
    materials?: string[]
    notes?: string
  }
  child_output: {
    type: string
    description: string
  }
  reflection: string[]
  parent_observation: string[]
  core_activities: string[]
  optional_extensions: string[]
  good_stopping_point: string
  time_summary: {
    prep_minutes: number
    lesson_minutes: number
    reading_minutes: number
    foundational_minutes: number
    has_experiment: boolean
    has_journal: boolean
  }
  /** Fun Engine + facilitation guarantees (optional on legacy lessons). */
  fun_contract?: FunContract
  low_battery_mode?: LowBatteryMode
  parent_answer_key?: ParentAnswerKey
  flashback?: LessonFlashback
  sibling_tag_along?: SiblingTagAlong[]
  block_minutes?: LessonBlockTime[]
  /** Play-order media queue — parent taps play, never hunts mid-lesson. */
  resource_queue?: CoreResource[]
  /** State benchmark codes touched (derived crosswalk input). */
  standards_tags?: string[]
  /** One-page recording sheet — only when the activity needs one. */
  printable?: LessonPrintable | null
}

export interface LeLesson {
  id: string
  expedition_id: string
  student_id: string
  created_by: string
  household_id: string | null
  lesson_number: number
  title: string
  essential_question: string | null
  status: LessonStatus
  estimated_total_minutes: number | null
  payload: LessonPayload
  planned_for: string
  created_at: string
  updated_at: string
  /** Wall-clock timing — set when the lesson is opened / finished. */
  started_at?: string | null
  completed_at?: string | null
}

// ============================================================================
// Lesson container — action items, notes, links, media inside one lesson
// ============================================================================

export type LessonItemKind = 'prep' | 'activity' | 'wrap_up' | 'custom'
export type LessonItemSource = 'generated' | 'custom'

/** One action item on the lesson checklist (print this, do the experiment…). */
export interface LeLessonItem {
  id: string
  lesson_id: string
  student_id: string
  created_by: string
  household_id: string | null
  title: string
  detail: string | null
  kind: LessonItemKind
  source: LessonItemSource
  is_complete: boolean
  completed_at: string | null
  sort_order: number
  created_at: string
  updated_at: string
}

export interface LeLessonNote {
  id: string
  lesson_id: string
  item_id: string | null
  student_id: string
  created_by: string
  household_id: string | null
  body: string
  created_at: string
  updated_at: string
}

export interface LeLessonLink {
  id: string
  lesson_id: string
  item_id: string | null
  student_id: string
  created_by: string
  household_id: string | null
  url: string
  title: string | null
  created_at: string
}

export interface LeLessonMedia {
  id: string
  lesson_id: string
  item_id: string | null
  note_id: string | null
  student_id: string
  created_by: string
  household_id: string | null
  media_type: ActivityMediaType
  url: string
  file_name: string | null
  caption: string | null
  created_at: string
}

/** Everything inside one lesson bucket — returned by GET /lessons/[id]. */
export interface LessonBundle {
  lesson: LeLesson
  items: LeLessonItem[]
  notes: LeLessonNote[]
  links: LeLessonLink[]
  media: LeLessonMedia[]
}

export interface LeLessonRecord {
  id: string
  lesson_id: string
  expedition_id: string
  student_id: string
  created_by: string
  household_id: string | null
  recorded_on: string
  status: RecordStatus
  activities_completed: string[]
  activities_skipped: string[]
  student_engagement: number | null
  enjoyed_most: string | null
  created_said_demonstrated: string | null
  easy_or_difficult: string | null
  new_questions: string[]
  skills_observed: string[]
  direction: Direction | null
  parent_notes: string | null
  recommended_next_action: string | null
  created_at: string
  updated_at: string
}

export interface LeLearningEvidence {
  id: string
  student_id: string
  expedition_id: string | null
  lesson_id: string | null
  lesson_record_id: string | null
  created_by: string
  household_id: string | null
  type: EvidenceType
  title: string
  file_url: string | null
  photo_url: string | null
  student_explanation: string | null
  parent_observation: string | null
  academic_tags: string[]
  created_at: string
  updated_at: string
}

export type ActivityMediaType = 'photo' | 'video' | 'file'

export interface LeActivityMedia {
  id: string
  activity_log_id: string
  student_id: string
  created_by: string
  household_id: string | null
  media_type: ActivityMediaType
  url: string
  caption: string | null
  created_at: string
}

export interface LeActivityLog {
  id: string
  student_id: string
  expedition_id: string | null
  created_by: string
  household_id: string | null
  entry_date: string
  title: string
  description: string | null
  duration_minutes: number
  reading_materials: string[]
  subjects: string[]
  created_at: string
  updated_at: string
  media?: LeActivityMedia[]
}

export interface LeSkillProgress {
  id: string
  student_id: string
  created_by: string
  household_id: string | null
  skill: string
  subject: string
  status: SkillStatus
  last_observed: string | null
  evidence_ids: string[]
  notes: string | null
  created_at: string
  updated_at: string
}

export interface ActiveContext {
  student: LeStudent
  expedition: LeExpedition | null
  wonderWall: {
    know: LeWonderItem[]
    wonder: LeWonderItem[]
    learned: LeWonderItem[]
  }
  latestRecord: LeLessonRecord | null
  readyLesson: LeLesson | null
  skills: LeSkillProgress[]
  highInterestWonders: LeWonderItem[]
}

export interface CheckInInput {
  lesson_id: string
  enjoyed_most?: string
  created_said_demonstrated?: string
  easy_or_difficult?: string
  new_question?: string
  direction?: Direction
  student_engagement?: number
  parent_notes?: string
  photo_url?: string
  activities_completed?: string[]
  activities_skipped?: string[]
  /** Whether the parent used the 15-minute Low-Battery version. */
  low_battery?: boolean
  /** Expedition Flashback recall results: wonder_item_id → recalled? */
  flashback_results?: Array<{ wonder_item_id: string; recalled: boolean }>
}

// ============================================================================
// Storybooks (Life Explorers picture books)
// ============================================================================

export type BookReadingMode = 'i_read' | 'read_to_me'
export type BookStatus = 'generating' | 'ready' | 'failed'
export type BookPageStatus = 'pending' | 'ready' | 'failed'

export interface LeCharacter {
  id: string
  created_by: string
  household_id: string | null
  student_id: string | null
  slug: string
  name: string
  species: string | null
  personality: string
  catchphrase: string | null
  visual_description: string
  portrait_url: string | null
  is_starter: boolean
  created_at: string
  updated_at: string
}

export interface LeBook {
  id: string
  student_id: string
  expedition_id: string | null
  created_by: string
  household_id: string | null
  title: string
  premise: string | null
  topic: string
  reading_mode: BookReadingMode
  status: BookStatus
  /** Human-readable progress, e.g. "Illustrating page 4 of 12". */
  status_detail: string | null
  cover_url: string | null
  cover_image_prompt: string | null
  /** Single character-lineup reference image used for every illustration. */
  cast_sheet_url: string | null
  /** Stable visual description of the story's single setting. */
  setting: string | null
  /** Empty wide shot of the setting (no characters), second edit reference. */
  setting_plate_url: string | null
  /** True topic facts the story teaches, shown on the end page. */
  facts_taught: string[]
  style_notes: string | null
  character_ids: string[]
  page_count: number
  created_at: string
  updated_at: string
}

export interface LeBookPage {
  id: string
  book_id: string
  created_by: string
  household_id: string | null
  page_number: number
  text: string
  image_prompt: string
  image_url: string | null
  /** Parent corrections applied whenever this page's image is regenerated. */
  revision_notes: string | null
  status: BookPageStatus
  created_at: string
  updated_at: string
}

/** One item in the Journey Feed (merged evidence + activity media). */
export interface JourneyFeedItem {
  id: string
  kind: 'evidence' | 'activity_media'
  date: string
  title: string
  media_url: string | null
  media_type: 'photo' | 'video' | 'file' | null
  student_explanation: string | null
  expedition_id: string | null
  expedition_title: string | null
  life_category: string | null
  lesson_title: string | null
  academic_tags: string[]
}
