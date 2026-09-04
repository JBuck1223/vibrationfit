/**
 * Activation orchestrator — generates every asset from the single vision object.
 *
 * Two phases, both idempotent and failure-tolerant:
 *
 *  generateCoreAssets  (fast, synchronous — gates "Activation Ready")
 *    vision object → Future-Self Story + Incantation + SparkQuery (parallel)
 *    + manifestation rows (text only, images arrive in enrichment)
 *
 *  runEnrichment  (slow, called by the Immersion screen — never blocks entry)
 *    spoken audio (separate Life I Choose + Future-Self Story TTS tracks)
 *    + personalized song (lyrics → Mureka submit) + manifestation images
 *
 * Per-asset state lives in activations.asset_status:
 *   { [asset]: { state: 'pending'|'generating'|'ready'|'failed',
 *                retry_count, error_message, ... } }
 * A failed song never blocks the story; a failed image never blocks the
 * dashboard. Re-running either phase only regenerates missing/failed assets.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig, type AIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance, estimateTokensForText } from '@/lib/tokens/tracking'
import { createFreshStoryRecord } from '@/lib/stories/create-story-record'
import { generateAudioTracks } from '@/lib/services/audioService'
import { generateImage } from '@/lib/services/imageService'
import { mureka } from '@/lib/mureka/client'
import { stripLyricsTitleHeader } from '@/lib/utils/lyrics-alignment'
import {
  ACTIVATION_VISION_SYSTEM_PROMPT,
  buildActivationVisionPrompt,
} from '@/lib/viva/prompts/activation-experience-prompts'
import {
  FOCUS_STORY_SYSTEM_PROMPT,
  buildCustomStoryPrompt,
} from '@/lib/viva/prompts/focus-story-prompt'
import {
  INCANTATION_SYSTEM_PROMPT,
  buildIncantationPrompt,
} from '@/lib/viva/prompts/incantation-prompt'
import {
  SPARK_QUERY_SYSTEM_PROMPT,
  buildSparkQueryPrompt,
} from '@/lib/viva/prompts/spark-query-prompt'
import { getVisionCategoryLabel, type VisionCategoryKey } from '@/lib/design-system/vision-categories'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ActivationAssetKey =
  | 'vision' | 'story' | 'incantation' | 'spark_query'
  | 'audio' | 'song' | 'board'

export interface AssetState {
  state: 'pending' | 'generating' | 'ready' | 'failed'
  retry_count?: number
  error_message?: string | null
  started_at?: string
  finished_at?: string
  [key: string]: unknown
}

export type ActivationChatMessage = {
  role: 'user' | 'assistant'
  content: string
}

export type ActivationRow = {
  id: string
  user_id: string
  status: string
  current_state: string | null
  dream_response: Record<string, string> | null
  category: string | null
  desired_emotional_state: string | null
  reflection: string | null
  vision_statement: string | null
  essence: string | null
  story_id: string | null
  incantation_id: string | null
  spark_query_id: string | null
  song_id: string | null
  audio_set_id: string | null
  audio_track_id: string | null
  manifestation_ids: string[]
  asset_status: Record<string, AssetState>
  ready_at: string | null
  entered_at: string | null
  opened_at?: string | null
  conversation?: ActivationChatMessage[]
  prompt_version?: string | null
  intake_turn_count?: number
  intake_ready_at?: string | null
  needs_support?: boolean
  resume_email_sent_at?: string | null
}

// ---------------------------------------------------------------------------
// Asset-status helpers (read-modify-write; per-user flow, no real concurrency)
// ---------------------------------------------------------------------------

async function patchAssetStatus(
  supabase: SupabaseClient,
  activation: ActivationRow,
  key: ActivationAssetKey,
  patch: Partial<AssetState>,
): Promise<void> {
  const prev = activation.asset_status?.[key] || { state: 'pending' as const }
  const next = { ...prev, ...patch }
  activation.asset_status = { ...(activation.asset_status || {}), [key]: next }
  await supabase
    .from('activations')
    .update({ asset_status: activation.asset_status })
    .eq('id', activation.id)
}

function markFailure(prev: AssetState | undefined, error: unknown): Partial<AssetState> {
  return {
    state: 'failed',
    retry_count: (prev?.retry_count || 0) + 1,
    error_message: error instanceof Error ? error.message : String(error),
    finished_at: new Date().toISOString(),
  }
}

function isReady(activation: ActivationRow, key: ActivationAssetKey): boolean {
  return activation.asset_status?.[key]?.state === 'ready'
}

/** Treat 'generating' older than this as stale (crashed run) and retry. */
const STALE_GENERATING_MS = 5 * 60 * 1000

