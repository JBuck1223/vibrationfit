import { S3Client, ListObjectsV2Command, GetObjectCommand } from '@aws-sdk/client-s3'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  formatTranscript,
  transcriptLooksCollapsed,
  type TranscriptionWord,
} from '@/lib/audio/format-transcript-paragraphs'

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'
export const RECOVERY_LOOKBACK_DAYS = 14
export const MAX_RECOVERABLE_ITEMS = 5

export interface RecoverableTranscript {
  sidecarKey: string
  audioKey: string
  audioUrl: string
  transcript: string
  transcriptPreview: string
  transcribedAt: string
  duration: number | null
  submitted: boolean
  matchedJournalEntryId: string | null
}

function getS3Client() {
  return new S3Client({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
  })
}

export function journalAudioPrefix(userId: string): string {
  return `user-uploads/${userId}/journal/audio-recordings/`
}

export function recordingFingerprint(keyOrUrl: string): string {
  const match = keyOrUrl.match(/recording-\d+/)
  return match?.[0] ?? keyOrUrl.split('/').pop()?.replace(/\.[^.]+$/, '') ?? keyOrUrl
}

export function audioKeyFromSidecar(sidecarKey: string): string {
  return sidecarKey.replace(/\.transcript\.json$/, '.webm')
}

export function cdnUrlForKey(key: string): string {
  return `${CDN_URL}/${key}`
}

async function loadLinkedFingerprints(
  supabase: SupabaseClient,
  userId: string,
  since: Date
): Promise<Map<string, string>> {
  const { data: entries } = await supabase
    .from('journal_entries')
    .select('id, audio_recordings, created_at')
    .eq('user_id', userId)
    .gte('created_at', since.toISOString())
    .order('created_at', { ascending: false })
    .limit(200)

  const map = new Map<string, string>()
  for (const entry of entries ?? []) {
    const recordings = (entry.audio_recordings ?? []) as Array<{ url?: string }>
    for (const recording of recordings) {
      if (recording?.url) {
        map.set(recordingFingerprint(recording.url), entry.id)
      }
    }
  }
  return map
}

async function readSidecar(
  client: S3Client,
  sidecarKey: string
): Promise<{
  transcript: string
  transcribedAt: string
  duration: number | null
  audioKey: string
} | null> {
  try {
    const response = await client.send(
      new GetObjectCommand({ Bucket: BUCKET_NAME, Key: sidecarKey })
    )
    if (!response.Body) return null

    const sidecar = JSON.parse(await response.Body.transformToString())
    const words = (sidecar.words ?? null) as TranscriptionWord[] | null
    const raw = (sidecar.transcript_raw ?? '').trim()
    const saved = (sidecar.transcript ?? '').trim()
    const sourceRaw = raw || (transcriptLooksCollapsed(saved) ? '' : saved)
    const transcript = formatTranscript(sourceRaw || saved, words) || sourceRaw || saved
    if (!transcript) return null

    const audioKey =
      typeof sidecar.audio_key === 'string' && sidecar.audio_key
        ? sidecar.audio_key
        : audioKeyFromSidecar(sidecarKey)

    return {
      transcript,
      transcribedAt: sidecar.transcribed_at ?? new Date().toISOString(),
      duration: typeof sidecar.duration === 'number' ? sidecar.duration : null,
      audioKey,
    }
  } catch (err: unknown) {
    if ((err as { name?: string })?.name === 'NoSuchKey') return null
    throw err
  }
}

export async function listRecoverableJournalTranscripts(
  supabase: SupabaseClient,
  userId: string
): Promise<RecoverableTranscript[]> {
  const client = getS3Client()
  const prefix = journalAudioPrefix(userId)
  const since = new Date()
  since.setDate(since.getDate() - RECOVERY_LOOKBACK_DAYS)

  const linked = await loadLinkedFingerprints(supabase, userId, since)

  const sidecarKeys: { key: string; lastModified: Date }[] = []
  let continuationToken: string | undefined

  do {
    const response = await client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        ContinuationToken: continuationToken,
        MaxKeys: 500,
      })
    )

    for (const item of response.Contents ?? []) {
      if (!item.Key?.endsWith('.transcript.json') || !item.LastModified) continue
      if (item.LastModified < since) continue
      sidecarKeys.push({ key: item.Key, lastModified: item.LastModified })
    }

    continuationToken = response.NextContinuationToken
  } while (continuationToken)

  sidecarKeys.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime())

  const recoverable: RecoverableTranscript[] = []

  for (const { key } of sidecarKeys) {
    if (recoverable.length >= MAX_RECOVERABLE_ITEMS) break

    const sidecar = await readSidecar(client, key)
    if (!sidecar) continue

    const fingerprint = recordingFingerprint(sidecar.audioKey)
    const matchedJournalEntryId = linked.get(fingerprint) ?? null
    const submitted = matchedJournalEntryId !== null

    if (submitted) continue

    recoverable.push({
      sidecarKey: key,
      audioKey: sidecar.audioKey,
      audioUrl: cdnUrlForKey(sidecar.audioKey),
      transcript: sidecar.transcript,
      transcriptPreview:
        sidecar.transcript.length > 160
          ? `${sidecar.transcript.slice(0, 160).trim()}...`
          : sidecar.transcript,
      transcribedAt: sidecar.transcribedAt,
      duration: sidecar.duration,
      submitted: false,
      matchedJournalEntryId: null,
    })
  }

  return recoverable
}
