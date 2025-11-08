export type VibrationalSourceType =
  | 'profile_goes_well'
  | 'profile_not_well'
  | 'assessment'
  | 'vision_paragraph'
  | 'scene'
  | 'journal'
  | 'decision'
  | 'abundance'
  | 'reflection'
  | 'other'

export interface DefaultVibrationalSourceConfig {
  source_key: VibrationalSourceType
  label: string
  description?: string
  enabled?: boolean
  default_category?: string | null
  field_map?: Record<string, string>
  analyzer_config?: Record<string, any>
}

export const DEFAULT_VIBRATIONAL_SOURCE_CONFIGS: DefaultVibrationalSourceConfig[] = [
  {
    source_key: 'profile_goes_well',
    label: 'Profile (Above the Green Line)',
    description: 'Member stories about what is going well.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'profile',
    },
  },
  {
    source_key: 'profile_not_well',
    label: 'Profile (Contrast)',
    description: 'Member stories about what is not working.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'profile',
    },
  },
  {
    source_key: 'assessment',
    label: 'Assessment Responses',
    description: 'Free-form assessment reflections analyzed by VIVA.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'assessment',
    },
  },
  {
    source_key: 'vision_paragraph',
    label: 'Vision Paragraph',
    description: 'Life vision paragraphs generated or edited through VIVA.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'vision',
    },
  },
  {
    source_key: 'scene',
    label: 'Scene Builder',
    description: 'Visualization scenes created or edited within Scene Builder.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
      source_id: 'scene_id',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'scene',
    },
  },
  {
    source_key: 'journal',
    label: 'Journal',
    description: 'Journal entries and reflections.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
      source_id: 'journal_entry_id',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'journal',
    },
  },
  {
    source_key: 'decision',
    label: 'Decision Analyzer',
    description: 'Decision reflections feeding vibrational data.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
      source_id: 'decision_id',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'decision',
    },
  },
  {
    source_key: 'abundance',
    label: 'Abundance Tracker',
    description: 'Abundance events logged by members.',
    default_category: 'abundance',
    field_map: {
      raw_text: 'note',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
      source_id: 'abundance_id',
    },
    analyzer_config: {
      strategy: 'manual',
    },
  },
  {
    source_key: 'reflection',
    label: 'VIVA Reflection',
    description: 'AI reflections and follow-up prompts.',
    default_category: null,
    field_map: {
      raw_text: 'text',
      category: 'category',
      emotional_valence: 'analysis.emotional_valence',
      dominant_emotions: 'analysis.dominant_emotions',
      intensity: 'analysis.intensity',
      essence_word: 'analysis.essence_word',
      is_contrast: 'analysis.is_contrast',
      summary_in_their_voice: 'analysis.summary_in_their_voice',
    },
    analyzer_config: {
      strategy: 'analyze',
      prompt: 'reflection',
    },
  },
  {
    source_key: 'other',
    label: 'Other / Imported',
    description: 'Catch-all for experimental sources.',
    default_category: null,
    analyzer_config: {
      strategy: 'manual',
    },
  },
]

export const VIBRATIONAL_SOURCE_TYPES = DEFAULT_VIBRATIONAL_SOURCE_CONFIGS.map(
  (config) => config.source_key
) as VibrationalSourceType[]

export function isValidVibrationalSourceType(
  value: string
): value is VibrationalSourceType {
  return (VIBRATIONAL_SOURCE_TYPES as string[]).includes(value)
}

export function getDefaultSourceConfig(
  sourceKey: string
): DefaultVibrationalSourceConfig | undefined {
  return DEFAULT_VIBRATIONAL_SOURCE_CONFIGS.find(
    (config) => config.source_key === sourceKey
  )
}
