import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import crypto from 'crypto'

export type OpenAIVoice = 'alloy' | 'verse' | 'coral' | 'sage' | 'flow' | 'aria'

export interface SectionInput {
  sectionKey: string
  text: string
}

export interface GeneratedTrackResult {
  sectionKey: string
  status: 'skipped' | 'generated' | 'failed'
  audioUrl?: string
  s3Key?: string
  error?: string
}

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com'

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

export function hashContent(text: string): string {
  const normalized = normalizeText(text)
  return crypto.createHash('sha256').update(normalized).digest('hex')
}

async function synthesizeWithOpenAI(text: string, voice: OpenAIVoice = 'alloy', format: 'mp3' | 'wav' = 'mp3'): Promise<Buffer> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) throw new Error('OPENAI_API_KEY not configured')

  const response = await fetch('https://api.openai.com/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      voice,
      input: text,
      format,
    }),
  })

  if (!response.ok) {
    const errText = await response.text().catch(() => '')
    throw new Error(`OpenAI TTS failed: ${response.status} ${response.statusText} ${errText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

function getS3Client() {
  if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    throw new Error('AWS credentials not configured')
  }
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    maxAttempts: 3,
  })
}

export async function generateAudioTracks(params: {
  userId: string
  visionId: string
  sections: SectionInput[]
  voice?: OpenAIVoice
  format?: 'mp3' | 'wav'
}): Promise<GeneratedTrackResult[]> {
  const { userId, visionId, sections, voice = 'alloy', format = 'mp3' } = params
  const supabase = await createClient()
  const s3 = getS3Client()

  const results: GeneratedTrackResult[] = []

  for (const section of sections) {
    const contentHash = hashContent(section.text)

    // Check if an identical track already exists
    const { data: existing, error: existingError } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('user_id', userId)
      .eq('vision_id', visionId)
      .eq('section_key', section.sectionKey)
      .eq('content_hash', contentHash)
      .maybeSingle()

    if (existingError) {
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: existingError.message })
      continue
    }

    if (existing) {
      results.push({ sectionKey: section.sectionKey, status: 'skipped', audioUrl: existing.audio_url, s3Key: existing.s3_key })
      continue
    }

    // Mark as processing
    const { data: inserted, error: insertError } = await supabase
      .from('audio_tracks')
      .insert({
        user_id: userId,
        vision_id: visionId,
        section_key: section.sectionKey,
        content_hash: contentHash,
        text_content: section.text,
        voice_id: voice,
        s3_bucket: BUCKET_NAME,
        s3_key: '',
        audio_url: '',
        status: 'processing',
      })
      .select()
      .single()

    if (insertError) {
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: insertError.message })
      continue
    }

    try {
      const audioBuffer = await synthesizeWithOpenAI(section.text, voice, format)
      const ext = format === 'wav' ? 'wav' : 'mp3'
      const fileName = `${section.sectionKey}-${contentHash.slice(0, 12)}.${ext}`
      const s3Key = `user-uploads/${userId}/life-vision/audio/${visionId}/${fileName}`

      const put = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: audioBuffer,
        ContentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
        CacheControl: 'max-age=31536000',
      })
      await s3.send(put)

      const audioUrl = `${CDN_PREFIX}/${s3Key}`

      await supabase
        .from('audio_tracks')
        .update({
          s3_key: s3Key,
          audio_url: audioUrl,
          status: 'completed',
        })
        .eq('id', inserted.id)

      results.push({ sectionKey: section.sectionKey, status: 'generated', audioUrl, s3Key })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      await supabase
        .from('audio_tracks')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', inserted.id)
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: errorMessage })
    }
  }

  await supabase
    .from('vision_versions')
    .update({ last_audio_generated_at: new Date().toISOString() })
    .eq('id', visionId)

  return results
}

export function getOpenAIVoices(): { id: OpenAIVoice; name: string; preview?: string }[] {
  return [
    { id: 'alloy', name: 'Alloy' },
    { id: 'verse', name: 'Verse' },
    { id: 'coral', name: 'Coral' },
    { id: 'sage', name: 'Sage' },
    { id: 'flow', name: 'Flow' },
    { id: 'aria', name: 'Aria' },
  ]
}


