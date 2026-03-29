import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import OpenAI from 'openai'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export const runtime = 'nodejs'
export const maxDuration = 300

const MAX_FILE_SIZE = 25 * 1024 * 1024

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { s3Key } = await request.json()

    if (!s3Key || typeof s3Key !== 'string') {
      return NextResponse.json({ error: 'Missing or invalid s3Key' }, { status: 400 })
    }

    // Verify the S3 key belongs to this user (keys are formatted as user-uploads/{userId}/...)
    if (!s3Key.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized access to this file' }, { status: 403 })
    }

    console.log('Transcribing from S3:', { s3Key, userId: user.id })

    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    const s3Response = await s3Client.send(getCommand)

    if (!s3Response.Body) {
      return NextResponse.json({ error: 'File not found in S3' }, { status: 404 })
    }

    const byteArray = await s3Response.Body.transformToByteArray()
    const buffer = Buffer.from(byteArray)

    if (buffer.length === 0) {
      return NextResponse.json({
        error: 'Audio file is empty.',
        code: 'FILE_EMPTY',
      }, { status: 400 })
    }

    if (buffer.length > MAX_FILE_SIZE) {
      const sizeMB = (buffer.length / (1024 * 1024)).toFixed(1)
      return NextResponse.json({
        error: `Audio file is too large (${sizeMB}MB). Maximum size is 25MB.`,
        code: 'FILE_TOO_LARGE',
      }, { status: 413 })
    }

    console.log('Downloaded from S3:', {
      sizeMB: (buffer.length / (1024 * 1024)).toFixed(2),
      contentType: s3Response.ContentType,
    })

    const fileName = s3Key.split('/').pop() || 'recording.webm'
    const contentType = s3Response.ContentType || 'audio/webm'
    const file = new File([buffer], fileName, { type: contentType })

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'en',
      response_format: 'verbose_json',
      timestamp_granularities: ['word'],
    })

    console.log('Transcription complete:', {
      duration: transcription.duration,
      wordCount: transcription.text.split(' ').length,
    })

    const costInCents = Math.round(transcription.duration * 0.006 * 100)

    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    await trackTokenUsage({
      user_id: user.id,
      action_type: 'transcription',
      model_used: 'whisper-1',
      tokens_used: Math.ceil(transcription.duration * 60),
      input_tokens: Math.ceil(transcription.duration * 60),
      output_tokens: transcription.text.split(' ').length,
      audio_seconds: transcription.duration,
      audio_duration_formatted: formatDuration(transcription.duration),
      actual_cost_cents: costInCents,
      openai_request_id: (transcription as any).id,
      openai_created: (transcription as any).created,
      system_fingerprint: (transcription as any).system_fingerprint,
      success: true,
      metadata: {
        audio_duration: transcription.duration,
        word_count: transcription.text.split(' ').length,
        language: transcription.language,
        file_size: buffer.length,
        source: 's3',
        s3_key: s3Key,
      },
    })

    // Save transcript as a sidecar file next to the audio in S3
    // If the browser loses connection before receiving the response, the transcript is still recoverable
    const transcriptKey = s3Key.replace(/\.[^.]+$/, '.transcript.json')
    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: transcriptKey,
        ContentType: 'application/json',
        Body: JSON.stringify({
          transcript: transcription.text,
          duration: transcription.duration,
          language: transcription.language,
          words: transcription.words,
          audio_key: s3Key,
          transcribed_at: new Date().toISOString(),
          user_id: user.id,
        }),
      }))
    } catch (sidecarErr) {
      console.error('Failed to save transcript sidecar (non-fatal):', sidecarErr)
    }

    return NextResponse.json({
      transcript: transcription.text,
      duration: transcription.duration,
      language: transcription.language,
      words: transcription.words,
      success: true,
    })
  } catch (error: any) {
    console.error('Transcribe-from-S3 error:', error)

    if (error?.name === 'NoSuchKey') {
      return NextResponse.json({
        error: 'Audio file not found in storage.',
        code: 'NOT_FOUND',
      }, { status: 404 })
    }

    if (error?.status === 401) {
      return NextResponse.json({
        error: 'OpenAI API key is invalid or missing',
        code: 'AUTH_ERROR',
      }, { status: 500 })
    }

    if (error?.status === 413) {
      return NextResponse.json({
        error: 'Audio file is too large. Maximum size is 25MB.',
        code: 'FILE_TOO_LARGE',
      }, { status: 413 })
    }

    if (error?.code === 'ECONNRESET' || error?.code === 'ETIMEDOUT') {
      return NextResponse.json({
        error: 'Connection to transcription service timed out. Please try again.',
        code: 'TIMEOUT',
        retryable: true,
      }, { status: 504 })
    }

    return NextResponse.json({
      error: 'Failed to transcribe audio. Please try again.',
      details: error?.message || 'Unknown error',
      code: 'TRANSCRIPTION_ERROR',
      retryable: true,
    }, { status: 500 })
  }
}
