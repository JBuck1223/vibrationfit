/**
 * Recording Optimization — MediaConvert re-encode for session recordings
 *
 * Daily.co cloud recordings are fragmented MP4s (fMP4) with hundreds of
 * moof+mdat segments. A 60-min session is ~2.4 GB and the browser cannot
 * seek efficiently because the sample index is spread across the file.
 *
 * This module submits a MediaConvert job to re-encode the recording as a
 * non-fragmented progressive-download MP4 at 720p with moov at front.
 * Result: ~70% smaller file with instant seeking.
 */

import {
  MediaConvertClient,
  CreateJobCommand,
  GetJobCommand,
  ListJobsCommand,
  AudioDefaultSelection,
  OutputGroupType,
  AacCodingMode,
} from '@aws-sdk/client-mediaconvert'
import { createServiceClient } from '@/lib/supabase/service'

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

function getClient() {
  return new MediaConvertClient({
    region: process.env.AWS_REGION || 'us-east-2',
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    endpoint: process.env.MEDIACONVERT_ENDPOINT,
  })
}

export interface OptimizeResult {
  session_id: string
  jobId?: string
  status: 'submitted' | 'skipped' | 'error'
  detail?: string
}

/**
 * Submit a MediaConvert optimization job for a session recording.
 * Safe to call multiple times — skips if already optimized, currently
 * processing, or a job was already submitted for this session.
 */
export async function optimizeRecording(
  sessionId: string,
  opts?: { force?: boolean }
): Promise<OptimizeResult> {
  const supabase = createServiceClient()

  const { data: session, error: fetchErr } = await supabase
    .from('video_sessions')
    .select('id, recording_s3_key, recording_url, recording_status, optimize_job_id')
    .eq('id', sessionId)
    .single()

  if (fetchErr || !session) {
    return { session_id: sessionId, status: 'error', detail: 'Session not found' }
  }

  // Already optimized (URL contains /optimized/) or currently processing
  if (session.recording_url?.includes('/optimized/')) {
    return { session_id: sessionId, status: 'skipped', detail: 'Already optimized' }
  }
  if (session.recording_status === 'processing') {
    return { session_id: sessionId, status: 'skipped', detail: 'Already processing' }
  }
  // A job was already submitted for this session. This is the hard guard that
  // prevents duplicate MediaConvert spend — never resubmit unless forced
  // (finalizePendingOptimizations clears the id if the job errored).
  if (session.optimize_job_id && !opts?.force) {
    return {
      session_id: sessionId,
      status: 'skipped',
      detail: `Job ${session.optimize_job_id} already submitted`,
    }
  }

  const s3Key =
    session.recording_s3_key ||
    session.recording_url?.replace(`${CDN_URL}/`, '') ||
    ''

  if (!s3Key) {
    return { session_id: sessionId, status: 'error', detail: 'No S3 key' }
  }

  const keyParts = s3Key.split('/')
  const filename = keyParts.pop() || 'recording.mp4'
  const baseName = filename.replace(/\.[^/.]+$/, '')
  const parentPath = keyParts.join('/')
  const outputPrefix = parentPath
    ? `${parentPath}/optimized/`
    : 'session-recordings/optimized/'

  try {
    const client = getClient()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobSettings: any = {
      Role: process.env.MEDIACONVERT_ROLE_ARN!,
      Settings: {
        Inputs: [
          {
            FileInput: `s3://${BUCKET_NAME}/${s3Key}`,
            VideoSelector: {},
            AudioSelectors: {
              'Audio Selector 1': {
                DefaultSelection: AudioDefaultSelection.DEFAULT,
              },
            },
          },
        ],
        OutputGroups: [
          {
            Name: 'Optimized Recording',
            OutputGroupSettings: {
              Type: OutputGroupType.FILE_GROUP_SETTINGS,
              FileGroupSettings: {
                Destination: `s3://${BUCKET_NAME}/${outputPrefix}`,
              },
            },
            Outputs: [
              {
                NameModifier: `-${baseName}`,
                VideoDescription: {
                  Width: 1280,
                  Height: 720,
                  CodecSettings: {
                    Codec: 'H_264',
                    H264Settings: {
                      RateControlMode: 'QVBR',
                      QvbrSettings: { QvbrQualityLevel: 7 },
                      QualityTuningLevel: 'SINGLE_PASS_HQ',
                      CodecProfile: 'MAIN',
                      CodecLevel: 'AUTO',
                      MaxBitrate: 3000000,
                    },
                  },
                },
                AudioDescriptions: [
                  {
                    CodecSettings: {
                      Codec: 'AAC',
                      AacSettings: {
                        Bitrate: 128000,
                        SampleRate: 48000,
                        CodingMode: AacCodingMode.CODING_MODE_2_0,
                      },
                    },
                  },
                ],
                ContainerSettings: {
                  Container: 'MP4',
                  Mp4Settings: {
                    CslgAtom: 'INCLUDE',
                    FreeSpaceBox: 'EXCLUDE',
                    MoovPlacement: 'PROGRESSIVE_DOWNLOAD',
                  },
                },
              },
            ],
          },
        ],
        TimecodeConfig: { Source: 'ZEROBASED' },
      },
      Tags: {
        purpose: 'session-recording-optimize',
        'session-id': sessionId,
      },
    }

    const command = new CreateJobCommand(jobSettings)

    const response = await client.send(command)
    const jobId = response.Job?.Id || ''

    await supabase
      .from('video_sessions')
      .update({
        recording_status: 'processing',
        optimize_job_id: jobId,
        optimize_submitted_at: new Date().toISOString(),
      })
      .eq('id', sessionId)

    console.log(
      `[recording-optimize] MediaConvert job ${jobId} submitted for session ${sessionId}`
    )

    return { session_id: sessionId, jobId, status: 'submitted' }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error(`[recording-optimize] Error for session ${sessionId}:`, msg)
    return { session_id: sessionId, status: 'error', detail: msg }
  }
}

