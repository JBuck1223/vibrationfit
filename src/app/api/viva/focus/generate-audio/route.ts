/**
 * Focus Story Audio Generation API
 * 
 * Generates audio from the focus story text using OpenAI TTS.
 * 
 * POST /api/viva/focus/generate-audio
 * Body: { visionId, storyContent, voice? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'
import { validateTokenBalance } from '@/lib/tokens/tracking'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { visionId, storyContent, voice = 'nova' } = body

    if (!visionId || !storyContent) {
      return NextResponse.json({ error: 'visionId and storyContent are required' }, { status: 400 })
    }

    console.log(`[FocusGenerateAudio] Starting for vision ${visionId}, ${storyContent.length} chars`)

    // Validate token balance for TTS (1 token per character approximately)
    const estimatedTokens = storyContent.length
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }, { status: tokenValidation.status })
    }

    // Get the story record
    const { data: story } = await supabase
      .from('stories')
      .select('id, audio_set_id')
      .eq('entity_type', 'life_vision')
      .eq('entity_id', visionId)
      .eq('user_id', user.id)
      .maybeSingle()

    // Create audio_set for this story if needed
    let audioSetId = story?.audio_set_id

    if (!audioSetId) {
      const { data: audioSet, error: audioSetError } = await supabase
        .from('audio_sets')
        .insert({
          user_id: user.id,
          vision_id: visionId,
          content_type: 'story',
          content_id: story?.id,
          name: 'Focus Story',
          description: 'Day-in-the-life narrative',
          variant: 'standard',
          voice_id: voice,
          is_active: true
        })
        .select('id')
        .single()

      if (audioSetError || !audioSet) {
        console.error('[FocusGenerateAudio] Failed to create audio_set:', audioSetError)
        throw audioSetError || new Error('Failed to create audio set')
      }

      audioSetId = audioSet.id
      console.log(`[FocusGenerateAudio] Created audio_set: ${audioSetId}`)
    }

    // Generate audio using existing infrastructure
    const audioResults = await generateAudioTracks({
      userId: user.id,
      visionId: visionId,
      sections: [{ sectionKey: 'focus_story', text: storyContent }],
      voice: voice,
      format: 'mp3',
      audioSetId: audioSetId,
      audioSetName: 'Focus Story',
      variant: 'standard'
    })

    // Check if generation succeeded
    const result = audioResults[0]
    if (!result || result.status === 'failed') {
      throw new Error(result?.error || 'Audio generation failed')
    }

    const elapsedMs = Date.now() - startTime
    console.log(`[FocusGenerateAudio] Complete in ${elapsedMs}ms`)

    // Update story with audio reference
    if (story?.id) {
      await supabase
        .from('stories')
        .update({
          audio_set_id: audioSetId,
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', story.id)
    }

    return NextResponse.json({
      audioSetId,
      audioUrl: result.audioUrl,
      duration: result.duration,
      elapsedMs
    })

  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[FocusGenerateAudio] Error after ${elapsedMs}ms:`, err)
    
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to generate audio'
    }, { status: 500 })
  }
}
