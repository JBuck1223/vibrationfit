export type EmotionalValence = 'below_green_line' | 'near_green_line' | 'above_green_line'

export type TrendingDirection = 'up' | 'down' | 'stable'

export interface VibrationalAnalysis {
  emotional_valence: EmotionalValence
  dominant_emotions: string[]
  intensity: number
  essence_word: string
  is_contrast: boolean
  summary_in_their_voice: string
}

export interface VibrationalEventRecord extends VibrationalAnalysis {
  id: string
  user_id: string
  category: string
  source_type: string
  source_id: string | null
  raw_text: string | null
  created_at: string
}

export interface SceneRecord {
  id: string
  user_id: string
  category: string
  title: string
  text: string
  essence_word: string | null
  emotional_valence: EmotionalValence
  created_from: 'ai_suggested' | 'user_written' | 'hybrid'
  related_vision_id: string | null
  created_at: string
  updated_at: string
}

export interface EmotionalSnapshotRecord {
  id: string
  user_id: string
  category: string
  current_valence: EmotionalValence
  trending_direction: TrendingDirection
  avg_intensity: number | null
  dominant_essence_words: string[]
  primary_essence: string | null
  last_event_at: string | null
  event_count_7d: number
  event_count_30d: number
  last_scene_id: string | null
  last_vision_id: string | null
  created_at: string
  updated_at: string
}

export interface AbundanceEventRecord {
  id: string
  user_id: string
  date: string
  value_type: 'money' | 'value'
  amount: number | null
  vision_category: string | null
  entry_category: string | null
  note: string
  created_at: string
}

export interface VibrationalEventSource {
  id: string
  source_key: string
  label: string
  description?: string | null
  enabled: boolean
  default_category?: string | null
  field_map: Record<string, any>
  analyzer_config: Record<string, any>
  created_at: string
  updated_at: string
}

export interface VibrationalEventInsert {
  user_id: string
  category: string
  source_type: string
  source_id?: string | null
  raw_text?: string | null
  emotional_valence: EmotionalValence
  dominant_emotions?: string[]
  intensity?: number | null
  essence_word?: string | null
  is_contrast: boolean
  summary_in_their_voice?: string | null
}

