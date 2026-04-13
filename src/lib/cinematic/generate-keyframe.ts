// Cinematic Universe -- Keyframe image generation pipeline
// Generates a single keyframe image via fal.ai, uploads to S3, creates cu_media row.

import { fal } from '@fal-ai/client'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { resolveImageModel, resolveEditModel, targetSizeToAspectRatio } from './fal-models'
import { resolveReferenceImageUrl } from './resolve-keyframe-refs'
import type { CuKeyframe, KeyframeWithMedia, GenerationMetadata, PreviousVersion } from './types'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = 'vibration-fit-client-storage'
const CDN_BASE = 'https://media.vibrationfit.com'

export interface GenerateKeyframeResult {
  success: boolean
  mediaId?: string
  mediaUrl?: string
  error?: string
}

/**
 * Generate a keyframe image and persist the result.
 * 1. Marks keyframe as 'generating'
 * 2. Calls fal.ai (image gen or image edit depending on reference presence)
 * 3. Uploads result to S3
 * 4. Creates cu_media row
 * 5. Links media to keyframe, marks 'complete'
 */
export async function generateKeyframe(
  keyframe: CuKeyframe,
  allKeyframes: KeyframeWithMedia[]
): Promise<GenerateKeyframeResult> {
  const supabase = createAdminClient()
  const startedAt = new Date().toISOString()

  // Preserve current version in history before re-generating
  const existingMeta = (keyframe.generation_metadata as GenerationMetadata) || {}
  const previousVersions: PreviousVersion[] = existingMeta.previous_versions || []

  if (keyframe.generated_media_id) {
    const { data: currentMedia } = await supabase
      .from('cu_media')
      .select('id, url, fal_model, fal_request_id, created_at')
      .eq('id', keyframe.generated_media_id)
      .single()

    if (currentMedia) {
      previousVersions.push({
        media_id: currentMedia.id,
        media_url: currentMedia.url,
        fal_model: currentMedia.fal_model ?? undefined,
        fal_request_id: currentMedia.fal_request_id ?? undefined,
        generated_at: currentMedia.created_at,
      })
    }
  }

  await supabase
    .from('cu_keyframes')
    .update({
      status: 'generating',
      generation_metadata: { started_at: startedAt, previous_versions: previousVersions },
    })
    .eq('id', keyframe.id)

  try {
    fal.config({ credentials: process.env.FAL_KEY! })

    const referenceUrl = resolveReferenceImageUrl(keyframe, allKeyframes)
    const aspectRatio = targetSizeToAspectRatio(keyframe.target_size || 'landscape_16_9')
    const prompt = keyframe.prompt || keyframe.description

    let imageUrl: string
    let falModel: string
    let falRequestId: string | undefined

    if (referenceUrl) {
      // Image edit mode: use reference image as base
      falModel = resolveEditModel(keyframe.fal_model)
      const result = await fal.subscribe(falModel, {
        input: {
          prompt,
          image_urls: [referenceUrl],
          aspect_ratio: aspectRatio,
          num_images: 1,
        },
        logs: false,
      })

      const data = (result as any).data || result
      falRequestId = (result as any).requestId
      imageUrl = data?.images?.[0]?.url
      if (!imageUrl) throw new Error('No image URL in fal.ai edit response')
    } else {
      // Text-to-image mode
      falModel = resolveImageModel(keyframe.fal_model)

      const sizeMap: Record<string, { width: number; height: number }> = {
        '9:16': { width: 720, height: 1280 },
        '1:1': { width: 1024, height: 1024 },
        '16:9': { width: 1280, height: 720 },
      }
      const imageSize = sizeMap[aspectRatio] || sizeMap['16:9']

      const isNanoBanana = falModel.includes('nano-banana')
      const input: Record<string, unknown> = {
        prompt,
        num_images: 1,
        ...(isNanoBanana ? { aspect_ratio: aspectRatio } : { image_size: imageSize }),
      }

      const result = await fal.subscribe(falModel, { input, logs: false })

      const data = (result as any).data || result
      falRequestId = (result as any).requestId
      imageUrl = data?.images?.[0]?.url
      if (!imageUrl) throw new Error('No image URL in fal.ai generate response')
    }

    // Download and upload to S3
    const imgResponse = await fetch(imageUrl)
    if (!imgResponse.ok) throw new Error('Failed to download generated image from fal.ai')
    const imgBuffer = new Uint8Array(await imgResponse.arrayBuffer())

    const timestamp = Date.now()
    const s3Key = `cinematic/keyframes/${keyframe.episode_id}/${timestamp}-kf${keyframe.sort_order}.png`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: s3Key,
        Body: Buffer.from(imgBuffer),
        ContentType: 'image/png',
        CacheControl: 'max-age=31536000',
      })
    )

    const cdnUrl = `${CDN_BASE}/${s3Key}`

    // Create cu_media row
    const { data: media, error: mediaError } = await supabase
      .from('cu_media')
      .insert({
        file_type: 'image',
        url: cdnUrl,
        s3_key: s3Key,
        fal_model: falModel,
        fal_request_id: falRequestId,
        file_size_bytes: imgBuffer.length,
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
      previous_versions: previousVersions.length > 0 ? previousVersions : undefined,
    }

    await supabase
      .from('cu_keyframes')
      .update({
        status: 'complete',
        generated_media_id: media.id,
        generation_metadata: metadata,
      })
      .eq('id', keyframe.id)

    return { success: true, mediaId: media.id, mediaUrl: cdnUrl }
  } catch (error: any) {
    console.error(`Keyframe ${keyframe.id} generation failed:`, error)

    const metadata: GenerationMetadata = {
      started_at: startedAt,
      completed_at: new Date().toISOString(),
      error_message: error.message || 'Unknown error',
      retry_count: ((keyframe.generation_metadata as any)?.retry_count ?? 0) + 1,
      previous_versions: previousVersions.length > 0 ? previousVersions : undefined,
    }

    await supabase
      .from('cu_keyframes')
      .update({ status: 'failed', generation_metadata: metadata })
      .eq('id', keyframe.id)

    return { success: false, error: error.message }
  }
}
