/**
 * Import Recording from Daily.co
 *
 * POST /api/admin/recordings/import-from-daily
 *
 * Accepts a Daily.co dashboard URL (or direct recording ID), resolves the
 * recording, downloads it from Daily, uploads to S3, and updates the
 * video_sessions row so the replay appears on /alignment-gym.
 *
 * Provides step-by-step progress logging so failures are diagnosable.
 */

import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'
import { createServiceClient } from '@/lib/supabase/service'
import {
  getMeeting,
  listRecordings,
  getRecordingAccessLink,
  getRecording,
} from '@/lib/video/daily'
import { S3Client, PutObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'

export const runtime = 'nodejs'
export const maxDuration = 300

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

/**
 * Parse a Daily.co URL into its components.
 *
 * Supported formats:
 *   - Dashboard session: https://dashboard.daily.co/sessions/{meetingId}?domain=...
 *   - Dashboard recording: https://dashboard.daily.co/recordings/{recordingId}?domain=...
 *   - Raw meeting ID or recording ID (UUID)
 */
function parseDailyUrl(input: string): {
  type: 'meeting' | 'recording' | 'unknown'
  id: string
} {
  const trimmed = input.trim()

  try {
    const url = new URL(trimmed)
    const pathParts = url.pathname.split('/').filter(Boolean)

    if (pathParts[0] === 'sessions' && pathParts[1]) {
      return { type: 'meeting', id: pathParts[1] }
    }
    if (pathParts[0] === 'recordings' && pathParts[1]) {
      return { type: 'recording', id: pathParts[1] }
    }
  } catch {
    // Not a URL — treat as raw ID
  }

  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidPattern.test(trimmed)) {
    return { type: 'unknown', id: trimmed }
  }

  return { type: 'unknown', id: trimmed }
}

