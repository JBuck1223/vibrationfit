/**
 * Focus Story & Audio Generation API
 * 
 * Generates a day-in-the-life narrative from selected highlights and creates
 * audio using OpenAI TTS.
 * 
 * POST /api/viva/focus/generate
 * Body: { focusId: string, selectedHighlights?: FocusHighlight[], voice?: string }
 * Returns: { focusId, storyContent, audioUrl, duration }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateText } from 'ai'
import { openai } from '@ai-sdk/openai'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { 
  buildDayInTheLifeStoryPrompt,
  type FocusHighlight 
} from '@/lib/viva/prompts'
import { generateAudioTracks } from '@/lib/services/audioService'

export const maxDuration = 300 // 5 minutes for story + audio generation
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
    const { focusId, selectedHighlights, voice = 'nova' } = body

    if (!focusId) {
      return NextResponse.json({ error: 'focusId is required' }, { status: 400 })
    }

    console.log(`[FocusGenerate] Starting generation for focus ${focusId}`)

    // Fetch the story record
    const { data: story, error: storyError } = await supabase
      .from('stories')
      .select('*, vision_versions:entity_id(*)')
      .eq('id', focusId)
      .eq('user_id', user.id)
      .single()

    if (storyError || !story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 })
    }

    // Use provided highlights or fall back to stored selected_highlights in metadata
    const metadata = story.metadata || {}
    const highlights: FocusHighlight[] = selectedHighlights || metadata.selected_highlights || []
    
    if (highlights.length === 0) {
      return NextResponse.json({ error: 'No highlights selected' }, { status: 400 })
    }

    // Update status to generating
    await supabase
      .from('stories')
      .update({ 
        status: 'generating',
        metadata: { ...metadata, selected_highlights: highlights },
        updated_at: new Date().toISOString()
      })
      .eq('id', focusId)

    // Get user profile for name and perspective
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, perspective')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .maybeSingle()

    const userName = profile?.first_name
    const perspective = (profile?.perspective as 'singular' | 'plural') || 'singular'

    // Build the story prompt
    const storyPrompt = buildDayInTheLifeStoryPrompt(highlights, userName, perspective)

    // Get AI config
    let toolConfig
    try {
      toolConfig = await getAIToolConfig('focus_story_generation')
    } catch {
      console.log('[FocusGenerate] Tool not configured, falling back to master_vision_assembly')
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    // Estimate tokens for story generation
    const estimatedStoryTokens = estimateTokensForText(storyPrompt, toolConfig.model_name)
    
    // Also estimate for audio (roughly 1 token per character, target ~5000 chars)
    const estimatedAudioTokens = 5000
    const totalEstimatedTokens = estimatedStoryTokens + estimatedAudioTokens

    const tokenValidation = await validateTokenBalance(user.id, totalEstimatedTokens, supabase)

    if (tokenValidation) {
      await supabase
        .from('stories')
        .update({ status: 'failed', error_message: tokenValidation.error })
        .eq('id', focusId)
        
      return NextResponse.json({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining
      }, { status: tokenValidation.status })
    }

    console.log(`[FocusGenerate] Using model ${toolConfig.model_name} for story`)

    // Generate the story
    // Note: maxTokens is handled by the model provider
    const storyResult = await generateText({
      model: openai(toolConfig.model_name),
      prompt: storyPrompt,
      temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.8) : undefined,
    })

    const storyContent = storyResult.text.trim()
    const wordCount = storyContent.split(/\s+/).length

    console.log(`[FocusGenerate] Story generated: ${wordCount} words`)

    // Track story generation tokens (AI SDK v4 usage object properties)
    if (storyResult.usage) {
      const usage = storyResult.usage
      const promptTokens = (usage as any).prompt || (usage as any).promptTokens || 0
      const completionTokens = (usage as any).completion || (usage as any).completionTokens || 0
      const totalTokens = (usage as any).total || (usage as any).totalTokens || (promptTokens + completionTokens)
      
      trackTokenUsage({
        user_id: user.id,
        action_type: 'focus_story_generation',
        model_used: toolConfig.model_name,
        tokens_used: totalTokens,
        input_tokens: promptTokens,
        output_tokens: completionTokens,
        actual_cost_cents: 0,
        success: true,
        metadata: {
          story_id: focusId,
          word_count: wordCount,
          highlight_count: highlights.length
        }
      }).catch(err => console.error('[FocusGenerate] Token tracking failed:', err))
    }

    // Update story with content
    await supabase
      .from('stories')
      .update({
        content: storyContent,
        word_count: wordCount,
        status: 'generating',
        updated_at: new Date().toISOString()
      })
      .eq('id', focusId)

    // Create audio_set for this story
    const { data: audioSet, error: audioSetError } = await supabase
      .from('audio_sets')
      .insert({
        user_id: user.id,
        vision_id: story.entity_id, // Keep reference to vision for now
        content_type: 'story',
        content_id: focusId,
        name: 'Focus Story',
        description: 'Day-in-the-life narrative',
        variant: 'standard',
        voice_id: voice,
        is_active: true
      })
      .select('id')
      .single()

    if (audioSetError || !audioSet) {
      console.error('[FocusGenerate] Failed to create audio_set:', audioSetError)
      throw audioSetError || new Error('Failed to create audio set')
    }

    console.log(`[FocusGenerate] Audio set created: ${audioSet.id}`)

    // Generate the audio using existing infrastructure
    let audioResults
    try {
      audioResults = await generateAudioTracks({
        userId: user.id,
        visionId: story.entity_id, // Required by existing function
        sections: [{ sectionKey: 'focus_story', text: storyContent }],
        voice: voice,
        format: 'mp3',
        audioSetId: audioSet.id,
        audioSetName: 'Focus Story',
        variant: 'standard'
      })
      
      // Check if generation succeeded
      const result = audioResults[0]
      if (!result || result.status === 'failed') {
        throw new Error(result?.error || 'Audio generation failed')
      }
    } catch (audioError) {
      console.error('[FocusGenerate] Audio generation failed:', audioError)
      
      // Update status to failed but keep the story
      await supabase
        .from('stories')
        .update({
          status: 'failed',
          error_message: audioError instanceof Error ? audioError.message : 'Audio generation failed',
          audio_set_id: audioSet.id
        })
        .eq('id', focusId)

      return NextResponse.json({
        error: 'Audio generation failed',
        storyId: focusId,
        storyContent,
        wordCount,
        audioSetId: audioSet.id
      }, { status: 500 })
    }

    const audioResult = audioResults[0]
    const elapsedMs = Date.now() - startTime
    console.log(`[FocusGenerate] Complete in ${elapsedMs}ms`)

    // Update story with audio info
    const { error: finalUpdateError } = await supabase
      .from('stories')
      .update({
        audio_set_id: audioSet.id,
        status: 'completed',
        generation_count: (story.generation_count || 0) + 1,
        error_message: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', focusId)

    if (finalUpdateError) {
      console.error('[FocusGenerate] Failed to update story:', finalUpdateError)
    }

    return NextResponse.json({
      storyId: focusId,
      visionId: story.entity_id,
      storyContent,
      wordCount,
      audioSetId: audioSet.id,
      audioUrl: audioResult.audioUrl,
      generationCount: (story.generation_count || 0) + 1,
      elapsedMs
    })

  } catch (err) {
    const elapsedMs = Date.now() - startTime
    console.error(`[FocusGenerate] Error after ${elapsedMs}ms:`, err)
    
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to generate focus story'
    }, { status: 500 })
  }
}

/**
 * PATCH /api/viva/focus/generate
 * Update selected highlights without regenerating
 */
export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { focusId, selectedHighlights } = body

    if (!focusId || !selectedHighlights) {
      return NextResponse.json({ error: 'focusId and selectedHighlights are required' }, { status: 400 })
    }

    // Get existing metadata first
    const { data: existing } = await supabase
      .from('stories')
      .select('metadata')
      .eq('id', focusId)
      .eq('user_id', user.id)
      .single()

    const { data, error } = await supabase
      .from('stories')
      .update({
        metadata: { ...existing?.metadata, selected_highlights: selectedHighlights },
        updated_at: new Date().toISOString()
      })
      .eq('id', focusId)
      .eq('user_id', user.id)
      .select()
      .single()

    if (error) {
      throw error
    }

    return NextResponse.json({ story: data })

  } catch (err) {
    console.error('[FocusGenerate PATCH] Error:', err)
    return NextResponse.json({ 
      error: err instanceof Error ? err.message : 'Failed to update highlights'
    }, { status: 500 })
  }
}
