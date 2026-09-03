/**
 * Activation Kit orchestrator — generates a member's default vision assets
 * after a Life Vision is committed as active.
 *
 * Three assets, all idempotent and failure-tolerant (same asset_status pattern
 * as the Activation Experience orchestrator in src/lib/activation/):
 *
 *   voice  — per-section TTS of the committed vision (variant 'standard').
 *            Unchanged sections reuse existing tracks via content-hash dedupe,
 *            so only refined categories cost TTS. A combined "full" track is
 *            concatenated via Lambda afterwards.
 *   mix    — voice tracks + background/binaural per the kit's saved preset,
 *            mixed by the audio-mixer Lambda (async; sync via syncKitRunStatus).
 *   board  — one manifestation (title/description/image) distilled per refined
 *            life category, landing on the member's board at /manifestations.
 *
 * Per-asset state lives in activation_kit_runs.asset_status:
 *   { [voice|mix|board]: { state: 'pending'|'generating'|'ready'|'failed',
 *                          retry_count, error_message, ... } }
 * Re-running only regenerates missing/failed assets. A failed image never
 * blocks the mix; a failed mix never blocks the voice tracks.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { generateText } from 'ai'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import { gateway, gatewayGenerationId } from '@/lib/ai/gateway'
import { getAIToolConfig, type AIToolConfig } from '@/lib/ai/database-config'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'
import {
  generateAudioTracks,
  generateFullVoiceTrack,
  hashContent,
} from '@/lib/services/audioService'
import { generateImage } from '@/lib/services/imageService'
import { parseVoiceId, getVoiceVibe } from '@/lib/audio/voice-vibes'
import {
  ORDERED_VISION_CATEGORIES,
  LIFE_CATEGORY_KEYS,
  getVisionCategoryLabel,
  type VisionCategoryKey,
} from '@/lib/design-system/vision-categories'
import {
  KIT_BOARD_MANIFESTATION_SYSTEM_PROMPT,
  buildKitBoardManifestationPrompt,
} from '@/lib/viva/prompts/activation-kit-prompts'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type KitAssetKey = 'voice' | 'mix' | 'board'

export interface KitSettings {
  include_voice: boolean
  include_mix: boolean
  include_board: boolean
  /** OpenAI voice or composite "voice__vibe" (see voice-vibes.ts) */
  voice_id: string
  background_track_id: string | null
  voice_volume: number
  bg_volume: number
  binaural_track_id: string | null
  binaural_volume: number
  mix_output_format: 'individual' | 'combined' | 'both'
}

export interface KitAssetState {
  state: 'pending' | 'generating' | 'ready' | 'failed'
  retry_count?: number
  error_message?: string | null
  started_at?: string
  finished_at?: string
  [key: string]: unknown
}

export type KitRunRow = {
  id: string
  user_id: string
  vision_id: string
  kit_id: string | null
  settings: KitSettings
  status: 'running' | 'completed' | 'partial' | 'failed'
  asset_status: Record<string, KitAssetState>
  voice_audio_set_id: string | null
  mix_audio_set_id: string | null
  mix_batch_id: string | null
  manifestation_ids: string[]
  completed_at: string | null
}

const VISION_CATEGORY_COLUMNS = ORDERED_VISION_CATEGORIES.map((c) => c.key)

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com'

/** Treat 'generating' older than this as stale (crashed run) and retry. */
const STALE_GENERATING_MS = 10 * 60 * 1000

// ---------------------------------------------------------------------------
// Asset-status helpers
// ---------------------------------------------------------------------------

async function patchAssetStatus(
  supabase: SupabaseClient,
  run: KitRunRow,
  key: KitAssetKey,
  patch: Partial<KitAssetState>,
): Promise<void> {
  const prev = run.asset_status?.[key] || { state: 'pending' as const }
  const next = { ...prev, ...patch }
  run.asset_status = { ...(run.asset_status || {}), [key]: next }
  await supabase
    .from('activation_kit_runs')
    .update({ asset_status: run.asset_status })
    .eq('id', run.id)
}

function markFailure(prev: KitAssetState | undefined, error: unknown): Partial<KitAssetState> {
  return {
    state: 'failed',
    retry_count: (prev?.retry_count || 0) + 1,
    error_message: error instanceof Error ? error.message : String(error),
    finished_at: new Date().toISOString(),
  }
}

function isReady(run: KitRunRow, key: KitAssetKey): boolean {
  return run.asset_status?.[key]?.state === 'ready'
}

