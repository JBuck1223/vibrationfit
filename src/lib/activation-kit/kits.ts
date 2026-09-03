/**
 * Activation Kit presets — server-side helpers.
 *
 * A kit is a saved settings preset (activation_kits). Members can have several;
 * exactly one is the default. The first kit is seeded lazily from their most
 * recent Audio studio choices so the commit dialog opens with familiar settings.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { KitSettings } from './orchestrator'

export interface ActivationKitRow extends KitSettings {
  id: string
  user_id: string
  name: string
  is_default: boolean
  created_at: string
  updated_at: string
}

export const KIT_SETTINGS_FIELDS: Array<keyof KitSettings> = [
  'include_voice', 'include_mix', 'include_board', 'voice_id',
  'background_track_id', 'voice_volume', 'bg_volume',
  'binaural_track_id', 'binaural_volume', 'mix_output_format',
]

export function kitToSettings(kit: ActivationKitRow | Record<string, unknown>): KitSettings {
  return {
    include_voice: Boolean(kit.include_voice),
    include_mix: Boolean(kit.include_mix),
    include_board: Boolean(kit.include_board),
    voice_id: String(kit.voice_id || 'nova'),
    background_track_id: (kit.background_track_id as string | null) || null,
    voice_volume: Number(kit.voice_volume ?? 70),
    bg_volume: Number(kit.bg_volume ?? 30),
    binaural_track_id: (kit.binaural_track_id as string | null) || null,
    binaural_volume: Number(kit.binaural_volume ?? 0),
    mix_output_format: (kit.mix_output_format as KitSettings['mix_output_format']) || 'both',
  }
}

/**
 * List the member's kits; if they have none, seed a default from their most
 * recent Audio studio choices (voice + mix settings), falling back to sensible
 * defaults with the first curated background track.
 */
export async function getOrSeedKits(
  supabase: SupabaseClient,
  userId: string,
): Promise<ActivationKitRow[]> {
  const { data: kits } = await supabase
    .from('activation_kits')
    .select('*')
    .eq('user_id', userId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })

  if (kits && kits.length > 0) return kits as ActivationKitRow[]

  // Seed from the last audio generation batch (voice + custom-mix metadata)
  const { data: lastBatch } = await supabase
    .from('audio_generation_batches')
    .select('voice_id, metadata')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const meta = (lastBatch?.metadata || {}) as Record<string, unknown>

  let backgroundTrackId = (meta.background_track_id as string | null) || null
  if (!backgroundTrackId) {
    const { data: firstTrack } = await supabase
      .from('audio_background_tracks')
      .select('id')
      .eq('is_active', true)
      .not('category', 'in', '("binaural","solfeggio_binaural")')
      .order('sort_order', { ascending: true })
      .limit(1)
      .maybeSingle()
    backgroundTrackId = firstTrack?.id || null
  }

  const seed = {
    user_id: userId,
    name: 'My Activation Kit',
    is_default: true,
    include_voice: true,
    include_mix: true,
    include_board: true,
    voice_id: lastBatch?.voice_id || 'nova',
    background_track_id: backgroundTrackId,
    voice_volume: typeof meta.voice_volume === 'number' ? meta.voice_volume : 70,
    bg_volume: typeof meta.bg_volume === 'number' ? meta.bg_volume : 30,
    binaural_track_id: (meta.binaural_track_id as string | null) || null,
    binaural_volume: typeof meta.binaural_volume === 'number'
      ? Math.min(30, meta.binaural_volume as number)
      : 0,
    mix_output_format: 'both',
  }

  const { data: created, error } = await supabase
    .from('activation_kits')
    .insert(seed)
    .select('*')
    .single()
  if (error || !created) {
    console.error('[activation-kit] failed to seed default kit:', error)
    return []
  }
  return [created as ActivationKitRow]
}
