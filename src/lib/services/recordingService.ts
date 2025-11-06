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
 * @param folder - The folder to upload to (e.g., 'journalAudioRecordings', 'lifeVisionAudioRecordings')
 * @param fileName - Optional custom file name
 * @returns Upload result with URL and transcript
 */
export async function uploadRecording(
  blob: Blob,
  folder: keyof typeof USER_FOLDERS = 'journalAudioRecordings',
  fileName?: string,
  onProgress?: (progress: number) => void
): Promise<RecordingUploadResult> {
  try {
    // Generate file name if not provided
    const timestamp = Date.now()
    const extension = blob.type.includes('video') ? 'webm' : 'webm'
    const name = fileName || `recording-${timestamp}.${extension}`

    // Create File object from Blob
    const file = new File([blob], name, { type: blob.type })

    // Upload to S3
    const result = await uploadUserFile(folder, file, undefined, onProgress)
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
  folder: keyof typeof USER_FOLDERS = 'journalAudioRecordings',
  fileName?: string,
  onProgress?: (progress: number, status: string) => void
): Promise<RecordingUploadResult> {
  try {
    // First, transcribe the audio
    onProgress?.(10, 'Transcribing audio...')
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
    onProgress?.(50, 'Transcription complete, uploading...')

    // Then upload to S3
    const uploadResult = await uploadRecording(blob, folder, fileName, (progress) => {
      // Map upload progress from 50-100%
      const mappedProgress = 50 + (progress * 0.5)
      onProgress?.(mappedProgress, 'Uploading recording...')
    })

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

/**
 * Extract S3 key from CDN URL
 * Example: https://media.vibrationfit.com/user-uploads/123/journal/audio-recordings/file.webm
 * Returns: user-uploads/123/journal/audio-recordings/file.webm
 */
export function extractS3KeyFromUrl(url: string): string {
  // Validate URL is not empty
  if (!url || typeof url !== 'string' || url.trim() === '') {
    throw new Error('Recording URL is empty or invalid')
  }

  try {
    const urlObj = new URL(url)
    // Remove leading slash if present
    const path = urlObj.pathname.startsWith('/') ? urlObj.pathname.slice(1) : urlObj.pathname
    return path
  } catch (error) {
    console.error('Failed to extract S3 key from URL:', url, error)
    throw new Error('Invalid recording URL')
  }
}

/**
 * Delete a recording file from S3
 */
export async function deleteRecording(url: string): Promise<void> {
  // Validate URL before attempting deletion
  if (!url || typeof url !== 'string' || url.trim() === '') {
    console.warn('Skipping deletion: Recording URL is empty or invalid')
    return // Silently skip if URL is invalid (may already be deleted or never existed)
  }

  try {
    const { deleteUserFile } = await import('@/lib/storage/s3-storage-presigned')
    const s3Key = extractS3KeyFromUrl(url)
    await deleteUserFile(s3Key)
  } catch (error) {
    // If URL is invalid, log but don't throw - the recording entry will still be removed from DB
    console.warn('Failed to delete recording file (may already be deleted):', url, error)
    // Don't throw - allow the database update to proceed
  }
}

