// Shared types for the Travel Tracker feature.

export type TripStatus = 'past' | 'upcoming' | 'draft_import'
export type TripSource = 'manual' | 'email' | 'migrated'

export interface TripDestination {
  name: string
  /** ISO 3166-1 alpha-2 country code, e.g. "FR" */
  countryCode?: string | null
  lat?: number | null
  lng?: number | null
}

export interface TripFlight {
  id: string
  trip_id: string
  airline: string | null
  flight_number: string | null
  depart_airport: string | null
  arrive_airport: string | null
  depart_at: string | null
  arrive_at: string | null
  distance_miles: number | null
  created_at: string
}

export interface TravelAttachment {
  id: string
  trip_id: string | null
  dream_destination_id: string | null
  file_name: string
  file_url: string
  file_type: string | null
  file_size: number | null
  uploaded_by: string | null
  created_at: string
}

export interface TravelReferenceLink {
  id: string
  trip_id: string | null
  dream_destination_id: string | null
  url: string
  title: string | null
  created_by: string | null
  created_at: string
}

export interface Trip {
  id: string
  user_id: string
  title: string
  status: TripStatus
  start_date: string | null
  end_date: string | null
  year: number | null
  duration_text: string | null
  destinations: TripDestination[]
  trip_type: string | null
  story: string | null
  cover_image_url: string | null
  source: TripSource
  import_meta: Record<string, unknown> | null
  household_id: string | null
  created_at: string
  updated_at: string
  // Enriched by API responses
  flights?: TripFlight[]
  attachments?: TravelAttachment[]
  reference_links?: TravelReferenceLink[]
  isMine?: boolean
  member?: {
    userId: string
    displayName: string
    avatarUrl?: string | null
    isSelf: boolean
  } | null
}

export interface DreamDestination {
  id: string
  user_id: string
  name: string
  country_code: string | null
  notes: string | null
  priority: number
  cover_image_url: string | null
  actualized_trip_id: string | null
  household_id: string | null
  created_at: string
  updated_at: string
  attachments?: TravelAttachment[]
  reference_links?: TravelReferenceLink[]
  isMine?: boolean
}

export interface ParsedTripFlight {
  airline?: string | null
  flightNumber?: string | null
  departAirport?: string | null
  arriveAirport?: string | null
  departAt?: string | null
  arriveAt?: string | null
}

/** Structured result of the VIVA travel email/itinerary parser. */
export interface ParsedTrip {
  title: string
  startDate?: string | null
  endDate?: string | null
  destinations: TripDestination[]
  flights: ParsedTripFlight[]
  notes?: string | null
}

export interface TravelStats {
  tripCount: number
  upcomingCount: number
  countryCount: number
  countryCodes: string[]
  destinationCount: number
  milesFlown: number
  flightCount: number
  tripsPerYear: { year: number; count: number }[]
  topDestinations: { name: string; count: number }[]
}
