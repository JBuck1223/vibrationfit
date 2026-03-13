import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks, hashContent } from '@/lib/services/audioService'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'

export const maxDuration = 800

const BUCKET_NAME = 'vibration-fit-client-storage'

const lambda = new LambdaClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('[CUSTOM MIX] Received request body:', JSON.stringify(body, null, 2))
    
    const {
      visionId, sections, voice, batchId,
      backgroundTrackUrl, voiceVolume, bgVolume,
      binauralTrackUrl, binauralVolume,
      outputFormat
    } = body

    if (!visionId || !sections || !voice || !batchId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    if (!backgroundTrackUrl) {
      return NextResponse.json(
        { error: 'Missing backgroundTrackUrl' },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const effectiveOutputFormat = (outputFormat === 'combined' || outputFormat === 'both')
      ? outputFormat
      : 'individual'

    console.log('[CUSTOM MIX] Starting custom mix generation:', {
      visionId, voice, batchId, backgroundTrackUrl,
      voiceVolume, bgVolume,
      binauralTrackUrl: binauralTrackUrl || 'none',
      binauralVolume: binauralVolume || 0,
      outputFormat: effectiveOutputFormat,
      sectionCount: sections.length
    })

    // Fetch background track name for labeling
    const { data: bgTrack } = await supabase
      .from('audio_background_tracks')
      .select('display_name')
      .eq('file_url', backgroundTrackUrl)
      .single()
    
    // Fetch frequency track name if provided
    let frequencyTrackName = null
    let frequencyType: 'pure' | 'solfeggio_binaural' | 'binaural' | null = null
    if (binauralTrackUrl && binauralTrackUrl !== 'none') {
      const { data: freqTrack } = await supabase
        .from('audio_background_tracks')
        .select('display_name, category, brainwave_hz')
        .eq('file_url', binauralTrackUrl)
        .single()
      frequencyTrackName = freqTrack?.display_name
      if (freqTrack?.category === 'solfeggio_binaural') {
        frequencyType = 'solfeggio_binaural'
      } else if (freqTrack?.category === 'binaural') {
        frequencyType = 'binaural'
      } else {
        frequencyType = 'pure'
      }
    }
    
    // Calculate adjusted volumes
    let adjustedVoiceVol = voiceVolume
    let adjustedBgVol = bgVolume
    
    if (binauralVolume && binauralVolume > 0 && voiceVolume !== undefined && bgVolume !== undefined) {
      const total = voiceVolume + bgVolume
      const remaining = 100 - binauralVolume
      adjustedVoiceVol = Math.round((voiceVolume / total) * remaining)
      adjustedBgVol = Math.round((bgVolume / total) * remaining)
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
    if (frequencyTrackName && binauralVolume > 0) {
      audioSetName += ` + ${frequencyTrackName}`
    }
    if (adjustedVoiceVol !== undefined && adjustedBgVol !== undefined) {
      if (binauralVolume && binauralVolume > 0) {
        audioSetName += ` (${adjustedVoiceVol}/${adjustedBgVol}/${binauralVolume})`
      } else {
        audioSetName += ` (${adjustedVoiceVol}/${adjustedBgVol})`
      }
    }
    
    // Build description
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
    const uniqueVariant = `custom-${batchId.slice(0, 8)}`
    
    const results = await generateAudioTracks({
      userId: user.id,
      visionId,
      sections,
      voice,
      format: 'mp3',
      variant: uniqueVariant,
      batchId,
      audioSetName,
      audioSetDescription,
      force: false,
      audioSetMetadata: {
        voice_volume: adjustedVoiceVol,
        bg_volume: adjustedBgVol,
        frequency_volume: binauralVolume || 0,
        background_track_name: bgTrack?.display_name,
        frequency_track_name: frequencyTrackName || undefined,
        frequency_type: frequencyType || undefined,
      }
    })

    console.log('[CUSTOM MIX] Voice generation results:', results)

    // Get the audio set ID
    const { data: audioSetData } = await supabase
      .from('audio_sets')
      .select('id')
      .eq('vision_id', visionId)
      .eq('variant', uniqueVariant)
      .eq('voice_id', voice)
      .single()
    
    const audioSetId = audioSetData?.id
    if (!audioSetId) {
      console.error('[CUSTOM MIX] Could not find audio set for variant:', uniqueVariant)
      return NextResponse.json({ error: 'Audio set not found' }, { status: 500 })
    }

    // Gather all completed voice tracks for Lambda batch-mix
    const lambdaSections: { trackId: string; voiceUrl: string; outputKey: string }[] = []

    for (const result of results) {
      if (result.status === 'generated' || result.status === 'skipped' || result.status === 'reused') {
        const { data: tracks } = await supabase
          .from('audio_tracks')
          .select('id, audio_url, s3_key')
          .eq('audio_set_id', audioSetId)
          .eq('section_key', result.sectionKey)
          .order('created_at', { ascending: false })
          .limit(1)
        
        const track = tracks?.[0]
        if (track?.audio_url) {
          const mixedKey = track.s3_key.replace('.mp3', `-mixed-${track.id.substring(0, 8)}.mp3`)
          lambdaSections.push({
            trackId: track.id,
            voiceUrl: track.audio_url,
            outputKey: mixedKey
          })
        }
      }
    }

    if (lambdaSections.length === 0) {
      console.error('[CUSTOM MIX] No voice tracks available for mixing')
      await supabase
        .from('audio_generation_batches')
        .update({ status: 'failed', error_message: 'No voice tracks available for mixing' })
        .eq('id', batchId)
      return NextResponse.json({ error: 'No voice tracks available' }, { status: 500 })
    }

    // If output includes combined, create the "full" track record in DB first
    let combinedTrackId: string | null = null
    let combinedOutputKey: string | null = null

    if ((effectiveOutputFormat === 'combined' || effectiveOutputFormat === 'both') && lambdaSections.length > 1) {
      combinedOutputKey = `user-uploads/${user.id}/life-vision/audio/${visionId}/full-mixed-${audioSetId}.mp3`
      const combinedAudioUrl = `https://media.vibrationfit.com/${combinedOutputKey}`
      const contentHash = hashContent(`full-vision-audio-${audioSetId}`).substring(0, 16)

      try {
        // Check for existing full track
        const { data: existing } = await supabase
          .from('audio_tracks')
          .select('id')
          .eq('audio_set_id', audioSetId)
          .eq('section_key', 'full')
          .maybeSingle()

        if (existing) {
          const { error: updateError } = await supabase
            .from('audio_tracks')
            .update({
              status: 'processing',
              mix_status: 'mixing',
              error_message: null,
              s3_key: combinedOutputKey,
              audio_url: combinedAudioUrl
            })
            .eq('id', existing.id)

          if (updateError) {
            console.error('[CUSTOM MIX] Failed to update full track:', updateError)
          } else {
            combinedTrackId = existing.id
          }
        } else {
          const { data: newTrack, error: insertError } = await supabase
            .from('audio_tracks')
            .insert({
              audio_set_id: audioSetId,
              user_id: user.id,
              vision_id: visionId,
              section_key: 'full',
              content_hash: contentHash,
              text_content: 'Full Vision Audio - All Sections Combined',
              voice_id: voice,
              s3_bucket: BUCKET_NAME,
              s3_key: combinedOutputKey,
              audio_url: combinedAudioUrl,
              status: 'processing',
              mix_status: 'mixing'
            })
            .select('id')
            .single()

          if (insertError) {
            console.error('[CUSTOM MIX] Failed to insert full track:', insertError)
          } else {
            combinedTrackId = newTrack?.id || null
          }
        }
      } catch (err: any) {
        console.error('[CUSTOM MIX] Error creating full track record:', err.message)
      }

      console.log(`[CUSTOM MIX] Combined track record: id=${combinedTrackId}, key=${combinedOutputKey}`)
    }

    // Convert percentages to decimals for Lambda
    const voiceVolumeDecimal = (adjustedVoiceVol || voiceVolume) / 100
    const bgVolumeDecimal = (adjustedBgVol || bgVolume) / 100
    const binauralVolumeDecimal = binauralVolume ? binauralVolume / 100 : 0

    // Build Lambda payload
    const lambdaPayload: any = {
      action: 'batch-mix',
      sections: lambdaSections,
      bgUrl: backgroundTrackUrl,
      voiceVolume: voiceVolumeDecimal,
      bgVolume: bgVolumeDecimal,
      outputFormat: effectiveOutputFormat,
    }

    if (binauralTrackUrl && binauralTrackUrl.trim() !== '' && binauralTrackUrl !== 'none' && binauralVolume && binauralVolume > 0) {
      lambdaPayload.binauralUrl = binauralTrackUrl
      lambdaPayload.binauralVolume = binauralVolumeDecimal
    }

    if (combinedTrackId && combinedOutputKey) {
      lambdaPayload.combinedTrackId = combinedTrackId
      lambdaPayload.combinedOutputKey = combinedOutputKey
    }

    lambdaPayload.batchId = batchId

    console.log('[CUSTOM MIX] Invoking Lambda batch-mix:', JSON.stringify({
      ...lambdaPayload,
      sections: `${lambdaSections.length} sections`
    }))

    // Mark all section tracks as mixing
    for (const section of lambdaSections) {
      await supabase
        .from('audio_tracks')
        .update({ mix_status: 'mixing' })
        .eq('id', section.trackId)
    }

    // Invoke Lambda asynchronously (Event invocation)
    const command = new InvokeCommand({
      FunctionName: 'audio-mixer',
      Payload: JSON.stringify(lambdaPayload),
      InvocationType: 'Event',
    })

    await lambda.send(command)
    console.log('[CUSTOM MIX] Lambda batch-mix invoked successfully')

    // Update batch status
    const completedCount = results.filter(r => r.status === 'generated' || r.status === 'skipped' || r.status === 'reused').length
    const failedCount = results.filter(r => r.status === 'failed').length

    // Keep batch as 'processing' so queue page continues polling
    // Lambda will update final status when done
    await supabase
      .from('audio_generation_batches')
      .update({
        status: 'processing',
        tracks_completed: 0,
        tracks_failed: failedCount,
        tracks_pending: completedCount,
        audio_set_ids: [audioSetId],
      })
      .eq('id', batchId)

    // Mark audios_generated in intensive_checklist
    if (lambdaSections.length > 0) {
      const now = new Date().toISOString()
      try {
        await supabase
          .from('intensive_checklist')
          .update({
            audios_generated: true,
            audios_generated_at: now
          })
          .eq('user_id', user.id)
          .in('status', ['pending', 'in_progress'])
          .is('audios_generated', false)
      } catch {
        // Silently ignore
      }
    }

    console.log('[CUSTOM MIX] Generation initiated:', {
      voiceTracks: completedCount,
      voiceFailed: failedCount,
      sectionsToMix: lambdaSections.length,
      outputFormat: effectiveOutputFormat,
      hasCombined: !!combinedTrackId
    })

    return NextResponse.json({
      success: true,
      results,
      outputFormat: effectiveOutputFormat,
      sectionsToMix: lambdaSections.length,
      hasCombined: !!combinedTrackId
    })
  } catch (error: any) {
    console.error('[CUSTOM MIX] Generation error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}
