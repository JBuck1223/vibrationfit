import { createClient } from '@/lib/supabase/server'
import { S3Client, PutObjectCommand, HeadObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3'
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert'
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda'
import crypto from 'crypto'
import { trackTokenUsage } from '@/lib/tokens/tracking'

export type OpenAIVoice = 'alloy' | 'ash' | 'coral' | 'echo' | 'fable' | 'onyx' | 'nova' | 'sage' | 'shimmer'
export type VoiceId = OpenAIVoice

export interface VoiceConfig {
  id: string
  name: string
  provider: 'openai'
}

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

async function triggerBackgroundMixing(params: {
  trackId: string
  voiceUrl: string
  variant: string
  outputKey: string
}): Promise<void> {
  const lambda = new LambdaClient({ 
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    },
  })

  // Get volume levels AND background track from database (single source of truth)
  const supabase = await createClient()
  const { data: variantData } = await supabase
    .from('audio_variants')
    .select('voice_volume, bg_volume, background_track')
    .eq('id', params.variant)
    .single()
  
  // Use database values for volume levels and background track
  let voiceVolume = 0.7
  let bgVolume = 0.3
  let bgUrl = null
  
  if (variantData) {
    // Convert percentages (0-100) to decimal (0-1)
    voiceVolume = variantData.voice_volume / 100
    bgVolume = variantData.bg_volume / 100
    bgUrl = variantData.background_track
  } else {
    // Fallback values if database query fails
    voiceVolume = params.variant === 'sleep' ? 0.3 : params.variant === 'meditation' ? 0.5 : 0.8
    bgVolume = params.variant === 'sleep' ? 0.7 : params.variant === 'meditation' ? 0.5 : 0.2
    // Fallback to hardcoded background track
    bgUrl = getBackgroundTrackForVariant(params.variant)
  }

  const command = new InvokeCommand({
    FunctionName: 'audio-mixer',
    Payload: JSON.stringify({
      voiceUrl: params.voiceUrl,
      bgUrl,
      outputKey: params.outputKey,
      variant: params.variant,
      voiceVolume,
      bgVolume,
      trackId: params.trackId,
    }),
    InvocationType: 'Event', // Async invocation
  })

  await lambda.send(command)
  
  console.log(`[Mixing] Triggered background mixing for track ${params.trackId} (${params.variant}) - volumes: ${voiceVolume}/${bgVolume}`)
}

