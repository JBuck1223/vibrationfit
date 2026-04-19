/**
 * Universal Story Audio Generation API
 *
 * Generates TTS audio for any story, regardless of entity type.
 * Looks up the story by ID -- completely entity-agnostic.
 *
 * POST /api/stories/[id]/audio/generate
 * Body: { voice? }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAudioTracks } from '@/lib/services/audioService'
import { validateTokenBalance } from '@/lib/tokens/tracking'

export const maxDuration = 300
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now()
  const { id: storyId } = await params
  let batchId: string | undefined

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { voice = 'nova' } = body

    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('id, entity_type, entity_id, title, content, audio_set_id')
      .eq('id', storyId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    if (!story.content) {
      return NextResponse.json({ error: 'Story has no content to generate audio from' }, { status: 400 })
    }

    console.log(`[StoryAudio] Starting for story ${storyId} (${story.entity_type}), ${story.content.length} chars`)

    const estimatedTokens = story.content.length
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining,
      }, { status: tokenValidation.status })
    }

    const sectionsPayload = [{ sectionKey: 'focus_story', text: story.content }]

    const { data: batchRow, error: batchInsertError } = await supabase
      .from('audio_generation_batches')
      .insert({
        user_id: user.id,
        content_type: 'story',
        content_id: story.id,
        variant_ids: ['standard'],
        voice_id: voice,
        sections_requested: sectionsPayload,
        total_tracks_expected: 1,
        status: 'pending',
        metadata: {
          source_type: 'story',
          story_id: story.id,
          audio_set_name: story.title || null,
          content_type: 'story',
        },
      })
      .select('id')
      .single()

    if (batchInsertError || !batchRow) {
      console.error('[StoryAudio] Failed to create generation batch:', batchInsertError)
      return NextResponse.json({ error: 'Failed to create generation batch' }, { status: 500 })
    }

    batchId = batchRow.id

    await supabase
      .from('audio_generation_batches')
      .update({
        status: 'processing',
        started_at: new Date().toISOString(),
      })
      .eq('id', batchId)

    let audioSetId = story.audio_set_id

    if (!audioSetId) {
      const { data: audioSet, error: audioSetError } = await supabase
        .from('audio_sets')
        .insert({
          user_id: user.id,
          vision_id: story.entity_id,
          content_type: 'story',
          content_id: story.id,
          name: story.title || 'Story Audio',
          description: `Audio for ${story.entity_type} story`,
          variant: 'standard',
          voice_id: voice,
          is_active: true,
        })
        .select('id')
        .single()

      if (audioSetError || !audioSet) {
        await supabase
          .from('audio_generation_batches')
          .update({
            status: 'failed',
            error_message: audioSetError?.message || 'Failed to create audio set',
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchId)
        console.error('[StoryAudio] Failed to create audio_set:', audioSetError)
        throw audioSetError || new Error('Failed to create audio set')
      }

      audioSetId = audioSet.id
      console.log(`[StoryAudio] Created audio_set: ${audioSetId}`)
    }

    const audioResults = await generateAudioTracks({
      userId: user.id,
      contentType: 'story',
      contentId: story.id,
      sections: sectionsPayload,
      voice,
      format: 'mp3',
      audioSetId,
      audioSetName: story.title || 'Story Audio',
      variant: 'standard',
      batchId,
    })

    const result = audioResults[0]
    if (!result || result.status === 'failed') {
      throw new Error(result?.error || 'Audio generation failed')
    }

    await supabase
      .from('stories')
      .update({
        audio_set_id: audioSetId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', story.id)

    const elapsedMs = Date.now() - startTime
    console.log(`[StoryAudio] Complete in ${elapsedMs}ms`)

    return NextResponse.json({
      audioSetId,
      audioUrl: result.audioUrl,
      elapsedMs,
      batchId,
    })
  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[StoryAudio] Error after ${elapsedMs}ms:`, err)

    if (batchId) {
      try {
        const supabase = await createClient()
        await supabase
          .from('audio_generation_batches')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Failed to generate audio',
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchId)
      } catch (e) {
        console.error('[StoryAudio] Failed to mark batch failed:', e)
      }
    }

    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate audio',
    }, { status: 500 })
  }
}
