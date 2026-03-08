import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks, OpenAIVoice, VoiceId, hashContent } from '@/lib/services/audioService'
import { validateTokenBalance, getDefaultTokenEstimate } from '@/lib/tokens/tracking'

export const runtime = 'nodejs'
// Full batch (e.g. 12–14 tracks) runs in one request; ~30–60s per track → need 800s on Pro
export const maxDuration = 800

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

    console.log('[API] Received generation request:', { visionId, voice, variant: variant || 'standard', sectionCount: sections.length })

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

    // Resolve the audioSetId: either from the request body or from the batch record
    // (generateAudioTracks creates/finds an audio set and writes it to the batch)
    let resolvedAudioSetId = audioSetId
    if (!resolvedAudioSetId && batchId) {
      const { data: batchForSetId } = await supabase
        .from('audio_generation_batches')
        .select('audio_set_ids')
        .eq('id', batchId)
        .single()
      
      resolvedAudioSetId = batchForSetId?.audio_set_ids?.[0]
      if (resolvedAudioSetId) {
        console.log('[FULL VOICE] Resolved audioSetId from batch:', resolvedAudioSetId)
      }
    }

    // Trigger full voice generation for voice-only (standard) variant
    if ((variant === 'standard' || !variant) && results.length === sections.length && resolvedAudioSetId) {
      const allSucceeded = results.every(r => r.status === 'generated' || r.status === 'skipped')
      
      if (allSucceeded && batchId) {
        const { data: batchData } = await supabase
          .from('audio_generation_batches')
          .select('metadata')
          .eq('id', batchId)
          .single()
        
        const outputFormat = batchData?.metadata?.output_format || 'both'
        const shouldGenerateFull = outputFormat === 'combined' || outputFormat === 'both'
        const hasMultipleSections = sections.length > 1
        
        if (shouldGenerateFull && hasMultipleSections) {
          console.log('[FULL VOICE] All voice-only tracks complete, triggering full voice generation...')
          console.log('[FULL VOICE] Output format:', outputFormat, '| Sections:', sections.length)
          
          const { generateFullVoiceTrack } = await import('@/lib/services/audioService')
          
          generateFullVoiceTrack(
            user.id,
            visionId,
            resolvedAudioSetId,
            voice as string
          ).then((result) => {
            if (result.success) {
              console.log('[FULL VOICE] Full voice generation complete:', result.trackId)
            } else {
              console.error('[FULL VOICE] Full voice generation failed:', result.error)
            }
          }).catch(err => {
            console.error('[FULL VOICE] Full voice generation error:', err)
          })
        } else if (!hasMultipleSections) {
          console.log('[FULL VOICE] Skipping full track - only 1 section (individual = combined)')
        } else {
          console.log('[FULL VOICE] Skipping full track - output_format is "individual"')
        }
      } else if (allSucceeded && !batchId) {
        console.log('[FULL VOICE] Legacy generation (no batchId), generating full track...')
        
        const { generateFullVoiceTrack } = await import('@/lib/services/audioService')
        
        generateFullVoiceTrack(
          user.id,
          visionId,
          resolvedAudioSetId,
          voice as string
        ).then((result) => {
          if (result.success) {
            console.log('[FULL VOICE] Full voice generation complete:', result.trackId)
          } else {
            console.error('[FULL VOICE] Full voice generation failed:', result.error)
          }
        }).catch(err => {
          console.error('[FULL VOICE] Full voice generation error:', err)
        })
      }
    }

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


