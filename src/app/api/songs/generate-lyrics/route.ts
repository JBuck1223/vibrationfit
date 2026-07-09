/**
 * Song Lyrics Generation API
 *
 * Generates streaming lyrics using the Emotional Songwriting Framework.
 * Receives a SongEssence payload, assembles the master songwriter prompt,
 * and streams lyrics back. On finish, upserts the songs row.
 *
 * POST /api/songs/generate-lyrics
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { streamText } from 'ai'
import { gateway } from '@/lib/ai/gateway'

const SONGWRITER_MODEL = 'claude-opus-4-5'
import { getAIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import {
  MASTER_SONGWRITER_SYSTEM_PROMPT,
  buildSongLyricsPrompt,
  buildSimpleSongPrompt,
} from '@/lib/viva/prompts/song-lyrics-prompt'
import { stripLyricsTitleHeader } from '@/lib/utils/lyrics-alignment'
import type { SongEssence, SongEntityType } from '@/lib/songs/types'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

interface GenerateLyricsBody {
  entity_type: SongEntityType
  entity_id?: string
  song_essence: SongEssence
  title?: string
  song_id?: string
}

export async function POST(request: NextRequest) {
  const startTime = Date.now()

  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const body: GenerateLyricsBody = await request.json()
    const { entity_type, song_essence } = body

    if (!entity_type || !song_essence) {
      return new Response(JSON.stringify({ error: 'entity_type and song_essence are required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    if (!song_essence.song_idea) {
      return new Response(JSON.stringify({ error: 'Song Essence requires at least a song_idea' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    console.log(`[SongLyrics] Starting for entity_type=${entity_type}, idea="${song_essence.song_idea.slice(0, 50)}"`)

    // Use simple prompt when only song_idea is provided (invisible extraction mode)
    const hasFullEssence = song_essence.emotional_start && song_essence.emotional_destination && song_essence.core_message
    const prompt = hasFullEssence
      ? buildSongLyricsPrompt(song_essence)
      : buildSimpleSongPrompt(song_essence.song_idea, song_essence.song_title)

    let toolConfig
    try {
      toolConfig = await getAIToolConfig('focus_story_generation')
    } catch {
      toolConfig = await getAIToolConfig('master_vision_assembly')
    }

    const estimatedTokens = estimateTokensForText(prompt, toolConfig.model_name)
    const tokenValidation = await validateTokenBalance(user.id, estimatedTokens, supabase)

    if (tokenValidation) {
      return new Response(JSON.stringify({
        error: tokenValidation.error,
        tokensRemaining: tokenValidation.tokensRemaining,
      }), { status: tokenValidation.status, headers: { 'Content-Type': 'application/json' } })
    }

    const entityId = body.entity_id || crypto.randomUUID()
    const title = body.title || `Song – ${song_essence.song_idea.slice(0, 40)}`

    let songId = body.song_id

    if (songId) {
      await supabase
        .from('songs')
        .update({
          status: 'generating_lyrics',
          song_essence,
          style_prompt: buildStylePrompt(song_essence),
          updated_at: new Date().toISOString(),
        })
        .eq('id', songId)
        .eq('user_id', user.id)
    } else {
      const { data: newSong, error: insertError } = await supabase
        .from('songs')
        .insert({
          user_id: user.id,
          entity_type,
          entity_id: entityId,
          title,
          song_essence,
          style_prompt: buildStylePrompt(song_essence),
          source: 'ai_generated',
          status: 'generating_lyrics',
          metadata: {},
          generation_count: 0,
        })
        .select('id')
        .single()

      if (insertError || !newSong) {
        throw new Error(`Failed to create song record: ${insertError?.message}`)
      }
      songId = newSong.id
    }

    console.log(`[SongLyrics] Song record: ${songId}, streaming with ${SONGWRITER_MODEL}`)

    const result = streamText({
      model: gateway(SONGWRITER_MODEL),
      system: MASTER_SONGWRITER_SYSTEM_PROMPT,
      prompt,
      temperature: 0.85,

      async onFinish({ text, usage, response }) {
        const elapsedMs = Date.now() - startTime
        console.log(`[SongLyrics] Completed in ${elapsedMs}ms`)

        await supabase
          .from('songs')
          .update({
            title,
            lyrics: stripLyricsTitleHeader(text),
            status: 'lyrics_complete',
            generation_count: 1,
            metadata: {
              prompt_version: 'songwriter-v2-no-coffee-opening',
              model_used: response?.modelId || SONGWRITER_MODEL,
            },
            updated_at: new Date().toISOString(),
          })
          .eq('id', songId)
          .eq('user_id', user.id)

        // Increment generation count
        try {
          await supabase.rpc('increment_song_generation_count', { song_id_param: songId })
        } catch {
          // Fallback: non-critical if RPC doesn't exist yet
        }

        if (usage) {
          trackTokenUsage({
            user_id: user.id,
            action_type: 'song_lyrics_generation',
            model_used: response?.modelId || SONGWRITER_MODEL,
            tokens_used: usage.totalTokens || 0,
            input_tokens: usage.inputTokens || 0,
            output_tokens: usage.outputTokens || 0,
            actual_cost_cents: 0,
            openai_request_id: response?.id,
            success: true,
            metadata: {
              entity_type,
              song_id: songId,
              elapsed_ms: elapsedMs,
            },
          }).catch(err => console.error('[SongLyrics] Token tracking failed:', err))
        }
      },
    })

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'X-Song-Id': songId!,
        'X-Entity-Type': entity_type,
        'Cache-Control': 'no-cache, no-transform',
      },
    })
  } catch (err) {
    console.error('[SongLyrics] Error:', err)
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Failed to generate lyrics',
    }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

function buildStylePrompt(essence: SongEssence): string {
  const parts = [essence.energy_style]
  if (essence.sliders.commercial_style) {
    parts.push(essence.sliders.commercial_style)
  }
  if (essence.sliders.energy) {
    parts.push(essence.sliders.energy)
  }
  return parts.join(', ')
}
