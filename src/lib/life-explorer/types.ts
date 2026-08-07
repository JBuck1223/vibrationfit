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
}

export interface CoreResource {
  title?: string
  url?: string | null
  resource_type?: string
  runtime?: string | null
  why_selected?: string
  question_it_answers?: string
  pause_points?: string[]
  needs_parent_link?: boolean
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
}
