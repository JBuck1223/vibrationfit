// Activation funnel instrumentation.
//
// Every step of the Activation experience records a journey_events row so the
// funnel (started → current state → dream → category → ready → entered →
// enriched → paid click) can be measured end to end. Client components call
// POST /api/activation/track; server routes call recordActivationEvent
// directly with an admin client.

import type { SupabaseClient } from '@supabase/supabase-js'

export const ACTIVATION_EVENT_TYPES = [
  'activation_started',
  'current_state_completed',
  'dream_layer_completed',
  'category_confirmed',
  'activation_ready',
  'activation_opened',
  'activation_entered',
  'activation_enriched',
  'inspired_step_saved',
  'story_viewed',
  'audio_played',
  'song_played',
  'assets_downloaded',
  'paid_offer_clicked',
] as const

export type ActivationEventType = (typeof ACTIVATION_EVENT_TYPES)[number]

export async function recordActivationEvent(
  supabase: SupabaseClient,
  params: {
    eventType: ActivationEventType
    activationId?: string | null
    userId?: string | null
    leadId?: string | null
    visitorId?: string | null
    sessionId?: string | null
    eventData?: Record<string, unknown>
  },
): Promise<void> {
  const { error } = await supabase.from('journey_events').insert({
    event_type: params.eventType,
    user_id: params.userId || null,
    lead_id: params.leadId || null,
    visitor_id: params.visitorId || null,
    session_id: params.sessionId || null,
    event_data: {
      ...(params.eventData || {}),
      ...(params.activationId ? { activation_id: params.activationId } : {}),
    },
  })
  if (error) {
    // Instrumentation must never break the funnel
    console.error('[activation/events] failed to record', params.eventType, error.message)
  }
}
