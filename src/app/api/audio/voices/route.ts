export const runtime = 'nodejs'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIVoices, synthesizePreview, getOrCreateVoiceReference } from '@/lib/services/audioService'

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const previewVoice = searchParams.get('preview') as any
    if (previewVoice) {
      const { url } = await getOrCreateVoiceReference(previewVoice)
      return NextResponse.json({ url })
    }

    const voices = getOpenAIVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load voices' }, { status: 500 })
  }
}


