/**
 * GET /api/audio/vibes
 *
 * Returns the meditative narration "vibes" for the audio generate page, each
 * with a short S3-cached preview clip. A vibe is the single, foolproof choice a
 * member makes; the backend resolves it to an OpenAI voice + tone instructions.
 *
 * First call lazily generates any missing previews (cached thereafter).
 */

export const runtime = 'nodejs'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { VOICE_VIBES } from '@/lib/audio/voice-vibes'
import { getOrCreateVibePreview } from '@/lib/services/audioService'

export async function GET() {
  try {
    const vibes = await Promise.all(
      VOICE_VIBES.map(async (vibe) => {
        let previewUrl: string | null = null
        try {
          const preview = await getOrCreateVibePreview(vibe)
          previewUrl = preview.url
        } catch (err) {
          console.error(`[Vibes] Failed to prepare preview for ${vibe.id}:`, err)
        }
        return {
          id: vibe.id,
          name: vibe.label,
          description: vibe.description,
          previewUrl,
        }
      }),
    )

    return NextResponse.json({ vibes })
  } catch (error) {
    console.error('[Vibes] Failed to load vibes:', error)
    return NextResponse.json({ error: 'Failed to load vibes' }, { status: 500 })
  }
}
