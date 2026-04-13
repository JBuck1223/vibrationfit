// Cinematic Universe -- Server-side queue runner with concurrent batching
// Runs up to MAX_CONCURRENT independent generations in parallel.
// Dependency-aware: only dispatches items whose references are satisfied.

import { createAdminClient } from '@/lib/supabase/admin'
import { pickAllRunnableKeyframes, allKeyframesTerminal, pickAllRunnableClips } from './resolve-keyframe-refs'
import { generateKeyframe } from './generate-keyframe'
import { generateClip } from './generate-clip'
import type { KeyframeWithMedia, ClipWithMedia } from './types'

const MAX_CONCURRENT = 8

export interface QueueRunResult {
  phase: 'keyframes' | 'clips'
  total: number
  succeeded: number
  failed: number
  remaining: number
  allComplete: boolean
  results: Array<{ id: string; success: boolean; error?: string }>
}

async function loadKeyframes(episodeId: string): Promise<KeyframeWithMedia[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cu_keyframes')
    .select('*, generated_media:cu_media(*)')
    .eq('episode_id', episodeId)
    .order('sort_order')

  if (error) throw new Error(`Failed to load keyframes: ${error.message}`)
  return (data ?? []) as KeyframeWithMedia[]
}

async function loadClips(episodeId: string): Promise<ClipWithMedia[]> {
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('cu_clips')
    .select(
      '*, generated_media:cu_media(*), first_frame_keyframe:cu_keyframes!cu_clips_first_frame_keyframe_id_fkey(*, generated_media:cu_media(*)), last_frame_keyframe:cu_keyframes!cu_clips_last_frame_keyframe_id_fkey(*, generated_media:cu_media(*))'
    )
    .eq('episode_id', episodeId)
    .order('sort_order')

  if (error) throw new Error(`Failed to load clips: ${error.message}`)
  return (data ?? []) as unknown as ClipWithMedia[]
}

/**
 * Run the full keyframe generation queue server-side.
 * Dispatches up to MAX_CONCURRENT independent keyframes in parallel,
 * then loops until all are terminal. Safe to fire-and-forget.
 */
export async function runKeyframeQueue(episodeId: string): Promise<QueueRunResult> {
  const supabase = createAdminClient()
  await supabase
    .from('cu_episodes')
    .update({ status: 'keyframes_generating' })
    .eq('id', episodeId)
    .in('status', ['planning', 'keyframes_review'])

  const results: Array<{ id: string; success: boolean; error?: string }> = []
  let loops = 0
  const maxLoops = 50

  while (loops < maxLoops) {
    loops++
    const keyframes = await loadKeyframes(episodeId)

    if (allKeyframesTerminal(keyframes)) break

    // Exclude anything currently generating (from a prior batch still in-flight)
    const generating = keyframes.filter((kf) => kf.status === 'generating')
    const slotsAvailable = MAX_CONCURRENT - generating.length
    if (slotsAvailable <= 0) {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }

    const ready = pickAllRunnableKeyframes(keyframes)
    if (ready.length === 0) {
      if (generating.length > 0) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      break
    }

    const batch = ready.slice(0, slotsAvailable)
    const batchResults = await Promise.allSettled(
      batch.map((kf) => generateKeyframe(kf, keyframes))
    )

    for (let i = 0; i < batch.length; i++) {
      const r = batchResults[i]
      if (r.status === 'fulfilled') {
        results.push({ id: batch[i].id, success: r.value.success, error: r.value.error })
      } else {
        results.push({ id: batch[i].id, success: false, error: String(r.reason) })
      }
    }
  }

  const finalKeyframes = await loadKeyframes(episodeId)
  const allComplete = allKeyframesTerminal(finalKeyframes)
  const remaining = finalKeyframes.filter(
    (kf) => kf.status === 'pending' || kf.status === 'generating' || kf.status === 'rejected'
  ).length

  if (allComplete) {
    const allApproved = finalKeyframes.every((kf) => kf.status === 'approved')
    if (allApproved) {
      await supabase
        .from('cu_episodes')
        .update({ status: 'keyframes_review' })
        .eq('id', episodeId)
    }
  }

  return {
    phase: 'keyframes',
    total: finalKeyframes.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    remaining,
    allComplete,
    results,
  }
}

