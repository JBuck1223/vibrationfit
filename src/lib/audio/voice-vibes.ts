/**
 * Voice Vibes — narration *tone* presets layered on top of a chosen voice.
 *
 * The member picks two things, independently:
 *   1. a Voice  — which OpenAI voice speaks (alloy, sage, onyx, ...)
 *   2. a Vibe   — the feel/delivery (Deep Calm, Sleep & Drift, ...)
 *
 * A vibe is voice-agnostic: it only carries `instructions` that steer delivery
 * on the steerable `gpt-4o-mini-tts` model. "Natural" is the default vibe and
 * carries no instructions, so it falls back to the original `tts-1` behavior —
 * nothing changes unless the member deliberately picks a tone.
 *
 * Storage: we persist a composite `voice_id` of `"<voice>__<vibe>"` (e.g.
 * `alloy__deep_calm`) so audio sets and de-duplication stay distinct per
 * voice+vibe combination. A bare voice id (no vibe / natural) is stored as-is,
 * which keeps every legacy track and queue replay working unchanged.
 */

// Self-contained voice union so this module is safe to import on the client
// (no dependency on the server-only audioService module).
export type VibeVoice =
  | 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer'

export interface VoiceVibe {
  /** Stable id used in the composite voice_id (e.g. "deep_calm"). */
  id: string
  /** User-facing name. */
  label: string
  /** Short UI description of the feel. */
  description: string
  /** Delivery steering sent to gpt-4o-mini-tts. Empty => natural (tts-1). */
  instructions: string
  /** Voice used only to render this vibe's illustrative preview clip. */
  previewVoice: VibeVoice
}

export const NATURAL_VIBE_ID = 'natural'

export const VOICE_VIBES: VoiceVibe[] = [
  {
    id: NATURAL_VIBE_ID,
    label: 'Natural',
    description: 'Standard, clear narration — no added styling.',
    instructions: '',
    previewVoice: 'nova',
  },
  {
    id: 'deep_calm',
    label: 'Deep Calm',
    description: 'Slow, soothing guided-meditation delivery with gentle pauses.',
    previewVoice: 'sage',
    instructions: [
      'Speak as a calm, experienced meditation guide.',
      'Tone: warm, serene, deeply reassuring, unhurried.',
      'Pace: slow and deliberate. Leave a gentle pause at the end of each sentence and a longer pause between ideas, as if guiding someone into relaxation.',
      'Volume: soft and intimate, like speaking quietly to one person.',
      'Emotion: peaceful and grounding. Never rushed, never excited. Let the words settle.',
    ].join(' '),
  },
  {
    id: 'sleep_drift',
    label: 'Sleep & Drift',
    description: 'Very soft, slow and dreamy — made for winding down and sleep.',
    previewVoice: 'shimmer',
    instructions: [
      'Speak as a soothing voice helping someone drift off to sleep.',
      'Tone: hushed, tender, dreamy, almost whispered.',
      'Pace: very slow, with long, relaxed pauses between phrases. Trail softly at the end of sentences.',
      'Volume: very soft and gentle throughout.',
      'Emotion: deeply calming and safe. Lull the listener; avoid any sharp emphasis or rising energy.',
    ].join(' '),
  },
  {
    id: 'gentle_guide',
    label: 'Gentle Guide',
    description: 'Warm and nurturing at a natural, easy pace for daily listening.',
    previewVoice: 'nova',
    instructions: [
      'Speak as a warm, encouraging guide and friend.',
      'Tone: kind, nurturing, sincere, gently uplifting.',
      'Pace: relaxed and natural with comfortable pauses — flowing, not rushed.',
      'Volume: soft-to-moderate and intimate.',
      'Emotion: caring and supportive, like reassuring someone who matters to you.',
    ].join(' '),
  },
  {
    id: 'grounded',
    label: 'Grounded & Present',
    description: 'Deep, steady and mindful — calm presence with quiet strength.',
    previewVoice: 'onyx',
    instructions: [
      'Speak as a grounded, mindful guide with quiet inner strength.',
      'Tone: deep, steady, calm and confident, deeply present.',
      'Pace: slow and measured with deliberate pauses between thoughts.',
      'Volume: low, resonant and steady.',
      'Emotion: centered and reassuring. Convey stillness and stability, never urgency.',
    ].join(' '),
  },
  {
    id: 'radiant',
    label: 'Radiant & Uplifting',
    description: 'Warm and bright with gentle, hopeful energy for affirmations.',
    previewVoice: 'coral',
    instructions: [
      'Speak as a warm, radiant guide affirming a bright future.',
      'Tone: warm, hopeful, gently bright and encouraging.',
      'Pace: relaxed and flowing with natural pauses — calm but alive.',
      'Volume: soft-to-moderate and inviting.',
      'Emotion: heartfelt optimism and quiet excitement, without becoming loud or hyped.',
    ].join(' '),
  },
]

const VIBE_BY_ID: Record<string, VoiceVibe> = Object.fromEntries(
  VOICE_VIBES.map(v => [v.id, v]),
)

/**
 * Returns the vibe for an id, or undefined if it isn't a known *steering* vibe.
 * Note: "natural" resolves to a vibe whose `instructions` are empty.
 */
export function getVoiceVibe(id: string | null | undefined): VoiceVibe | undefined {
  if (!id) return undefined
  return VIBE_BY_ID[id]
}

/** True when the given id is a known vibe id. */
export function isVoiceVibeId(id: string | null | undefined): boolean {
  return Boolean(id && VIBE_BY_ID[id])
}

const COMPOSITE_SEPARATOR = '__'

/**
 * Build the stored voice_id from a voice + optional vibe.
 * Natural / no vibe => the bare voice id (backward compatible).
 */
export function buildVoiceId(voice: string, vibe?: string | null): string {
  if (!vibe || vibe === NATURAL_VIBE_ID) return voice
  return `${voice}${COMPOSITE_SEPARATOR}${vibe}`
}

/**
 * Parse a stored voice_id back into its voice + vibe parts.
 * Accepts both bare voices ("alloy") and composites ("alloy__deep_calm").
 */
export function parseVoiceId(voiceId: string | null | undefined): { voice: string; vibe?: string } {
  if (!voiceId) return { voice: 'alloy' }
  const idx = voiceId.indexOf(COMPOSITE_SEPARATOR)
  if (idx === -1) return { voice: voiceId }
  return {
    voice: voiceId.slice(0, idx),
    vibe: voiceId.slice(idx + COMPOSITE_SEPARATOR.length) || undefined,
  }
}
