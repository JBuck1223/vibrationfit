// Cinematic Universe -- Shared types for the Keyframe Execution Engine

// ---------------------------------------------------------------------------
// Status enums
// ---------------------------------------------------------------------------

export type SeriesStatus = 'planning' | 'active' | 'complete' | 'archived'

export type EpisodeStatus =
  | 'planning'
  | 'keyframes_generating'
  | 'keyframes_review'
  | 'clips_generating'
  | 'clips_review'
  | 'approved'
  | 'published'

export type KeyframeStatus =
  | 'pending'
  | 'generating'
  | 'complete'
  | 'approved'
  | 'rejected'
  | 'failed'

export type ClipStatus =
  | 'pending'
  | 'waiting_keyframes'
  | 'generating'
  | 'complete'
  | 'approved'
  | 'rejected'
  | 'failed'

export type ScheduledPostStatus =
  | 'scheduled'
  | 'publishing'
  | 'posted'
  | 'failed'
  | 'cancelled'

export type CharacterType = 'real_person' | 'generated'

export type TransitionType = 'chain' | 'jump_cut'

export type AspectRatio = 'landscape_16_9' | 'portrait_9_16' | 'square_1_1'

export type MediaFileType = 'image' | 'video'

// ---------------------------------------------------------------------------
// Style guide stored as JSONB on cu_series
// ---------------------------------------------------------------------------

export interface StyleGuide {
  visual_style?: string
  mood?: string
  lighting?: string
  color_grading?: string
  default_aspect_ratio?: AspectRatio
  photorealistic?: boolean
  extra_notes?: string
}

// ---------------------------------------------------------------------------
// Database row types
// ---------------------------------------------------------------------------

export interface CuSeries {
  id: string
  title: string
  concept: string | null
  tone: string | null
  style_guide: StyleGuide
  status: SeriesStatus
  platform_targets: string[]
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface CuCharacter {
  id: string
  series_id: string | null
  name: string
  description: string | null
  reference_images: string[]
  style_notes: string | null
  character_type: CharacterType
  created_at: string
  updated_at: string
}

export interface CuEpisode {
  id: string
  series_id: string
  title: string
  concept: string | null
  sort_order: number
  status: EpisodeStatus
  execution_plan: ExecutionPlan | null
  caption: string | null
  hashtags: string | null
  call_to_action: string | null
  final_video_url: string | null
  target_aspect_ratio: AspectRatio
  created_at: string
  updated_at: string
}

export interface CuKeyframe {
  id: string
  episode_id: string
  sort_order: number
  description: string
  prompt: string | null
  negative_prompt: string | null
  fal_model: string | null
  target_size: string
  character_ids: string[]
  style_reference_keyframe_id: string | null
  reference_image_url: string | null
  status: KeyframeStatus
  generated_media_id: string | null
  generation_metadata: GenerationMetadata | null
  created_at: string
  updated_at: string
}

export interface CuClip {
  id: string
  episode_id: string
  sort_order: number
  first_frame_keyframe_id: string
  last_frame_keyframe_id: string
  transition_type: TransitionType
  prompt: string | null
  fal_model: string | null
  duration_seconds: number
  status: ClipStatus
  generated_media_id: string | null
  generation_metadata: GenerationMetadata | null
  created_at: string
  updated_at: string
}

export interface CuMedia {
  id: string
  file_type: MediaFileType
  url: string
  s3_key: string | null
  thumbnail_url: string | null
  width: number | null
  height: number | null
  duration_seconds: number | null
  fal_model: string | null
  fal_request_id: string | null
  file_size_bytes: number | null
  created_at: string
}

export interface CuScheduledPost {
  id: string
  episode_id: string
  media_ids: string[]
  platforms: string[]
  title: string | null
  caption: string | null
  hashtags: string | null
  link_url: string | null
  call_to_action: string | null
  scheduled_at: string
  posted_at: string | null
  status: ScheduledPostStatus
  publish_result: Record<string, unknown> | null
  sort_order: number
  created_at: string
  updated_at: string
}

// ---------------------------------------------------------------------------
// Generation metadata stored as JSONB
// ---------------------------------------------------------------------------

export interface PreviousVersion {
  media_id: string
  media_url: string
  fal_model?: string
  fal_request_id?: string
  generated_at: string
}

export interface GenerationMetadata {
  fal_request_id?: string
  started_at?: string
  completed_at?: string
  duration_ms?: number
  cost_cents?: number
  retry_count?: number
  error_message?: string
  previous_versions?: PreviousVersion[]
}

// ---------------------------------------------------------------------------
// VIVA Execution Plan (stored as JSONB on cu_episodes.execution_plan)
// ---------------------------------------------------------------------------

export interface ExecutionPlanKeyframe {
  sort_order: number
  description: string
  characters: string[]
  camera: string
  setting: string
  lens: string
  lighting: string
  emotional_beat: string
  generation_approach: 'generate' | 'image_edit'
  reference_notes: string
  style_reference_sort_order?: number
}

export interface ExecutionPlanClip {
  sort_order: number
  first_frame_keyframe: number
  last_frame_keyframe: number
  transition_type: TransitionType
  action: string
  camera_motion: string
  duration_seconds: number
  emotional_beat: string
  dialogue?: string
}

export interface NarrativeBeat {
  title: string
  keyframe_range_start: number
  keyframe_range_end: number
  clip_range: number[]
}

export interface ExecutionPlan {
  keyframes: ExecutionPlanKeyframe[]
  clips: ExecutionPlanClip[]
  narrative_beats?: NarrativeBeat[]
}

// ---------------------------------------------------------------------------
// Joined / enriched types used in the UI and queue runner
// ---------------------------------------------------------------------------

export interface KeyframeWithMedia extends CuKeyframe {
  generated_media: CuMedia | null
  style_reference_keyframe: { generated_media: CuMedia | null } | null
}

export interface ClipWithMedia extends CuClip {
  generated_media: CuMedia | null
  first_frame_keyframe: KeyframeWithMedia
  last_frame_keyframe: KeyframeWithMedia
}

export interface EpisodeDetail extends CuEpisode {
  series: CuSeries
  keyframes: KeyframeWithMedia[]
  clips: ClipWithMedia[]
}

// ---------------------------------------------------------------------------
// API request/response helpers
// ---------------------------------------------------------------------------

export interface CreateSeriesInput {
  title: string
  concept?: string
  tone?: string
  style_guide?: StyleGuide
  platform_targets?: string[]
}

export interface CreateCharacterInput {
  series_id?: string
  name: string
  description?: string
  reference_images?: string[]
  style_notes?: string
  character_type: CharacterType
}

export interface CreateEpisodeInput {
  series_id: string
  title: string
  concept?: string
  target_aspect_ratio?: AspectRatio
}

export interface SaveExecutionPlanInput {
  episode_id: string
  plan: ExecutionPlan
}
