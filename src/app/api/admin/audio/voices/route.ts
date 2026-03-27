export const runtime = 'nodejs'

import { NextRequest, NextResponse } from 'next/server'

interface ElevenLabsVoice {
  voice_id: string
  name: string
  category?: string
  labels?: Record<string, string>
  preview_url?: string
  description?: string
}

interface ElevenLabsV2Response {
  voices: ElevenLabsVoice[]
  has_more: boolean
  next_page_token?: string
  total_count?: number
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const voiceType = searchParams.get('type') || 'default'
  const pageSize = searchParams.get('pageSize') || '50'
  const pageToken = searchParams.get('pageToken') || ''

  const apiKey = process.env.ELEVENLABS_API_KEY
  if (!apiKey) {
    return NextResponse.json(
      { error: 'ELEVENLABS_API_KEY not configured' },
      { status: 500 }
    )
  }

  try {
    const params = new URLSearchParams({
      page_size: pageSize,
      include_total_count: 'true',
    })

    if (search) params.set('search', search)
    if (voiceType) params.set('voice_type', voiceType)
    if (pageToken) params.set('next_page_token', pageToken)

    const res = await fetch(
      `https://api.elevenlabs.io/v2/voices?${params.toString()}`,
      {
        headers: { 'xi-api-key': apiKey },
      }
    )

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      throw new Error(`ElevenLabs API: ${res.status} ${errText}`)
    }

    const data: ElevenLabsV2Response = await res.json()

    const voices = data.voices.map((v) => ({
      id: v.voice_id,
      name: v.name,
      gender: v.labels?.gender || 'Unknown',
      accent: v.labels?.accent || '',
      age: v.labels?.age || '',
      description: v.labels?.description || v.description || '',
      useCase: v.labels?.['use case'] || v.labels?.use_case || '',
      category: v.category || '',
      previewUrl: v.preview_url || null,
    }))

    return NextResponse.json({
      voices,
      hasMore: data.has_more,
      nextPageToken: data.next_page_token || null,
      totalCount: data.total_count ?? voices.length,
    })
  } catch (error: any) {
    console.error('[ElevenLabs Voices]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to fetch voices' },
      { status: 500 }
    )
  }
}