function isActivelyGenerating(activation: ActivationRow, key: ActivationAssetKey): boolean {
  const s = activation.asset_status?.[key]
  if (s?.state !== 'generating') return false
  const started = s.started_at ? new Date(s.started_at as string).getTime() : 0
  return Date.now() - started < STALE_GENERATING_MS
}

// ---------------------------------------------------------------------------
// Shared LLM helpers
// ---------------------------------------------------------------------------

async function loadToolConfig(primary: string): Promise<AIToolConfig> {
  try {
    return await getAIToolConfig(primary)
  } catch {
    try {
      return await getAIToolConfig('vision_refinement')
    } catch {
      return await getAIToolConfig('master_vision_assembly')
    }
  }
}

function parseJsonBlock<T>(raw: string): T | null {
  let text = raw.trim()
  if (text.startsWith('```')) {
    text = text.replace(/```json?\n?/g, '').replace(/```$/g, '').trim()
  }
  try {
    return JSON.parse(text) as T
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (match) {
      try { return JSON.parse(match[0]) as T } catch { return null }
    }
    return null
  }
}

type TrackableActionType =
  | 'vision_generation' | 'focus_story_generation'
  | 'incantation_generation' | 'spark_query_generation'

async function runTextGeneration(params: {
  userId: string
  activationId: string
  actionType: TrackableActionType
  toolKey: string
  system: string
  prompt: string
  promptVersion?: string | null
}): Promise<string> {
  const toolConfig = await loadToolConfig(params.toolKey)
  const result = await generateText({
    model: gateway(`openai/${toolConfig.model_name}`),
    system: params.system,
    prompt: params.prompt,
    temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
  })

  const inputTokens = result.usage?.inputTokens || 0
  const outputTokens = result.usage?.outputTokens || 0
  await trackTokenUsage({
    user_id: params.userId,
    action_type: params.actionType,
    model_used: result.response?.modelId || toolConfig.model_name,
    tokens_used: result.usage?.totalTokens || (inputTokens + outputTokens),
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    actual_cost_cents: 0,
    provider: 'vercel_gateway',
    provider_request_id: gatewayGenerationId(result),
    success: true,
    metadata: { feature: 'activation', activation_id: params.activationId, prompt_version: params.promptVersion || null },
  }).catch((err) => console.error('[activation] token tracking failed:', err))

  return result.text || ''
}

