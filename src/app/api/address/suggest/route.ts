import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import type { AddressSuggestion } from '@/lib/address/suggest'

type CensusComponents = {
  zip?: string
  streetName?: string
  preType?: string
  city?: string
  preDirection?: string
  suffixDirection?: string
  fromAddress?: string
  state?: string
  suffixType?: string
  toAddress?: string
}

type CensusMatch = {
  matchedAddress?: string
  addressComponents?: CensusComponents
}

function pretty(value: string) {
  return value.toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase())
}

function houseNumber(components: CensusComponents, query: string) {
  const typed = query.match(/^\s*(\d+)/)?.[1]
  const from = Number(components.fromAddress)
  const to = Number(components.toAddress)
  const typedNumber = typed ? Number(typed) : NaN
  if (
    typed &&
    Number.isFinite(typedNumber) &&
    Number.isFinite(from) &&
    Number.isFinite(to) &&
    typedNumber >= from &&
    typedNumber <= to
  ) {
    return typed
  }
  return components.fromAddress || typed || ''
}

function toSuggestion(match: CensusMatch, query: string): AddressSuggestion | null {
  const components = match.addressComponents
  if (!components?.streetName) return null
  const street = [
    components.preDirection,
    components.preType,
    components.streetName,
    components.suffixType,
    components.suffixDirection,
  ]
    .filter(Boolean)
    .join(' ')
  const line1 = pretty([houseNumber(components, query), street].filter(Boolean).join(' '))
  if (!line1) return null
  const city = components.city ? pretty(components.city) : ''
  const state = (components.state || '').toUpperCase()
  const postalCode = components.zip || ''
  const label = [line1, city, state, postalCode].filter(Boolean).join(', ')
  return { label, line1, city, state, postalCode, country: 'United States' }
}

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const q = request.nextUrl.searchParams.get('q')?.trim() || ''
  if (q.length < 8 || !/\d/.test(q)) return NextResponse.json({ suggestions: [] })

  const url = new URL('https://geocoding.geo.census.gov/geocoder/locations/onelineaddress')
  url.searchParams.set('address', q)
  url.searchParams.set('benchmark', '4')
  url.searchParams.set('format', 'json')

  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': 'VibrationFit/1.0 (shipping address)' },
      signal: AbortSignal.timeout(6000),
    })
    if (!response.ok) return NextResponse.json({ suggestions: [] })
    const body = (await response.json()) as { result?: { addressMatches?: CensusMatch[] } }
    const seen = new Set<string>()
    const suggestions: AddressSuggestion[] = []
    for (const match of body.result?.addressMatches || []) {
      const suggestion = toSuggestion(match, q)
      if (!suggestion || seen.has(suggestion.label)) continue
      seen.add(suggestion.label)
      suggestions.push(suggestion)
      if (suggestions.length >= 5) break
    }
    return NextResponse.json({ suggestions })
  } catch {
    return NextResponse.json({ suggestions: [] })
  }
}
