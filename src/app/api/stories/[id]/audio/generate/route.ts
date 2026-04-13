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
        console.error('[StoryAudio] Failed to create audio_set:', audioSetError)
        throw audioSetError || new Error('Failed to create audio set')
      }

      audioSetId = audioSet.id
      console.log(`[StoryAudio] Created audio_set: ${audioSetId}`)
    }

    const audioResults = await generateAudioTracks({
      userId: user.id,
      visionId: story.entity_id,
      sections: [{ sectionKey: 'focus_story', text: story.content }],
      voice,
      format: 'mp3',
      audioSetId,
      audioSetName: story.title || 'Story Audio',
      variant: 'standard',
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
    })
  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[StoryAudio] Error after ${elapsedMs}ms:`, err)

    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to generate audio',
    }, { status: 500 })
  }
}
