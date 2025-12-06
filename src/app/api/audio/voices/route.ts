export const runtime = 'nodejs'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIVoices } from '@/lib/services/audioService'

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const previewVoice = searchParams.get('preview') as any
    if (previewVoice) {
      // OpenAI voice previews are pre-generated and served from S3
      const voiceSamples = {
        'alloy': 'https://media.vibrationfit.com/site-assets/voice-previews/alloy-v1759856713602.mp3',
        'ash': 'https://media.vibrationfit.com/site-assets/voice-previews/ash-v1759856717540.mp3',
        'coral': 'https://media.vibrationfit.com/site-assets/voice-previews/coral-v1759856721577.mp3',
        'echo': 'https://media.vibrationfit.com/site-assets/voice-previews/echo-v1759856727354.mp3',
        'fable': 'https://media.vibrationfit.com/site-assets/voice-previews/fable-v1759856734156.mp3',
        'onyx': 'https://media.vibrationfit.com/site-assets/voice-previews/onyx-v1759856739405.mp3',
        'nova': 'https://media.vibrationfit.com/site-assets/voice-previews/nova-v1759856746503.mp3',
        'sage': 'https://media.vibrationfit.com/site-assets/voice-previews/sage-v1759856752077.mp3',
        'shimmer': 'https://media.vibrationfit.com/site-assets/voice-previews/shimmer-v1759856756423.mp3',
      }
      
      const url = voiceSamples[previewVoice as keyof typeof voiceSamples] || voiceSamples['alloy']
      return NextResponse.json({ url })
    }

    const voices = getOpenAIVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load voices' }, { status: 500 })
  }
}