function isActivelyGenerating(run: KitRunRow, key: KitAssetKey): boolean {
  const s = run.asset_status?.[key]
  if (s?.state !== 'generating') return false
  const started = s.started_at ? new Date(s.started_at as string).getTime() : 0
  return Date.now() - started < STALE_GENERATING_MS
}

// ---------------------------------------------------------------------------
// Overall run status
// ---------------------------------------------------------------------------

function enabledAssets(settings: KitSettings): KitAssetKey[] {
  const keys: KitAssetKey[] = []
  if (settings.include_voice || settings.include_mix) keys.push('voice')
  if (settings.include_mix) keys.push('mix')
  if (settings.include_board) keys.push('board')
  return keys
}

async function updateOverallStatus(supabase: SupabaseClient, run: KitRunRow): Promise<void> {
  const assets = enabledAssets(run.settings)
  const states = assets.map((k) => run.asset_status?.[k]?.state || 'pending')

  let status: KitRunRow['status']
  if (states.some((s) => s === 'generating' || s === 'pending')) {
    status = 'running'
  } else if (states.every((s) => s === 'ready')) {
    status = 'completed'
  } else if (states.every((s) => s === 'failed')) {
    status = 'failed'
  } else {
    status = 'partial'
  }

  const update: Record<string, unknown> = { status }
  if (status !== 'running' && !run.completed_at) {
    run.completed_at = new Date().toISOString()
    update.completed_at = run.completed_at
  }
  run.status = status
  await supabase.from('activation_kit_runs').update(update).eq('id', run.id)
}

// ---------------------------------------------------------------------------
// Vision sections
// ---------------------------------------------------------------------------

type VisionRow = Record<string, string | null> & {
  id: string
  refined_categories: string[] | null
  household_id: string | null
}

async function loadVision(supabase: SupabaseClient, visionId: string): Promise<VisionRow> {
  const { data, error } = await supabase
    .from('vision_versions')
    .select(`id, household_id, refined_categories, ${VISION_CATEGORY_COLUMNS.join(', ')}`)
    .eq('id', visionId)
    .single()
  if (error || !data) throw error || new Error('Vision not found')
  return data as unknown as VisionRow
}

function visionSections(vision: VisionRow): Array<{ sectionKey: string; text: string }> {
  return VISION_CATEGORY_COLUMNS
    .map((key) => ({ sectionKey: key, text: (vision[key] || '').trim() }))
    .filter((s) => s.text.length > 0)
}

// ---------------------------------------------------------------------------
// Main entry — run every enabled asset that isn't already done
// ---------------------------------------------------------------------------

