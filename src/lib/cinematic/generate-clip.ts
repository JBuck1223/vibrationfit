// Cinematic Universe -- Video clip generation pipeline
// Generates a video clip between two keyframe images via fal.ai, uploads to S3.

import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveVideoModel } from './fal-models'
import { buildVideoFalInput, assertVideoInputsValid } from './fal-video-input'
import type { CuClip, KeyframeWithMedia, GenerationMetadata } from './types'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = 'vibration-fit-client-storage'
const CDN_BASE = 'https://media.vibrationfit.com'

export interface GenerateClipResult {
  success: boolean
  mediaId?: string
  mediaUrl?: string
  error?: string
}

/**
 * Generate a video clip between two approved keyframes.
 * 1. Validates both keyframes are approved with media URLs
 * 2. Marks clip as 'generating'
 * 3. Calls fal.ai video model with first/last frame
 * 4. Uploads to S3
 * 5. Creates cu_media row, links to clip, marks 'complete'
 */
export async function generateClip(
  clip: CuClip,
  firstFrameKeyframe: KeyframeWithMedia,
  lastFrameKeyframe: KeyframeWithMedia,
  targetSize: string
): Promise<GenerateClipResult> {
  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()

  const firstFrameUrl = firstFrameKeyframe.generated_media?.url
  const lastFrameUrl = lastFrameKeyframe.generated_media?.url

  if (!firstFrameUrl || !lastFrameUrl) {
    return { success: false, error: 'Both keyframes must have generated media URLs' }
  }

  const falModel = resolveVideoModel(clip.fal_model)
  assertVideoInputsValid(falModel, firstFrameUrl, lastFrameUrl)

  await supabase
    .from('cu_clips')
    .update({ status: 'generating', generation_metadata: { started_at: startedAt } })
    .eq('id', clip.id)

  try {
    fal.config({ credentials: process.env.FAL_KEY! })

    const prompt = clip.prompt || 'Smooth cinematic transition between scenes'
    const input = buildVideoFalInput({
      modelId: falModel,
      prompt,
      firstFrameUrl,
      lastFrameUrl,
      targetSize,
      duration: clip.duration_seconds ? String(clip.duration_seconds) : undefined,
    })

    console.log(`[clip ${clip.id}] fal.ai request:`, { model: falModel, input })
    const result = await fal.subscribe(falModel, { input, logs: false })

    const data = (result as any).data || result
    const falRequestId = (result as any).requestId
    const videoUrl = data?.video?.url
    if (!videoUrl) throw new Error('No video URL in fal.ai response')

    // Download and upload to S3
    const videoResponse = await fetch(videoUrl)
    if (!videoResponse.ok) throw new Error('Failed to download generated video from fal.ai')
    const videoBuffer = new Uint8Array(await videoResponse.arrayBuffer())

    const timestamp = Date.now()
    const s3Key = `cinematic/clips/${clip.episode_id}/${timestamp}-clip${clip.sort_order}.mp4`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: Buffer.from(videoBuffer),
        ContentType: 'video/mp4',
        CacheControl: 'max-age=31536000',
      })
    )

    const cdnUrl = `${CDN_BASE}/${s3Key}`

    const { data: media, error: mediaError } = await supabase
      .from('cu_media')
      .insert({
        file_type: 'video',
        url: cdnUrl,
        s3_key: s3Key,
        duration_seconds: clip.duration_seconds || 6,
        fal_model: falModel,
        fal_request_id: falRequestId,
        file_size_bytes: videoBuffer.length,
      })
      .select('id')
      .single()

    if (mediaError) throw new Error(`Failed to save media: ${mediaError.message}`)

    const completedAt = new Date().toISOString()
    const metadata: GenerationMetadata = {
      fal_request_id: falRequestId,
      started_at: startedAt,
      completed_at: completedAt,
      duration_ms: new Date(completedAt).getTime() - new Date(startedAt).getTime(),
    }

    await supabase
      .from('cu_clips')
      .update({
        status: 'complete',
        generated_media_id: media.id,
        generation_metadata: metadata,
      })
      .eq('id', clip.id)

    return { success: true, mediaId: media.id, mediaUrl: cdnUrl }
  } catch (error: any) {
    console.error(`Clip ${clip.id} generation failed:`, error?.message, error?.body || error)

    const metadata: GenerationMetadata = {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      error_message: error.message || 'Unknown error',
      retry_count: ((clip.generation_metadata as any)?.retry_count ?? 0) + 1,
    }

    await supabase
      .from('cu_clips')
      .update({ status: 'failed', generation_metadata: metadata })
      .eq('id', clip.id)

    return { success: false, error: error.message }
  }
}
