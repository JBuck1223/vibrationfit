import type { SupabaseClient } from '@supabase/supabase-js'

/** area_activations.area values used for MAP visit/listen tracking */
export const MAP_ACTIVATION_AREAS = {
  vision_audio: 'vision_audio',
  story_audio: 'story_audio',
  music_listen: 'music_listen',
  life_vision: 'life_vision',
  vision_board: 'vision_board',
  journal_review: 'journal_review',
} as const

export type MapActivationArea =
  (typeof MAP_ACTIVATION_AREAS)[keyof typeof MAP_ACTIVATION_AREAS]

export type MapAudioActivityType =
  | 'vision_audio'
  | 'story_audio'
  | 'music_listen'

const SET_ICON_TO_AUDIO_ACTIVITY: Record<string, MapAudioActivityType> = {
  life_vision: 'vision_audio',
  stories: 'story_audio',
  music: 'music_listen',
}

export function mapAudioActivityFromSetIcon(
  setIconKey?: string | null,
): MapAudioActivityType | null {
  if (!setIconKey) return null
  return SET_ICON_TO_AUDIO_ACTIVITY[setIconKey] ?? null
}

export function mapActivationAreaForActivity(
  activityType: string,
): MapActivationArea | null {
  switch (activityType) {
    case 'vision_audio':
    case 'morning_vision':
    case 'night_immersion':
    case 'realtime_activation':
      return MAP_ACTIVATION_AREAS.vision_audio
    case 'story_audio':
      return MAP_ACTIVATION_AREAS.story_audio
    case 'music_listen':
      return MAP_ACTIVATION_AREAS.music_listen
    case 'vision_read':
      return MAP_ACTIVATION_AREAS.life_vision
    case 'vision_board_view':
    case 'vision_board_update':
      return MAP_ACTIVATION_AREAS.vision_board
    case 'journal_review':
      return MAP_ACTIVATION_AREAS.journal_review
    default:
      return null
  }
}

/**
 * Record a daily area activation (client or server Supabase client).
 */
export async function recordMapAreaActivation(
  supabase: SupabaseClient,
  userId: string,
  area: MapActivationArea,
  activationDate?: string,
): Promise<void> {
  const today = activationDate ?? new Date().toISOString().split('T')[0]
  await supabase.from('area_activations').upsert(
    { user_id: userId, area, activation_date: today },
    { onConflict: 'user_id,area,activation_date', ignoreDuplicates: true },
  )
}
