/** The studio's Life Vision mix types (same rules as /audio/mix). */
export type MixType = 'voice-only' | 'power' | 'meditation' | 'sleep' | 'personal'

/** Mix type from the voice / background split. */
export function mixTypeFor(variant: string | null | undefined, voice: number | null | undefined, background: number | null | undefined): MixType {
  if (variant === 'personal') return 'personal'
  if (variant === 'standard' || !background) return 'voice-only'
  const v = voice ?? 100
  if (v <= 30) return 'sleep'
  if (v >= 40 && v <= 60) return 'meditation'
  return 'power'
}
