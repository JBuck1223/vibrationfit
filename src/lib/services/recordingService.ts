import { uploadUserFile, USER_FOLDERS } from '@/lib/storage/s3-storage-presigned'

export interface RecordingUploadResult {
  url: string
  key: string
  transcript?: string
  duration?: number
}

/**
 * Upload a recorded audio/video file to S3
 * @param blob - The recorded media blob
 * @param folder - The folder to upload to (e.g., 'journal', 'evidence')
 * @param fileName - Optional custom file name
 * @returns Upload result with URL and transcript
 */
export async function uploadRecording(
  blob: Blob,
  folder: keyof typeof USER_FOLDERS = 'evidence',
  fileName?: string
): Promise<RecordingUploadResult> {
  try {
    // Generate file name if not provided
    const timestamp = Date.now()
    const extension = blob.type.includes('video') ? 'webm' : 'webm'
    const name = fileName || `recording-${timestamp}.${extension}`

    // Create File object from Blob
    const file = new File([blob], name, { type: blob.type })

    // Upload to S3
    const result = await uploadUserFile(folder, file)
    const url = result.url

    return {
      url,
      key: url.split('/').slice(-1)[0], // Extract key from URL
    }
  } catch (error) {
    console.error('Failed to upload recording:', error)
    throw new Error('Failed to upload recording')
  }
}

/**
 * Upload and transcribe an audio recording
 * @param blob - The recorded audio blob
 * @param folder - The folder to upload to
 * @param fileName - Optional custom file name
 * @returns Upload result with URL and transcript
 */
export async function uploadAndTranscribeRecording(
  blob: Blob,
  folder: keyof typeof USER_FOLDERS = 'evidence',
  fileName?: string
): Promise<RecordingUploadResult> {
  try {
    // First, transcribe the audio
    const formData = new FormData()
    formData.append('audio', blob, fileName || 'recording.webm')

    const transcribeResponse = await fetch('/api/transcribe', {
      method: 'POST',
      body: formData
    })

    if (!transcribeResponse.ok) {
      throw new Error('Transcription failed')
    }

    const { transcript, duration } = await transcribeResponse.json()

    // Then upload to S3
    const uploadResult = await uploadRecording(blob, folder, fileName)

    return {
      ...uploadResult,
      transcript,
      duration
    }
  } catch (error) {
    console.error('Failed to upload and transcribe recording:', error)
    throw new Error('Failed to upload and transcribe recording')
  }
}

/**
 * Format duration in seconds to readable string
 */
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = Math.floor(seconds % 60)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}

/**
 * Estimate transcription cost (OpenAI Whisper pricing: $0.006 per minute)
 */
export function estimateTranscriptionCost(durationSeconds: number): number {
  const minutes = durationSeconds / 60
  return minutes * 0.006
}