/** The source material every asset inherits: the user's words + vision object. */
function buildSourceContent(activation: ActivationRow): string {
  const parts: string[] = []
  if (activation.vision_statement) {
    parts.push(`LIFE I CHOOSE:\n${activation.vision_statement}`)
  }
  if (activation.essence) parts.push(`ESSENCE: ${activation.essence}`)
  if (activation.desired_emotional_state) {
    parts.push(`HOW IT FEELS: ${activation.desired_emotional_state}`)
  }
  if (activation.dream_response) {
    const dream = Object.entries(activation.dream_response)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}: ${v.trim()}`)
      .join('\n')
    if (dream) parts.push(`IN THEIR OWN WORDS:\n${dream}`)
  }
  return parts.join('\n\n')
}

// ---------------------------------------------------------------------------
// Phase 1 — core written assets (gates "Activation Ready")
// ---------------------------------------------------------------------------

interface VisionObject {
  vision_statement: string
  essence: string
  desired_emotional_state: string
  manifestation_desires: Array<{ title: string; description: string; image_prompt?: string }>
}

export async function generateCoreAssets(
  supabase: SupabaseClient,
  activation: ActivationRow,
  options?: { firstName?: string | null },
): Promise<{ ready: boolean; errors: string[] }> {
  const errors: string[] = []
  const userId = activation.user_id

  if (!activation.current_state?.trim() || !activation.category) {
    throw new Error('Activation is missing current state or category')
  }

  // Fail fast if the balance can't cover the core generation (~20k tokens)
  const balanceCheck = await validateTokenBalance(userId, 20_000, supabase)
  if (balanceCheck) {
    throw Object.assign(new Error(balanceCheck.error), {
      insufficientTokens: true,
      status: balanceCheck.status,
    })
  }

  await supabase.from('activations').update({ status: 'generating' }).eq('id', activation.id)

  // ---- 1. Vision object (everything else derives from it) ----
  if (!activation.vision_statement || !isReady(activation, 'vision')) {
    await patchAssetStatus(supabase, activation, 'vision', {
      state: 'generating', started_at: new Date().toISOString(),
    })
    try {
      const raw = await runTextGeneration({
        userId,
        activationId: activation.id,
        actionType: 'vision_generation',
        toolKey: 'master_vision_assembly',
        system: ACTIVATION_VISION_SYSTEM_PROMPT,
        prompt: buildActivationVisionPrompt({
          currentState: activation.current_state,
          reflection: activation.reflection,
          dreamResponse: activation.dream_response,
          category: activation.category,
          firstName: options?.firstName,
        }),
        promptVersion: activation.prompt_version,
      })
      const vision = parseJsonBlock<VisionObject>(raw)
      if (!vision?.vision_statement) throw new Error('Vision generation returned an unexpected format')

      activation.vision_statement = vision.vision_statement.trim()
      activation.essence = (vision.essence || '').trim() || null
      activation.desired_emotional_state =
        (vision.desired_emotional_state || '').trim() || activation.desired_emotional_state

      await supabase
        .from('activations')
        .update({
          vision_statement: activation.vision_statement,
          essence: activation.essence,
          desired_emotional_state: activation.desired_emotional_state,
        })
        .eq('id', activation.id)

      // Manifestation rows now (text only) — images arrive in enrichment
      const desires = (vision.manifestation_desires || []).slice(0, 3)
      const imagePrompts: Record<string, string> = {}
      if (desires.length > 0 && (activation.manifestation_ids || []).length === 0) {
        for (const desire of desires) {
          if (!desire.title?.trim() || !desire.description?.trim()) continue
          const { data: item } = await supabase
            .from('manifestations')
            .insert({
              user_id: userId,
              name: desire.title.trim(),
              description: desire.description.trim(),
              categories: [activation.category],
              status: 'active',
            })
            .select('id')
            .single()
          if (item) {
            activation.manifestation_ids = [...(activation.manifestation_ids || []), item.id]
            if (desire.image_prompt?.trim()) imagePrompts[item.id] = desire.image_prompt.trim()
          }
        }
        await supabase
          .from('activations')
          .update({ manifestation_ids: activation.manifestation_ids })
          .eq('id', activation.id)
      }

      await patchAssetStatus(supabase, activation, 'vision', {
        state: 'ready', error_message: null, finished_at: new Date().toISOString(),
      })
      await patchAssetStatus(supabase, activation, 'board', {
        state: activation.manifestation_ids.length > 0 ? 'pending' : 'failed',
        image_prompts: imagePrompts,
      })
    } catch (err) {
      await patchAssetStatus(supabase, activation, 'vision', markFailure(activation.asset_status?.vision, err))
      // Without the vision object nothing else can generate
      throw err
    }
  }

  const sourceContent = buildSourceContent(activation)
  const categoryLabel = getVisionCategoryLabel(activation.category as VisionCategoryKey) || activation.category

  // ---- 2. Story + Incantation + SparkQuery in parallel ----
  const tasks: Array<Promise<void>> = []

  if (!activation.story_id || !isReady(activation, 'story')) {
    tasks.push((async () => {
      await patchAssetStatus(supabase, activation, 'story', {
        state: 'generating', started_at: new Date().toISOString(),
      })
      try {
        const text = await runTextGeneration({
          userId,
          activationId: activation.id,
          actionType: 'focus_story_generation',
          toolKey: 'focus_story_generation',
          system: FOCUS_STORY_SYSTEM_PROMPT,
          prompt: buildCustomStoryPrompt(sourceContent, `My ${categoryLabel} Activation`),
          promptVersion: activation.prompt_version,
        })
        if (!text.trim()) throw new Error('Story generation returned empty text')
        const story = await createFreshStoryRecord(supabase, {
          userId,
          entityType: 'custom',
          entityId: activation.id,
          title: `Future-Self Story — ${categoryLabel}`,
          metadata: { feature: 'activation', activation_id: activation.id },
          status: 'completed',
        })
        await supabase
          .from('stories')
          .update({
            content: text.trim(),
            word_count: text.trim().split(/\s+/).length,
            status: 'completed',
          })
          .eq('id', story.id)
        activation.story_id = story.id
        await supabase.from('activations').update({ story_id: story.id }).eq('id', activation.id)
        await patchAssetStatus(supabase, activation, 'story', {
          state: 'ready', error_message: null, finished_at: new Date().toISOString(),
        })
      } catch (err) {
        errors.push(`story: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'story', markFailure(activation.asset_status?.story, err))
      }
    })())
  }

  if (!activation.incantation_id || !isReady(activation, 'incantation')) {
    tasks.push((async () => {
      await patchAssetStatus(supabase, activation, 'incantation', {
        state: 'generating', started_at: new Date().toISOString(),
      })
      try {
        const raw = await runTextGeneration({
          userId,
          activationId: activation.id,
          actionType: 'incantation_generation',
          toolKey: 'vision_refinement',
          system: INCANTATION_SYSTEM_PROMPT,
          prompt: buildIncantationPrompt({
            sourceContent,
            sourceLabel: 'Activation Vision',
            framework: 'self',
          }),
          promptVersion: activation.prompt_version,
        })
        const parsed = parseJsonBlock<{ text?: string; title?: string; variants?: Array<{ text: string }> }>(raw)
        const text = (parsed?.text || parsed?.variants?.[0]?.text || '').trim()
        if (!text) throw new Error('Incantation generation returned an unexpected format')
        const story = await createFreshStoryRecord(supabase, {
          userId,
          entityType: 'custom',
          entityId: activation.id,
          title: parsed?.title || `Incantation — ${categoryLabel}`,
          metadata: { feature: 'activation', activation_id: activation.id, is_incantation: true },
          status: 'completed',
        })
        await supabase.from('stories').update({ content: text, status: 'completed' }).eq('id', story.id)
        activation.incantation_id = story.id
        await supabase.from('activations').update({ incantation_id: story.id }).eq('id', activation.id)
        await patchAssetStatus(supabase, activation, 'incantation', {
          state: 'ready', error_message: null, finished_at: new Date().toISOString(),
        })
      } catch (err) {
        errors.push(`incantation: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'incantation', markFailure(activation.asset_status?.incantation, err))
      }
    })())
  }

  if (!activation.spark_query_id || !isReady(activation, 'spark_query')) {
    tasks.push((async () => {
      await patchAssetStatus(supabase, activation, 'spark_query', {
        state: 'generating', started_at: new Date().toISOString(),
      })
      try {
        const raw = await runTextGeneration({
          userId,
          activationId: activation.id,
          actionType: 'spark_query_generation',
          toolKey: 'spark_query_generation',
          system: SPARK_QUERY_SYSTEM_PROMPT,
          prompt: buildSparkQueryPrompt({
            sourceContent,
            sourceLabel: 'Activation Vision',
          }),
          promptVersion: activation.prompt_version,
        })
        const parsed = parseJsonBlock<{ title?: string; questions?: string[] }>(raw)
        const questions = (parsed?.questions || [])
          .filter((q): q is string => typeof q === 'string' && !!q.trim())
          .map((q) => (q.trim().endsWith('?') ? q.trim() : `${q.trim()}?`))
        if (questions.length === 0) throw new Error('SparkQuery generation returned an unexpected format')
        const story = await createFreshStoryRecord(supabase, {
          userId,
          entityType: 'custom',
          entityId: activation.id,
          title: parsed?.title || `SparkQuery — ${categoryLabel}`,
          metadata: {
            feature: 'activation',
            activation_id: activation.id,
            is_spark_query: true,
            questions,
          },
          status: 'completed',
        })
        await supabase.from('stories').update({ content: questions.join('\n\n'), status: 'completed' }).eq('id', story.id)
        activation.spark_query_id = story.id
        await supabase.from('activations').update({ spark_query_id: story.id }).eq('id', activation.id)
        await patchAssetStatus(supabase, activation, 'spark_query', {
          state: 'ready', error_message: null, finished_at: new Date().toISOString(),
        })
      } catch (err) {
        errors.push(`spark_query: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'spark_query', markFailure(activation.asset_status?.spark_query, err))
      }
    })())
  }

  await Promise.all(tasks)

  // Ready = the vision + at least the story exist. Incantation/SparkQuery
  // failures degrade gracefully (retry from the Immersion screen).
  const ready = !!activation.vision_statement && isReady(activation, 'story')
  if (ready && activation.status !== 'ready' && activation.status !== 'entered') {
    activation.status = 'ready'
    activation.ready_at = activation.ready_at || new Date().toISOString()
    await supabase
      .from('activations')
      .update({ status: 'ready', ready_at: activation.ready_at })
      .eq('id', activation.id)
  }

  return { ready, errors }
}

