// Cinematic Universe -- Supported fal.ai models for image, edit, and video generation

// ---------------------------------------------------------------------------
// Default models
// ---------------------------------------------------------------------------

export const FAL_DEFAULT_IMAGE_MODEL = 'fal-ai/flux-2-pro'
export const FAL_DEFAULT_EDIT_MODEL = 'fal-ai/flux-2-pro/edit'
export const FAL_DEFAULT_VIDEO_MODEL = 'fal-ai/veo3.1/first-last-frame-to-video'

// ---------------------------------------------------------------------------
// Image models
// ---------------------------------------------------------------------------

export const FAL_IMAGE_MODELS = [
  { id: 'fal-ai/flux-2-pro', label: 'Flux 2 Pro' },
  { id: 'fal-ai/flux-2', label: 'Flux 2 Dev' },
  { id: 'fal-ai/nano-banana', label: 'Nano Banana (fast/cheap)' },
  { id: 'fal-ai/nano-banana-2', label: 'Nano Banana 2 (fast/cheap)' },
] as const

// ---------------------------------------------------------------------------
// Image-edit models
// ---------------------------------------------------------------------------

export const FAL_EDIT_MODELS = [
  { id: 'fal-ai/flux-2-pro/edit', label: 'Flux 2 Pro Edit' },
  { id: 'fal-ai/nano-banana/edit', label: 'Nano Banana Edit (cheap)' },
  { id: 'fal-ai/nano-banana-pro/edit', label: 'Nano Banana Pro Edit' },
] as const

// ---------------------------------------------------------------------------
// Video models -- duration ranges per model family
// ---------------------------------------------------------------------------

export const FAL_VIDEO_FIRST_LAST_MODEL = 'fal-ai/veo3.1/first-last-frame-to-video'

export interface VideoModelDef {
  id: string
  label: string
  durations: string[]
  defaultDuration: string
  maxSeconds: number
  features: string[]
}

