/**
 * Songs collection API
 *
 * POST /api/songs
 *   Creates a song record WITHOUT generating music or regenerating lyrics.
 *   Used to (a) save a member's pasted/edited lyrics exactly as written before
 *   music generation, and (b) save a draft to return to later.
 *
 * Body: {
 *   entity_type?, entity_id?, title?, lyrics?, song_idea?,
 *   style_prompt?, source?, life_categories?
 * }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { stripLyricsTitleHeader } from '@/lib/utils/lyrics-alignment'
import type { SongEntityType, SongSource, SongEssence } from '@/lib/songs/types'

export const dynamic = 'force-dynamic'

interface CreateSongBody {
  entity_type?: SongEntityType
  entity_id?: string
  title?: string
  lyrics?: string
  song_idea?: string
  style_prompt?: string
  source?: SongSource
  life_categories?: string[]
}

const VALID_ENTITY_TYPES: SongEntityType[] = ['life_vision', 'vision_board_item', 'journal_entry', 'custom']
const VALID_SOURCES: SongSource[] = ['ai_generated', 'user_written', 'ai_assisted']

function buildMinimalEssence(idea: string, title?: string): SongEssence {
  return {
    song_idea: idea,
    song_title: title || undefined,
    emotional_start: '',
    emotional_destination: '',
    core_message: '',
    imagery: [],
    energy_style: '',
    sliders: {
      emotional_intensity: 7,
      spiritual_depth: 4,
      energy: 'uplifting',
      lyrical_style: 'conversational',
      commercial_style: 'indie',
    },
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: CreateSongBody = await request.json()

    const entityType: SongEntityType = VALID_ENTITY_TYPES.includes(body.entity_type as SongEntityType)
      ? (body.entity_type as SongEntityType)
      : 'custom'
    const source: SongSource = VALID_SOURCES.includes(body.source as SongSource)
      ? (body.source as SongSource)
      : 'user_written'

    const cleanLyrics = body.lyrics ? stripLyricsTitleHeader(body.lyrics.trim()) : ''
    const idea = (body.song_idea || '').trim()
    const title = (body.title || '').trim() || (idea ? `Song – ${idea.slice(0, 40)}` : 'Untitled Song')

    const insert: Record<string, unknown> = {
      user_id: user.id,
      entity_type: entityType,
      entity_id: body.entity_id || crypto.randomUUID(),
      title,
      lyrics: cleanLyrics || null,
      song_essence: buildMinimalEssence(idea, title),
      style_prompt: body.style_prompt?.trim() || null,
      source,
      status: cleanLyrics ? 'lyrics_complete' : 'draft',
      metadata: {},
      generation_count: 0,
    }

    if (Array.isArray(body.life_categories)) {
      insert.life_categories = body.life_categories
    }

    const { data: song, error } = await supabase
      .from('songs')
      .insert(insert)
      .select('id, title, lyrics, style_prompt, status, generation_count, metadata')
      .single()

    if (error || !song) {
      return NextResponse.json({ error: error?.message || 'Failed to create song' }, { status: 500 })
    }

    return NextResponse.json({ song })
  } catch (err) {
    console.error('[SongCreate] Error:', err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Failed to create song',
    }, { status: 500 })
  }
}
