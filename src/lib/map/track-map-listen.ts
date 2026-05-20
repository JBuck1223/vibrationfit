'use client'

import type { MapAudioActivityType } from '@/lib/map/track-activation'
import {
  MAP_ACTIVATION_AREAS,
  mapActivationAreaForActivity,
  recordMapAreaActivation,
} from '@/lib/map/track-activation'
import { autoVerifyClient } from '@/lib/map/auto-verify-client'

/**
 * After ~5s of listening: increment play count, record area activation, verify MAP.
 */
export async function trackMapAudioListen(
  trackId: string,
  activityType: MapAudioActivityType,
): Promise<void> {
  try {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const {
      data: { session },
    } = await supabase.auth.getSession()
    const user = session?.user
    if (!user) return

    await supabase.rpc('increment_audio_play', { p_track_id: trackId })

    const area = mapActivationAreaForActivity(activityType)
    if (area) {
      await recordMapAreaActivation(supabase, user.id, area)
    }

    await autoVerifyClient({ activityType })
  } catch (error) {
    console.error('Failed to track MAP audio listen:', error)
  }
}

export { MAP_ACTIVATION_AREAS }
