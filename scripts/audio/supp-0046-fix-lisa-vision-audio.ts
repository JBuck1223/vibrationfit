/**
 * SUPP-0046: Regenerate missing vision-audio tracks for Lisa after refine carry-over,
 * then reply on the support ticket.
 *
 * Usage: npx tsx scripts/audio/supp-0046-fix-lisa-vision-audio.ts
 */

import { createClient } from '@supabase/supabase-js'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import OpenAI from 'openai'
import * as crypto from 'crypto'
import * as dotenv from 'dotenv'
import { sendAndLogEmail } from '../../src/lib/email/send'
import { generatePersonalMessageEmail } from '../../src/lib/email/templates/personal-message'

dotenv.config({ path: '.env.local' })

const USER_ID = '25b2b667-9ebd-420c-916a-1ecc2baf9101'
const VISION_ID = 'f0f2f0c0-3d96-4570-bb73-a2ce20807b66'
const TICKET_ID = '3082aef1-5111-4a14-b891-fd5f13ab5674'
const STAFF_USER_ID = '2a0fc1a7-5b8a-46a4-97e4-d5c5ddefdf1a'
const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_PREFIX = 'https://media.vibrationfit.com'

const SECTION_KEYS = [
  'forward', 'fun', 'health', 'travel', 'love', 'family', 'social',
  'home', 'work', 'money', 'stuff', 'giving', 'spirituality', 'conclusion',
] as const

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
const openaiKey = process.env.OPENAI_API_KEY

if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, or OPENAI_API_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)
const openai = new OpenAI({ apiKey: openaiKey })
const s3 = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
})

function normalizeText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
}

function hashContent(text: string): string {
  return crypto.createHash('sha256').update(normalizeText(text)).digest('hex')
}

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
        for (let i = 0; i < s.length; i += maxLen) chunks.push(s.slice(i, i + maxLen))
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

async function synthesize(text: string, voice: string): Promise<Buffer> {
  const parts = chunkTextForTTS(text)
  const buffers: Buffer[] = []
  for (const part of parts) {
    const response = await openai.audio.speech.create({
      model: 'tts-1',
      voice: voice as 'nova' | 'sage' | 'shimmer',
      input: part,
      response_format: 'mp3',
    })
    buffers.push(Buffer.from(await response.arrayBuffer()))
  }
  return Buffer.concat(buffers)
}

async function ensureTrack(params: {
  audioSetId: string
  sectionKey: string
  text: string
  voiceId: string
  sourceTrack?: {
    content_hash: string
    text_content: string
    s3_bucket: string | null
    s3_key: string | null
    audio_url: string
    duration_seconds: number | null
    mix_status?: string
    mixed_audio_url?: string | null
    mixed_s3_key?: string | null
  }
}) {
  const { audioSetId, sectionKey, text, voiceId, sourceTrack } = params
  const contentHash = hashContent(text)

  const { data: existing } = await supabase
    .from('audio_tracks')
    .select('id, content_hash, status, audio_url')
    .eq('audio_set_id', audioSetId)
    .eq('section_key', sectionKey)
    .maybeSingle()

  if (existing?.status === 'completed' && existing.content_hash === contentHash && existing.audio_url) {
    console.log(`  skip ${sectionKey} (already current)`)
    return existing
  }

  let audioUrl = sourceTrack?.audio_url
  let s3Key = sourceTrack?.s3_key
  let s3Bucket = sourceTrack?.s3_bucket || BUCKET_NAME
  let duration = sourceTrack?.duration_seconds ?? null

  if (!audioUrl || sourceTrack?.content_hash !== contentHash) {
    console.log(`  generate ${sectionKey} (${voiceId})`)
    const audioBuffer = await synthesize(text, voiceId)
    const timestamp = Date.now().toString(36)
    s3Key = `user-uploads/${USER_ID}/life-vision/audio/${VISION_ID}/${sectionKey}-${contentHash.slice(0, 12)}-${timestamp}.mp3`
    s3Bucket = BUCKET_NAME
    await s3.send(new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      Body: audioBuffer,
      ContentType: 'audio/mpeg',
      CacheControl: 'max-age=31536000',
    }))
    audioUrl = `${CDN_PREFIX}/${s3Key}`
    duration = null
  } else {
    console.log(`  reuse ${sectionKey} from matching voice set`)
  }

  const row = {
    user_id: USER_ID,
    vision_id: VISION_ID,
    audio_set_id: audioSetId,
    section_key: sectionKey,
    content_hash: contentHash,
    text_content: text,
    voice_id: voiceId,
    s3_bucket: s3Bucket,
    s3_key: s3Key,
    audio_url: audioUrl,
    duration_seconds: duration,
    status: 'completed',
    mix_status: sourceTrack?.mix_status && sourceTrack.content_hash === contentHash
      ? sourceTrack.mix_status
      : 'not_required',
    mixed_audio_url: sourceTrack?.content_hash === contentHash ? sourceTrack.mixed_audio_url : null,
    mixed_s3_key: sourceTrack?.content_hash === contentHash ? sourceTrack.mixed_s3_key : null,
    content_type: 'life_vision',
    updated_at: new Date().toISOString(),
  }

  if (existing?.id) {
    const { data, error } = await supabase
      .from('audio_tracks')
      .update(row)
      .eq('id', existing.id)
      .select()
      .single()
    if (error) throw error
    return data
  }

  const { data, error } = await supabase
    .from('audio_tracks')
    .insert({ ...row, play_count: 0, created_at: new Date().toISOString() })
    .select()
    .single()
  if (error) throw error
  return data
}