export async function runActivationKit(
  supabase: SupabaseClient,
  run: KitRunRow,
): Promise<{ errors: string[] }> {
  const errors: string[] = []
  const settings = run.settings
  const now = () => new Date().toISOString()

  // Fail fast if the balance can't cover generation
  const balanceCheck = await validateTokenBalance(run.user_id, 10_000, supabase)
  if (balanceCheck) {
    throw Object.assign(new Error(balanceCheck.error), {
      insufficientTokens: true,
      status: balanceCheck.status,
    })
  }

  const vision = await loadVision(supabase, run.vision_id)
  const sections = visionSections(vision)
  if (sections.length === 0) throw new Error('This vision has no written categories yet')

  // ---- 1. Voice tracks (required for mixes too) ----
  const voiceNeeded = settings.include_voice || settings.include_mix
  if (voiceNeeded && !isReady(run, 'voice') && !isActivelyGenerating(run, 'voice')) {
    await patchAssetStatus(supabase, run, 'voice', { state: 'generating', started_at: now() })
    try {
      const results = await generateAudioTracks({
        userId: run.user_id,
        visionId: run.vision_id,
        sections,
        voice: settings.voice_id,
        variant: 'standard',
      })

      const succeeded = results.filter((r) => r.status !== 'failed')
      if (succeeded.length === 0) {
        throw new Error(results[0]?.error || 'All voice tracks failed to generate')
      }

      // Resolve the "Standard Version" set generateAudioTracks used/created
      const { data: audioSet } = await supabase
        .from('audio_sets')
        .select('id')
        .eq('vision_id', run.vision_id)
        .eq('variant', 'standard')
        .eq('voice_id', settings.voice_id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (audioSet) {
        run.voice_audio_set_id = audioSet.id
        await supabase
          .from('activation_kit_runs')
          .update({ voice_audio_set_id: audioSet.id })
          .eq('id', run.id)

        // Combined full track (Lambda concat — free, arrives async)
        if (succeeded.length > 1) {
          await generateFullVoiceTrack(run.user_id, run.vision_id, audioSet.id, settings.voice_id)
            .catch((err) => console.error('[activation-kit] full voice track failed:', err))
        }
      }

      const failedCount = results.length - succeeded.length
      await patchAssetStatus(supabase, run, 'voice', {
        state: 'ready',
        error_message: failedCount > 0 ? `${failedCount} section(s) failed` : null,
        finished_at: now(),
        sections_total: results.length,
        sections_failed: failedCount,
      })
    } catch (err) {
      errors.push(`voice: ${err instanceof Error ? err.message : err}`)
      await patchAssetStatus(supabase, run, 'voice', markFailure(run.asset_status?.voice, err))
    }
  }

  // ---- 2. Mix (needs completed voice tracks) ----
  if (
    settings.include_mix &&
    !isReady(run, 'mix') &&
    !isActivelyGenerating(run, 'mix') &&
    isReady(run, 'voice')
  ) {
    await patchAssetStatus(supabase, run, 'mix', { state: 'generating', started_at: now() })
    try {
      await startMixGeneration(supabase, run, sections)
      // Stays 'generating' — the audio-mixer Lambda finishes async;
      // syncKitRunStatus flips this to 'ready' from the batch/track state.
    } catch (err) {
      errors.push(`mix: ${err instanceof Error ? err.message : err}`)
      await patchAssetStatus(supabase, run, 'mix', markFailure(run.asset_status?.mix, err))
    }
  }

  // ---- 3. Board manifestations ----
  if (settings.include_board && !isReady(run, 'board') && !isActivelyGenerating(run, 'board')) {
    await patchAssetStatus(supabase, run, 'board', { state: 'generating', started_at: now() })
    try {
      const created = await generateBoardManifestations(supabase, run, vision)
      await patchAssetStatus(supabase, run, 'board', {
        state: 'ready',
        error_message: null,
        finished_at: now(),
        manifestations_created: created,
      })
    } catch (err) {
      errors.push(`board: ${err instanceof Error ? err.message : err}`)
      await patchAssetStatus(supabase, run, 'board', markFailure(run.asset_status?.board, err))
    }
  }

  await updateOverallStatus(supabase, run)
  return { errors }
}

// ---------------------------------------------------------------------------
// Mix — lean vision-only version of /api/audio/generate-custom-mix
// ---------------------------------------------------------------------------

async function startMixGeneration(
  supabase: SupabaseClient,
  run: KitRunRow,
  sections: Array<{ sectionKey: string; text: string }>,
): Promise<void> {
  const settings = run.settings

  if (!settings.background_track_id) {
    throw new Error('No background track selected for this kit')
  }

  const { data: bgTrack } = await supabase
    .from('audio_background_tracks')
    .select('id, display_name, file_url')
    .eq('id', settings.background_track_id)
    .single()
  if (!bgTrack?.file_url) throw new Error('Background track not found')

  let binauralTrack: { display_name: string; file_url: string; category: string | null } | null = null
  if (settings.binaural_track_id && settings.binaural_volume > 0) {
    const { data } = await supabase
      .from('audio_background_tracks')
      .select('display_name, file_url, category')
      .eq('id', settings.binaural_track_id)
      .single()
    binauralTrack = data || null
  }
  const binauralVolume = binauralTrack ? settings.binaural_volume : 0

  // Adjusted volumes (binaural takes its share off the top, like the mix studio)
  let adjustedVoiceVol = settings.voice_volume
  let adjustedBgVol = settings.bg_volume
  if (binauralVolume > 0) {
    const total = settings.voice_volume + settings.bg_volume
    const remaining = 100 - binauralVolume
    adjustedVoiceVol = Math.round((settings.voice_volume / total) * remaining)
    adjustedBgVol = Math.round((settings.bg_volume / total) * remaining)
  }

  const outputFormat = settings.mix_output_format

  // Batch row (same shape the mix studio creates client-side)
  const { data: batch, error: batchError } = await supabase
    .from('audio_generation_batches')
    .insert({
      user_id: run.user_id,
      vision_id: run.vision_id,
      variant_ids: ['custom'],
      voice_id: settings.voice_id,
      sections_requested: sections,
      total_tracks_expected:
        sections.length + ((outputFormat === 'combined' || outputFormat === 'both') && sections.length > 1 ? 1 : 0),
      status: 'processing',
      metadata: {
        custom_mix: true,
        activation_kit_run_id: run.id,
        output_format: outputFormat,
        source_type: 'life_vision',
        background_track_id: bgTrack.id,
        background_track_url: bgTrack.file_url,
        voice_volume: adjustedVoiceVol,
        bg_volume: adjustedBgVol,
        ...(binauralTrack && {
          binaural_track_id: settings.binaural_track_id,
          binaural_track_url: binauralTrack.file_url,
          binaural_volume: binauralVolume,
        }),
      },
    })
    .select('id')
    .single()
  if (batchError || !batch) throw batchError || new Error('Failed to create mix batch')

  run.mix_batch_id = batch.id
  await supabase.from('activation_kit_runs').update({ mix_batch_id: batch.id }).eq('id', run.id)
  await patchAssetStatus(supabase, run, 'mix', { batch_id: batch.id })

  // Descriptive set name (mirrors generate-custom-mix)
  const parsedVoice = parseVoiceId(settings.voice_id)
  const vibeLabel = parsedVoice.vibe ? getVoiceVibe(parsedVoice.vibe)?.label : undefined
  const voiceNames: Record<string, string> = {
    alloy: 'Alloy', echo: 'Echo', fable: 'Fable', onyx: 'Onyx', nova: 'Nova',
    shimmer: 'Shimmer', ash: 'Ash', coral: 'Coral', sage: 'Sage',
  }
  let audioSetName = voiceNames[parsedVoice.voice] || parsedVoice.voice
  if (vibeLabel && vibeLabel !== 'Natural') audioSetName += ` (${vibeLabel})`
  if (bgTrack.display_name) audioSetName += ` + ${bgTrack.display_name}`
  if (binauralTrack && binauralVolume > 0) audioSetName += ` + ${binauralTrack.display_name}`
  audioSetName += binauralVolume > 0
    ? ` (${adjustedVoiceVol}/${adjustedBgVol}/${binauralVolume})`
    : ` (${adjustedVoiceVol}/${adjustedBgVol})`

  const uniqueVariant = `custom-${batch.id.slice(0, 8)}`

  // Voice tracks for the mix variant (reuses the just-generated standard tracks)
  const results = await generateAudioTracks({
    userId: run.user_id,
    visionId: run.vision_id,
    sections,
    voice: settings.voice_id,
    format: 'mp3',
    variant: uniqueVariant,
    batchId: batch.id,
    audioSetName,
    audioSetDescription: `Activation Kit mix: ${adjustedVoiceVol}% voice, ${adjustedBgVol}% background${binauralVolume > 0 ? `, ${binauralVolume}% binaural` : ''}`,
    audioSetMetadata: {
      voice_volume: adjustedVoiceVol,
      bg_volume: adjustedBgVol,
      frequency_volume: binauralVolume,
      background_track_id: bgTrack.id,
      background_track_name: bgTrack.display_name,
      frequency_track_name: binauralTrack?.display_name,
      output_format: outputFormat,
    },
  })

  const { data: audioSetData } = await supabase
    .from('audio_sets')
    .select('id')
    .eq('vision_id', run.vision_id)
    .eq('variant', uniqueVariant)
    .eq('voice_id', settings.voice_id)
    .single()
  if (!audioSetData?.id) throw new Error('Mix audio set not found after generation')

  run.mix_audio_set_id = audioSetData.id
  await supabase
    .from('activation_kit_runs')
    .update({ mix_audio_set_id: audioSetData.id })
    .eq('id', run.id)

  // Collect completed tracks for the Lambda
  const lambdaSections: Array<{ trackId: string; voiceUrl: string; outputKey: string; sectionKey: string }> = []
  for (const result of results) {
    if (result.status === 'failed') continue
    const { data: tracks } = await supabase
      .from('audio_tracks')
      .select('id, audio_url, s3_key')
      .eq('audio_set_id', audioSetData.id)
      .eq('section_key', result.sectionKey)
      .order('created_at', { ascending: false })
      .limit(1)
    const track = tracks?.[0]
    if (track?.audio_url) {
      lambdaSections.push({
        trackId: track.id,
        voiceUrl: track.audio_url,
        outputKey: track.s3_key.replace('.mp3', `-mixed-${track.id.substring(0, 8)}.mp3`),
        sectionKey: result.sectionKey,
      })
    }
  }
  if (lambdaSections.length === 0) {
    await supabase
      .from('audio_generation_batches')
      .update({ status: 'failed', error_message: 'No voice tracks available for mixing' })
      .eq('id', batch.id)
    throw new Error('No voice tracks available for mixing')
  }

  // Combined "full" track record
  let combinedTrackId: string | null = null
  let combinedOutputKey: string | null = null
  if ((outputFormat === 'combined' || outputFormat === 'both') && lambdaSections.length > 1) {
    combinedOutputKey = `user-uploads/${run.user_id}/life-vision/audio/${run.vision_id}/full-mixed-${audioSetData.id}.mp3`
    const { data: fullTrack, error: fullErr } = await supabase
      .from('audio_tracks')
      .insert({
        audio_set_id: audioSetData.id,
        user_id: run.user_id,
        vision_id: run.vision_id,
        section_key: 'full',
        content_hash: hashContent(`full-audio-${audioSetData.id}`).substring(0, 16),
        text_content: 'Full Vision Audio - All Sections Combined',
        voice_id: settings.voice_id,
        s3_bucket: BUCKET_NAME,
        s3_key: combinedOutputKey,
        audio_url: `${CDN_PREFIX}/${combinedOutputKey}`,
        status: 'processing',
        mix_status: 'mixing',
        content_type: 'life_vision',
      })
      .select('id')
      .single()
    if (fullErr) console.error('[activation-kit] full mix track insert failed:', fullErr)
    combinedTrackId = fullTrack?.id || null
  }

  // Canonical section order (forward first, conclusion last)
  const categoryOrder = new Map<string, number>(ORDERED_VISION_CATEGORIES.map((c, i) => [c.key, i]))
  lambdaSections.sort((a, b) => (categoryOrder.get(a.sectionKey) ?? 99) - (categoryOrder.get(b.sectionKey) ?? 99))

  // Mark tracks as mixing
  for (const section of lambdaSections) {
    await supabase.from('audio_tracks').update({ mix_status: 'mixing' }).eq('id', section.trackId)
  }

  const lambdaPayload: Record<string, unknown> = {
    action: 'batch-mix',
    sections: lambdaSections,
    bgUrl: bgTrack.file_url,
    voiceVolume: adjustedVoiceVol / 100,
    bgVolume: adjustedBgVol / 100,
    outputFormat,
    batchId: batch.id,
  }
  if (binauralTrack && binauralVolume > 0) {
    lambdaPayload.binauralUrl = binauralTrack.file_url
    lambdaPayload.binauralVolume = binauralVolume / 100
  }
  if (combinedTrackId && combinedOutputKey) {
    lambdaPayload.combinedTrackId = combinedTrackId
    lambdaPayload.combinedOutputKey = combinedOutputKey
  }

  const lambda = new LambdaClient({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })
  await lambda.send(new InvokeCommand({
    FunctionName: 'audio-mixer',
    Payload: JSON.stringify(lambdaPayload),
    InvocationType: 'Event',
  }))

  // Keep the batch processing so the queue page keeps polling; Lambda finishes it
  await supabase
    .from('audio_generation_batches')
    .update({
      status: 'processing',
      tracks_completed: 0,
      tracks_failed: results.filter((r) => r.status === 'failed').length,
      tracks_pending: lambdaSections.length,
      audio_set_ids: [audioSetData.id],
    })
    .eq('id', batch.id)
}

// ---------------------------------------------------------------------------
// Board — one manifestation per refined life category
// ---------------------------------------------------------------------------

const MAX_BOARD_MANIFESTATIONS = 4

async function loadKitToolConfig(): Promise<AIToolConfig> {
  try {
    return await getAIToolConfig('vision_refinement')
  } catch {
    return await getAIToolConfig('master_vision_assembly')
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

async function generateBoardManifestations(
  supabase: SupabaseClient,
  run: KitRunRow,
  vision: VisionRow,
): Promise<number> {
  // Refined life categories first; for a first vision (no refinements) take
  // the first few life categories with text.
  const lifeKeys = LIFE_CATEGORY_KEYS as readonly string[]
  const refined = (vision.refined_categories || []).filter(
    (key) => lifeKeys.includes(key) && (vision[key] || '').trim(),
  )
  const fallback = lifeKeys.filter((key) => (vision[key] || '').trim()).slice(0, 3)
  const categories = (refined.length > 0 ? refined : fallback).slice(0, MAX_BOARD_MANIFESTATIONS)

  if (categories.length === 0) return 0

  const toolConfig = await loadKitToolConfig()
  let created = 0
  let failures = 0

  for (const categoryKey of categories) {
    try {
      const label = getVisionCategoryLabel(categoryKey as VisionCategoryKey)
      const result = await generateText({
        model: gateway(`openai/${toolConfig.model_name}`),
        system: KIT_BOARD_MANIFESTATION_SYSTEM_PROMPT,
        prompt: buildKitBoardManifestationPrompt({
          categoryLabel: label,
          categoryText: (vision[categoryKey] || '').trim(),
        }),
        temperature: toolConfig.supports_temperature ? (toolConfig.temperature || 0.7) : undefined,
      })

      await trackTokenUsage({
        user_id: run.user_id,
        action_type: 'vision_generation',
        model_used: result.response?.modelId || toolConfig.model_name,
        tokens_used: result.usage?.totalTokens || 0,
        input_tokens: result.usage?.inputTokens || 0,
        output_tokens: result.usage?.outputTokens || 0,
        actual_cost_cents: 0,
        provider: 'vercel_gateway',
        provider_request_id: gatewayGenerationId(result),
        success: true,
        metadata: { feature: 'activation_kit', kit_run_id: run.id, category: categoryKey },
      }).catch(() => {})

      const parsed = parseJsonBlock<{ title?: string; description?: string; image_prompt?: string }>(result.text || '')
      if (!parsed?.title?.trim()) throw new Error('Manifestation distillation returned an unexpected format')

      const { data: item, error: insertErr } = await supabase
        .from('manifestations')
        .insert({
          user_id: run.user_id,
          name: parsed.title.trim(),
          description: (parsed.description || '').trim() || null,
          categories: [categoryKey],
          status: 'active',
        })
        .select('id')
        .single()
      if (insertErr || !item) throw insertErr || new Error('Failed to create manifestation')

      run.manifestation_ids = [...(run.manifestation_ids || []), item.id]
      await supabase
        .from('activation_kit_runs')
        .update({ manifestation_ids: run.manifestation_ids })
        .eq('id', run.id)

      const image = await generateImage({
        userId: run.user_id,
        prompt: parsed.image_prompt?.trim() || `${parsed.title}. ${parsed.description || ''}`,
        dimension: 'landscape_4_3',
        quality: 'standard',
        style: 'vivid',
        context: 'vision_board',
      })
      if (image.success && image.imageUrl) {
        await supabase
          .from('manifestations')
          .update({ image_url: image.imageUrl, updated_at: new Date().toISOString() })
          .eq('id', item.id)
      }

      created++
    } catch (err) {
      failures++
      console.error(`[activation-kit] board manifestation failed (${categoryKey}):`, err)
    }
  }

  if (created === 0 && failures > 0) {
    throw new Error(`${failures} manifestation(s) failed to generate`)
  }
  return created
}

// ---------------------------------------------------------------------------
// Status sync — flips async assets (mix) when their background work lands
// ---------------------------------------------------------------------------

export async function syncKitRunStatus(
  supabase: SupabaseClient,
  run: KitRunRow,
): Promise<KitRunRow> {
  const mixState = run.asset_status?.mix?.state

  if (mixState === 'generating' && run.mix_batch_id) {
    const { data: batch } = await supabase
      .from('audio_generation_batches')
      .select('status, error_message')
      .eq('id', run.mix_batch_id)
      .maybeSingle()

    if (batch?.status === 'completed' || batch?.status === 'partial_success') {
      await patchAssetStatus(supabase, run, 'mix', {
        state: 'ready',
        error_message: batch.status === 'partial_success' ? 'Some sections failed to mix' : null,
        finished_at: new Date().toISOString(),
      })
      await updateOverallStatus(supabase, run)
    } else if (batch?.status === 'failed') {
      await patchAssetStatus(
        supabase, run, 'mix',
        markFailure(run.asset_status?.mix, new Error(batch.error_message || 'Mix failed')),
      )
      await updateOverallStatus(supabase, run)
    } else if (!isActivelyGenerating(run, 'mix')) {
      // Stale: Lambda never reported back
      await patchAssetStatus(
        supabase, run, 'mix',
        markFailure(run.asset_status?.mix, new Error('Mix timed out')),
      )
      await updateOverallStatus(supabase, run)
    }
  }

  return run
}
