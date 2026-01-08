import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateFullVoiceTrack } from '@/lib/services/audioService'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { audioSetId, visionId, userId, voiceId } = await request.json()

    if (!audioSetId || !visionId || !userId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user || user.id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get voice ID from the audio set if not provided
    let finalVoiceId = voiceId
    if (!finalVoiceId) {
      const { data: audioSet } = await supabase
        .from('audio_sets')
        .select('voice_id')
        .eq('id', audioSetId)
        .single()
      
      finalVoiceId = audioSet?.voice_id || 'alloy'
    }

    // Call the service function
    const result = await generateFullVoiceTrack(userId, visionId, audioSetId, finalVoiceId)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate full voice track' },
        { status: 500 }
      )
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ [FULL VOICE] Error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate full voice track' },
      { status: 500 }
    )
  }
}