// ---------------------------------------------------------------------------
// Phase 2 — enrichment (audio, song, board images) — never gates entry
// ---------------------------------------------------------------------------

export async function runEnrichment(
  supabase: SupabaseClient,
  activation: ActivationRow,
): Promise<{ errors: string[] }> {
  const errors: string[] = []
  const userId = activation.user_id
  const now = () => new Date().toISOString()

  const tasks: Array<Promise<void>> = []

  // ---- Spoken audio: one TTS track per written asset, not a combined read-through ----
  const AUDIO_SECTION_VISION = 'life_i_choose'
  const AUDIO_SECTION_STORY = 'future_self_story'

  if (!isActivelyGenerating(activation, 'audio') && (activation.vision_statement || activation.story_id)) {
    tasks.push((async () => {
      try {
        const { data: story } = activation.story_id
          ? await supabase
              .from('stories')
              .select('id, content')
              .eq('id', activation.story_id)
              .single()
          : { data: null }

        const desiredSections: Array<{ sectionKey: string; text: string }> = []
        if (activation.vision_statement?.trim()) {
          desiredSections.push({ sectionKey: AUDIO_SECTION_VISION, text: activation.vision_statement.trim() })
        }
        if (story?.content?.trim()) {
          desiredSections.push({ sectionKey: AUDIO_SECTION_STORY, text: story.content.trim() })
        }
        if (desiredSections.length === 0) throw new Error('Nothing to narrate')

        // Re-run even when asset_status.audio is 'ready' so older combined
        // "activation" tracks get split into the two matching sections.
        let existingKeys = new Set<string>()
        if (activation.audio_set_id) {
          const { data: existingTracks } = await supabase
            .from('audio_tracks')
            .select('section_key')
            .eq('audio_set_id', activation.audio_set_id)
            .eq('status', 'completed')
          existingKeys = new Set((existingTracks || []).map((t) => t.section_key))
        }
        const missingSections = desiredSections.filter((s) => !existingKeys.has(s.sectionKey))
        if (missingSections.length === 0) {
          if (!isReady(activation, 'audio')) {
            await patchAssetStatus(supabase, activation, 'audio', {
              state: 'ready', error_message: null, finished_at: now(),
            })
          }
          return
        }

        await patchAssetStatus(supabase, activation, 'audio', { state: 'generating', started_at: now() })

        const contentId = story?.id || activation.id
        let audioSetId = activation.audio_set_id
        if (!audioSetId) {
          const { data: audioSet, error: setErr } = await supabase
            .from('audio_sets')
            .insert({
              user_id: userId,
              content_type: story?.id ? 'story' : 'custom',
              content_id: contentId,
              name: 'Activation Audio',
              description: 'Spoken Life I Choose and Future-Self Story as separate tracks',
              variant: 'standard',
              voice_id: 'nova',
              is_active: true,
            })
            .select('id')
            .single()
          if (setErr || !audioSet) throw setErr || new Error('Failed to create audio set')
          audioSetId = audioSet.id
          activation.audio_set_id = audioSetId
          await supabase.from('activations').update({ audio_set_id: audioSetId }).eq('id', activation.id)
        }

        const results = await generateAudioTracks({
          userId,
          contentType: story?.id ? 'story' : 'custom',
          contentId,
          sections: missingSections,
          voice: 'nova',
          format: 'mp3',
          audioSetId: audioSetId ?? undefined,
          audioSetName: 'Activation Audio',
          variant: 'standard',
        })
        const failed = results.filter((r) => r.status === 'failed')
        const ok = results.filter((r) => r.status !== 'failed')
        if (ok.length === 0) {
          throw new Error(failed[0]?.error || 'Audio generation failed')
        }

        const { data: tracks } = await supabase
          .from('audio_tracks')
          .select('id, section_key, audio_url')
          .eq('audio_set_id', audioSetId)
          .eq('status', 'completed')
        const visionTrack = (tracks || []).find((t) => t.section_key === AUDIO_SECTION_VISION)
        if (visionTrack) {
          activation.audio_track_id = visionTrack.id
          await supabase.from('activations').update({ audio_track_id: visionTrack.id }).eq('id', activation.id)
        }

        if (failed.length > 0) {
          throw new Error(failed.map((r) => r.error || r.sectionKey).join('; '))
        }

        await patchAssetStatus(supabase, activation, 'audio', {
          state: 'ready',
          error_message: null,
          finished_at: now(),
          tracks: (tracks || []).map((t) => ({ section_key: t.section_key, audio_url: t.audio_url })),
        })
      } catch (err) {
        errors.push(`audio: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'audio', markFailure(activation.asset_status?.audio, err))
      }
    })())
  }

  // ---- Personalized song (lyrics → Mureka submit; client polls completion) ----
  if (!isReady(activation, 'song') && !isActivelyGenerating(activation, 'song') && activation.vision_statement) {
    tasks.push((async () => {
      await patchAssetStatus(supabase, activation, 'song', { state: 'generating', started_at: now() })
      try {
        let songId = activation.song_id

        // Reuse an existing lyrics-complete song row when retrying
        let lyrics: string | null = null
        if (songId) {
          const { data: existing } = await supabase
            .from('songs')
            .select('id, lyrics, status, metadata')
            .eq('id', songId)
            .single()
          lyrics = existing?.lyrics || null
          if (existing?.status === 'generating_music' || existing?.status === 'completed') {
            await patchAssetStatus(supabase, activation, 'song', {
              state: existing.status === 'completed' ? 'ready' : 'generating',
              mureka_task_id: (existing.metadata as Record<string, unknown>)?.mureka_task_id,
            })
            return
          }
        }

        if (!lyrics) {
          const songIdea = [
            activation.vision_statement,
            activation.essence ? `The feeling at the center: ${activation.essence}` : '',
            activation.desired_emotional_state || '',
          ].filter(Boolean).join('\n')

          const { buildSimpleSongPrompt, MASTER_SONGWRITER_SYSTEM_PROMPT } =
            await import('@/lib/viva/prompts/song-lyrics-prompt')

          const result = await generateText({
            model: gateway('claude-opus-4-5'),
            system: MASTER_SONGWRITER_SYSTEM_PROMPT,
            prompt: buildSimpleSongPrompt(songIdea),
            temperature: 0.85,
          })
          lyrics = stripLyricsTitleHeader(result.text || '')
          if (!lyrics.trim()) throw new Error('Lyrics generation returned empty text')

          await trackTokenUsage({
            user_id: userId,
            action_type: 'song_lyrics_generation',
            model_used: result.response?.modelId || 'claude-opus-4-5',
            tokens_used: result.usage?.totalTokens || 0,
            input_tokens: result.usage?.inputTokens || 0,
            output_tokens: result.usage?.outputTokens || 0,
            actual_cost_cents: 0,
            provider: 'vercel_gateway',
            provider_request_id: gatewayGenerationId(result),
            success: true,
            metadata: { feature: 'activation', activation_id: activation.id },
          }).catch(() => {})
        }

        const stylePrompt = `uplifting, emotional, cinematic, modern${activation.essence ? `, evoking ${activation.essence}` : ''}`

        if (!songId) {
          const { data: newSong, error: songErr } = await supabase
            .from('songs')
            .insert({
              user_id: userId,
              entity_type: 'custom',
              entity_id: activation.id,
              title: `My Activation Song`,
              lyrics,
              style_prompt: stylePrompt,
              source: 'ai_generated',
              status: 'lyrics_complete',
              metadata: { feature: 'activation', activation_id: activation.id },
              generation_count: 1,
              life_categories: activation.category ? [activation.category] : [],
            })
            .select('id')
            .single()
          if (songErr || !newSong) throw songErr || new Error('Failed to create song record')
          songId = newSong.id
          activation.song_id = songId
          await supabase.from('activations').update({ song_id: songId }).eq('id', activation.id)
        }

        const murekaResponse = await mureka.generateSong({
          lyrics: stripLyricsTitleHeader(lyrics),
          prompt: stylePrompt,
          model: 'auto',
        })

        await supabase
          .from('songs')
          .update({
            status: 'generating_music',
            metadata: {
              feature: 'activation',
              activation_id: activation.id,
              mureka_task_id: murekaResponse.id,
              mureka_model: murekaResponse.model,
              mureka_trace_id: murekaResponse.trace_id,
            },
            updated_at: now(),
          })
          .eq('id', songId)

        // Stays 'generating' — the Immersion screen polls /api/songs/poll/[taskId]
        // and GET /api/activation/[id] flips this to 'ready' when the song lands.
        await patchAssetStatus(supabase, activation, 'song', {
          state: 'generating', mureka_task_id: murekaResponse.id, error_message: null,
        })
      } catch (err) {
        errors.push(`song: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'song', markFailure(activation.asset_status?.song, err))
      }
    })())
  }

  // ---- Manifestation images ----
  if (!isReady(activation, 'board') && !isActivelyGenerating(activation, 'board') && (activation.manifestation_ids || []).length > 0) {
    tasks.push((async () => {
      const imagePrompts =
        (activation.asset_status?.board?.image_prompts as Record<string, string> | undefined) || {}
      await patchAssetStatus(supabase, activation, 'board', { state: 'generating', started_at: now() })
      try {
        const { data: items } = await supabase
          .from('manifestations')
          .select('id, name, description, image_url')
          .in('id', activation.manifestation_ids)

        let attempted = 0
        let failures = 0
        for (const item of items || []) {
          if (item.image_url) continue
          attempted++
          try {
            const result = await generateImage({
              userId,
              prompt: imagePrompts[item.id] || `${item.name}. ${item.description || ''}`,
              dimension: 'landscape_4_3',
              quality: 'standard',
              style: 'vivid',
              context: 'vision_board',
            })
            if (result.success && result.imageUrl) {
              await supabase
                .from('manifestations')
                .update({ image_url: result.imageUrl, updated_at: now() })
                .eq('id', item.id)
            } else {
              failures++
            }
          } catch {
            failures++
          }
        }

        if (attempted > 0 && failures === attempted) {
          throw new Error(`${failures} image(s) failed to generate`)
        }
        await patchAssetStatus(supabase, activation, 'board', {
          state: 'ready', error_message: null, finished_at: now(),
        })
      } catch (err) {
        errors.push(`board: ${err instanceof Error ? err.message : err}`)
        await patchAssetStatus(supabase, activation, 'board', markFailure(activation.asset_status?.board, err))
      }
    })())
  }

  await Promise.allSettled(tasks)
  return { errors }
}
