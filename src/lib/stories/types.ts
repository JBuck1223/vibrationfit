/**
 * Story System Types
 * 
 * Stories are narratives that can attach to any entity type (life_vision, vision_board_item, etc.)
 * Each story can have its own audio (AI-generated or user-recorded).
 */

export type StoryEntityType = 
  | 'life_vision'
  | 'vision_board_item'
  | 'goal'
  | 'schedule_block'
  | 'journal_entry'
  | 'custom'

export type StorySource = 
  | 'ai_generated'
  | 'user_written'
  | 'ai_assisted'

export type StoryStatus = 
  | 'draft'
  | 'generating'
  | 'completed'
  | 'failed'

export interface StoryMetadata {
  // Focus story specific
  selected_categories?: string[]
  category_data?: Record<string, { visionText: string; focusNotes: string }>
  selected_highlights?: Array<{
    category: string
    text: string
  }>
  // Generation context
  prompt_version?: string
  model_used?: string
  // Custom metadata
  [key: string]: unknown
}

export interface Story {
  id: string
  user_id: string
  entity_type: StoryEntityType
  entity_id: string
  title: string | null
  content: string | null
  word_count: number | null
  source: StorySource
  audio_set_id: string | null
  user_audio_url: string | null
  user_audio_duration_seconds: number | null
  metadata: StoryMetadata
  status: StoryStatus
  error_message: string | null
  generation_count: number
  display_order: number
  created_at: string
  updated_at: string
}

export interface StoryWithAudioInfo extends Story {
  // Computed audio status
  hasAiAudio: boolean
  hasUserRecording: boolean
  audioSetCount: number
  totalAudioTracks: number
}

// Create/Update payloads
export interface CreateStoryPayload {
  entity_type: StoryEntityType
  entity_id: string
  title?: string
  content?: string
  source?: StorySource
  metadata?: StoryMetadata
  display_order?: number
}

export interface UpdateStoryPayload {
  title?: string
  content?: string
  source?: StorySource
  status?: StoryStatus
  metadata?: StoryMetadata
  display_order?: number
  error_message?: string | null
}

// Component props
export interface StoriesListProps {
  entityType: StoryEntityType
  entityId: string
  createUrl: string
  storyUrlPrefix: string
  onStorySelect?: (story: Story) => void
  showCreateButton?: boolean
  emptyStateMessage?: string
}

export interface StoryCardProps {
  story: Story
  href: string
  onDelete?: (storyId: string) => void
  showDeleteButton?: boolean
}

export interface StoryEditorProps {
  story: Story
  onSave: (content: string, title?: string) => Promise<void>
  onTitleChange?: (title: string) => void
  autoSave?: boolean
  autoSaveDelay?: number
  readOnly?: boolean
}

// Hook return types
export interface UseStoriesReturn {
  stories: Story[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
  createStory: (payload: CreateStoryPayload) => Promise<Story | null>
  deleteStory: (storyId: string) => Promise<boolean>
}

export interface UseStoryReturn {
  story: Story | null
  loading: boolean
  error: string | null
  saving: boolean
  refetch: () => Promise<void>
  updateStory: (payload: UpdateStoryPayload) => Promise<boolean>
  deleteStory: () => Promise<boolean>
}
