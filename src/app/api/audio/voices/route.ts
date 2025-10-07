export const runtime = 'nodejs'
export const maxDuration = 60
import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIVoices, synthesizePreview } from '@/lib/services/audioService'

export async function GET(_request: NextRequest) {
  try {
    const { searchParams } = new URL(_request.url)
    const previewVoice = searchParams.get('preview') as any
    if (previewVoice) {
      const buffer = await synthesizePreview(previewVoice)
      return new NextResponse(Buffer.from(buffer), {
        status: 200,
        headers: {
          'Content-Type': 'audio/mpeg',
          'Cache-Control': 'public, max-age=86400'
        }
      })
    }

    const voices = getOpenAIVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load voices' }, { status: 500 })
  }
}


