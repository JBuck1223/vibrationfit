export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { audioUrl, voiceName } = await request.json()

    if (!audioUrl || !voiceName) {
      return NextResponse.json({ error: 'Missing audioUrl or voiceName' }, { status: 400 })
    }

    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'ElevenLabs API not configured' }, { status: 500 })
    }

    // Download audio from S3
    console.log('[Voice Clone] Downloading audio from:', audioUrl)
    const audioResponse = await fetch(audioUrl)
    if (!audioResponse.ok) {
      throw new Error('Failed to download audio from S3')
    }
    
    const audioBlob = await audioResponse.blob()
    console.log('[Voice Clone] Downloaded audio:', audioBlob.size, 'bytes')

    // Create FormData for ElevenLabs
    const formData = new FormData()
    formData.append('name', `${user.id}-${voiceName}`)
    formData.append('description', `Custom voice clone for ${voiceName}`)
    formData.append('files', audioBlob, 'voice-sample.mp3')

    console.log('[Voice Clone] Sending to ElevenLabs...')

    // Send to ElevenLabs voice cloning API
    const elevenLabsResponse = await fetch('https://api.elevenlabs.io/v1/voices/add', {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
      },
      body: formData
    })

    if (!elevenLabsResponse.ok) {
      const errorText = await elevenLabsResponse.text()
      console.error('[Voice Clone] ElevenLabs error:', errorText)
      return NextResponse.json({ 
        error: `ElevenLabs API error: ${elevenLabsResponse.status}`,
        details: errorText 
      }, { status: 500 })
    }

    const result = await elevenLabsResponse.json()
    console.log('[Voice Clone] Success! Voice ID:', result.voice_id)

    return NextResponse.json({
      voiceId: result.voice_id,
      voiceName: voiceName
    })

  } catch (error: any) {
    console.error('[Voice Clone] Error:', error)
    return NextResponse.json({ 
      error: 'Voice cloning failed',
      details: error.message 
    }, { status: 500 })
  }
}








