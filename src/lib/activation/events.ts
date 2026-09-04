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
  'activation_oriented',
  'activation_resume_email_sent',
  'activation_resumed',
  'activation_intake_ready',
  'activation_generate_failed',
  'activation_ready',
  'activation_opened',
  'activation_entered',
  'activation_enriched',
  'inspired_step_saved',
  'story_viewed',
  'audio_played',
  'song_played',
  'assets_downloaded',
  'offer_video_viewed',
  'paid_offer_clicked',
  'converted_to_paid',
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
    activation_id: params.activationId || null,
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

/** Paid conversion attributed to the member's latest Activation, once. */
export async function recordActivationPaidConversion(
  supabase: SupabaseClient,
  params: {
    userId: string
    visitorId?: string | null
    sessionId?: string | null
    eventData?: Record<string, unknown>
  },
): Promise<void> {
  const { data: activation } = await supabase
    .from('activations')
    .select('id')
    .eq('user_id', params.userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!activation?.id) return

  const { data: existing } = await supabase
    .from('journey_events')
    .select('id')
    .eq('event_type', 'converted_to_paid')
    .eq('activation_id', activation.id)
    .limit(1)
    .maybeSingle()
  if (existing) return

  await recordActivationEvent(supabase, {
    eventType: 'converted_to_paid',
    activationId: activation.id,
    userId: params.userId,
    visitorId: params.visitorId,
    sessionId: params.sessionId,
    eventData: { signup_source: 'activation', ...(params.eventData || {}) },
  })
}
