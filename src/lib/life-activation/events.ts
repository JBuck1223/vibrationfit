import type { SupabaseClient } from '@supabase/supabase-js'
import type { LifeActivationEventType } from './types'

export async function recordLifeActivationEvent(
  supabase: SupabaseClient,
  params: {
    eventType: LifeActivationEventType
    userId: string
    eventData?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await supabase.from('journey_events').insert({
    event_type: params.eventType,
    user_id: params.userId,
    event_data: params.eventData || {},
  })
  if (error) {
    console.error('[life-activation/events] failed to record', params.eventType, error.message)
  }
}
