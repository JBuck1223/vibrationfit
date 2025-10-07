import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks, OpenAIVoice, hashContent } from '@/lib/services/audioService'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { visionId, sections, voice = 'alloy', format = 'mp3' } = body as {
      visionId: string
      sections: { sectionKey: string; text: string }[]
      voice?: OpenAIVoice
      format?: 'mp3' | 'wav'
    }

    if (!visionId || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'visionId and sections are required' }, { status: 400 })
    }

    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice,
      format,
    })

    return NextResponse.json({ results })
  } catch (error) {
    console.error('Audio generation error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Generation failed' }, { status: 500 })
  }
}

// Simple status endpoint via GET ?visionId=... returns track statuses
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const visionId = searchParams.get('visionId')
    if (!visionId) return NextResponse.json({ error: 'visionId is required' }, { status: 400 })

    const { data, error } = await supabase
      .from('audio_tracks')
      .select('id, section_key, status, audio_url, error_message, created_at, updated_at, content_hash, voice_id')
      .eq('user_id', user.id)
      .eq('vision_id', visionId)
      .order('updated_at', { ascending: false })

    if (error) throw error

    return NextResponse.json({ tracks: data })
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Status failed' }, { status: 500 })
  }
}


