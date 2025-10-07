import { NextRequest, NextResponse } from 'next/server'
import { getOpenAIVoices } from '@/lib/services/audioService'

export async function GET(_request: NextRequest) {
  try {
    const voices = getOpenAIVoices()
    return NextResponse.json({ voices })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to load voices' }, { status: 500 })
  }
}


