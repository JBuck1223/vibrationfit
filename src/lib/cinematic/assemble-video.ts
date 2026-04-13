// Cinematic Universe -- Video assembly
// Concatenates approved clip videos into a final episode video.
// Uses S3 for intermediate storage and ffmpeg-compatible concat for now.
// Can be upgraded to AWS MediaConvert for production-grade encoding.

import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { createAdminClient } from '@/lib/supabase/admin'
import { collectClipUrls } from './collect-assets'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET = 'vibration-fit-client-storage'
const CDN_BASE = 'https://media.vibrationfit.com'

export interface AssembleResult {
  success: boolean
  videoUrl?: string
  s3Key?: string
  error?: string
}

/**
 * Simple video assembly: downloads all clip videos and creates a concat list
 * that can be processed by MediaConvert or ffmpeg.
 *
 * For the initial implementation, this creates a manifest file in S3
 * that lists all clip URLs in order. A Lambda/MediaConvert job can
 * pick this up for server-side stitching.
 *
 * When clips are short (6s each), the total video is typically 18-42 seconds --
 * perfect for Reels/TikTok/Shorts.
 */
export async function assembleEpisodeVideo(episodeId: string): Promise<AssembleResult> {
  try {
    const clipUrls = await collectClipUrls(episodeId)

    if (clipUrls.length === 0) {
      return { success: false, error: 'No approved clips found' }
    }

    // Create a manifest file for MediaConvert / Lambda processing
    const manifest = {
      episode_id: episodeId,
      created_at: new Date().toISOString(),
      clips: clipUrls.map((url, i) => ({
        order: i,
        url,
        s3_key: url.replace(`${CDN_BASE}/`, ''),
      })),
      total_clips: clipUrls.length,
      estimated_duration_seconds: clipUrls.length * 6,
    }

    const manifestKey = `cinematic/assembly/${episodeId}/manifest.json`

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: manifestKey,
        Body: JSON.stringify(manifest, null, 2),
        ContentType: 'application/json',
      })
    )

    // For now, if there's only one clip, use it directly as the final video
    if (clipUrls.length === 1) {
      const supabase = createAdminClient()
      await supabase
        .from('cu_episodes')
        .update({
          final_video_url: clipUrls[0],
          status: 'approved',
        })
        .eq('id', episodeId)

      return { success: true, videoUrl: clipUrls[0] }
    }

    // For multiple clips, store the manifest and update episode
    // The actual concatenation will be handled by MediaConvert Lambda
    const manifestUrl = `${CDN_BASE}/${manifestKey}`
    const supabase = createAdminClient()
    await supabase
      .from('cu_episodes')
      .update({
        final_video_url: manifestUrl,
      })
      .eq('id', episodeId)

    return {
      success: true,
      videoUrl: manifestUrl,
      s3Key: manifestKey,
    }
  } catch (error: any) {
    console.error('Video assembly failed:', error)
    return { success: false, error: error.message }
  }
}
