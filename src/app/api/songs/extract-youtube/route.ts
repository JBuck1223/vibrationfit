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

    // Step 1: ask the RapidAPI downloader for a temporary MP3 download URL
    const apiRes = await fetch(
      `https://${RAPIDAPI_HOST}/download/mp3?url=${encodeURIComponent(url)}`,
      {
        headers: {
          'x-rapidapi-key': RAPIDAPI_KEY,
          'x-rapidapi-host': RAPIDAPI_HOST,
        },
      }
    )

    if (!apiRes.ok) {
      const text = await apiRes.text().catch(() => '')
      console.error('[ExtractYouTube] RapidAPI error:', apiRes.status, text.slice(0, 300))
      return NextResponse.json({ error: 'Could not fetch audio for that link. Try another track.' }, { status: 502 })
    }

    const apiData = await apiRes.json().catch(() => ({}))
    const downloadUrl: string | undefined = apiData.downloadUrl || apiData.link || apiData.url

    if (!downloadUrl) {
      console.error('[ExtractYouTube] No downloadUrl in response:', JSON.stringify(apiData).slice(0, 300))
      return NextResponse.json({ error: 'No audio available for that link.' }, { status: 502 })
    }

    // Step 2: download the MP3 (session URL is single-use)
    const audioRes = await fetch(downloadUrl)
    if (!audioRes.ok) {
      console.error('[ExtractYouTube] Download failed:', audioRes.status)
      return NextResponse.json({ error: 'Failed to download audio.' }, { status: 502 })
    }

    const audioBuffer = Buffer.from(await audioRes.arrayBuffer())

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
    return NextResponse.json({ audio_url: audioUrl, duration: 0 })
  } catch (err) {
    console.error('[ExtractYouTube] Error:', err)
    const message = err instanceof Error ? err.message : 'Extraction failed'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
