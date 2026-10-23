/**
 * Every playable version of a story's audio, in one list: each VIVA voice,
 * the member's own recording, and each music mix. The story page, the Audio
 * library and the Audio page all read stories through this, so a member sees
 * the same versions everywhere.
 *
 * Rules:
 * - A story can have many audio sets (content_type 'story', content_id = the
 *   story). stories.audio_set_id is only the one played first.
 * - VIVA narration (and mixes made from it) only count while their text still
 *   matches the story, so an edited story never plays out-of-date words.
 * - The member's own recording always counts: it is their voice.
 * - A mix counts once its music is ready; until then it is the same narration
 *   already listed, so it is left out rather than shown twice.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { storyTextMatchesTrack } from '@/lib/audio/content-normalize'
import { mixTypeFor } from '@/lib/audio/mix-type'

export type StoryAudioKind = 'viva' | 'personal' | 'mix'

export interface StoryAudioVersion {
  /** Stable per version: the track id, or 'user-recording'. */
  id: string
  kind: StoryAudioKind
  /** "VIVA · Shimmer", "Your voice", "Power mix · Ocean Waves" */
  label: string
  /** "Voice only", "Personal recording", "Voice + music" */
  sublabel: string
  url: string
  duration: number
  audioSetId: string | null
}

export interface StoryForAudio {
  id: string
  content?: string | null
  audio_set_id?: string | null
  user_audio_url?: string | null
}

const VOICES: Record<string, string> = {
  alloy: 'Alloy', shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', echo: 'Echo',
  fable: 'Fable', onyx: 'Onyx', nova: 'Nova', sage: 'Sage',
}

/** "shimmer__gentle_guide" -> "Shimmer" */
export function storyVoiceName(voiceId: string | null | undefined): string {
  if (!voiceId || voiceId === 'user_voice') return 'Your voice'
  const base = voiceId.split('__')[0]
  return VOICES[base] ?? base.charAt(0).toUpperCase() + base.slice(1)
}

const MIX_LABEL = { power: 'Power mix', meditation: 'Meditation mix', sleep: 'Sleep mix', 'voice-only': 'Mix', personal: 'Mix' } as const

interface SetRow {
  id: string
  name: string | null
  variant: string | null
  voice_id: string | null
  created_at: string
  metadata: {
    voice_volume?: number
    bg_volume?: number
    background_track_name?: string
    source_audio_set_id?: string
  } | null
}

interface TrackRow {
  id: string
  audio_set_id: string
  audio_url: string | null
  mixed_audio_url: string | null
  mix_status: string | null
  text_content: string | null
  duration_seconds: number | null
  created_at: string
}

export async function loadStoryAudioVersions(
  supabase: SupabaseClient,
  story: StoryForAudio,
): Promise<StoryAudioVersion[]> {
  const setFilter = story.audio_set_id
    ? `and(content_type.eq.story,content_id.eq.${story.id}),id.eq.${story.audio_set_id}`
    : `and(content_type.eq.story,content_id.eq.${story.id})`
  const { data: sets } = await supabase
    .from('audio_sets')
    .select('id, name, variant, voice_id, created_at, metadata')
    .or(setFilter)
    .order('created_at', { ascending: false })

  const setRows = (sets ?? []) as SetRow[]
  const tracksBySet = new Map<string, TrackRow[]>()
  if (setRows.length > 0) {
    const { data: tracks } = await supabase
      .from('audio_tracks')
      .select('id, audio_set_id, audio_url, mixed_audio_url, mix_status, text_content, duration_seconds, created_at')
      .in('audio_set_id', setRows.map((s) => s.id))
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    for (const track of (tracks ?? []) as TrackRow[]) {
      const list = tracksBySet.get(track.audio_set_id) ?? []
      list.push(track)
      tracksBySet.set(track.audio_set_id, list)
    }
  }

  const personalSetIds = new Set(setRows.filter((s) => s.variant === 'personal').map((s) => s.id))
  const viva: StoryAudioVersion[] = []
  const personal: StoryAudioVersion[] = []
  const mixes: StoryAudioVersion[] = []

  for (const set of setRows) {
    const tracks = tracksBySet.get(set.id) ?? []
    const isPersonal = set.variant === 'personal'
    const madeFromPersonal = set.voice_id === 'user_voice' || personalSetIds.has(set.metadata?.source_audio_set_id ?? '')
    const current = isPersonal || madeFromPersonal ? tracks : tracks.filter((t) => storyTextMatchesTrack(story.content, t.text_content))

    for (const track of current) {
      const duration = Number(track.duration_seconds) || 0
      if (isPersonal) {
        if (!track.audio_url) continue
        personal.push({ id: track.id, kind: 'personal', label: 'Your voice', sublabel: 'Personal recording', url: track.audio_url, duration, audioSetId: set.id })
      } else if (set.variant === 'standard') {
        if (!track.audio_url) continue
        viva.push({ id: track.id, kind: 'viva', label: `VIVA · ${storyVoiceName(set.voice_id)}`, sublabel: 'Voice only', url: track.audio_url, duration, audioSetId: set.id })
      } else {
        // Music mixes (custom-…, and the older sleep / meditation / energy sets).
        if (track.mix_status !== 'completed' || !track.mixed_audio_url) continue
        const type = mixTypeFor(set.variant, set.metadata?.voice_volume, set.metadata?.bg_volume ?? 1)
        const music = set.metadata?.background_track_name
        mixes.push({
          id: track.id,
          kind: 'mix',
          label: music ? `${MIX_LABEL[type]} · ${music}` : MIX_LABEL[type],
          sublabel: `${madeFromPersonal ? 'Your voice' : storyVoiceName(set.voice_id)} + music`,
          url: track.mixed_audio_url,
          duration,
          audioSetId: set.id,
        })
      }
    }
  }

  // A recording saved straight onto the story (older recordings, and the
  // link the recorder keeps) when no personal set already lists it.
  if (story.user_audio_url && !personal.some((v) => v.url === story.user_audio_url)) {
    personal.unshift({ id: 'user-recording', kind: 'personal', label: 'Your voice', sublabel: 'Personal recording', url: story.user_audio_url, duration: 0, audioSetId: null })
  }

  // The version the story points at plays first; then VIVA voices, the
  // member's own voice, and the mixes. No URL appears twice.
  const ordered = [...viva, ...personal, ...mixes].sort(
    (a, b) => Number(b.audioSetId === story.audio_set_id && b.kind !== 'mix') - Number(a.audioSetId === story.audio_set_id && a.kind !== 'mix'),
  )
  const seen = new Set<string>()
  return ordered.filter((v) => (seen.has(v.url) ? false : (seen.add(v.url), true)))
}
