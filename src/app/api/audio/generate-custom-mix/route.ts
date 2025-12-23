import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const { visionId, sections, voice, batchId, backgroundTrackUrl, voiceVolume, bgVolume } = await request.json()

    if (!visionId || !sections || !voice || !batchId || !backgroundTrackUrl) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    console.log('🎵 [CUSTOM MIX] Starting custom mix generation:', {
      visionId,
      voice,
      batchId,
      backgroundTrackUrl,
      voiceVolume,
      bgVolume,
      sectionCount: sections.length
    })

    // Update batch status to processing
    await supabase
      .from('audio_generation_batches')
      .update({ status: 'processing' })
      .eq('id', batchId)

    // Generate voice-only tracks first (or reuse existing ones)
    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice,
      format: 'mp3',
      variant: 'custom',
      batchId,
      force: false // Don't regenerate if voice tracks already exist
    })

    console.log('🎵 [CUSTOM MIX] Voice generation results:', results)

    // Now trigger mixing for each completed track
    let mixSuccessCount = 0
    let mixFailCount = 0

    for (const result of results) {
      if (result.status === 'generated' || result.status === 'skipped') {
        try {
          // Get the audio track record to get the track ID and voice URL
          const { data: track } = await supabase
            .from('audio_tracks')
            .select('id, audio_url, s3_key')
            .eq('vision_id', visionId)
            .eq('section_key', result.sectionKey)
            .eq('voice_id', voice)
            .eq('variant', 'custom')
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (track && track.audio_url) {
            // Generate output key for mixed version
            const mixedKey = track.s3_key.replace('.mp3', '-mixed.mp3')

            // Call mixing API
            const mixResponse = await fetch(`${request.nextUrl.origin}/api/audio/mix-custom`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                trackId: track.id,
                voiceUrl: track.audio_url,
                backgroundTrackUrl,
                voiceVolume,
                bgVolume,
                outputKey: mixedKey
              })
            })

            if (mixResponse.ok) {
              mixSuccessCount++
              console.log(`✅ [CUSTOM MIX] Mixed ${result.sectionKey}`)
            } else {
              mixFailCount++
              console.error(`❌ [CUSTOM MIX] Failed to mix ${result.sectionKey}`)
            }
          }
        } catch (mixError) {
          mixFailCount++
          console.error(`❌ [CUSTOM MIX] Error mixing ${result.sectionKey}:`, mixError)
        }
      }
    }

    // Update batch with final status
    const completedCount = results.filter(r => r.status === 'generated' || r.status === 'skipped').length
    const failedCount = results.filter(r => r.status === 'failed').length

    await supabase
      .from('audio_generation_batches')
      .update({
        status: failedCount === sections.length ? 'failed' : 'completed',
        tracks_completed: completedCount,
        tracks_failed: failedCount
      })
      .eq('id', batchId)

    console.log('🎵 [CUSTOM MIX] Generation complete:', {
      completed: completedCount,
      failed: failedCount,
      mixed: mixSuccessCount,
      mixFailed: mixFailCount
    })

    return NextResponse.json({
      success: true,
      results,
      mixStats: {
        success: mixSuccessCount,
        failed: mixFailCount
      }
    })
  } catch (error: any) {
    console.error('❌ [CUSTOM MIX] Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

