// Cinematic Universe -- Keyframe dependency resolution
// Determines execution order and resolves reference URLs for image generation.
// Adapted from Untamed's resolve-references.ts but uses keyframe IDs instead of sort_order.

import type { CuKeyframe, KeyframeWithMedia, ClipWithMedia } from './types'

const READY_STATUSES = new Set(['complete', 'approved'])

/**
 * Resolve the style-reference image URL for a keyframe.
 * If the keyframe references another keyframe via style_reference_keyframe_id,
 * returns that keyframe's generated image URL (only if it's in a ready state).
 * Falls back to the keyframe's own reference_image_url (uploaded/external).
 */
export function resolveReferenceImageUrl(
  keyframe: CuKeyframe,
  allKeyframes: KeyframeWithMedia[]
): string | undefined {
  if (keyframe.style_reference_keyframe_id) {
    const source = allKeyframes.find((k) => k.id === keyframe.style_reference_keyframe_id)
    if (!source || !READY_STATUSES.has(source.status)) return undefined
    return source.generated_media?.url
  }
  return keyframe.reference_image_url ?? undefined
}

/**
 * Check whether a keyframe's dependencies are satisfied and it can be generated.
 */
export function keyframeDependenciesReady(
  keyframe: CuKeyframe,
  allKeyframes: KeyframeWithMedia[]
): boolean {
  if (!keyframe.style_reference_keyframe_id) return true
  const source = allKeyframes.find((k) => k.id === keyframe.style_reference_keyframe_id)
  if (!source) return true
  return READY_STATUSES.has(source.status) && !!source.generated_media?.url
}

/**
 * Pick the next keyframe that is ready to generate.
 * Returns the first pending keyframe whose dependencies are met (ordered by sort_order).
 */
export function pickNextRunnableKeyframe(
  keyframes: KeyframeWithMedia[]
): KeyframeWithMedia | undefined {
  const sorted = [...keyframes].sort((a, b) => a.sort_order - b.sort_order)
  return sorted.find(
    (kf) =>
      (kf.status === 'pending' || kf.status === 'rejected') &&
      keyframeDependenciesReady(kf, keyframes)
  )
}

/**
 * Pick ALL keyframes that are independently ready to generate right now.
 * Used for concurrent batch dispatch.
 */
export function pickAllRunnableKeyframes(
  keyframes: KeyframeWithMedia[]
): KeyframeWithMedia[] {
  return [...keyframes]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter(
      (kf) =>
        (kf.status === 'pending' || kf.status === 'rejected') &&
        keyframeDependenciesReady(kf, keyframes)
    )
}

/**
 * Check whether all keyframes for an episode are in a terminal state (approved or failed).
 */
export function allKeyframesTerminal(keyframes: KeyframeWithMedia[]): boolean {
  return keyframes.every((kf) => kf.status === 'approved' || kf.status === 'failed')
}

/**
 * Check whether both keyframes for a clip are approved (clip is ready to generate).
 */
export function clipKeyframesReady(
  firstFrameKeyframe: KeyframeWithMedia,
  lastFrameKeyframe: KeyframeWithMedia
): boolean {
  return (
    firstFrameKeyframe.status === 'approved' &&
    lastFrameKeyframe.status === 'approved' &&
    !!firstFrameKeyframe.generated_media?.url &&
    !!lastFrameKeyframe.generated_media?.url
  )
}

/**
 * Pick ALL clips that are independently ready to generate right now.
 * Used for concurrent batch dispatch.
 */
export function pickAllRunnableClips(clips: ClipWithMedia[]): ClipWithMedia[] {
  return [...clips]
    .sort((a, b) => a.sort_order - b.sort_order)
    .filter((c) => {
      if (c.status !== 'pending' && c.status !== 'waiting_keyframes' && c.status !== 'rejected') {
        return false
      }
      return clipKeyframesReady(
        c.first_frame_keyframe as KeyframeWithMedia,
        c.last_frame_keyframe as KeyframeWithMedia
      )
    })
}
