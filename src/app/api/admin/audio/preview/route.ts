export const runtime = 'nodejs'
export const maxDuration = 60

import { NextRequest, NextResponse } from 'next/server'
import { experimental_generateSpeech as generateSpeech } from 'ai'
import { elevenlabs } from '@ai-sdk/elevenlabs'

// ── OpenAI TTS (direct REST, same pattern as audioService) ──────────────────

async function synthesizeOpenAI(text: string, voice: string): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const res = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      format: 'mp3',
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`OpenAI TTS failed: ${res.status} ${errText}`)
  }

  return Buffer.from(await res.arrayBuffer())
}

// ── Google Cloud TTS (REST with API key) ────────────────────────────────────

async function synthesizeGoogle(
  text: string,
  voice: string,
  speakingRate: number = 1.0
): Promise<Buffer> {
  const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY
  if (!apiKey) throw new Error('Add GOOGLE_CLOUD_TTS_API_KEY to .env.local — get one at console.cloud.google.com/apis/credentials (enable Cloud Text-to-Speech API first)')

  const res = await fetch(
    `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        input: { text },
        voice: {
          languageCode: 'en-US',
          name: `en-US-Chirp3-HD-${voice}`,
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
        },
      }),
    }
  )

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`Google TTS failed: ${res.status} ${errText}`)
  }

  const data = await res.json()
  return Buffer.from(data.audioContent, 'base64')
}

// ── ElevenLabs TTS (via Vercel AI SDK) ──────────────────────────────────────

async function synthesizeElevenLabs(
  text: string,
  voice: string,
  stability: number = 0.5,
  similarityBoost: number = 0.75
): Promise<Buffer> {
  if (!process.env.ELEVENLABS_API_KEY) {
    throw new Error('Add ELEVENLABS_API_KEY to .env.local — get one at elevenlabs.io/app/settings/api-keys')
  }

  const { audio } = await generateSpeech({
    model: elevenlabs.speech('eleven_multilingual_v2') as unknown as Parameters<typeof generateSpeech>[0]['model'],
    text,
    voice,
    providerOptions: {
      elevenlabs: {
        stability,
        similarity_boost: similarityBoost,
      },
    },
  })

  return Buffer.from(audio.uint8Array)
}

// ── Route handler ───────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      provider,
      voice,
      text,
      speakingRate,
      stability,
      similarityBoost,
    } = body

    if (!provider || !voice || !text) {
      return NextResponse.json(
        { error: 'Missing required fields: provider, voice, text' },
        { status: 400 }
      )
    }

    if (text.length > 1000) {
      return NextResponse.json(
        { error: 'Preview text limited to 1000 characters' },
        { status: 400 }
      )
    }

    let audioBuffer: Buffer

    switch (provider) {
      case 'openai':
        audioBuffer = await synthesizeOpenAI(text, voice)
        break
      case 'google':
        audioBuffer = await synthesizeGoogle(text, voice, speakingRate ?? 1.0)
        break
      case 'elevenlabs':
        audioBuffer = await synthesizeElevenLabs(
          text,
          voice,
          stability ?? 0.5,
          similarityBoost ?? 0.75
        )
        break
      default:
        return NextResponse.json(
          { error: `Unknown provider: ${provider}` },
          { status: 400 }
        )
    }

    return new NextResponse(new Uint8Array(audioBuffer), {
      headers: {
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(audioBuffer.length),
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: any) {
    console.error('[Audio Preview]', error)
    return NextResponse.json(
      { error: error.message || 'Failed to generate preview' },
      { status: 500 }
    )
  }
}
