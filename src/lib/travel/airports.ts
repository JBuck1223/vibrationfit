// IATA airport lookup + great-circle distance (server-side use).
//
// airports-data.json is generated from the OpenFlights public dataset:
// { "ATL": [lat, lng, "City", "Country"], ... } (~6k airports with IATA codes)

import airportsData from './airports-data.json'

type AirportTuple = [number, number, string, string]

const AIRPORTS = airportsData as unknown as Record<string, AirportTuple>

export interface AirportInfo {
  iata: string
  lat: number
  lng: number
  city: string
  country: string
}

export function getAirport(iata: string | null | undefined): AirportInfo | null {
  if (!iata) return null
  const code = iata.trim().toUpperCase()
  const entry = AIRPORTS[code]
  if (!entry) return null
  return { iata: code, lat: entry[0], lng: entry[1], city: entry[2], country: entry[3] }
}

const EARTH_RADIUS_MILES = 3958.8

export function haversineMiles(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(a))
}

/** Great-circle distance between two IATA airports, or null if either is unknown. */
export function flightDistanceMiles(
  departIata: string | null | undefined,
  arriveIata: string | null | undefined
): number | null {
  const from = getAirport(departIata)
  const to = getAirport(arriveIata)
  if (!from || !to) return null
  return Math.round(haversineMiles(from.lat, from.lng, to.lat, to.lng) * 10) / 10
}