async function synthesizeWithOpenAI(text: string, voice: OpenAIVoice = 'alloy', format: 'mp3' | 'wav' = 'mp3', userId?: string): Promise<Buffer> {
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
  const buffer = Buffer.from(arrayBuffer)

  // Track token usage for TTS
  if (userId) {
    // TTS pricing: $0.015 per 1K characters
    const costInCents = Math.round((text.length / 1000) * 0.015 * 100) // Convert to cents
    
    // Estimate audio duration: ~150 words per minute, ~5 chars per word = 750 chars/min
    const estimatedSeconds = Math.round((text.length / 750) * 60)
    const formatDuration = (seconds: number): string => {
      const mins = Math.floor(seconds / 60)
      const secs = Math.floor(seconds % 60)
      return `${mins}:${secs.toString().padStart(2, '0')}`
    }
    
    await trackTokenUsage({
      user_id: userId,
      action_type: 'audio_generation',
      model_used: 'tts-1',
      tokens_used: text.length, // Character count as tokens
      input_tokens: text.length,
      output_tokens: 0, // TTS doesn't have output tokens
      audio_seconds: estimatedSeconds,
      audio_duration_formatted: formatDuration(estimatedSeconds),
      actual_cost_cents: costInCents,
      success: true,
      metadata: {
        voice: voice,
        format: format,
        text_length: text.length,
        audio_size_bytes: buffer.length,
        estimated_duration_seconds: estimatedSeconds
      }
    })
  }

  return buffer
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

// Background track URLs for different variants
/**
 * Get background track URL for a variant (FALLBACK ONLY)
 * @deprecated Background tracks are now stored in the audio_variants database table
 * This function is only used as a fallback if the database query fails
 */
export function getBackgroundTrackForVariant(variant?: string): string | null {
  switch (variant) {
    case 'sleep':
    case 'meditation':
    case 'energy':
      // Fallback: Using ocean waves for all variants
      return 'https://media.vibrationfit.com/site-assets/audio/mixing-tracks/Ocean-Waves-1.mp3'
    default:
      return null
  }
}

// Mix audio with background track
// NOTE: FFmpeg doesn't work well on Vercel. Options:
// 1. Use external service (Cloudflare Stream API, AssemblyAI, etc.)
// 2. Mix client-side after generation
// 3. Pre-generate mixed versions
async function mixWithBackgroundTrack(audioBuffer: Buffer, variant?: string): Promise<Buffer> {
  // For now, just return the voice-only audio
  // Background mixing will be handled by Lambda function after voice generation completes
  return audioBuffer
}

// Helper function to process text for variants
function processTextForVariant(text: string, variant?: string): string {
  if (!variant || variant === 'standard') return text
  
  if (variant === 'sleep') {
    // Add longer pauses for sleep version (using ellipsis for natural pauses)
    return text
      .replace(/\. /g, '. ... ')
      .replace(/\? /g, '? ... ')
      .replace(/! /g, '! ... ')
      .replace(/;/g, '... ')
      .replace(/, /g, '... ')
  }
  
  if (variant === 'meditation') {
    // Very slow, methodical speech with elongated pauses
    return text
      .replace(/\. /g, '. ........ ')
      .replace(/\? /g, '? ........ ')
      .replace(/! /g, '! ........ ')
      .replace(/;/g, '........ ')
      .replace(/, /g, '......... ')
  }
  
  if (variant === 'energy') {
    // Faster pace, more emphasis (using shorter pauses or all caps for key words)
    return text
      .replace(/\. /g, '. ')
      .replace(/\? /g, '? ')
      .replace(/! /g, '! ')
      // Keep it moving quickly
      .replace(/;/g, ', ')
  }
  
  return text
}

export async function generateAudioTracks(params: {
  userId: string
  visionId: string
  sections: SectionInput[]
  voice?: VoiceId | string
  format?: 'mp3' | 'wav'
  force?: boolean
  audioSetId?: string // Optional: specify which audio set to generate for
  audioSetName?: string // Optional: name for new audio set if creating one
  variant?: string // Optional: variant type (standard, sleep, energy, etc.)
  batchId?: string // Optional: batch tracking ID for progress updates
}): Promise<GeneratedTrackResult[]> {
  const { userId, visionId, sections, voice = 'alloy', format = 'mp3', force = false, audioSetId, audioSetName, variant, batchId } = params
  const supabase = await createClient()
  const s3 = getS3Client()

  const results: GeneratedTrackResult[] = []
  let totalCharactersProcessed = 0
  const sectionCharacterCounts: { [key: string]: number } = {}

  console.log(`\n🎬 [Generation Start] ========================================`)
  console.log(`🎬 Vision ID: ${visionId}`)
  console.log(`🎬 Voice: ${voice}`)
  console.log(`🎬 Variant: ${variant || 'standard'}`)
  console.log(`🎬 Sections to process: ${sections.length}`)
  console.log(`🎬 ========================================\n`)

  // Helper to update batch progress
  const updateBatchProgress = async () => {
    if (!batchId) return
    
    const completed = results.filter(r => r.status === 'generated' || r.status === 'skipped').length
    const failed = results.filter(r => r.status === 'failed').length
    const pending = sections.length - completed - failed
    
    await Promise.resolve(
      supabase
        .from('audio_generation_batches')
        .update({
          tracks_completed: completed,
          tracks_failed: failed,
          tracks_pending: Math.max(0, pending),
        })
        .eq('id', batchId)
    )
      .then(() => {})
      .catch(err => console.error('Failed to update batch progress:', err))
  }

  // Get or create audio_set
  let targetAudioSetId: string
  
  if (audioSetId) {
    // Use specified audio set
    targetAudioSetId = audioSetId
    console.log(`[Audio Set] Using specified audio set: ${targetAudioSetId}`)
  } else {
    // Create or get audio set - match by variant AND voice_id to allow multiple voice versions
    console.log(`[Audio Set] Looking for existing set with variant="${variant || 'standard'}", voice_id="${voice}"`)
    
    const { data: existingSet } = await supabase
      .from('audio_sets')
      .select('id, voice_id, variant')
      .eq('vision_id', visionId)
      .eq('variant', variant || 'standard')
      .eq('voice_id', voice)
      .maybeSingle()
    
    if (existingSet) {
      targetAudioSetId = existingSet.id
      console.log(`[Audio Set] Reusing existing audio set: ${targetAudioSetId}`)
    } else {
      // Create new audio set
      console.log(`[Audio Set] Creating new audio set for voice: ${voice}, variant: ${variant || 'standard'}`)
      
      const getDescription = (v: string | undefined) => {
        if (v === 'standard' || !v) return 'Voice only narration'
        if (v === 'sleep') return '10% voice, 90% background'
        if (v === 'energy') return '80% voice, 20% background'
        if (v === 'meditation') return '50% voice, 50% background'
        return '50% voice, 50% background'
      }

      const { data: newSet, error: setError } = await supabase
        .from('audio_sets')
        .insert({
          vision_id: visionId,
          user_id: userId,
          name: audioSetName || `${variant || 'Standard'} Version`,
          description: getDescription(variant),
          variant: variant || 'standard',
          voice_id: voice,
        })
        .select()
        .single()
      
      if (setError || !newSet) {
        throw new Error(`Failed to create audio set: ${setError?.message}`)
      }
      targetAudioSetId = newSet.id
      console.log(`[Audio Set] Created audio set: ${targetAudioSetId}`)
    }
  }
  
  // Update batch with audio_set_id
  if (batchId) {
    await Promise.resolve(
      supabase
        .from('audio_generation_batches')
        .update({
          audio_set_ids: [targetAudioSetId]
        })
        .eq('id', batchId)
    )
      .then(() => {})
      .catch(err => console.error('Failed to update batch with audio set ID:', err))
  }

  for (const section of sections) {
    console.log(`\n📝 [Section Start] ${section.sectionKey} ========================================`)
    
    const contentHash = hashContent(section.text)

    // Check if an identical track already exists in this audio set
    const { data: existing, error: existingError } = await supabase
      .from('audio_tracks')
      .select('*')
      .eq('user_id', userId)
      .eq('vision_id', visionId)
      .eq('audio_set_id', targetAudioSetId)
      .eq('section_key', section.sectionKey)
      .eq('content_hash', contentHash)
      .maybeSingle()

    if (existingError) {
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: existingError.message })
      await updateBatchProgress()
      continue
    }

    // If existing record found
    let recordId: string | null = null
    if (existing) {
      if (!force && existing.status === 'completed') {
        console.log(`[Track] Skipping ${section.sectionKey} - using existing completed track`)
        results.push({ sectionKey: section.sectionKey, status: 'skipped', audioUrl: existing.audio_url, s3Key: existing.s3_key })
        await updateBatchProgress()
        continue
      }
      // Reuse existing row and set to processing
      console.log(`[Track] Regenerating ${section.sectionKey}`)
      const { error: updErr } = await supabase
        .from('audio_tracks')
        .update({ status: 'processing', error_message: null, voice_id: voice })
        .eq('id', existing.id)
      if (updErr) {
        results.push({ sectionKey: section.sectionKey, status: 'failed', error: updErr.message })
        await updateBatchProgress()
        continue
      }
      recordId = existing.id
    } else {
      console.log(`[Track] Creating new track record for ${section.sectionKey}`)
      // Insert new row
      const { data: inserted, error: insertError } = await supabase
        .from('audio_tracks')
        .insert({
          user_id: userId,
          vision_id: visionId,
          audio_set_id: targetAudioSetId,
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
        await updateBatchProgress()
        continue
      }
      recordId = inserted.id
    }

    try {
      // For mixing variants, REQUIRE existing voice-only track (NEVER regenerate voice)
      let voiceAudioUrl: string | null = null
      let shouldGenerateVoice = true
      
      if (variant && variant !== 'standard') {
        // Mix variants MUST have an existing voice track to mix from
        // Look for existing standard (voice-only) track for this section with the SAME voice
        const { data: standardTrack } = await supabase
          .from('audio_tracks')
          .select('audio_url, voice_id, s3_key')
          .eq('user_id', userId)
          .eq('vision_id', visionId)
          .eq('section_key', section.sectionKey)
          .eq('voice_id', voice) // MUST be same voice
          .eq('status', 'completed')
          .not('audio_url', 'is', null)
          .limit(1)
          .maybeSingle()
        
        if (!standardTrack?.audio_url) {
          // CRITICAL: Mix variants require a pre-existing voice track
          const errorMsg = `Mix variant "${variant}" requires existing voice-only track for ${section.sectionKey} with voice "${voice}". Generate voice-only tracks first (Step 1) before creating mixes (Step 2).`
          console.error(errorMsg)
          throw new Error(errorMsg)
        }
        
        // Found existing voice track - use it for mixing (no TTS needed!)
        console.log(`[Mixing] Found existing voice track for ${section.sectionKey} - will mix with background music`)
        console.log(`[Mixing] Voice: ${standardTrack.voice_id}, URL: ${standardTrack.audio_url}`)
        voiceAudioUrl = standardTrack.audio_url
        shouldGenerateVoice = false
      }
      
      let audioUrl: string
      let s3Key: string
      
      if (shouldGenerateVoice) {
        // Generate new voice track (for standard variant or if no existing track found)
        const processedText = processTextForVariant(section.text, variant)
        
        // Validate OpenAI voice
        if (!['alloy', 'ash', 'coral', 'echo', 'fable', 'onyx', 'nova', 'sage', 'shimmer'].includes(voice)) {
          throw new Error(`Unknown voice: ${voice}. Expected OpenAI voice (alloy, echo, fable, onyx, nova, shimmer, etc.)`)
        }
        
        const useVoice: OpenAIVoice = voice as OpenAIVoice
        
        // Generate audio with OpenAI
        console.log(`[TTS] Generating ${section.sectionKey} with voice: ${useVoice}`)
        
        const chunks = chunkTextForTTS(processedText)
        
        const buffers: Buffer[] = []
        for (const part of chunks) {
          totalCharactersProcessed += part.length
          const b = await synthesizeWithOpenAI(part, useVoice, format, userId)
          buffers.push(b)
        }
        
        const audioBuffer = Buffer.concat(buffers)
        
        const ext = format === 'wav' ? 'wav' : 'mp3'
        const timestamp = Date.now().toString(36) // Base-36 timestamp for cache-busting
        const fileName = `${section.sectionKey}-${contentHash.slice(0, 12)}-${timestamp}.${ext}`
        s3Key = `user-uploads/${userId}/life-vision/audio/${visionId}/${fileName}`

        const put = new PutObjectCommand({
          Bucket: BUCKET_NAME,
          Key: s3Key,
          Body: audioBuffer,
          ContentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
          CacheControl: 'max-age=31536000',
        })
        await s3.send(put)
        console.log(`[S3] Uploaded: ${s3Key}`)

        audioUrl = `${CDN_PREFIX}/${s3Key}`
        voiceAudioUrl = audioUrl
      } else {
        // Reusing existing voice track - no need to upload
        audioUrl = voiceAudioUrl as string
        s3Key = audioUrl.replace(CDN_PREFIX + '/', '')
      }

      // Update track record
      const { data: updated } = await supabase
        .from('audio_tracks')
        .update({
          s3_key: s3Key,
          audio_url: audioUrl,
          status: 'completed',
          mix_status: variant && variant !== 'standard' ? 'pending' : 'not_required',
        })
        .eq('id', recordId)
        .select()
        .single()

      results.push({ sectionKey: section.sectionKey, status: 'generated', audioUrl, s3Key })
      
      // Update batch progress
      await updateBatchProgress()
      
      // If variant requires mixing, trigger Lambda async
      if (variant && variant !== 'standard' && updated && voiceAudioUrl) {
        // Mark as pending and trigger mixing in background
        triggerBackgroundMixing({
          trackId: updated.id,
          voiceUrl: voiceAudioUrl,
          variant,
          outputKey: s3Key.replace('.mp3', '-mixed.mp3'),
        }).catch((err: Error) => {
          console.error(`Failed to trigger mixing for track ${updated.id}:`, err)
        })
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      console.error(`[TTS] Generation failed for ${section.sectionKey}:`, errorMessage)
      
      await supabase
        .from('audio_tracks')
        .update({ status: 'failed', error_message: errorMessage })
        .eq('id', recordId as string)
      results.push({ sectionKey: section.sectionKey, status: 'failed', error: errorMessage })
      
      // Update batch progress
      await updateBatchProgress()
    }
  }

  await supabase
    .from('vision_versions')
    .update({ last_audio_generated_at: new Date().toISOString() })
    .eq('id', visionId)

  // Log final character usage summary
  const costPer1k = 0.015 // OpenAI TTS
  const totalCost = (totalCharactersProcessed / 1000) * costPer1k
  
  console.log(`\n[TTS Summary] ========================================`)
  console.log(`Total sections processed: ${sections.length}`)
  console.log(`Total characters sent to TTS: ${totalCharactersProcessed}`)
  console.log(`Provider: OpenAI TTS`)
  console.log(`Estimated cost: $${totalCost.toFixed(2)}`)
  console.log(`========================================\n`)

  // Update final batch status
  if (batchId) {
    const completed = results.filter(r => r.status === 'generated' || r.status === 'skipped').length
    const failed = results.filter(r => r.status === 'failed').length
    const total = sections.length
    
    let finalStatus: string
    if (failed === total) {
      finalStatus = 'failed'
    } else if (completed === total) {
      finalStatus = 'completed'
    } else if (completed > 0) {
      finalStatus = 'partial_success'
    } else {
      finalStatus = 'failed'
    }
    
    await Promise.resolve(
      supabase
        .from('audio_generation_batches')
        .update({
          status: finalStatus,
          tracks_completed: completed,
          tracks_failed: failed,
          tracks_pending: 0,
          completed_at: new Date().toISOString(),
        })
        .eq('id', batchId)
    )
      .then(() => {})
      .catch(err => console.error('Failed to update final batch status:', err))
  }

  return results
}

export function getOpenAIVoices(): { id: OpenAIVoice; name: string; brandName: string; gender: 'male' | 'female' | 'neutral'; provider: 'openai' }[] {
  return [
    { id: 'alloy', name: 'Alloy', brandName: 'Clear & Professional', gender: 'neutral', provider: 'openai' },
    { id: 'shimmer', name: 'Shimmer', brandName: 'Gentle & Soothing', gender: 'female', provider: 'openai' },
    { id: 'ash', name: 'Ash', brandName: 'Warm & Friendly', gender: 'male', provider: 'openai' },
    { id: 'coral', name: 'Coral', brandName: 'Bright & Energetic', gender: 'female', provider: 'openai' },
    { id: 'echo', name: 'Echo', brandName: 'Deep & Authoritative', gender: 'male', provider: 'openai' },
    { id: 'fable', name: 'Fable', brandName: 'Storytelling & Expressive', gender: 'male', provider: 'openai' },
    { id: 'onyx', name: 'Onyx', brandName: 'Strong & Confident', gender: 'male', provider: 'openai' },
    { id: 'nova', name: 'Nova', brandName: 'Fresh & Modern', gender: 'female', provider: 'openai' },
    { id: 'sage', name: 'Sage', brandName: 'Excited & Firm', gender: 'female', provider: 'openai' },
  ]
}


export async function synthesizePreview(voice: OpenAIVoice, format: 'mp3' | 'wav' = 'mp3'): Promise<Buffer> {
  const sample = "We are doing this! We're taking the initiative to have a vibration transformation in our life! The infinite part of our consciousness is always there, always excited, and elated when we acknowledge it and decide to be all that we've become. This is a process of discovery. We know the vibrational signature of our most satisfying life already exists. Our intention now is to tap into it and allow ourselves an unabridged look into what we've already become."
  return synthesizeWithOpenAI(sample, voice, format, 'system') // System user for previews
}

const REFERENCE_TEXT = "This vision serves as my magnet, attracting the people, ideas, resources, strategies, events, and circumstances that orchestrate its beautiful unfolding. I hereby give the Universe full permission to open all doors leading to the joyful experience of this or something even better. Thank you in advance for this fun and satisfying journey of unlimited creation. I am truly grateful for the opportunity to be here and experience ourselves as the conscious creators of the The Life I Choose."

export async function getOrCreateVoiceReference(voice: OpenAIVoice, format: 'mp3' | 'wav' = 'mp3'): Promise<{ url: string; key: string }> {
  const s3 = getS3Client()
  const ext = format === 'wav' ? 'wav' : 'mp3'
  const key = `site-assets/voice-previews/${voice}.${ext}`

  // Check if it already exists
  try {
    await s3.send(new HeadObjectCommand({ Bucket: BUCKET_NAME, Key: key }))
    return { url: `${CDN_PREFIX}/${key}`, key }
  } catch {
    // Not found, generate and upload
    const chunks = chunkTextForTTS(REFERENCE_TEXT)
    const buffers: Buffer[] = []
    for (const part of chunks) {
      const b = await synthesizeWithOpenAI(part, voice, format, 'system') // System user for voice previews
      buffers.push(b)
    }
    const audioBuffer = Buffer.concat(buffers)

    const put = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      Body: audioBuffer,
      ContentType: format === 'wav' ? 'audio/wav' : 'audio/mpeg',
      CacheControl: 'public, max-age=31536000',
    })
    await s3.send(put)
    return { url: `${CDN_PREFIX}/${key}`, key }
  }
}


