import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎵 [CUSTOM MIX] Received request body:', JSON.stringify(body, null, 2))
    
    const { visionId, sections, voice, batchId, backgroundTrackUrl, voiceVolume, bgVolume, binauralTrackUrl, binauralVolume } = body

    if (!visionId || !sections || !voice || !batchId) {
      console.error('❌ [CUSTOM MIX] Missing required fields:', {
        visionId: !!visionId,
        sections: !!sections,
        voice: !!voice,
        batchId: !!batchId,
        backgroundTrackUrl: !!backgroundTrackUrl
      })
      return NextResponse.json(
        { error: 'Missing required fields', received: { visionId: !!visionId, sections: !!sections, voice: !!voice, batchId: !!batchId, backgroundTrackUrl: !!backgroundTrackUrl } },
        { status: 400 }
      )
    }
    
    if (!backgroundTrackUrl) {
      console.error('❌ [CUSTOM MIX] Missing backgroundTrackUrl!')
      return NextResponse.json(
        { error: 'Missing backgroundTrackUrl' },
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
      binauralTrackUrl: binauralTrackUrl || 'none',
      binauralVolume: binauralVolume || 0,
      sectionCount: sections.length
    })

    // Fetch background track name for better labeling
    const { data: bgTrack } = await supabase
      .from('audio_background_tracks')
      .select('display_name')
      .eq('file_url', backgroundTrackUrl)
      .single()
    
    // Fetch binaural track name if provided
    let binauralTrackName = null
    if (binauralTrackUrl && binauralTrackUrl !== 'none') {
      const { data: binTrack } = await supabase
        .from('audio_background_tracks')
        .select('display_name')
        .eq('file_url', binauralTrackUrl)
        .single()
      binauralTrackName = binTrack?.display_name
    }
    
    // Build descriptive audio set name
    const voiceNames: Record<string, string> = {
      'alloy': 'Fresh and Modern (Male)',
      'echo': 'Warm and Inviting (Male)',
      'fable': 'Smooth and Expressive (Male)',
      'onyx': 'Deep and Authoritative (Male)',
      'nova': 'Fresh and Modern (Female)',
      'shimmer': 'Warm and Inviting (Female)'
    }
    
    let audioSetName = voiceNames[voice] || voice
    if (bgTrack?.display_name) {
      audioSetName += ` + ${bgTrack.display_name}`
    }
    if (binauralTrackName && binauralVolume > 0) {
      audioSetName += ` + ${binauralTrackName} (${binauralVolume}%)`
    }
    
    // Build descriptive description with mix ratios
    let audioSetDescription = 'Custom mix: '
    if (voiceVolume !== undefined && bgVolume !== undefined && binauralVolume > 0) {
      // 3-track mix: adjust ratios
      const voicePercent = Math.round(voiceVolume * (100 - binauralVolume) / 100)
      const bgPercent = Math.round(bgVolume * (100 - binauralVolume) / 100)
      audioSetDescription += `${voicePercent}% voice, ${bgPercent}% background, ${binauralVolume}% binaural`
    } else if (voiceVolume !== undefined && bgVolume !== undefined) {
      // 2-track mix: use ratios as-is
      audioSetDescription += `${Math.round(voiceVolume)}% voice, ${Math.round(bgVolume)}% background`
    } else {
      audioSetDescription += 'custom ratios'
    }

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
      audioSetName,  // Pass the descriptive name
      audioSetDescription,  // Pass the descriptive description
      force: false // Don't regenerate if voice tracks already exist
    })

    console.log('🎵 [CUSTOM MIX] Voice generation results:', results)

    // Now trigger mixing for each completed track
    let mixSuccessCount = 0
    let mixFailCount = 0

    for (const result of results) {
      console.log(`🔄 [CUSTOM MIX] Processing ${result.sectionKey} (status: ${result.status})`)
      
      if (result.status === 'generated' || result.status === 'skipped') {
        try {
          // Get the audio track record to get the track ID and voice URL
          // Note: variant is stored on audio_sets, not audio_tracks
          // We filter by vision + section + voice + audio_set to get the right track
          const { data: tracks, error: trackError } = await supabase
            .from('audio_tracks')
            .select('id, audio_url, s3_key, audio_set_id')
            .eq('vision_id', visionId)
            .eq('section_key', result.sectionKey)
            .eq('voice_id', voice)
            .order('created_at', { ascending: false })
            .limit(10)  // Get recent tracks
          
          // Find the track that matches our audio set (the one we just created/reused)
          const track = tracks?.find(t => t.audio_url === result.audioUrl) || tracks?.[0]

          if (trackError) {
            console.error(`❌ [CUSTOM MIX] Error fetching track for ${result.sectionKey}:`, trackError)
            mixFailCount++
            continue
          }

          console.log(`📍 [CUSTOM MIX] Track for ${result.sectionKey}:`, {
            id: track?.id,
            hasAudioUrl: !!track?.audio_url,
            audioUrl: track?.audio_url
          })

          if (track && track.audio_url) {
            // Validate required URLs
            if (!track.audio_url || !backgroundTrackUrl) {
              console.error(`❌ [CUSTOM MIX] Missing URLs for ${result.sectionKey}:`, {
                voiceUrl: track.audio_url,
                backgroundTrackUrl
              })
              mixFailCount++
              
              // Update track with error
              await supabase
                .from('audio_tracks')
                .update({
                  mix_status: 'failed',
                  error_message: 'Missing voice or background URL'
                })
                .eq('id', track.id)
              
              continue
            }
            
            // Generate output key for mixed version
            const mixedKey = track.s3_key.replace('.mp3', '-mixed.mp3')

            // Prepare mix payload
            const mixPayload: any = {
              trackId: track.id,
              voiceUrl: track.audio_url,
              backgroundTrackUrl,
              voiceVolume,
              bgVolume,
              outputKey: mixedKey
            }
            
            // Add optional binaural track (only if valid URL and volume > 0)
            if (binauralTrackUrl && binauralTrackUrl.trim() !== '' && binauralVolume && binauralVolume > 0) {
              mixPayload.binauralUrl = binauralTrackUrl
              mixPayload.binauralVolume = binauralVolume
            }
            
            console.log(`🎵 [CUSTOM MIX] Mixing ${result.sectionKey}:`, {
              trackId: track.id,
              voiceUrl: track.audio_url,
              backgroundTrackUrl,
              binauralTrackUrl: mixPayload.binauralUrl || 'none',
              outputKey: mixedKey
            })
            
            // Call mixing API
            const mixResponse = await fetch(`${request.nextUrl.origin}/api/audio/mix-custom`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(mixPayload)
            })

            const mixResult = await mixResponse.json()
            
            if (mixResponse.ok) {
              mixSuccessCount++
              console.log(`✅ [CUSTOM MIX] Mixed ${result.sectionKey}`)
            } else {
              mixFailCount++
              console.error(`❌ [CUSTOM MIX] Failed to mix ${result.sectionKey}:`, mixResult)
            }
          } else {
            console.log(`⚠️ [CUSTOM MIX] Skipping ${result.sectionKey} - no track or audio_url`)
          }
        } catch (mixError) {
          mixFailCount++
          console.error(`❌ [CUSTOM MIX] Error mixing ${result.sectionKey}:`, mixError)
        }
      } else {
        console.log(`⏭️ [CUSTOM MIX] Skipping ${result.sectionKey} - status: ${result.status}`)
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

