import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@/lib/supabase/server'
import { getActiveStudent } from '@/lib/life-explorer/context'
import { trackTokenUsage, validateTokenBalance } from '@/lib/tokens/tracking'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

const BUCKET = 'vibration-fit-client-storage'
const CDN = 'https://media.vibrationfit.com'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  const student = await getActiveStudent(supabase, body.student_id)
  if (!student) return NextResponse.json({ error: 'No active student' }, { status: 400 })

  const text = (body.text || student.life_i_choose || '').trim()
  if (!text) {
    return NextResponse.json({ error: 'Write the Life I Choose first' }, { status: 400 })
  }

  const tokenValidation = await validateTokenBalance(user.id, Math.ceil(text.length / 4), supabase)
  if (tokenValidation) {
    return NextResponse.json({ error: tokenValidation.error }, { status: 402 })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: 'Audio is not configured' }, { status: 500 })
  }

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice: 'nova',
      input: text.slice(0, 4000),
      format: 'mp3',
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    return NextResponse.json({ error: `Hear-it failed: ${response.status} ${errText}` }, { status: 500 })
  }

  const buffer = Buffer.from(await response.arrayBuffer())
  const key = `users/${user.id}/homeschool/life-explorer/${student.id}/life-i-choose.mp3`

  const s3 = new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })

  await s3.send(
    new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      Body: buffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'public, max-age=3600',
    })
  )

  const audioUrl = `${CDN}/${key}`

  await supabase
    .from('le_students')
    .update({ life_i_choose_audio_url: audioUrl, updated_at: new Date().toISOString() })
    .eq('id', student.id)

  await trackTokenUsage(
    {
      user_id: user.id,
      action_type: 'audio_generation',
      model_used: 'tts-1',
      tokens_used: text.length,
      input_tokens: text.length,
      output_tokens: 0,
      success: true,
      metadata: { kind: 'life_i_choose_hear', student_id: student.id },
    },
    supabase
  )

  return NextResponse.json({ audio_url: audioUrl })
}
