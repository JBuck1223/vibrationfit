import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3'

export const runtime = 'nodejs'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

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

    if (!s3Key.includes(user.id)) {
      return NextResponse.json({ error: 'Unauthorized access to this file' }, { status: 403 })
    }

    const transcriptKey = s3Key.replace(/\.[^.]+$/, '.transcript.json')

    try {
      const response = await s3Client.send(new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: transcriptKey,
      }))

      if (!response.Body) {
        return NextResponse.json({ found: false })
      }

      const bodyString = await response.Body.transformToString()
      const sidecar = JSON.parse(bodyString)

      return NextResponse.json({
        found: true,
        transcript: sidecar.transcript,
        duration: sidecar.duration,
        language: sidecar.language,
        words: sidecar.words,
        transcribed_at: sidecar.transcribed_at,
      })
    } catch (err: any) {
      if (err?.name === 'NoSuchKey') {
        return NextResponse.json({ found: false })
      }
      throw err
    }
  } catch (error: any) {
    console.error('Transcript check error:', error)
    return NextResponse.json({
      error: 'Failed to check for transcript',
      found: false,
    }, { status: 500 })
  }
}
