// Cinematic Universe -- Model-specific fal.ai video payload builders

import {
  FAL_VIDEO_FIRST_LAST_MODEL,
  videoModelRequiresFirstAndLastFrame,
  videoModelRequiresStartImage,
  resolveVideoModel,
  getVideoModelDef,
} from './fal-models'

export interface VideoInputOptions {
  modelId: string
  prompt: string
  firstFrameUrl?: string
  lastFrameUrl?: string
  targetSize: string
  duration?: string
  generateAudio?: boolean
}

// --- Model family sets ---

const KLING_I2V = new Set([
  'fal-ai/kling-video/v2/master/image-to-video',
  'fal-ai/kling-video/v2.1/master/image-to-video',
  'fal-ai/kling-video/v3/pro/image-to-video',
  'fal-ai/kling-video/v3/standard/image-to-video',
])

const VEO_I2V = new Set([
  'fal-ai/veo2/image-to-video',
  'fal-ai/veo3/image-to-video',
  'fal-ai/veo3.1/image-to-video',
])

const VEO_T2V = new Set([
  'fal-ai/veo2',
  'fal-ai/veo3',
  'fal-ai/veo3/fast',
  'fal-ai/veo3.1',
])

const SEEDANCE_MODELS = new Set([
  'bytedance/seedance-2.0/image-to-video',
  'bytedance/seedance-2.0/text-to-video',
  'bytedance/seedance-2.0/fast/image-to-video',
  'bytedance/seedance-2.0/fast/text-to-video',
])

// --- Aspect ratio helpers ---

function veo3FamilyAspect(targetSize: string): '16:9' | '9:16' | 'auto' {
  switch (targetSize) {
    case 'landscape_16_9': return '16:9'
    case 'portrait_9_16': return '9:16'
    default: return 'auto'
  }
}

function standardAspect(targetSize: string): '16:9' | '9:16' {
  return targetSize === 'portrait_9_16' ? '9:16' : '16:9'
}

function resolveDuration(modelId: string, requested?: string): string {
  const def = getVideoModelDef(modelId)
  if (!def) return requested || '6s'
  if (!requested) return def.defaultDuration

  // Try exact match first (e.g. "6s" or "5")
  if (def.durations.includes(requested)) return requested
  // Try with "s" suffix (user passed "6", model wants "6s")
  if (def.durations.includes(`${requested}s`)) return `${requested}s`
  // Try without "s" suffix (user passed "6s", model wants "6")
  const bare = requested.replace(/s$/, '')
  if (def.durations.includes(bare)) return bare

  return def.defaultDuration
}

/**
 * Build the fal.ai input payload for a video generation call.
 */
export function buildVideoFalInput(opts: VideoInputOptions): Record<string, unknown> {
  const { modelId, prompt, firstFrameUrl, lastFrameUrl, targetSize, generateAudio } = opts
  const duration = resolveDuration(modelId, opts.duration)
  const audio = generateAudio ?? true

  // Veo 3.1 first-last-frame
  if (modelId === FAL_VIDEO_FIRST_LAST_MODEL) {
    if (!firstFrameUrl || !lastFrameUrl) {
      throw new Error('First and last frame image URLs are required for Veo 3.1 first-last-frame')
    }
    return {
      prompt,
      first_frame_url: firstFrameUrl,
      last_frame_url: lastFrameUrl,
      duration,
      aspect_ratio: veo3FamilyAspect(targetSize),
      resolution: '720p',
      generate_audio: audio,
      auto_fix: true,
      safety_tolerance: '4',
    }
  }

  // Seedance 2.0 image-to-video (supports start + end frame)
  if (modelId === 'bytedance/seedance-2.0/image-to-video' || modelId === 'bytedance/seedance-2.0/fast/image-to-video') {
    if (!firstFrameUrl) throw new Error('Reference image required for Seedance image-to-video')
    const input: Record<string, unknown> = {
      prompt,
      image_url: firstFrameUrl,
      duration,
      aspect_ratio: standardAspect(targetSize),
      generate_audio: audio,
    }
    if (lastFrameUrl) input.tail_image_url = lastFrameUrl
    return input
  }

  // Seedance 2.0 text-to-video
  if (SEEDANCE_MODELS.has(modelId)) {
    return {
      prompt,
      duration,
      aspect_ratio: standardAspect(targetSize),
      generate_audio: audio,
    }
  }

  // Kling image-to-video (v2 + v3)
  if (KLING_I2V.has(modelId)) {
    if (!firstFrameUrl) throw new Error('Reference image is required for Kling image-to-video')
    return {
      prompt,
      image_url: firstFrameUrl,
      duration,
      generate_audio: audio,
    }
  }

  // Kling text-to-video
  if (modelId === 'fal-ai/kling-video/v3/pro/text-to-video') {
    return {
      prompt,
      duration,
      aspect_ratio: standardAspect(targetSize),
      generate_audio: audio,
    }
  }

  // Veo image-to-video family
  if (VEO_I2V.has(modelId)) {
    if (!firstFrameUrl) throw new Error('Reference image is required for Veo image-to-video')
    return {
      prompt,
      image_url: firstFrameUrl,
      duration,
      aspect_ratio: veo3FamilyAspect(targetSize),
      resolution: '720p',
      generate_audio: audio,
      auto_fix: true,
      safety_tolerance: '4',
    }
  }

  // Veo text-to-video family
  if (VEO_T2V.has(modelId)) {
    return {
      prompt,
      aspect_ratio: standardAspect(targetSize),
      duration,
      resolution: '720p',
      generate_audio: audio,
      auto_fix: true,
      safety_tolerance: '4',
    }
  }

  throw new Error(`Unsupported video model: ${modelId}`)
}

/**
 * Validate that the required frame URLs are present for the chosen model.
 */
export function assertVideoInputsValid(
  modelId: string,
  firstFrameUrl: string | undefined,
  lastFrameUrl: string | undefined
): void {
  const resolved = resolveVideoModel(modelId)
  if (videoModelRequiresFirstAndLastFrame(resolved)) {
    if (!firstFrameUrl || !lastFrameUrl) {
      throw new Error('This model needs both a first frame and a last frame image')
    }
  } else if (videoModelRequiresStartImage(resolved) && !firstFrameUrl) {
    throw new Error('This model requires a start (first frame) image')
  }
}
