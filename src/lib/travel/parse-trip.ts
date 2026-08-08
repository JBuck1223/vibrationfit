// Server-side travel text parsing (shared by the paste-in import API route
// and the SES inbound webhook). Calls the model through the Vercel AI Gateway
// and normalizes the response into a ParsedTrip.

import { gatewayClient } from '@/lib/ai/gateway'
import {
  TRAVEL_PARSER_SYSTEM_PROMPT,
  buildTravelParserPrompt,
} from '@/lib/viva/prompts'
import type { ParsedTrip, ParsedTripFlight, TripDestination } from './types'

const DEFAULT_MODEL = 'gpt-4o'
const DEFAULT_TEMPERATURE = 0.2
const DEFAULT_MAX_TOKENS = 4096

export interface TravelParseOptions {
  modelName?: string
  temperature?: number
  maxTokens?: number
}

export interface TravelParseResult {
  parsed: ParsedTrip | null
  usage: {
    model: string
    totalTokens: number
    inputTokens: number
    outputTokens: number
    requestId?: string
  }
}

function normalizeDestinations(value: unknown): TripDestination[] {
  if (!Array.isArray(value)) return []
  return value
    .map((d) => ({
      name: typeof d?.name === 'string' ? d.name.trim() : '',
      countryCode:
        typeof d?.countryCode === 'string' && /^[A-Za-z]{2}$/.test(d.countryCode.trim())
          ? d.countryCode.trim().toUpperCase()
          : null,
    }))
    .filter((d) => d.name.length > 0)
}

function normalizeFlights(value: unknown): ParsedTripFlight[] {
  if (!Array.isArray(value)) return []
  return value
    .map((f) => ({
      airline: typeof f?.airline === 'string' ? f.airline.trim() || null : null,
      flightNumber: typeof f?.flightNumber === 'string' ? f.flightNumber.trim() || null : null,
      departAirport:
        typeof f?.departAirport === 'string' && /^[A-Za-z]{3}$/.test(f.departAirport.trim())
          ? f.departAirport.trim().toUpperCase()
          : null,
      arriveAirport:
        typeof f?.arriveAirport === 'string' && /^[A-Za-z]{3}$/.test(f.arriveAirport.trim())
          ? f.arriveAirport.trim().toUpperCase()
          : null,
      departAt: typeof f?.departAt === 'string' ? f.departAt.trim() || null : null,
    }))
    .filter((f) => f.airline || f.flightNumber || f.departAirport || f.arriveAirport)
}

function toDateOnly(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = value.match(/^\d{4}-\d{2}-\d{2}/)
  return match ? match[0] : null
}

export async function parseTravelText(
  text: string,
  options: TravelParseOptions = {}
): Promise<TravelParseResult> {
  const model = options.modelName || DEFAULT_MODEL

  const completion = await gatewayClient.chat.completions.create({
    model: `openai/${model}`,
    messages: [
      { role: 'system', content: TRAVEL_PARSER_SYSTEM_PROMPT },
      { role: 'user', content: buildTravelParserPrompt(text) },
    ],
    temperature: options.temperature ?? DEFAULT_TEMPERATURE,
    max_tokens: options.maxTokens ?? DEFAULT_MAX_TOKENS,
    response_format: { type: 'json_object' },
  })

  const usage = {
    model,
    totalTokens: completion.usage?.total_tokens || 0,
    inputTokens: completion.usage?.prompt_tokens || 0,
    outputTokens: completion.usage?.completion_tokens || 0,
    requestId: completion.id,
  }

  const responseText = completion.choices[0]?.message?.content || '{}'

  let raw: { trip?: unknown; flights?: unknown }
  try {
    const cleaned = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    raw = JSON.parse(cleaned)
  } catch {
    return { parsed: null, usage }
  }

  if (!raw?.trip || typeof raw.trip !== 'object') {
    return { parsed: null, usage }
  }

  const rawTrip = raw.trip as Record<string, unknown>
  const destinations = normalizeDestinations(rawTrip.destinations)
  const flights = normalizeFlights(raw.flights)
  const title = typeof rawTrip.title === 'string' ? rawTrip.title.trim() : ''

  if (!title && destinations.length === 0 && flights.length === 0) {
    return { parsed: null, usage }
  }

  const parsed: ParsedTrip = {
    title: title || destinations.map((d) => d.name).join(' & ') || 'Imported Trip',
    startDate: toDateOnly(rawTrip.startDate),
    endDate: toDateOnly(rawTrip.endDate),
    destinations,
    flights,
    notes: typeof rawTrip.notes === 'string' ? rawTrip.notes.trim() || null : null,
  }

  return { parsed, usage }
}
