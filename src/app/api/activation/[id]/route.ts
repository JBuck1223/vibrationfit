/**
 * Activation record API.
 *
 * GET   /api/activation/[id]  — activation + joined assets for the wizard and
 *                               Immersion screen. Lazily syncs the song's
 *                               asset state (Mureka completes via the songs
 *                               poll endpoint) and records activation_enriched
 *                               once when every enrichment asset is terminal.
 * PATCH /api/activation/[id]  — persist intake fields and the explicit user
 *                               moments: orient, open, enter, inspired step.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { recordActivationEvent } from '@/lib/activation/events'
import type { ActivationChatMessage, ActivationRow, AssetState } from '@/lib/activation/orchestrator'
import { LIFE_CATEGORY_KEYS, getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'
import { ACTIVATION_COPY } from '@/lib/activation/copy'

export const dynamic = 'force-dynamic'

async function loadOwnedActivation(id: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: NextResponse.json({ error: 'Authentication required' }, { status: 401 }) }

  const { data: activation, error } = await supabase
    .from('activations')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !activation) {
    return { error: NextResponse.json({ error: 'Activation not found' }, { status: 404 }) }
  }
  return { supabase, user, activation: activation as ActivationRow }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const loaded = await loadOwnedActivation(id)
    if ('error' in loaded) return loaded.error
    const { supabase, activation } = loaded

    // ---- Joined assets ----
    const storyIds = [activation.story_id, activation.incantation_id, activation.spark_query_id]
      .filter((v): v is string => !!v)
    const [storiesRes, songRes, trackRes, boardRes] = await Promise.all([
      storyIds.length
        ? supabase.from('stories').select('id, title, content, metadata, audio_set_id').in('id', storyIds)
        : Promise.resolve({ data: [] as any[] }),
      activation.song_id
        ? supabase.from('songs').select('id, title, lyrics, status, metadata').eq('id', activation.song_id).maybeSingle()
        : Promise.resolve({ data: null }),
      activation.audio_set_id
        ? supabase.from('audio_tracks').select('id, audio_url, duration_seconds, section_key').eq('audio_set_id', activation.audio_set_id).eq('status', 'completed').order('created_at', { ascending: true })
        : Promise.resolve({ data: [] as any[] }),
      (activation.manifestation_ids || []).length
        ? supabase.from('manifestations').select('id, name, description, image_url, categories').in('id', activation.manifestation_ids)
        : Promise.resolve({ data: [] as any[] }),
    ])

    const stories = storiesRes.data || []
    const song = songRes.data as { id: string; title: string; lyrics: string; status: string; metadata: Record<string, unknown> } | null
    const audioTracks = (trackRes.data || []) as Array<{
      id: string; audio_url: string; duration_seconds: number; section_key: string
    }>
    const manifestations = boardRes.data || []

    let songTracks: Array<{ id: string; audio_url: string; cover_url: string | null; title: string | null }> = []
    if (song && (song.status === 'completed' || song.status === 'generating_music')) {
      const { data } = await supabase
        .from('song_tracks')
        .select('id, mp3_url, cover_url, title')
        .eq('song_id', song.id)
        .not('mp3_url', 'is', null)
        .order('created_at', { ascending: true })
      songTracks = (data || [])
        .filter((t): t is typeof t & { mp3_url: string } => !!t.mp3_url)
        .map((t) => ({
          id: t.id,
          audio_url: t.mp3_url,
          cover_url: t.cover_url,
          title: t.title,
        }))
    }

    // ---- Lazy sync: song asset state follows the songs row ----
    const assetStatus: Record<string, AssetState> = { ...(activation.asset_status || {}) }
    let statusDirty = false
    if (song && assetStatus.song?.state === 'generating') {
      if (song.status === 'completed') {
        assetStatus.song = { ...assetStatus.song, state: 'ready', finished_at: new Date().toISOString() }
        statusDirty = true
      } else if (song.status === 'failed') {
        assetStatus.song = { ...assetStatus.song, state: 'failed', error_message: 'Song generation failed' }
        statusDirty = true
      }
    }

    // ---- activation_enriched: once, when all enrichment assets are terminal ----
    const enrichKeys = ['audio', 'song', 'board'] as const
    const attempted = enrichKeys.filter((k) => assetStatus[k])
    const allTerminal = attempted.length > 0 &&
      attempted.every((k) => ['ready', 'failed'].includes(assetStatus[k]?.state))
    const anyReady = attempted.some((k) => assetStatus[k]?.state === 'ready')
    if (allTerminal && anyReady && !assetStatus.meta?.enriched_recorded) {
      assetStatus.meta = { ...(assetStatus.meta || { state: 'ready' }), enriched_recorded: true } as AssetState
      statusDirty = true
      await recordActivationEvent(createAdminClient(), {
        eventType: 'activation_enriched',
        activationId: activation.id,
        userId: activation.user_id,
        eventData: Object.fromEntries(enrichKeys.map((k) => [k, assetStatus[k]?.state || 'pending'])),
      })
    }

    if (statusDirty) {
      await supabase.from('activations').update({ asset_status: assetStatus }).eq('id', activation.id)
    }

    return NextResponse.json({
      activation: { ...activation, asset_status: assetStatus },
      assets: {
        story: stories.find((s) => s.id === activation.story_id) || null,
        incantation: stories.find((s) => s.id === activation.incantation_id) || null,
        sparkQuery: stories.find((s) => s.id === activation.spark_query_id) || null,
        song: song ? { ...song, tracks: songTracks } : null,
        audioTracks,
        manifestations,
      },
    })
  } catch (error) {
    console.error('[activation GET] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

const WIZARD_STATUSES = ['started', 'oriented', 'current_state', 'dream', 'category_confirmed'] as const

function openingMessage(firstName: string | null | undefined, category: string): ActivationChatMessage {
  const label = getVisionCategoryLabel(category as VisionCategoryKey)
  return { role: 'assistant', content: ACTIVATION_COPY.chat.opening(firstName, label) }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    const loaded = await loadOwnedActivation(id)
    if ('error' in loaded) return loaded.error
    const { supabase, user, activation } = loaded

    const body = await request.json()
    const updates: Record<string, unknown> = {}
    const admin = createAdminClient()

    if (typeof body.current_state === 'string') updates.current_state = body.current_state
    if (body.dream_response && typeof body.dream_response === 'object') {
      updates.dream_response = body.dream_response
    }
    if (typeof body.desired_emotional_state === 'string') {
      updates.desired_emotional_state = body.desired_emotional_state
    }
    if (typeof body.category === 'string') {
      if (!(LIFE_CATEGORY_KEYS as readonly string[]).includes(body.category)) {
        return NextResponse.json({ error: 'Invalid category' }, { status: 400 })
      }
      updates.category = body.category
    }
    if (typeof body.inspired_next_step === 'string' && body.inspired_next_step.trim()) {
      updates.inspired_next_step = body.inspired_next_step.trim()
      await recordActivationEvent(admin, {
        eventType: 'inspired_step_saved',
        activationId: activation.id,
        userId: activation.user_id,
      })
    }
    if (typeof body.status === 'string') {
      if (!(WIZARD_STATUSES as readonly string[]).includes(body.status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      if (!['ready', 'opened', 'entered', 'generating'].includes(activation.status)) {
        updates.status = body.status
        if (body.status === 'category_confirmed' && activation.status !== 'category_confirmed') {
          await recordActivationEvent(admin, {
            eventType: 'category_confirmed',
            activationId: activation.id,
            userId: activation.user_id,
            eventData: { category: body.category || activation.category },
          })
        }
      }
    }

    if (body.action === 'orient' && ['started', 'current_state', 'dream'].includes(activation.status)) {
      updates.status = 'oriented'
      await recordActivationEvent(admin, {
        eventType: 'activation_oriented',
        activationId: activation.id,
        userId: activation.user_id,
      })
    }

    if (body.action === 'choose_category') {
      const chosen = typeof body.category === 'string' ? body.category : ''
      if (!(LIFE_CATEGORY_KEYS as readonly string[]).includes(chosen)) {
        return NextResponse.json({ error: 'Choose a life category' }, { status: 400 })
      }
      if (['ready', 'opened', 'entered', 'generating'].includes(activation.status)) {
        return NextResponse.json({ error: 'This Activation is already past intake' }, { status: 409 })
      }
      updates.category = chosen
      if (activation.status === 'oriented' || activation.status === 'started') {
        updates.status = 'oriented'
      }
      const existing = Array.isArray(activation.conversation) ? activation.conversation : []
      const userHasSpoken = existing.some((m) => m.role === 'user')
      if (!userHasSpoken) {
        const firstName =
          (user.user_metadata?.first_name as string | undefined) ||
          (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
          null
        updates.conversation = [openingMessage(firstName, chosen)]
      }
      if (activation.category !== chosen) {
        await recordActivationEvent(admin, {
          eventType: 'category_confirmed',
          activationId: activation.id,
          userId: activation.user_id,
          eventData: { category: chosen, source: 'member_pick' },
        })
      }
    }

    // Enter My Activation — Preview → Immersion. Not the north-star.
    if (body.action === 'open' && !activation.opened_at && ['ready', 'opened'].includes(activation.status)) {
      updates.status = 'opened'
      updates.opened_at = new Date().toISOString()
      await recordActivationEvent(admin, {
        eventType: 'activation_opened',
        activationId: activation.id,
        userId: activation.user_id,
        eventData: { category: activation.category },
      })
    }

    // I've Entered This Reality — after Start Here. North-star metric.
    if (body.action === 'enter' && !activation.entered_at) {
      updates.status = 'entered'
      updates.entered_at = new Date().toISOString()
      if (!activation.opened_at) updates.opened_at = new Date().toISOString()
      await recordActivationEvent(admin, {
        eventType: 'activation_entered',
        activationId: activation.id,
        userId: activation.user_id,
        eventData: { category: activation.category },
      })
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ activation })
    }

    const { data: updated, error } = await supabase
      .from('activations')
      .update(updates)
      .eq('id', activation.id)
      .select()
      .single()
    if (error) {
      console.error('[activation PATCH] update failed:', error)
      return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
    }

    return NextResponse.json({ activation: updated })
  } catch (error) {
    console.error('[activation PATCH] error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
