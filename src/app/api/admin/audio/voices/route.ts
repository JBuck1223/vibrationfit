export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

// ── Types ───────────────────────────────────────────────────────────────────

interface NormalizedVoice {
  id: string
  name: string
  gender: string
  accent: string
  age: string
  description: string
  useCase: string
  category: string
  previewUrl: string | null
}

// ── Account voices (v2 API) ─────────────────────────────────────────────────

async function fetchAccountVoices(
  apiKey: string,
  search: string,
  pageSize: number,
  pageToken?: string
) {
  const params = new URLSearchParams({
    page_size: String(pageSize),
    include_total_count: 'true',
    voice_type: 'default',
  })
  if (search) params.set('search', search)
  if (pageToken) params.set('next_page_token', pageToken)

  const res = await fetch(
    `https://api.elevenlabs.io/v2/voices?${params.toString()}`,
    { headers: { 'xi-api-key': apiKey } }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`ElevenLabs v2 API: ${res.status} ${errText}`)
  }

  const data = await res.json()

  const voices: NormalizedVoice[] = (data.voices || []).map((v: any) => ({
    id: v.voice_id,
    name: v.name,
    gender: v.labels?.gender || 'Unknown',
    accent: v.labels?.accent || '',
    age: v.labels?.age || '',
    description: v.labels?.description || v.description || '',
    useCase: v.labels?.['use case'] || v.labels?.use_case || '',
    category: v.category || 'premade',
    previewUrl: v.preview_url || null,
  }))

  return {
    voices,
    hasMore: data.has_more ?? false,
    nextPageToken: data.next_page_token || null,
    totalCount: data.total_count ?? voices.length,
  }
}

// ── Community / shared voices (v1 shared-voices API) ────────────────────────

async function fetchCommunityVoices(
  apiKey: string,
  search: string,
  pageSize: number,
  pageToken?: string
) {
  const params = new URLSearchParams({
    page_size: String(pageSize),
  })
  if (search) params.set('search', search)
  if (pageToken) params.set('page', pageToken)

  const res = await fetch(
    `https://api.elevenlabs.io/v1/shared-voices?${params.toString()}`,
    { headers: { 'xi-api-key': apiKey } }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`ElevenLabs shared-voices API: ${res.status} ${errText}`)
  }

  const data = await res.json()

  const capitalize = (s: string) => s ? s.charAt(0).toUpperCase() + s.slice(1).toLowerCase() : 'Unknown'

  const voices: NormalizedVoice[] = (data.voices || []).map((v: any) => ({
    id: v.voice_id,
    name: v.name,
    gender: capitalize(v.gender),
    accent: v.accent || '',
    age: v.age?.replace(/_/g, ' ') || '',
    description: v.descriptive || v.description || '',
    useCase: v.use_case?.replace(/_/g, ' ') || '',
    category: v.category || 'community',
    previewUrl: v.preview_url || null,
  }))

  return {
    voices,
    hasMore: data.has_more ?? false,
    nextPageToken: data.last_sort_id || null,
    totalCount: voices.length,
  }
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const voiceType = searchParams.get('type') || 'default'
  const pageSize = parseInt(searchParams.get('pageSize') || '30', 10)
  const pageToken = searchParams.get('pageToken') || undefined

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    const result =
      voiceType === 'community'
        ? await fetchCommunityVoices(apiKey, search, pageSize, pageToken)
        : await fetchAccountVoices(apiKey, search, pageSize, pageToken)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[ElevenLabs Voices]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
