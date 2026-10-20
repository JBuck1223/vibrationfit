export const AUTO_INHALE_SECONDS = 3
export const AUTO_EXHALE_SECONDS = 5
export const AUTO_DURATION_MINUTES = 5

export const BREATH_MIN_SECONDS = 2
export const BREATH_MAX_SECONDS = 20
export const HOLD_MAX_SECONDS = 20
export const DURATION_MIN_MINUTES = 1
export const DURATION_MAX_MINUTES = 30

export const DURATION_OPTIONS = [3, 5, 10, 15, 20] as const

export interface BreathPreset {
  id: string
  label: string
  inhale: number
  exhale: number
  /** Seconds held at full lungs between in and out. */
  hold: number
  hint: string
}

export const BREATH_PRESETS: readonly BreathPreset[] = [
  { id: 'calm', label: 'Calm', inhale: AUTO_INHALE_SECONDS, exhale: AUTO_EXHALE_SECONDS, hold: 0, hint: 'A longer out-breath to settle' },
  { id: 'balance', label: 'Balance', inhale: 5, exhale: 5, hold: 0, hint: 'Even, steady rhythm' },
  { id: 'unwind', label: 'Unwind', inhale: 4, exhale: 8, hold: 0, hint: 'Slow release before sleep' },
  { id: 'lift', label: 'Lift', inhale: 4, exhale: 3, hold: 0, hint: 'A brighter, waking rhythm' },
  { id: '478', label: '4-7-8', inhale: 4, exhale: 8, hold: 7, hint: 'In for 4, hold for 7, out for 8. Deep calm for stress and sleep' },
]

export const CUSTOM_PRESET_ID = 'custom'

/** Mureka trims instrumental references to 30 seconds. */
export const REFERENCE_CLIP_SECONDS = 30

export const MOOD_IDEAS = [
  'Warm pads, distant piano',
  'Crystal bowls, soft shimmer',
  'Ocean drift, deep drones',
  'Forest dawn, gentle flute',
] as const

export const BREATH_STORAGE_KEY = 'vf-meditation-breath'

export const FREQUENCY_CATEGORIES = ['solfeggio', 'solfeggio_binaural', 'binaural'] as const

export const DEFAULT_MUSIC_VOLUME = 0.55
export const DEFAULT_BINAURAL_VOLUME = 0.3

export const LEAD_IN_SECONDS = 3
export const END_FADE_SECONDS = 6
