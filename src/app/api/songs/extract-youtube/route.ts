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

// A single RapidAPI key works across every API the account is subscribed to,
// so all providers below share one key — only the host + response shape differ.
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY

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

// Transient statuses worth retrying/polling for. A 403/404 is NOT here —
// those mean "not subscribed" or "video unavailable" and we move on fast.
const RETRYABLE_STATUS = new Set([408, 425, 429, 500, 502, 503, 504])

// Carries a user-facing message + HTTP status up to the route handler.
class ExtractError extends Error {
  constructor(public userMessage: string, public status: number) {
    super(userMessage)
  }
}

// Hard wall-clock deadline for the whole operation (all providers combined).
// Stays comfortably below the route's maxDuration so we always return our own
// clean error before Vercel kills the function with a platform 504.
const TOTAL_DEADLINE_MS = 80000
const RESOLVE_TIMEOUT_MS = 15000
const DOWNLOAD_TIMEOUT_MS = 30000

function rapidHeaders(host: string) {
  return { 'x-rapidapi-key': RAPIDAPI_KEY as string, 'x-rapidapi-host': host }
}

/** Pull the 11-char video ID out of any YouTube URL shape. */
function extractVideoId(url: string): string | null {
  try {
    const u = new URL(url)
    if (u.hostname === 'youtu.be') return u.pathname.slice(1).split('/')[0] || null
    if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2] || null
    if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2] || null
    return u.searchParams.get('v')
  } catch {
    return null
  }
}

interface ResolveCtx {
  host: string
  url: string
  videoId: string | null
  remaining: () => number
}

interface Provider {
  name: string
  host: string
  // Returns a directly-downloadable MP3 URL, or null if this provider can't serve it.
  resolve: (ctx: ResolveCtx) => Promise<string | null>
}

/**
 * youtube-mp36 (ytjar) — the most widely used RapidAPI YouTube->MP3 service.
 * Takes a video ID and returns { link, status }. When the file is still being
 * converted it reports status "processing"; poll until "ok".
 */
async function resolveMp36({ host, videoId, remaining }: ResolveCtx): Promise<string | null> {
  if (!videoId) return null

  for (let i = 0; i < 6; i++) {
    if (remaining() < 6000) break

    const res = await fetch(`https://${host}/dl?id=${encodeURIComponent(videoId)}`, {
      headers: rapidHeaders(host),
      signal: AbortSignal.timeout(Math.min(RESOLVE_TIMEOUT_MS, remaining())),
    })

    if (!res.ok) {
      if (RETRYABLE_STATUS.has(res.status)) {
        await sleep(2000)
        continue
      }
      return null // e.g. 403 not subscribed / 404 — let the next provider try.
    }

    const data = await res.json().catch(() => ({} as Record<string, unknown>))
    const status = String(data.status || '').toLowerCase()
    const link = (data.link || data.url) as string | undefined

    if (link && (status === 'ok' || status === '' || status === 'success')) return link
    if (status === 'processing' || status === 'in process' || status === 'converting') {
      await sleep(2500)
      continue
    }
    return null // status "fail" or unknown shape.
  }
  return null
}

/**
 * youtube-mp310 (Elis) — takes a full URL and returns a single-use download
 * link (downloadUrl/link/url). Kept as a fallback.
 */
async function resolveMp310({ host, url, remaining }: ResolveCtx): Promise<string | null> {
  const res = await fetch(`https://${host}/download/mp3?url=${encodeURIComponent(url)}`, {
    headers: rapidHeaders(host),
    signal: AbortSignal.timeout(Math.min(RESOLVE_TIMEOUT_MS, remaining())),
  })
  if (!res.ok) return null
  const data = await res.json().catch(() => ({} as Record<string, unknown>))
  return (data.downloadUrl || data.link || data.url || null) as string | null
}

// Tried in order until one yields a working download. Hosts are overridable
// via env so providers can be swapped without a deploy.
const PROVIDERS: Provider[] = [
  {
    name: 'youtube-mp36',
    host: process.env.RAPIDAPI_YOUTUBE_MP3_HOST_PRIMARY || 'youtube-mp36.p.rapidapi.com',
    resolve: resolveMp36,
  },
  {
    name: 'youtube-mp310',
    host: process.env.RAPIDAPI_YOUTUBE_MP3_HOST || 'youtube-mp310.p.rapidapi.com',
    resolve: resolveMp310,
  },
]

/**
 * Obtain the full MP3 for a YouTube URL, trying each provider in turn. The
 * whole operation is bounded by a wall-clock deadline so a member never waits
 * long and we never trip Vercel's function timeout — they get audio quickly,
 * fall through to a healthy provider, or get a clean error.
 */
async function fetchYoutubeAudio(youtubeUrl: string): Promise<Buffer> {
  const startedAt = Date.now()
  const remaining = () => TOTAL_DEADLINE_MS - (Date.now() - startedAt)
  const videoId = extractVideoId(youtubeUrl)
  let lastReason = 'no provider could serve this track'

  for (const provider of PROVIDERS) {
    if (remaining() < 8000) break

    try {
      const downloadUrl = await provider.resolve({ host: provider.host, url: youtubeUrl, videoId, remaining })
      if (!downloadUrl) {
        lastReason = `${provider.name}: no download link`
        console.warn(`[ExtractYouTube] provider ${provider.name} unavailable`)
        continue
      }

      if (remaining() < 5000) break

      const dlRes = await fetch(downloadUrl, {
        signal: AbortSignal.timeout(Math.min(DOWNLOAD_TIMEOUT_MS, remaining())),
      })
      if (dlRes.ok) {
        console.log(`[ExtractYouTube] served by ${provider.name} in ${Date.now() - startedAt}ms`)
        return Buffer.from(await dlRes.arrayBuffer())
      }
      lastReason = `${provider.name}: download ${dlRes.status}`
    } catch (err) {
      lastReason = `${provider.name}: ${err instanceof Error ? err.message : String(err)}`
    }

    console.warn(`[ExtractYouTube] provider ${provider.name} failed: ${lastReason}`)
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
