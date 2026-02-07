/**
 * Video Recording Processor
 * 
 * POST /api/video/recordings/process
 * 
 * Downloads a recording from Daily.co and streams it directly to our S3 bucket.
 * Called by the Daily.co webhook handler when a recording is ready.
 * 
 * Flow: Daily.co S3 → stream → our S3 bucket
 */

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { Upload } from '@aws-sdk/lib-storage'
import { getRecordingAccessLink, getRecording } from '@/lib/video/daily'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'
export const maxDuration = 300 // 5 min for large file transfers

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

export async function POST(request: NextRequest) {
  try {
    // Verify internal call (from our webhook handler)
    const internalSecret = request.headers.get('x-internal-secret')
    const expectedSecret = process.env.INTERNAL_API_SECRET
    if (expectedSecret && internalSecret !== expectedSecret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { recording_id, room_name, duration } = await request.json()

    if (!recording_id || !room_name) {
      return NextResponse.json(
        { error: 'recording_id and room_name are required' },
        { status: 400 }
      )
    }

    console.log(`📥 Processing recording ${recording_id} from room ${room_name}`)

    const supabase = createServiceClient()

    // 1. Get recording details from Daily.co
    let recordingDetails
    try {
      recordingDetails = await getRecording(recording_id)
    } catch (err) {
      console.error('Failed to get recording details:', err)
      await supabase
        .from('video_sessions')
        .update({ recording_status: 'failed' })
        .eq('daily_room_name', room_name)
      return NextResponse.json({ error: 'Failed to get recording details' }, { status: 500 })
    }

    // 2. Get the download link from Daily.co
    let downloadLink: string
    try {
      const accessData = await getRecordingAccessLink(recording_id)
      downloadLink = accessData.download_link
    } catch (err) {
      console.error('Failed to get recording download link:', err)
      await supabase
        .from('video_sessions')
        .update({ recording_status: 'failed' })
        .eq('daily_room_name', room_name)
      return NextResponse.json({ error: 'Failed to get download link' }, { status: 500 })
    }

    // 3. Stream from Daily.co's S3 directly to our S3
    const s3Key = `session-recordings/${room_name}/${recording_id}.mp4`

    try {
      console.log(`⬇️ Downloading from Daily.co...`)
      const downloadResponse = await fetch(downloadLink)

      if (!downloadResponse.ok || !downloadResponse.body) {
        throw new Error(`Download failed: ${downloadResponse.status}`)
      }

      const contentLength = downloadResponse.headers.get('content-length')
      const fileSize = contentLength ? parseInt(contentLength, 10) : undefined

      console.log(`⬆️ Streaming to S3: ${s3Key} (${fileSize ? Math.round(fileSize / 1024 / 1024) + 'MB' : 'unknown size'})`)

      // Convert ReadableStream to Node.js readable for S3 SDK
      const reader = downloadResponse.body.getReader()
      const chunks: Uint8Array[] = []
      
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        chunks.push(value)
      }

      const fullBuffer = Buffer.concat(chunks)

      // Use multipart upload for large files, simple put for small ones
      if (fullBuffer.length > 50 * 1024 * 1024) {
        // Multipart upload for files > 50MB
        const upload = new Upload({
          client: s3Client,
          params: {
            Bucket: BUCKET_NAME,
            Key: s3Key,
            Body: fullBuffer,
            ContentType: 'video/mp4',
            CacheControl: 'max-age=31536000', // 1 year cache
            Metadata: {
              'daily-recording-id': recording_id,
              'daily-room-name': room_name,
              'recording-duration': String(duration || recordingDetails.duration || 0),
            },
          },
          queueSize: 4,
          partSize: 10 * 1024 * 1024, // 10MB parts
        })

        await upload.done()
      } else {
        // Simple upload for smaller files
        await s3Client.send(new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: fullBuffer,
          ContentType: 'video/mp4',
          CacheControl: 'max-age=31536000',
          Metadata: {
            'daily-recording-id': recording_id,
            'daily-room-name': room_name,
            'recording-duration': String(duration || recordingDetails.duration || 0),
          },
        }))
      }

      console.log(`✅ Uploaded to S3: ${s3Key}`)
    } catch (err) {
      console.error('S3 transfer failed:', err)
      await supabase
        .from('video_sessions')
        .update({ recording_status: 'failed' })
        .eq('daily_room_name', room_name)
      return NextResponse.json({ error: 'S3 transfer failed' }, { status: 500 })
    }

    // 4. Update the database with the S3 URL
    const recordingUrl = `${CDN_URL}/${s3Key}`
    const recordingDuration = duration || recordingDetails.duration || 0

    const { error: updateError } = await supabase
      .from('video_sessions')
      .update({
        recording_status: 'uploaded',
        recording_s3_key: s3Key,
        recording_url: recordingUrl,
        recording_duration_seconds: recordingDuration,
        daily_recording_id: recording_id,
      })
      .eq('daily_room_name', room_name)

    if (updateError) {
      console.error('Failed to update session with recording URL:', updateError)
      // Recording is in S3 but DB update failed — not a complete failure
    }

    console.log(`🎬 Recording complete: ${recordingUrl} (${Math.round(recordingDuration / 60)}min)`)

    return NextResponse.json({
      success: true,
      recording_url: recordingUrl,
      s3_key: s3Key,
      duration_seconds: recordingDuration,
    })
  } catch (error) {
    console.error('Recording processing error:', error)
    return NextResponse.json(
      { error: 'Processing failed' },
      { status: 500 }
    )
  }
}