export async function POST(request: NextRequest) {
  const steps: string[] = []
  const step = (msg: string) => {
    steps.push(msg)
    console.log(`[import-from-daily] ${msg}`)
  }

  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const body = await request.json()
    const { daily_url, session_id } = body as {
      daily_url?: string
      session_id?: string
    }

    if (!daily_url) {
      return NextResponse.json(
        { error: 'daily_url is required', steps },
        { status: 400 }
      )
    }

    step(`Parsing input: ${daily_url}`)
    const parsed = parseDailyUrl(daily_url)
    step(`Parsed as ${parsed.type}: ${parsed.id}`)

    // Cloud recordings use "finished", raw-tracks use "ready"
    const DOWNLOADABLE_STATUSES = ['ready', 'finished']
    const isDownloadable = (status: string) => DOWNLOADABLE_STATUSES.includes(status)

    // Resolve to a recording ID
    let recordingId: string | null = null
    let roomName: string | null = null
    let recordingDuration = 0

    if (parsed.type === 'recording') {
      step('Fetching recording details directly...')
      try {
        const rec = await getRecording(parsed.id)
        recordingId = rec.id
        roomName = rec.room_name
        recordingDuration = rec.duration || 0
        step(`Recording found: ${rec.id} (room: ${rec.room_name}, status: ${rec.status}, duration: ${rec.duration}s)`)
        if (!isDownloadable(rec.status)) {
          return NextResponse.json(
            { error: `Recording status is "${rec.status}" — not yet downloadable. Try again later.`, steps },
            { status: 422 }
          )
        }
      } catch (err) {
        step(`Failed to fetch recording directly: ${err}`)
        return NextResponse.json(
          { error: `Could not find recording ${parsed.id} in Daily.co`, steps },
          { status: 404 }
        )
      }
    } else {
      // For meeting URLs or unknown IDs, try meeting lookup first, then recording
      let resolvedRoomName: string | null = null

      if (parsed.type === 'meeting' || parsed.type === 'unknown') {
        step('Looking up meeting in Daily.co...')
        try {
          const meeting = await getMeeting(parsed.id)
          resolvedRoomName = meeting.room
          step(`Meeting resolved: room="${meeting.room}", participants=${meeting.max_participants}, duration=${meeting.duration}s`)
        } catch (err) {
          step(`Meeting lookup failed: ${err}`)
          if (parsed.type === 'unknown') {
            step('Trying as recording ID instead...')
            try {
              const rec = await getRecording(parsed.id)
              recordingId = rec.id
              roomName = rec.room_name
              recordingDuration = rec.duration || 0
              step(`Found as recording: ${rec.id} (room: ${rec.room_name}, status: ${rec.status})`)
              if (!isDownloadable(rec.status)) {
                return NextResponse.json(
                  { error: `Recording status is "${rec.status}" — not yet downloadable.`, steps },
                  { status: 422 }
                )
              }
            } catch {
              return NextResponse.json(
                { error: `Could not resolve "${parsed.id}" as a meeting or recording in Daily.co`, steps },
                { status: 404 }
              )
            }
          } else {
            return NextResponse.json(
              { error: `Meeting ${parsed.id} not found in Daily.co`, steps },
              { status: 404 }
            )
          }
        }
      }

      // If we resolved a room name but not yet a recording, list recordings for that room
      if (resolvedRoomName && !recordingId) {
        roomName = resolvedRoomName
        step(`Listing recordings for room "${roomName}"...`)
        let recordings: Awaited<ReturnType<typeof listRecordings>>['data']
        try {
          const result = await listRecordings(roomName)
          recordings = result.data
          step(`Daily returned ${recordings?.length ?? 0} recording(s) for this room`)
          if (recordings && recordings.length > 0) {
            for (const r of recordings) {
              step(`  - ${r.id} | status=${r.status} | duration=${r.duration}s | start_ts=${r.start_ts}`)
            }
          }
        } catch (err) {
          step(`listRecordings API call failed: ${err}`)
          return NextResponse.json(
            { error: `Failed to list recordings for room "${roomName}"`, steps },
            { status: 500 }
          )
        }

        const readyRecordings = (recordings || []).filter(r => isDownloadable(r.status))

        if (readyRecordings.length === 0) {
          step(`No downloadable recordings found (need status: ${DOWNLOADABLE_STATUSES.join(' or ')})`)
          return NextResponse.json(
            {
              error: `No ready recordings found for room "${roomName}". Found ${recordings?.length || 0} total recordings.`,
              recordings: recordings?.map(r => ({ id: r.id, status: r.status, duration: r.duration })),
              steps,
            },
            { status: 404 }
          )
        }

        // Use the most recent ready recording
        const best = readyRecordings.sort((a, b) => (b.start_ts || 0) - (a.start_ts || 0))[0]
        recordingId = best.id
        recordingDuration = best.duration || 0
        step(`Selected recording: ${best.id} (duration: ${best.duration}s, started: ${new Date((best.start_ts || 0) * 1000).toISOString()})`)

        if (readyRecordings.length > 1) {
          step(`Note: ${readyRecordings.length} ready recordings exist — using the most recent one`)
        }
      }
    }

    if (!recordingId) {
      return NextResponse.json(
        { error: 'Could not resolve a recording ID', steps },
        { status: 400 }
      )
    }

    // Get download link
    step('Getting download link from Daily.co...')
    let downloadLink: string
    try {
      const accessData = await getRecordingAccessLink(recordingId)
      downloadLink = accessData.download_link
      step('Download link obtained')
    } catch (err) {
      step(`Failed to get download link: ${err}`)
      return NextResponse.json(
        { error: 'Failed to get recording download link from Daily.co', steps },
        { status: 500 }
      )
    }

    // Download from Daily
    step('Downloading recording from Daily.co...')
    let fullBuffer: Buffer
    try {
      const downloadResponse = await fetch(downloadLink)
      if (!downloadResponse.ok || !downloadResponse.body) {
        throw new Error(`HTTP ${downloadResponse.status} ${downloadResponse.statusText}`)
      }

      const reader = downloadResponse.body.getReader()
      const chunks: Uint8Array[] = []
      let totalBytes = 0
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
        totalBytes += value.length
      }
      fullBuffer = Buffer.concat(chunks)
      step(`Downloaded ${(fullBuffer.length / (1024 * 1024)).toFixed(1)} MB`)
    } catch (err) {
      step(`Download failed: ${err}`)
      return NextResponse.json(
        { error: 'Failed to download recording from Daily.co', steps },
        { status: 500 }
      )
    }

    // Upload to S3
    const effectiveRoom = roomName || `imported-${recordingId}`
    const s3Key = `session-recordings/${effectiveRoom}/${recordingId}.mp4`

    step(`Uploading to S3: ${s3Key} (${(fullBuffer.length / (1024 * 1024)).toFixed(1)} MB)...`)
    try {
      if (fullBuffer.length > 50 * 1024 * 1024) {
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fullBuffer,
            ContentType: 'video/mp4',
            CacheControl: 'max-age=31536000',
            Metadata: {
              'daily-recording-id': recordingId,
              'daily-room-name': effectiveRoom,
              'recording-duration': String(recordingDuration),
            },
          },
          queueSize: 4,
          partSize: 10 * 1024 * 1024,
        })
        await upload.done()
      } else {
        await s3Client.send(
          new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fullBuffer,
            ContentType: 'video/mp4',
            CacheControl: 'max-age=31536000',
            Metadata: {
              'daily-recording-id': recordingId,
              'daily-room-name': effectiveRoom,
              'recording-duration': String(recordingDuration),
            },
          })
        )
      }
      step('S3 upload complete')
    } catch (err) {
      step(`S3 upload failed: ${err}`)
      return NextResponse.json(
        { error: 'Failed to upload recording to S3', steps },
        { status: 500 }
      )
    }

    const recordingUrl = `${CDN_URL}/${s3Key}`

    // Update database
    if (session_id) {
      step(`Updating video_sessions row ${session_id}...`)
      const supabase = createServiceClient()

      const updatePayload: Record<string, unknown> = {
        recording_status: 'uploaded',
        recording_s3_key: s3Key,
        recording_url: recordingUrl,
        recording_duration_seconds: recordingDuration,
        daily_recording_id: recordingId,
      }

      // Also mark completed if not already, so it shows in replay list
      const { data: currentSession } = await supabase
        .from('video_sessions')
        .select('status')
        .eq('id', session_id)
        .single()

      if (currentSession && currentSession.status !== 'completed') {
        updatePayload.status = 'completed'
        updatePayload.ended_at = new Date().toISOString()
        step(`Also marking session as completed (was "${currentSession.status}")`)
      }

      const { error: updateError } = await supabase
        .from('video_sessions')
        .update(updatePayload)
        .eq('id', session_id)

      if (updateError) {
        step(`DB update failed: ${updateError.message}`)
        return NextResponse.json(
          {
            error: 'Recording uploaded to S3 but database update failed',
            recording_url: recordingUrl,
            steps,
          },
          { status: 500 }
        )
      }
      step('Database updated successfully')
    } else {
      step('No session_id provided — skipping database update')
    }

    step('Import complete')

    return NextResponse.json({
      success: true,
      recording_url: recordingUrl,
      recording_id: recordingId,
      s3_key: s3Key,
      duration_seconds: recordingDuration,
      room_name: roomName,
      steps,
    })
  } catch (error) {
    console.error('[import-from-daily] Unexpected error:', error)
    step(`Unexpected error: ${error}`)
    return NextResponse.json(
      { error: 'Import failed unexpectedly', steps },
      { status: 500 }
    )
  }
}
