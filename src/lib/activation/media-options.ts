/**
 * Voice and song-genre choices shown after "Enter My Activation".
 * Genre previews are member-generated tracks (generic titles).
 * Enrichment uploads the preview URL to Mureka as the reference.
 */

export const ACTIVATION_VOICES = [
  {
    id: 'nova',
    label: 'Nova',
    gender: 'Female',
    previewUrl: 'https://media.vibrationfit.com/site-assets/voice-previews/nova-v1759856746503.mp3',
  },
  {
    id: 'echo',
    label: 'Echo',
    gender: 'Male',
    previewUrl: 'https://media.vibrationfit.com/site-assets/voice-previews/echo-v1759856727354.mp3',
  },
  {
    id: 'shimmer',
    label: 'Shimmer',
    gender: 'Female',
    previewUrl: 'https://media.vibrationfit.com/site-assets/voice-previews/shimmer-v1759856756423.mp3',
  },
  {
    id: 'alloy',
    label: 'Alloy',
    gender: 'Male',
    previewUrl: 'https://media.vibrationfit.com/site-assets/voice-previews/alloy-v1759856713602.mp3',
  },
] as const

export type ActivationVoiceId = (typeof ACTIVATION_VOICES)[number]['id']

export const ACTIVATION_GENRES = [
  {
    id: 'unstoppable',
    label: 'Unstoppable',
    description: 'Big pop anthem',
    stylePrompt: 'empowering pop anthem, soaring vocal, cinematic drums, modern',
    previewUrl:
      'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/songs/0386cd9b-8fb7-4246-aa25-038389c5a1cc/track-1.mp3',
  },
  {
    id: 'soft-light',
    label: 'Soft Light',
    description: 'Bright and warm',
    stylePrompt: 'bright pop, warm, uplifting, happy, modern',
    previewUrl:
      'https://media.vibrationfit.com/user-uploads/30082787-6ae1-4413-9a32-293cc63e38ee/songs/cfa25430-9e6c-4fb9-bc2f-1f6ad0264dfc/track-1.mp3',
  },
  {
    id: 'heartline',
    label: 'Heartline',
    description: 'Intimate and emotional',
    stylePrompt: 'intimate piano pop, emotional, modern, warm',
    previewUrl:
      'https://media.vibrationfit.com/user-uploads/5c49b204-0c1b-4c5e-bb33-118f9d251259/songs/f1d45410-de69-451c-82ba-3712112fda6a/track-1.mp3',
  },
  {
    id: 'indie-rise',
    label: 'Indie Rise',
    description: 'Organic indie lift',
    stylePrompt: 'indie, uplifting, organic, modern',
    previewUrl:
      'https://media.vibrationfit.com/user-uploads/25b2b667-9ebd-420c-916a-1ecc2baf9101/songs/c0fd4d24-9aed-4bd4-84ae-96dd3d4f8054/track-1.mp3',
  },
] as const

export type ActivationGenreId = (typeof ACTIVATION_GENRES)[number]['id']

export function isActivationVoiceId(value: unknown): value is ActivationVoiceId {
  return ACTIVATION_VOICES.some((voice) => voice.id === value)
}

export function isActivationGenreId(value: unknown): value is ActivationGenreId {
  return ACTIVATION_GENRES.some((genre) => genre.id === value)
}

export function getActivationGenre(id: string | null | undefined) {
  return ACTIVATION_GENRES.find((genre) => genre.id === id) ?? ACTIVATION_GENRES[0]
}

export function getActivationVoice(id: string | null | undefined) {
  return ACTIVATION_VOICES.find((voice) => voice.id === id) ?? ACTIVATION_VOICES[0]
}
