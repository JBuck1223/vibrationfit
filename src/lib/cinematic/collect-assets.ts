// Cinematic Universe -- Collect all assets for an episode
// Used for assembly, export, and social media publishing.

import { createAdminClient } from '@/lib/supabase/admin'

export interface EpisodeAsset {
  type: 'keyframe' | 'clip'
  sort_order: number
  media_url: string
  s3_key: string | null
  file_type: 'image' | 'video'
  duration_seconds: number | null
}

/**
 * Collect all approved media assets for an episode in sort order.
 * Keyframes come first (sorted), then clips (sorted).
 */
export async function collectEpisodeAssets(episodeId: string): Promise<EpisodeAsset[]> {
  const supabase = createAdminClient()

  const [keyframesRes, clipsRes] = await Promise.all([
    supabase
      .from('cu_keyframes')
      .select('sort_order, status, generated_media:cu_media(url, s3_key, file_type, duration_seconds)')
      .eq('episode_id', episodeId)
      .eq('status', 'approved')
      .order('sort_order'),
    supabase
      .from('cu_clips')
      .select('sort_order, status, generated_media:cu_media(url, s3_key, file_type, duration_seconds)')
      .eq('episode_id', episodeId)
      .eq('status', 'approved')
      .order('sort_order'),
  ])

  const assets: EpisodeAsset[] = []

  for (const kf of keyframesRes.data ?? []) {
    const media = kf.generated_media as any
    if (media?.url) {
      assets.push({
        type: 'keyframe',
        sort_order: kf.sort_order,
        media_url: media.url,
        s3_key: media.s3_key,
        file_type: 'image',
        duration_seconds: null,
      })
    }
  }

  for (const clip of clipsRes.data ?? []) {
    const media = clip.generated_media as any
    if (media?.url) {
      assets.push({
        type: 'clip',
        sort_order: clip.sort_order,
        media_url: media.url,
        s3_key: media.s3_key,
        file_type: 'video',
        duration_seconds: media.duration_seconds,
      })
    }
  }

  return assets
}

/**
 * Get just the approved clip video URLs in order (for video stitching).
 */
export async function collectClipUrls(episodeId: string): Promise<string[]> {
  const assets = await collectEpisodeAssets(episodeId)
  return assets.filter((a) => a.type === 'clip').map((a) => a.media_url)
}
