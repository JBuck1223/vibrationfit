/**
 * YouTube Audio Extraction API
 *
 * Fetches audio for a YouTube URL via a RapidAPI YouTube->MP3 downloader
 * (works from serverless/datacenter IPs, unlike yt-dlp which YouTube blocks),
 * stores it on S3, and returns a temporary audio URL the client can load
 * into a waveform scrubber.
 *
 * POST /api/songs/extract-youtube
 * Body: { url: string }
 * Returns: { audio_url: string, duration: number }
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

export const maxDuration = 120
export const dynamic = 'force-dynamic'

const CDN_URL = 'https://media.vibrationfit.com'
const BUCKET = 'vibration-fit-client-storage'

const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY
const RAPIDAPI_HOST = process.env.RAPIDAPI_YOUTUBE_MP3_HOST || 'youtube-mp310.p.rapidapi.com'

const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

function isValidYoutubeUrl(url: string): boolean {
  try {
    const u = new URL(url)
    return (
      u.hostname === 'www.youtube.com' ||
      u.hostname === 'youtube.com' ||
      u.hostname === 'youtu.be' ||
      u.hostname === 'm.youtube.com' ||
      u.hostname === 'music.youtube.com'
    )
  } catch {
    return false
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

// RapidAPI hands back a download link a moment before the converted file is
// actually ready, so the first hit often returns 429/5xx. The conversion is
// cached after the first request, so retrying the whole operation (fetching a
// FRESH link each time) almost always succeeds.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

// Carries a user-facing message + HTTP status up to the route handler.
class ExtractError extends Error {
  constructor(public userMessage: string, public status: number) {
    super(userMessage)
  }
}

// Hard wall-clock deadline for the whole operation. Must stay comfortably
// below the route's maxDuration so we always return our own clean error
// before Vercel kills the function with a platform 504.
const TOTAL_DEADLINE_MS = 85000
const CONVERT_TIMEOUT_MS = 15000
const DOWNLOAD_TIMEOUT_MS = 30000

/**
 * Obtain the full MP3 for a YouTube URL via RapidAPI, retrying the ENTIRE
 * convert+download as a unit. The download link is single-use, so a failed
 * download must be retried with a freshly-issued link, not the same one.
 *
 * The whole loop is bounded by a wall-clock deadline (and per-attempt
 * timeouts are clamped to the remaining budget), so a member never sits
 * waiting and we never trip Vercel's function timeout — they get audio
 * quickly or a clean error.
 */
async function fetchYoutubeAudio(
  youtubeUrl: string,
  { attempts = 4, baseDelayMs = 2000 }: { attempts?: number; baseDelayMs?: number } = {}
): Promise<Buffer> {
  const startedAt = Date.now()
  const remaining = () => TOTAL_DEADLINE_MS - (Date.now() - startedAt)
  let lastReason = 'unknown error'

  for (let attempt = 1; attempt <= attempts; attempt++) {
    // Stop if there isn't enough budget left to meaningfully try again.
    if (remaining() < 5000) break

    try {
      // Step 1: request a fresh, single-use MP3 download URL.
      const convertRes = await fetch(
        `https://${RAPIDAPI_HOST}/download/mp3?url=${encodeURIComponent(youtubeUrl)}`,
        {
          headers: {
            'x-rapidapi-key': RAPIDAPI_KEY as string,
            'x-rapidapi-host': RAPIDAPI_HOST,
          },
          signal: AbortSignal.timeout(Math.min(CONVERT_TIMEOUT_MS, remaining())),
        }
      )

      if (!convertRes.ok) {
        const body = await convertRes.text().catch(() => '')
        // Non-retryable (e.g. 400/403/404 — bad/private/unavailable video): fail fast.
        if (!RETRYABLE_STATUS.has(convertRes.status)) {
          throw new ExtractError('Could not fetch audio for that link. Try another track.', 502)
        }
        lastReason = `convert ${convertRes.status} ${body.slice(0, 120)}`
      } else {
        const data = await convertRes.json().catch(() => ({} as Record<string, unknown>))
        const downloadUrl = (data.downloadUrl || data.link || data.url) as string | undefined

        if (!downloadUrl) {
          // File likely still converting — retry for a fresh response.
          lastReason = `no downloadUrl in response: ${JSON.stringify(data).slice(0, 120)}`
        } else if (remaining() > 5000) {
          // Step 2: download the fresh single-use URL exactly once.
          const dlRes = await fetch(downloadUrl, {
            signal: AbortSignal.timeout(Math.min(DOWNLOAD_TIMEOUT_MS, remaining())),
          })
          if (dlRes.ok) {
            return Buffer.from(await dlRes.arrayBuffer())
          }
          lastReason = `download ${dlRes.status}`
        }
      }
    } catch (err) {
      if (err instanceof ExtractError) throw err
      // Network error or per-attempt timeout — retryable.
      lastReason = err instanceof Error ? err.message : String(err)
    }

    console.warn(`[ExtractYouTube] attempt ${attempt}/${attempts} failed: ${lastReason}`)

    // Back off before the next attempt, but only if budget remains.
    const delay = Math.min(baseDelayMs * 2 ** (attempt - 1), 8000)
    if (attempt < attempts && remaining() > delay + 5000) {
      await sleep(delay)
    } else if (attempt < attempts) {
      break
    }
  }

  console.error(`[ExtractYouTube] gave up after ${Date.now() - startedAt}ms: ${lastReason}`)
  throw new ExtractError('That track took too long to prepare. Please try again.', 502)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!RAPIDAPI_KEY) {
      return NextResponse.json({ error: 'YouTube extraction is not configured' }, { status: 500 })
    }

    const { url } = await request.json()

    if (!url || !isValidYoutubeUrl(url)) {
      return NextResponse.json({ error: 'Invalid YouTube URL' }, { status: 400 })
    }

    // Fetch the video title via YouTube oEmbed (free, no key required)
    let videoTitle: string | null = null
    try {
      const oembedRes = await fetch(
        `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`,
        { signal: AbortSignal.timeout(5000) }
      )
      if (oembedRes.ok) {
        const oembed = await oembedRes.json()
        videoTitle = oembed.title || null
      }
    } catch {
      // Non-critical — proceed without title
    }

    // Steps 1 & 2: fetch a fresh single-use download link and download the MP3,
    // retrying the whole unit on transient upstream failures.
    let audioBuffer: Buffer
    try {
      audioBuffer = await fetchYoutubeAudio(url)
    } catch (err) {
      if (err instanceof ExtractError) {
        console.error('[ExtractYouTube] Extraction failed:', err.message)
        return NextResponse.json({ error: err.userMessage }, { status: err.status })
      }
      throw err
    }

    // Step 3: store full audio on S3 as the scrubbable reference source
    const key = `${user.id}/songs/references/${Date.now()}-ref.mp3`
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
    }))

    const audioUrl = `${CDN_URL}/${key}`

    // Client computes the real duration from the waveform; this is a placeholder.
    return NextResponse.json({
      audio_url: audioUrl,
      duration: 0,
      title: videoTitle,
      youtube_url: url,
    })
  } catch (err) {
    console.error('[ExtractYouTube] Error:', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
