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

// Split long text to safer chunks for TTS (~3k chars per chunk)
function chunkTextForTTS(text: string, maxLen = 3000): string[] {
  const t = normalizeText(text)
  if (t.length <= maxLen) return [t]
  const sentences = t.split(/(?<=[\.!?])\s+/)
  const chunks: string[] = []
  let current = ''
  for (const s of sentences) {
    if ((current + ' ' + s).trim().length > maxLen) {
      if (current) chunks.push(current.trim())
      if (s.length > maxLen) {
        // hard-split very long sentence
        for (let i = 0; i < s.length; i += maxLen) {
          chunks.push(s.slice(i, i + maxLen))
        }
        current = ''
      } else {
        current = s
      }
    } else {
      current = (current ? current + ' ' : '') + s
    }
  }
  if (current) chunks.push(current.trim())
  return chunks
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
  force?: boolean
}): Promise<GeneratedTrackResult[]> {
  const { userId, visionId, sections, voice = 'alloy', format = 'mp3', force = false } = params
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

    // If existing record found
    let recordId: string | null = null
    if (existing) {
      if (!force && existing.status === 'completed') {
        results.push({ sectionKey: section.sectionKey, status: 'skipped', audioUrl: existing.audio_url, s3Key: existing.s3_key })
        continue
      }
      // Reuse existing row and set to processing
      const { error: updErr } = await supabase
        .from('audio_tracks')
        .update({ status: 'processing', error_message: null, voice_id: voice })
        .eq('id', existing.id)
      if (updErr) {
        results.push({ sectionKey: section.sectionKey, status: 'failed', error: updErr.message })
        continue
      }
      recordId = existing.id
    } else {
      // Insert new row
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
      if (insertError || !inserted) {
        results.push({ sectionKey: section.sectionKey, status: 'failed', error: insertError?.message || 'insert failed' })
        continue
      }
      recordId = inserted.id
    }

    try {
      // Retry with exponential backoff and optional fallback voice on 429/5xx
      const maxAttempts = 3
      let attempt = 0
      let lastError: Error | null = null
      let audioBuffer: Buffer | null = null
      let useVoice: OpenAIVoice = voice
      while (attempt < maxAttempts && !audioBuffer) {
        try {
          const chunks = chunkTextForTTS(section.text)
          const buffers: Buffer[] = []
          for (const part of chunks) {
            const b = await synthesizeWithOpenAI(part, useVoice, format)
            buffers.push(b)
          }
          audioBuffer = Buffer.concat(buffers)
          break
        } catch (e: any) {
          lastError = e instanceof Error ? e : new Error(String(e))
          attempt += 1
          // crude detection of rate-limit/server errors
          const message = (lastError.message || '').toLowerCase()
          if (message.includes('429') || message.includes('5') || message.includes('timeout')) {
            // fallback voice on next attempt
            useVoice = useVoice === 'alloy' ? 'verse' : 'alloy'
          }
          if (attempt < maxAttempts) {
            const delay = 1000 * Math.pow(2, attempt - 1)
            await new Promise(r => setTimeout(r, delay))
          }
        }
      }
      if (!audioBuffer) throw lastError || new Error('OpenAI TTS failed')
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
        .eq('id', recordId)

      results.push({ sectionKey: section.sectionKey, status: 'generated', audioUrl, s3Key })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      await supabase
        .from('audio_tracks')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', recordId as string)
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: errorMessage })
    }
  }

  await supabase
    .from('vision_versions')
    .update({ last_audio_generated_at: new Date().toISOString() })
    .eq('id', visionId)

  return results
}

export function getOpenAIVoices(): { id: OpenAIVoice; name: string; brandName: string; gender: 'male' | 'female' }[] {
  return [
    { id: 'alloy', name: 'Alloy', brandName: 'Clarity Mentor', gender: 'male' },
    { id: 'verse', name: 'Verse', brandName: 'Warm Guide', gender: 'male' },
    { id: 'coral', name: 'Coral', brandName: 'Cosmic Storyteller', gender: 'female' },
    { id: 'sage', name: 'Sage', brandName: 'Deep Presence', gender: 'male' },
    { id: 'flow', name: 'Flow', brandName: 'Meditation Flow', gender: 'female' },
    { id: 'aria', name: 'Aria', brandName: 'Energetic Coach', gender: 'female' },
  ]
}

export async function synthesizePreview(voice: OpenAIVoice, format: 'mp3' | 'wav' = 'mp3'): Promise<Buffer> {
  const sample = "We are doing this! We’re taking the initiative to have a vibration transformation in our life! The infinite part of our consciousness is always there, always excited, and elated when we acknowledge it and decide to be all that we’ve become. This is a process of discovery. We know the vibrational signature of our most satisfying life already exists. Our intention now is to tap into it and allow ourselves an unabridged look into what we’ve already become."
  return synthesizeWithOpenAI(sample, voice, format)
}


