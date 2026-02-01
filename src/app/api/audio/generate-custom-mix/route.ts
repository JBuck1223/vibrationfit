import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'

export const maxDuration = 300 // 5 minutes

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('🎵 [CUSTOM MIX] Received request body:', JSON.stringify(body, null, 2))
    console.log('🔍 [CUSTOM MIX] Extracted values:')
    console.log('  backgroundTrackUrl:', body.backgroundTrackUrl)
    console.log('  voiceVolume:', body.voiceVolume)
    console.log('  bgVolume:', body.bgVolume)
    
    const { visionId, sections, voice, batchId, backgroundTrackUrl, voiceVolume, bgVolume, binauralTrackUrl, binauralVolume } = body
    
    console.log('🔍 [CUSTOM MIX] After destructuring:')
    console.log('  backgroundTrackUrl:', backgroundTrackUrl)
    console.log('  voiceVolume:', voiceVolume)
    console.log('  bgVolume:', bgVolume)

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
    
    // Fetch frequency track name and type if provided (can be pure solfeggio OR binaural)
    let frequencyTrackName = null
    let frequencyType: 'pure' | 'solfeggio_binaural' | 'binaural' | null = null
    if (binauralTrackUrl && binauralTrackUrl !== 'none') {
      const { data: freqTrack } = await supabase
        .from('audio_background_tracks')
        .select('display_name, category, brainwave_hz')
        .eq('file_url', binauralTrackUrl)
        .single()
      frequencyTrackName = freqTrack?.display_name
      // Determine type based on category:
      // - 'solfeggio' = pure solfeggio tone (no brainwave)
      // - 'solfeggio_binaural' = solfeggio carrier + brainwave entrainment
      // - 'binaural' = non-solfeggio binaural beats (future)
      if (freqTrack?.category === 'solfeggio_binaural') {
        frequencyType = 'solfeggio_binaural'
      } else if (freqTrack?.category === 'binaural') {
        frequencyType = 'binaural'
      } else {
        frequencyType = 'pure' // solfeggio or legacy
      }
    }
    
    // Calculate adjusted volumes (accounting for binaural if present)
    let adjustedVoiceVol = voiceVolume
    let adjustedBgVol = bgVolume
    
    if (binauralVolume && binauralVolume > 0 && voiceVolume !== undefined && bgVolume !== undefined) {
      const total = voiceVolume + bgVolume
      const remaining = 100 - binauralVolume
      adjustedVoiceVol = Math.round((voiceVolume / total) * remaining)
      adjustedBgVol = Math.round((bgVolume / total) * remaining)
    }
    
    // Build descriptive audio set name with actual mix percentages
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
    if (frequencyTrackName && binauralVolume > 0) {
      audioSetName += ` + ${frequencyTrackName}`
    }
    
    // Add the actual mix ratio to the name
    if (adjustedVoiceVol !== undefined && adjustedBgVol !== undefined) {
      if (binauralVolume && binauralVolume > 0) {
        audioSetName += ` (${adjustedVoiceVol}/${adjustedBgVol}/${binauralVolume})`
      } else {
        audioSetName += ` (${adjustedVoiceVol}/${adjustedBgVol})`
      }
    }
    
    // Build descriptive description with mix ratios
    let audioSetDescription = 'Custom mix: '
    if (adjustedVoiceVol !== undefined && adjustedBgVol !== undefined && binauralVolume && binauralVolume > 0) {
      audioSetDescription += `${adjustedVoiceVol}% voice, ${adjustedBgVol}% background, ${binauralVolume}% binaural`
    } else if (adjustedVoiceVol !== undefined && adjustedBgVol !== undefined) {
      audioSetDescription += `${Math.round(adjustedVoiceVol)}% voice, ${Math.round(adjustedBgVol)}% background`
    } else {
      audioSetDescription += 'custom ratios'
    }

    // Update batch status to processing
    await supabase
      .from('audio_generation_batches')
      .update({ status: 'processing' })
      .eq('id', batchId)

    // Generate voice-only tracks first (or reuse existing ones)
    // Use a unique variant identifier to ensure each generation gets its own audio_set
    const uniqueVariant = `custom-${batchId.slice(0, 8)}`
    
    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice,
      format: 'mp3',
      variant: uniqueVariant,
      batchId,
      audioSetName,  // Pass the descriptive name
      audioSetDescription,  // Pass the descriptive description
      force: false, // Don't regenerate if voice tracks already exist
      audioSetMetadata: {
        voice_volume: adjustedVoiceVol,
        bg_volume: adjustedBgVol,
        frequency_volume: binauralVolume || 0,
        background_track_name: bgTrack?.display_name,
        frequency_track_name: frequencyTrackName || undefined,
        frequency_type: frequencyType || undefined, // 'pure' for solfeggio, 'binaural' for binaural beats
      }
    })

    console.log('🎵 [CUSTOM MIX] Voice generation results:', results)

    // Get the audio set ID that was created/reused for this generation
    const { data: audioSetData } = await supabase
      .from('audio_sets')
      .select('id')
      .eq('vision_id', visionId)
      .eq('variant', uniqueVariant)
      .eq('voice_id', voice)
      .single()
    
    const audioSetId = audioSetData?.id
    
    if (!audioSetId) {
      console.error('❌ [CUSTOM MIX] Could not find audio set for variant:', uniqueVariant)
      return NextResponse.json({ error: 'Audio set not found' }, { status: 500 })
    }
    
    console.log(`🎯 [CUSTOM MIX] Using audio set ID: ${audioSetId}`)

    // Now trigger mixing for each completed track
    let mixSuccessCount = 0
    let mixFailCount = 0

    for (const result of results) {
      console.log(`🔄 [CUSTOM MIX] Processing ${result.sectionKey} (status: ${result.status})`)
      
      if (result.status === 'generated' || result.status === 'skipped' || result.status === 'reused') {
        try {
          // Get the audio track record for THIS audio set only
          console.log(`🔍 [CUSTOM MIX] Looking for track: audioSet=${audioSetId}, section=${result.sectionKey}`)
          
          const { data: tracks, error: trackError } = await supabase
            .from('audio_tracks')
            .select('id, audio_url, s3_key, audio_set_id, status, mix_status')
            .eq('audio_set_id', audioSetId)  // Filter by THIS audio set only!
            .eq('section_key', result.sectionKey)
            .order('created_at', { ascending: false })
            .limit(1)  // Only need one track
          
          console.log(`📊 [CUSTOM MIX] Found ${tracks?.length || 0} tracks for ${result.sectionKey}`)
          if (tracks && tracks.length > 0) {
            console.log(`📊 [CUSTOM MIX] Track details:`, tracks.map(t => ({
              id: t.id,
              audio_set_id: t.audio_set_id,
              hasUrl: !!t.audio_url,
              status: t.status,
              mix_status: t.mix_status
            })))
          }
          
          // Use the track from THIS audio set
          const track = tracks?.[0]

          if (trackError) {
            console.error(`❌ [CUSTOM MIX] Error fetching track for ${result.sectionKey}:`, trackError)
            mixFailCount++
            continue
          }

          if (!track) {
            console.error(`❌ [CUSTOM MIX] No track found for ${result.sectionKey}!`)
            mixFailCount++
            continue
          }

          console.log(`📍 [CUSTOM MIX] Using track for ${result.sectionKey}:`, {
            id: track.id,
            audio_set_id: track.audio_set_id,
            hasAudioUrl: !!track.audio_url,
            audioUrl: track.audio_url,
            status: track.status,
            mix_status: track.mix_status
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
            
            // Generate output key for mixed version (include track ID to ensure uniqueness)
            const mixedKey = track.s3_key.replace('.mp3', `-mixed-${track.id.substring(0, 8)}.mp3`)

            // Adjust voice and background volumes if binaural is present
            let adjustedVoiceVolume = voiceVolume
            let adjustedBgVolume = bgVolume
            
            if (binauralTrackUrl && binauralTrackUrl.trim() !== '' && binauralVolume && binauralVolume > 0) {
              // Proportionally reduce voice and bg to make room for binaural
              const remaining = 100 - binauralVolume
              const total = voiceVolume + bgVolume
              adjustedVoiceVolume = (voiceVolume / total) * remaining
              adjustedBgVolume = (bgVolume / total) * remaining
              
              console.log(`📊 [CUSTOM MIX] Adjusting volumes for binaural:`, {
                original: { voice: voiceVolume, bg: bgVolume },
                adjusted: { voice: adjustedVoiceVolume, bg: adjustedBgVolume, binaural: binauralVolume }
              })
            }

            // Prepare mix payload
            const mixPayload: any = {
              trackId: track.id,
              voiceUrl: track.audio_url,
              backgroundTrackUrl,
              voiceVolume: adjustedVoiceVolume,
              bgVolume: adjustedBgVolume,
              outputKey: mixedKey
            }
            
            // Add optional binaural track (only if valid URL and volume > 0)
            if (binauralTrackUrl && binauralTrackUrl.trim() !== '' && binauralVolume && binauralVolume > 0) {
              mixPayload.binauralTrackUrl = binauralTrackUrl
              mixPayload.binauralVolume = binauralVolume
            }
            
            console.log(`🎵 [CUSTOM MIX] Mixing ${result.sectionKey}:`)
            console.log('  Track ID:', track.id)
            console.log('  Voice URL:', track.audio_url)
            console.log('  Background URL:', backgroundTrackUrl)
            console.log('  Voice Volume:', mixPayload.voiceVolume, '(should be decimal like 0.8)')
            console.log('  BG Volume:', mixPayload.bgVolume, '(should be decimal like 0.2)')
            console.log('  Binaural URL:', mixPayload.binauralTrackUrl || 'none')
            console.log('  Binaural Volume:', mixPayload.binauralVolume || 0)
            console.log('  Output Key:', mixedKey)
            console.log('  Full Payload:', JSON.stringify(mixPayload, null, 2))
            
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
    const completedCount = results.filter(r => r.status === 'generated' || r.status === 'skipped' || r.status === 'reused').length
    const failedCount = results.filter(r => r.status === 'failed').length

    await supabase
      .from('audio_generation_batches')
      .update({
        status: failedCount === sections.length ? 'failed' : 'completed',
        tracks_completed: completedCount,
        tracks_failed: failedCount,
        tracks_pending: 0,
        completed_at: new Date().toISOString()
      })
      .eq('id', batchId)

    // Mark audios_generated in intensive_checklist if user is in intensive mode and mix succeeded
    if (mixSuccessCount > 0) {
      const now = new Date().toISOString()
      try {
        const { error: checklistError } = await supabase
          .from('intensive_checklist')
          .update({
            audios_generated: true,
            audios_generated_at: now
          })
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .is('audios_generated', false)
        
        if (!checklistError) {
          console.log('[CUSTOM MIX] Marked audios_generated in intensive_checklist')
        } else {
          console.log('[CUSTOM MIX] No intensive checklist to update (user may not be in intensive mode)')
        }
      } catch {
        // Silently ignore - user may not be in intensive mode
        console.log('[CUSTOM MIX] No intensive checklist to update (user may not be in intensive mode)')
      }
    }

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