/**
 * Check a MediaConvert job and finalize the session recording URL if complete.
 */
export async function checkOptimizationJob(
  jobId: string,
  sessionId: string
): Promise<{ status: string; optimizedUrl?: string; finalized?: boolean }> {
  const client = getClient()
  const { Job: job } = await client.send(new GetJobCommand({ Id: jobId }))

  if (!job) return { status: 'NOT_FOUND' }

  const status = job.Status || 'UNKNOWN'

  if (status === 'COMPLETE') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const jobAny = job as any
    const resolvedUri = jobAny.OutputGroupDetails?.[0]?.OutputDetails?.[0]?.OutputFilePaths?.[0] as string | undefined

    if (resolvedUri) {
      const s3Key = resolvedUri.replace(new RegExp(`s3://${BUCKET_NAME}/`, 'i'), '')
      const optimizedUrl = `${CDN_URL}/${s3Key}`

      const supabase = createServiceClient()
      const { error } = await supabase
        .from('video_sessions')
        .update({
          recording_url: optimizedUrl,
          recording_s3_key: s3Key,
          recording_status: 'uploaded',
        })
        .eq('id', sessionId)

      if (error) {
        console.error(`[recording-optimize] DB update failed for ${sessionId}:`, error.message)
        return { status, optimizedUrl }
      }

      console.log(`[recording-optimize] Session ${sessionId} → optimized: ${optimizedUrl}`)
      return { status, optimizedUrl, finalized: true }
    }
  }

  if (status === 'ERROR') {
    const supabase = createServiceClient()
    // Clear the job id so a future optimize attempt is allowed
    await supabase
      .from('video_sessions')
      .update({ recording_status: 'uploaded', optimize_job_id: null })
      .eq('id', sessionId)
  }

  return { status }
}

/**
 * Finalize in-flight optimization jobs. Called from the recording-sync cron.
 *
 * For every session stuck in 'processing' with a tracked MediaConvert job,
 * polls the job and swaps the recording URL to the optimized file when
 * complete. This closes the loop that previously required a manual admin
 * endpoint call (and caused duplicate job submissions while it never came).
 */
export async function finalizePendingOptimizations(): Promise<{
  checked: number
  finalized: number
  errored: number
}> {
  const supabase = createServiceClient()
  const summary = { checked: 0, finalized: 0, errored: 0 }

  const { data: pending } = await supabase
    .from('video_sessions')
    .select('id, optimize_job_id')
    .eq('recording_status', 'processing')
    .not('optimize_job_id', 'is', null)
    .limit(20)

  for (const session of pending || []) {
    summary.checked++
    try {
      const result = await checkOptimizationJob(session.optimize_job_id, session.id)
      if (result.finalized) summary.finalized++
      if (result.status === 'ERROR') summary.errored++
    } catch (err) {
      console.error(
        `[recording-optimize] finalize check failed for ${session.id}:`,
        err instanceof Error ? err.message : err
      )
    }
  }

  return summary
}
