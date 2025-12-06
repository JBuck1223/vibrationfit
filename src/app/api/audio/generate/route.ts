import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks, OpenAIVoice, VoiceId, hashContent } from '@/lib/services/audioService'
import { validateTokenBalance, getDefaultTokenEstimate } from '@/lib/tokens/tracking'

export const runtime = 'nodejs'
export const maxDuration = 300

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { visionId, sections, voice = 'alloy', format = 'mp3', force = false, variant, audioSetId, audioSetName, batchId } = body as {
      visionId: string
      sections: { sectionKey: string; text: string }[]
      voice?: VoiceId | string
      format?: 'mp3' | 'wav'
      force?: boolean
      variant?: string
      audioSetId?: string
      audioSetName?: string
      batchId?: string
    }

    console.log('🎤 [API] Received generation request')
    console.log('🎤 [API] Voice parameter:', voice)
    console.log('🎤 [API] Voice type:', typeof voice)
    console.log('🎤 [API] Is cloned voice:', typeof voice === 'string' && voice.startsWith('clone-'))
    console.log('🎤 [API] Variant:', variant || 'standard')

    if (!visionId || !Array.isArray(sections)) {
      return NextResponse.json({ error: 'visionId and sections are required' }, { status: 400 })
    }

    // Calculate total text length for token estimation
    const totalTextLength = sections.reduce((sum, section) => sum + (section.text?.length || 0), 0)
    // TTS: approximately 1 token per character
    const estimatedTokens = Math.max(100, totalTextLength)
    
    // Validate token balance
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)
    if (tokenValidation) {
      // Mark batch as failed if provided
      if (batchId) {
        await supabase
          .from('audio_generation_batches')
          .update({
            status: 'failed',
            error_message: tokenValidation.error,
            completed_at: new Date().toISOString()
          })
          .eq('id', batchId)
      }
      
      return NextResponse.json(
        { 
          error: tokenValidation.error,
          tokensRemaining: tokenValidation.tokensRemaining
        },
        { status: tokenValidation.status }
      )
    }

    // Mark batch as processing if provided
    if (batchId) {
      await supabase
        .from('audio_generation_batches')
        .update({
          status: 'processing',
          started_at: new Date().toISOString()
        })
        .eq('id', batchId)
    }

    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice,
      format,
      force,
      variant,
      audioSetId,
      audioSetName,
      batchId,
    })

    return NextResponse.json({ results, batchId })
  } catch (error) {
    console.error('Audio generation error:', error)
    
    // Mark batch as failed if provided
    const body = await request.json().catch(() => ({}))
    if (body.batchId) {
      const supabase = await createClient()
      await Promise.resolve(
        supabase
          .from('audio_generation_batches')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString()
          })
          .eq('id', body.batchId)
      )
        .then(() => {})
        .catch(() => {})
    }
    
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