export const FAL_VIDEO_MODELS: VideoModelDef[] = [
  // --- Veo 3.1 family ---
  {
    id: 'fal-ai/veo3.1/first-last-frame-to-video',
    label: 'Veo 3.1 First+Last Frame',
    durations: ['4s', '6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['first-last-frame', '4k-capable'],
  },
  {
    id: 'fal-ai/veo3.1/image-to-video',
    label: 'Veo 3.1 Image-to-Video',
    durations: ['4s', '6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['image-to-video', '4k-capable'],
  },
  {
    id: 'fal-ai/veo3.1',
    label: 'Veo 3.1 Text-to-Video',
    durations: ['4s', '6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['text-to-video', 'native-audio', '4k-capable'],
  },
  // --- Veo 3 family ---
  {
    id: 'fal-ai/veo3/image-to-video',
    label: 'Veo 3 Image-to-Video',
    durations: ['4s', '6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['image-to-video', 'native-audio'],
  },
  {
    id: 'fal-ai/veo3',
    label: 'Veo 3 Text-to-Video',
    durations: ['4s', '6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['text-to-video', 'native-audio'],
  },
  // --- Kling 3.0 family ---
  {
    id: 'fal-ai/kling-video/v3/pro/image-to-video',
    label: 'Kling 3.0 Pro I2V',
    durations: ['5', '10', '15'],
    defaultDuration: '5',
    maxSeconds: 15,
    features: ['image-to-video', 'native-audio', 'multi-shot', 'camera-control'],
  },
  {
    id: 'fal-ai/kling-video/v3/standard/image-to-video',
    label: 'Kling 3.0 Standard I2V',
    durations: ['5', '10'],
    defaultDuration: '5',
    maxSeconds: 10,
    features: ['image-to-video', 'native-audio'],
  },
  {
    id: 'fal-ai/kling-video/v3/pro/text-to-video',
    label: 'Kling 3.0 Pro T2V',
    durations: ['5', '10', '15'],
    defaultDuration: '5',
    maxSeconds: 15,
    features: ['text-to-video', 'native-audio', 'multi-shot', 'camera-control'],
  },
  // --- Seedance 2.0 family (ByteDance) ---
  {
    id: 'bytedance/seedance-2.0/image-to-video',
    label: 'Seedance 2.0 I2V',
    durations: ['5', '10'],
    defaultDuration: '5',
    maxSeconds: 10,
    features: ['image-to-video', 'native-audio', 'camera-control', 'start-end-frame'],
  },
  {
    id: 'bytedance/seedance-2.0/text-to-video',
    label: 'Seedance 2.0 T2V',
    durations: ['5', '10'],
    defaultDuration: '5',
    maxSeconds: 10,
    features: ['text-to-video', 'native-audio', 'multi-shot', 'camera-control'],
  },
  // --- Kling 2.x (legacy) ---
  {
    id: 'fal-ai/kling-video/v2.1/master/image-to-video',
    label: 'Kling 2.1 Master',
    durations: ['5', '10'],
    defaultDuration: '5',
    maxSeconds: 10,
    features: ['image-to-video'],
  },
  {
    id: 'fal-ai/kling-video/v2/master/image-to-video',
    label: 'Kling 2.0 Master',
    durations: ['5', '10'],
    defaultDuration: '5',
    maxSeconds: 10,
    features: ['image-to-video'],
  },
  // --- Veo 2 (legacy) ---
  {
    id: 'fal-ai/veo2/image-to-video',
    label: 'Veo 2 Image-to-Video',
    durations: ['6s', '8s'],
    defaultDuration: '6s',
    maxSeconds: 8,
    features: ['image-to-video'],
  },
]

// ---------------------------------------------------------------------------
// Model sets for validation
// ---------------------------------------------------------------------------

const ALLOWED_IMAGE = new Set<string>(FAL_IMAGE_MODELS.map((m) => m.id))
const ALLOWED_EDIT = new Set<string>(FAL_EDIT_MODELS.map((m) => m.id))
const ALLOWED_VIDEO = new Set<string>(FAL_VIDEO_MODELS.map((m) => m.id))

const VIDEO_FIRST_LAST_MODELS = new Set<string>([
  FAL_VIDEO_FIRST_LAST_MODEL,
  'bytedance/seedance-2.0/image-to-video',
])

const VIDEO_SINGLE_START_I2V = new Set<string>([
  'fal-ai/kling-video/v2/master/image-to-video',
  'fal-ai/kling-video/v2.1/master/image-to-video',
  'fal-ai/kling-video/v3/pro/image-to-video',
  'fal-ai/kling-video/v3/standard/image-to-video',
  'fal-ai/veo2/image-to-video',
  'fal-ai/veo3/image-to-video',
  'fal-ai/veo3.1/image-to-video',
])

const VIDEO_TEXT_ONLY = new Set<string>([
  'fal-ai/veo2',
  'fal-ai/veo3',
  'fal-ai/veo3/fast',
  'fal-ai/veo3.1',
  'fal-ai/kling-video/v3/pro/text-to-video',
  'bytedance/seedance-2.0/text-to-video',
])

export function getVideoModelDef(modelId: string): VideoModelDef | undefined {
  return FAL_VIDEO_MODELS.find((m) => m.id === modelId)
}

// ---------------------------------------------------------------------------
// Resolvers (validate requested model or fall back to default)
// ---------------------------------------------------------------------------

export function resolveImageModel(requested?: string | null): string {
  if (requested && ALLOWED_IMAGE.has(requested)) return requested
  return FAL_DEFAULT_IMAGE_MODEL
}

export function resolveEditModel(requested?: string | null): string {
  if (requested && ALLOWED_EDIT.has(requested)) return requested
  return FAL_DEFAULT_EDIT_MODEL
}

export function resolveVideoModel(requested?: string | null): string {
  if (requested && ALLOWED_VIDEO.has(requested)) return requested
  return FAL_DEFAULT_VIDEO_MODEL
}

// ---------------------------------------------------------------------------
// Model capability checks
// ---------------------------------------------------------------------------

export function videoModelRequiresFirstAndLastFrame(modelId: string): boolean {
  return VIDEO_FIRST_LAST_MODELS.has(modelId)
}

export function videoModelRequiresStartImage(modelId: string): boolean {
  return VIDEO_SINGLE_START_I2V.has(modelId) || VIDEO_FIRST_LAST_MODELS.has(modelId)
}

export function videoModelIsTextOnly(modelId: string): boolean {
  return VIDEO_TEXT_ONLY.has(modelId)
}

// ---------------------------------------------------------------------------
// Aspect ratio mapping
// ---------------------------------------------------------------------------

export function targetSizeToAspectRatio(targetSize: string): string {
  const map: Record<string, string> = {
    square_1_1: '1:1',
    landscape_16_9: '16:9',
    portrait_9_16: '9:16',
  }
  return map[targetSize] ?? '16:9'
}