async function regenerateAudio() {
  console.log('Loading vision…')
  const { data: vision, error: visionError } = await supabase
    .from('vision_versions')
    .select('*')
    .eq('id', VISION_ID)
    .single()
  if (visionError || !vision) throw visionError || new Error('Vision not found')

  const sections = SECTION_KEYS
    .map(key => ({ key, text: String(vision[key] || '').trim() }))
    .filter(s => s.text.length > 0)

  console.log(`Vision sections with content: ${sections.length}`)

  const { data: sets, error: setsError } = await supabase
    .from('audio_sets')
    .select('id, name, variant, voice_id')
    .eq('vision_id', VISION_ID)
    .eq('content_type', 'life_vision')
    .order('created_at', { ascending: true })
  if (setsError || !sets) throw setsError || new Error('No audio sets')

  const standardSets = sets.filter(s => s.variant === 'standard')
  const customSets = sets.filter(s => s.variant !== 'standard' && s.variant !== 'personal')

  // voiceId -> sectionKey -> track
  const generatedByVoice = new Map<string, Map<string, any>>()

  for (const set of standardSets) {
    console.log(`\nStandard set: ${set.name} (${set.voice_id})`)
    const bySection = new Map<string, any>()
    for (const section of sections) {
      const track = await ensureTrack({
        audioSetId: set.id,
        sectionKey: section.key,
        text: section.text,
        voiceId: set.voice_id,
        sourceTrack: generatedByVoice.get(set.voice_id)?.get(section.key),
      })
      bySection.set(section.key, track)
    }
    generatedByVoice.set(set.voice_id, bySection)
  }

  for (const set of customSets) {
    console.log(`\nCustom set: ${set.name} (${set.voice_id}) — copying voice tracks (mix for new sections can be remade later)`)
    const source = generatedByVoice.get(set.voice_id)
    if (!source) {
      console.warn(`  no standard voice source for ${set.voice_id}, skipping`)
      continue
    }
    for (const section of sections) {
      const sourceTrack = source.get(section.key)
      if (!sourceTrack) continue
      await ensureTrack({
        audioSetId: set.id,
        sectionKey: section.key,
        text: section.text,
        voiceId: set.voice_id,
        sourceTrack: {
          content_hash: sourceTrack.content_hash,
          text_content: sourceTrack.text_content,
          s3_bucket: sourceTrack.s3_bucket,
          s3_key: sourceTrack.s3_key,
          audio_url: sourceTrack.audio_url,
          duration_seconds: sourceTrack.duration_seconds,
          // Keep existing mixed audio only when hash already matched in ensureTrack;
          // new sections play voice-only until remixed.
          mix_status: 'not_required',
          mixed_audio_url: null,
          mixed_s3_key: null,
        },
      })
    }
  }

  await supabase
    .from('vision_versions')
    .update({ last_audio_generated_at: new Date().toISOString() })
    .eq('id', VISION_ID)

  console.log('\nAudio regeneration complete.')
}

async function replyToTicket() {
  const reply = `Hi Lisa,

Thanks for flagging this — you were right that Play My Vision wasn’t playing every category.

Here’s what happened: after you refined most of your vision categories, we carried over audio only for the sections that didn’t change (Forward, Spirituality, and Conclusion). The updated categories still needed new audio, so Listen was only able to play those three tracks.

We’ve regenerated the missing vision audio for your current Life Vision. Please refresh Listen and try Play My Vision again — you should hear all of your categories now.

If you use a background mix (like Brown Noise or Infinite Power), those mixes may still need a quick remake for the new sections. Voice-only should already be complete.

And going forward, Listen will show a clear “incomplete audio set” notice with a Regenerate button whenever this happens after refining.

We’re glad you’re here — thank you for your patience.

— Vibration Fit Support`

  const { data: inserted, error } = await supabase
    .from('support_ticket_replies')
    .insert({
      ticket_id: TICKET_ID,
      user_id: STAFF_USER_ID,
      message: reply,
      is_staff: true,
    })
    .select()
    .single()

  if (error) throw error

  await supabase
    .from('support_tickets')
    .update({
      status: 'waiting_reply',
      updated_at: new Date().toISOString(),
    })
    .eq('id', TICKET_ID)

  try {
    const emailContent = await generatePersonalMessageEmail({
      senderName: 'Vibration Fit Support Team',
      messageBody: `We've added a new response to your support ticket SUPP-0046: "partially working things"\n\nView your ticket and reply here:\nhttps://vibrationfit.com/support/tickets/${TICKET_ID}`,
      closingLine: 'Best regards,',
    })

    await sendAndLogEmail({
      to: 'lisa2windle@gmail.com',
      subject: 'Re: partially working things [SUPP-0046]',
      htmlBody: emailContent.htmlBody,
      textBody: emailContent.textBody,
      replyTo: 'team@vibrationfit.com',
      context: { userId: USER_ID, isReply: true },
    })
    console.log('Ticket reply email sent.')
  } catch (emailError) {
    console.error('Ticket reply saved, but email notification failed:', emailError)
  }

  console.log('Ticket reply created:', inserted.id)
}

async function main() {
  await regenerateAudio()
  await replyToTicket()
  console.log('\nSUPP-0046 done.')
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})