/**
 * Run the full clip generation queue server-side.
 * Dispatches up to MAX_CONCURRENT clips whose keyframes are both approved.
 */
export async function runClipQueue(episodeId: string): Promise<QueueRunResult> {
  const supabase = createAdminClient()
  await supabase
    .from('cu_episodes')
    .update({ status: 'clips_generating' })
    .eq('id', episodeId)
    .in('status', ['keyframes_review', 'clips_review'])

  const { data: episode } = await supabase
    .from('cu_episodes')
    .select('target_aspect_ratio')
    .eq('id', episodeId)
    .single()
  const targetSize = episode?.target_aspect_ratio || 'landscape_16_9'

  const results: Array<{ id: string; success: boolean; error?: string }> = []
  let loops = 0
  const maxLoops = 50

  while (loops < maxLoops) {
    loops++
    const clips = await loadClips(episodeId)

    const allTerminal = clips.every(
      (c) => c.status === 'complete' || c.status === 'approved' || c.status === 'failed'
    )
    if (allTerminal) break

    const generating = clips.filter((c) => c.status === 'generating')
    const slotsAvailable = MAX_CONCURRENT - generating.length
    if (slotsAvailable <= 0) {
      await new Promise((r) => setTimeout(r, 2000))
      continue
    }

    const ready = pickAllRunnableClips(clips)
    if (ready.length === 0) {
      // Mark pending clips as waiting_keyframes
      const pendingIds = clips.filter((c) => c.status === 'pending').map((c) => c.id)
      if (pendingIds.length > 0) {
        await supabase.from('cu_clips').update({ status: 'waiting_keyframes' }).in('id', pendingIds)
      }
      if (generating.length > 0) {
        await new Promise((r) => setTimeout(r, 2000))
        continue
      }
      break
    }

    const batch = ready.slice(0, slotsAvailable)
    const batchResults = await Promise.allSettled(
      batch.map((clip) =>
        generateClip(
          clip,
          clip.first_frame_keyframe as KeyframeWithMedia,
          clip.last_frame_keyframe as KeyframeWithMedia,
          targetSize
        )
      )
    )

    for (let i = 0; i < batch.length; i++) {
      const r = batchResults[i]
      if (r.status === 'fulfilled') {
        results.push({ id: batch[i].id, success: r.value.success, error: r.value.error })
      } else {
        results.push({ id: batch[i].id, success: false, error: String(r.reason) })
      }
    }
  }

  const finalClips = await loadClips(episodeId)
  const allComplete = finalClips.every(
    (c) => c.status === 'complete' || c.status === 'approved' || c.status === 'failed'
  )
  const remaining = finalClips.filter(
    (c) => !['complete', 'approved', 'failed'].includes(c.status)
  ).length

  if (allComplete) {
    await supabase
      .from('cu_episodes')
      .update({ status: 'clips_review' })
      .eq('id', episodeId)
  }

  return {
    phase: 'clips',
    total: finalClips.length,
    succeeded: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
    remaining,
    allComplete,
    results,
  }
}

/**
 * Reset keyframes/clips stuck in 'generating' status back to 'pending'.
 */
export async function resetStuck(episodeId: string): Promise<{ keyframes: number; clips: number }> {
  const supabase = createAdminClient()

  const { data: stuckKf } = await supabase
    .from('cu_keyframes')
    .update({ status: 'pending' })
    .eq('episode_id', episodeId)
    .eq('status', 'generating')
    .select('id')

  const { data: stuckClips } = await supabase
    .from('cu_clips')
    .update({ status: 'pending' })
    .eq('episode_id', episodeId)
    .eq('status', 'generating')
    .select('id')

  return {
    keyframes: stuckKf?.length ?? 0,
    clips: stuckClips?.length ?? 0,
  }
}
