// Forward-to-address travel import.
//
// When a member forwards a travel confirmation email to the trips address,
// the SES inbound webhook routes it here: match the sender to a member,
// let VIVA parse the itinerary, and create a draft trip (status
// 'draft_import') for review on the Travel Tracker dashboard.

import { createAdminClient } from '@/lib/supabase/admin'
import { trackTokenUsage } from '@/lib/tokens/tracking'
import { flightDistanceMiles } from './airports'
import { parseTravelText } from './parse-trip'

export const TRAVEL_INBOUND_ADDRESSES = [
  'trips@vibrationfit.com',
  'trips@inbound.vibrationfit.com',
]

/** True when any recipient is the travel import address. */
export function isTravelInboundRecipient(recipients: string[]): boolean {
  return recipients.some((r) => TRAVEL_INBOUND_ADDRESSES.includes(r.trim().toLowerCase()))
}

export interface TravelImportEmail {
  fromEmail: string
  subject: string
  bodyText: string
  messageId: string | null
  receivedAt: string
}

export interface TravelImportResult {
  status: 'created' | 'duplicate' | 'no_user' | 'no_trip_found'
  tripId?: string
}

export async function handleTravelImportEmail(
  email: TravelImportEmail
): Promise<TravelImportResult> {
  const supabase = createAdminClient()

  // Only registered members can import trips by email (sender must match
  // their account email).
  const { data: profile } = await supabase
    .from('user_profiles')
    .select('user_id')
    .ilike('email', email.fromEmail)
    .limit(1)
    .single()

  if (!profile?.user_id) {
    console.log(`[Travel Import] No member found for sender ${email.fromEmail}`)
    return { status: 'no_user' }
  }
  const userId = profile.user_id as string

  // Dedupe: the same forwarded email should not create two drafts.
  if (email.messageId) {
    const { data: existing } = await supabase
      .from('trips')
      .select('id')
      .eq('user_id', userId)
      .eq('import_meta->>messageId', email.messageId)
      .maybeSingle()
    if (existing) {
      console.log(`[Travel Import] Duplicate skipped: ${email.messageId}`)
      return { status: 'duplicate', tripId: existing.id }
    }
  }

  const text = `Subject: ${email.subject}\n\n${email.bodyText}`
  const { parsed, usage } = await parseTravelText(text)

  await trackTokenUsage({
    user_id: userId,
    action_type: 'travel_parse',
    model_used: usage.model,
    tokens_used: usage.totalTokens,
    input_tokens: usage.inputTokens,
    output_tokens: usage.outputTokens,
    provider: 'vercel_gateway',
    provider_request_id: usage.requestId,
    success: true,
    metadata: { source: 'email_forward', found_trip: !!parsed },
  }, supabase)

  if (!parsed) {
    console.log(`[Travel Import] No travel details found in email from ${email.fromEmail}`)
    return { status: 'no_trip_found' }
  }

  const { data: trip, error: tripError } = await supabase
    .from('trips')
    .insert({
      user_id: userId,
      title: parsed.title,
      status: 'draft_import',
      start_date: parsed.startDate,
      end_date: parsed.endDate,
      destinations: parsed.destinations,
      story: parsed.notes,
      source: 'email',
      import_meta: {
        fromAddress: email.fromEmail,
        subject: email.subject,
        receivedAt: email.receivedAt,
        messageId: email.messageId,
      },
    })
    .select('id')
    .single()

  if (tripError || !trip) {
    console.error('[Travel Import] Trip insert error:', tripError)
    throw new Error('Failed to create draft trip')
  }

  if (parsed.flights.length > 0) {
    const rows = parsed.flights.map((f) => ({
      trip_id: trip.id,
      airline: f.airline,
      flight_number: f.flightNumber,
      depart_airport: f.departAirport,
      arrive_airport: f.arriveAirport,
      depart_at: f.departAt
        ? (f.departAt.length === 10 ? `${f.departAt}T12:00:00Z` : f.departAt)
        : null,
      distance_miles: flightDistanceMiles(f.departAirport, f.arriveAirport),
    }))
    const { error: flightError } = await supabase.from('trip_flights').insert(rows)
    if (flightError) {
      console.error('[Travel Import] Flight insert error:', flightError)
    }
  }

  console.log(
    `[Travel Import] Draft trip "${parsed.title}" created for user ${userId} (${parsed.flights.length} flights)`
  )
  return { status: 'created', tripId: trip.id }
}
