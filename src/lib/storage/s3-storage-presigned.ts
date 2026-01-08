// Enhanced S3 storage with presigned URLs for large files
import { createClient } from '@/lib/supabase/client'

const CDN_URL = 'https://media.vibrationfit.com'

export const USER_FOLDERS = {
  visionBoard: 'vision-board',
  visionBoardGenerated: 'vision-board/generated',
  visionBoardUploaded: 'vision-board/uploaded',
  journal: 'journal/uploads',
  journalAudioRecordings: 'journal/audio-recordings',
  journalVideoRecordings: 'journal/video-recordings',
  lifeVision: 'life-vision',
  lifeVisionAudioRecordings: 'life-vision/audio-recordings',
  lifeVisionVideoRecordings: 'life-vision/video-recordings',
  alignmentPlan: 'alignment-plan',
  alignmentPlanAudioRecordings: 'alignment-plan/audio-recordings',
  alignmentPlanVideoRecordings: 'alignment-plan/video-recordings',
  profile: 'profile',
  profilePicture: 'profile/avatar',
  profileAudioRecordings: 'profile/audio-recordings',
  profileVideoRecordings: 'profile/video-recordings',
  customTracks: 'custom-tracks',
  voiceCloneSamples: 'voice-clone-samples',
  // Intensive testimonials
  intensiveTestimonials: 'intensive/testimonials',
  intensiveCalibrationRecordings: 'intensive/calibration-recordings',
} as const

type UserFolder = keyof typeof USER_FOLDERS

export function getFileUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${CDN_URL}/${cleanPath}`
}

// Threshold for presigned URL upload
// Lowered to 500KB because Vercel has payload limits with FormData overhead
// Files >500KB must use presigned URLs to avoid "Function payload too large" errors
const PRESIGNED_THRESHOLD = 500 * 1024 // 500KB

// Threshold for multipart upload (files larger than this use multipart)
const MULTIPART_THRESHOLD = 100 * 1024 * 1024 // 100MB

// Chunk size for multipart uploads (10MB per chunk)
const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB

// Retry configuration
const MAX_RETRIES = 3
const INITIAL_RETRY_DELAY = 1000 // 1 second

// Retry wrapper with exponential backoff
async function withRetry<T>(
  fn: () => Promise<T>,
  options: {
    maxRetries?: number
    initialDelay?: number
    onRetry?: (attempt: number, error: Error) => void
    shouldRetry?: (error: Error) => boolean
  } = {}
): Promise<T> {
  const {
    maxRetries = MAX_RETRIES,
    initialDelay = INITIAL_RETRY_DELAY,
    onRetry,
    shouldRetry = (error) => {
      // Retry on network errors, timeouts, and 5xx server errors
      const message = error.message.toLowerCase()
      return (
        message.includes('network') ||
        message.includes('timeout') ||
        message.includes('timed out') ||
        message.includes('500') ||
        message.includes('502') ||
        message.includes('503') ||
        message.includes('504')
      )
    }
  } = options

  let lastError: Error = new Error('Unknown error')

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error))

      if (attempt === maxRetries || !shouldRetry(lastError)) {
        throw lastError
      }

      const delay = initialDelay * Math.pow(2, attempt)
      console.log(`⚠️ Attempt ${attempt + 1} failed, retrying in ${delay}ms...`, lastError.message)

      if (onRetry) {
        onRetry(attempt + 1, lastError)
      }

      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  throw lastError
}

// Convert technical error messages to user-friendly messages
export function getUploadErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase()

  // Timeout errors
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'Upload timed out. Please check your internet connection and try again with a smaller file if needed.'
  }

  // Network errors
  if (message.includes('network') || message.includes('failed to fetch') || message.includes('net::')) {
    return 'Network error. Please check your internet connection and try again.'
  }

  // CORS errors
  if (message.includes('cors') || message.includes('405')) {
    return 'Upload blocked by server configuration. Please try again or contact support.'
  }

  // File size errors
  if (message.includes('too large') || message.includes('413') || message.includes('payload')) {
    return 'File is too large. Please try a smaller file.'
  }

  // File type errors
  if (message.includes('invalid') && (message.includes('type') || message.includes('format'))) {
    return 'This file format is not supported. Please use common image, video, or audio formats.'
  }

  // Authentication errors
  if (message.includes('authenticated') || message.includes('unauthorized') || message.includes('401')) {
    return 'Your session has expired. Please refresh the page and try again.'
  }

  // Server errors
  if (message.includes('500') || message.includes('502') || message.includes('503') || message.includes('server')) {
    return 'Server error. Please wait a moment and try again.'
  }

  // Storage quota errors
  if (message.includes('quota') || message.includes('storage')) {
    return 'Storage limit reached. Please delete some files and try again.'
  }

  // Generic fallback
  return 'Upload failed. Please try again. If the problem persists, try a smaller file or different format.'
}

// Get presigned URL for direct S3 upload
export async function getPresignedUploadUrl(
  folder: UserFolder,
  fileName: string,
  fileType: string,
  userId?: string
): Promise<{ uploadUrl: string; key: string; finalUrl: string }> {
  try {
    if (!userId) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Not authenticated')
      userId = user.id
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const sanitizedName = fileName.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase()
    const key = `user-uploads/${userId}/${USER_FOLDERS[folder]}/${timestamp}-${randomStr}-${sanitizedName}`

    const response = await fetch('/api/upload/presigned', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key, fileType })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to get presigned URL')
    }

    const { uploadUrl } = await response.json()
    const finalUrl = getFileUrl(key)

    return { uploadUrl, key, finalUrl }
  } catch (error) {
    console.error('Presigned URL error:', error)
    throw error
  }
}

// XHR-based upload with real progress tracking
async function uploadWithXHRProgress(
  url: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<{ status: number; statusText: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    
    // Track upload progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve({ status: xhr.status, statusText: xhr.statusText })
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
      }
    }
    
    xhr.onerror = () => {
      reject(new Error('Network error during upload'))
    }
    
    xhr.ontimeout = () => {
      reject(new Error('Upload timed out'))
    }
    
    // Set a long timeout for large files (10 minutes)
    xhr.timeout = 600000
    
    xhr.open('PUT', url)
    xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream')
    xhr.send(file)
  })
}

// Upload file using presigned URL (for large files)
export async function uploadFileWithPresignedUrl(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  try {
    // Get presigned URL
    const { uploadUrl, key, finalUrl } = await getPresignedUploadUrl(
      folder,
      file.name,
      file.type,
      userId
    )

    console.log('📤 Uploading to S3 with presigned URL:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
      key: key
    })

    // Use XHR for real progress tracking
    try {
      await uploadWithXHRProgress(uploadUrl, file, onProgress)
      console.log('✅ Presigned upload successful')
    } catch (xhrError) {
      // Check for specific error types
      if (xhrError instanceof Error) {
        if (xhrError.message.includes('405')) {
          console.error('❌ 405 Method Not Allowed from S3. This usually means:')
          console.error('   1. S3 bucket CORS configuration is missing or incorrect')
          console.error('   2. The presigned URL may be malformed')
          console.error('   3. The bucket policy may be blocking PUT requests')
          throw new Error('S3 upload blocked (405). Please check S3 CORS configuration. Attempting fallback...')
        }
        if (xhrError.message.includes('Network error') || xhrError.message.includes('timed out')) {
          throw xhrError // Propagate for retry logic
        }
      }
      throw xhrError
    }

    if (onProgress) onProgress(100)

    // Note: MediaConvert is triggered automatically via S3 event listener in AWS
    // No manual trigger needed from the app

    return { url: finalUrl, key }
  } catch (error) {
    console.error('❌ Presigned upload error:', error)
    
    // If it's a CORS/405 error, try fallback to API route
    if (error instanceof Error && (error.message.includes('405') || error.message.includes('CORS'))) {
      console.log('🔄 Attempting fallback to API route upload...')
      try {
        return await uploadViaApiRoute(folder, file, userId, onProgress)
      } catch (fallbackError) {
        console.error('❌ Fallback upload also failed:', fallbackError)
        throw new Error(`Upload failed via both presigned URL and API route. Original error: ${error.message}`)
      }
    }
    
    throw error
  }
}

// Upload large file using multipart upload
export async function uploadFileWithMultipart(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  try {
    console.log('🚀 Starting multipart upload:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      fileType: file.type,
    })

    // Generate key
    if (!userId) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Not authenticated')
      userId = user.id
    }

    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase()
    const key = `user-uploads/${userId}/${USER_FOLDERS[folder]}/${timestamp}-${randomStr}-${sanitizedName}`

    // Step 1: Create multipart upload
    const createResponse = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create',
        key,
        fileType: file.type,
        fileName: file.name,
      }),
    })

    if (!createResponse.ok) {
      throw new Error('Failed to create multipart upload')
    }

    const { uploadId } = await createResponse.json()
    console.log('✅ Multipart upload created:', uploadId)

    // Step 2: Calculate chunks
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    console.log(`📦 Splitting into ${totalChunks} chunks of ${CHUNK_SIZE / 1024 / 1024}MB each`)

    // Step 3: Upload chunks in parallel (with concurrency limit)
    const uploadedParts: Array<{ ETag: string; PartNumber: number }> = []
    const CONCURRENT_UPLOADS = 3 // Upload 3 chunks at a time
    let uploadedCount = 0 // Track completed uploads for accurate progress

    try {
      for (let i = 0; i < totalChunks; i += CONCURRENT_UPLOADS) {
        const chunkPromises = []

        for (let j = 0; j < CONCURRENT_UPLOADS && (i + j) < totalChunks; j++) {
          const partNumber = i + j + 1
          const start = (i + j) * CHUNK_SIZE
          const end = Math.min(start + CHUNK_SIZE, file.size)
          const chunk = file.slice(start, end)

          chunkPromises.push(
            (async () => {
              // Get presigned URL for this part
              const partUrlResponse = await fetch('/api/upload/multipart', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'getPartUrl',
                  key,
                  uploadId,
                  partNumber,
                }),
              })

              if (!partUrlResponse.ok) {
                throw new Error(`Failed to get presigned URL for part ${partNumber}`)
              }

              const { presignedUrl } = await partUrlResponse.json()

              // Upload the chunk with timeout
              const controller = new AbortController()
              const timeout = setTimeout(() => controller.abort(), 60000) // 60 second timeout per chunk

              try {
                const uploadResponse = await fetch(presignedUrl, {
                  method: 'PUT',
                  body: chunk,
                  headers: {
                    'Content-Type': file.type,
                  },
                  signal: controller.signal,
                })

                clearTimeout(timeout)

                if (!uploadResponse.ok) {
                  throw new Error(`Failed to upload part ${partNumber}: ${uploadResponse.status}`)
                }

                const etag = uploadResponse.headers.get('ETag')
                if (!etag) {
                  throw new Error(`No ETag returned for part ${partNumber}`)
                }

                console.log(`✅ Uploaded part ${partNumber}/${totalChunks} (${etag})`)

                // Update progress based on actual completed uploads
                uploadedCount++
                if (onProgress) {
                  const progress = Math.round((uploadedCount / totalChunks) * 100)
                  onProgress(progress)
                }

                return { ETag: etag.replace(/"/g, ''), PartNumber: partNumber }
              } catch (error) {
                clearTimeout(timeout)
                if (error instanceof Error && error.name === 'AbortError') {
                  throw new Error(`Upload timeout for part ${partNumber}`)
                }
                throw error
              }
            })()
          )
        }

        // Wait for this batch of chunks to complete
        const batchParts = await Promise.all(chunkPromises)
        uploadedParts.push(...batchParts)
      }
    } catch (error) {
      // Abort the multipart upload if any chunk fails
      console.error('❌ Chunk upload failed, aborting multipart upload...', error)
      await fetch('/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'abort',
          key,
          uploadId,
        }),
      }).catch(e => console.error('Failed to abort upload:', e))
      throw error
    }

    // Sort parts by part number (required by S3)
    uploadedParts.sort((a, b) => a.PartNumber - b.PartNumber)

    console.log('✅ All chunks uploaded, completing multipart upload...')

    // Step 4: Complete multipart upload
    const completeResponse = await fetch('/api/upload/multipart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'complete',
        key,
        uploadId,
        parts: uploadedParts,
      }),
    })

    if (!completeResponse.ok) {
      // If completion fails, abort the upload
      await fetch('/api/upload/multipart', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'abort',
          key,
          uploadId,
        }),
      })
      throw new Error('Failed to complete multipart upload')
    }

    const { url: finalUrl } = await completeResponse.json()
    console.log('🎉 Multipart upload complete!', finalUrl)

    if (onProgress) onProgress(100)

    // Note: MediaConvert is triggered automatically via AWS Lambda when files land in S3
    // No manual trigger needed

    return { url: finalUrl, key }
  } catch (error) {
    console.error('❌ Multipart upload error:', error)
    throw error
  }
}

// Smart upload function - chooses best method
export async function uploadUserFile(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  console.log('📤 uploadUserFile called:', { 
    folder, 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type,
    userId 
  })

  // Validate file first
  const validation = validateFile(file, folder)
  if (!validation.valid) {
    console.error('❌ File validation failed:', validation.error)
    throw new Error(validation.error)
  }

  console.log('✅ File validation passed')

  // Choose upload method based on file size
  const fileSizeMB = file.size / 1024 / 1024

  // Wrap all upload methods with retry logic for better reliability
  const uploadFn = async (): Promise<{ url: string; key: string }> => {
    // Use multipart upload for very large files (>100MB)
    if (file.size > MULTIPART_THRESHOLD) {
      console.log(`🚀 Using multipart upload for ${file.name} (${fileSizeMB.toFixed(2)}MB)`)
      return uploadFileWithMultipart(folder, file, userId, onProgress)
    }

    // Use presigned URL for medium files (500KB - 100MB)
    if (file.size > PRESIGNED_THRESHOLD) {
      console.log(`📤 Using presigned URL upload for ${file.name} (${fileSizeMB.toFixed(2)}MB)`)
      return uploadFileWithPresignedUrl(folder, file, userId, onProgress)
    }

    // Use API route for small files (<500KB - more reliable, no CORS issues)
    console.log(`📦 Using API route upload for ${file.name} (${fileSizeMB.toFixed(2)}MB)`)
    return uploadViaApiRoute(folder, file, userId, onProgress)
  }

  // Execute with retry logic
  return withRetry(uploadFn, {
    maxRetries: MAX_RETRIES,
    onRetry: (attempt, error) => {
      console.log(`🔄 Retry attempt ${attempt} for ${file.name}: ${error.message}`)
    }
  })
}

// Upload via API route (for smaller files with compression)
async function uploadViaApiRoute(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  try {
    if (!userId) {
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Not authenticated')
      userId = user.id
    }

    // Clone file to avoid "body is disturbed or locked" error
    const fileClone = new File([file], file.name, { type: file.type })

    const formData = new FormData()
    formData.append('file', fileClone)
    formData.append('folder', USER_FOLDERS[folder])
    formData.append('userId', userId)
    // Always use multipart for files larger than 4MB to avoid Vercel body size limit (4.5MB)
    if (file.size > 4 * 1024 * 1024) {
      formData.append('multipart', 'true')
    }

    console.log('📤 Uploading via API route:', {
      fileName: file.name,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      folder: USER_FOLDERS[folder]
    })

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // Read response as text first, then try to parse as JSON
      let errorMessage = `Upload failed with status ${response.status}`
      try {
        const responseText = await response.text()
        if (responseText) {
          try {
            const errorData = JSON.parse(responseText)
            errorMessage = errorData.error || responseText
          } catch {
            // Not JSON, use raw text
            errorMessage = responseText
          }
        }
      } catch {
        // Couldn't read response
      }
      throw new Error(errorMessage)
    }

    const result = await response.json()

    if (onProgress) onProgress(100)

    console.log('✅ API route upload successful')

    return { url: result.url, key: result.key }
  } catch (error) {
    console.error('API route upload error:', error)
    throw error
  }
}

function validateFile(file: File, folder: UserFolder): { valid: boolean; error?: string } {
  const rules = {
    visionBoard: {
      maxSize: 100 * 1024 * 1024, // 100MB for images
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
    },
    journal: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for videos/audio/images (supports multipart upload)
      types: [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        // Videos - standard
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // Videos - iPhone/mobile specific
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
        // Audio
        'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg',
      ],
    },
    journalAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    journalVideoRecordings: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for video recordings (supports multipart upload)
      types: [
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // iPhone/mobile specific formats
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
      ],
    },
    lifeVision: {
      maxSize: 500 * 1024 * 1024, // 500MB for audio/docs
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg', 'application/pdf', 'text/plain'],
    },
    lifeVisionAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    lifeVisionVideoRecordings: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for video recordings (supports multipart upload)
      types: [
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // iPhone/mobile specific formats
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
      ],
    },
    alignmentPlan: {
      maxSize: 500 * 1024 * 1024, // 500MB for media/docs
      types: ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'audio/webm', 'audio/ogg', 'application/pdf'],
    },
    alignmentPlanAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    alignmentPlanVideoRecordings: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for video recordings (supports multipart upload)
      types: [
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // iPhone/mobile specific formats
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
      ],
    },
    profile: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for profile files (supports multipart upload)
      types: [
        // Images
        'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
        // Videos - standard
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // Videos - iPhone/mobile specific
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
        // Audio
        'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg',
      ],
    },
    profileAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    profileVideoRecordings: {
      maxSize: 5 * 1024 * 1024 * 1024, // 5GB for video recordings (supports multipart upload)
      types: [
        'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi',
        // iPhone/mobile specific formats
        'video/3gpp', 'video/3gpp2', 'video/x-m4v', 'video/hevc',
      ],
    },
    profilePicture: {
      maxSize: 20 * 1024 * 1024, // 20MB for profile pictures
      types: ['image/jpeg', 'image/png', 'image/webp'],
    },
    customTracks: {
      maxSize: 500 * 1024 * 1024, // 500MB for audio tracks
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
    },
    visionBoardGenerated: {
      maxSize: 20 * 1024 * 1024, // 20MB for generated images
      types: ['image/jpeg', 'image/png', 'image/webp'],
    },
    visionBoardUploaded: {
      maxSize: 20 * 1024 * 1024, // 20MB for uploaded images
      types: ['image/jpeg', 'image/png', 'image/webp'],
    },
    voiceCloneSamples: {
      maxSize: 500 * 1024 * 1024, // 500MB for voice clone audio samples
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
  }

  const { maxSize, types } = rules[folder]

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max: ${maxSize / 1024 / 1024}MB` }
  }

  // Check MIME type first
  if (types.includes(file.type)) {
    return { valid: true }
  }

  // Fallback: Check by file extension when MIME type is missing or unrecognized
  // This handles mobile browsers that don't properly detect MIME types
  const extension = file.name.split('.').pop()?.toLowerCase() || ''
  const extensionToMimeMap: Record<string, string[]> = {
    // Video extensions
    'mp4': ['video/mp4'],
    'mov': ['video/quicktime'],
    'webm': ['video/webm', 'audio/webm'],
    'avi': ['video/x-msvideo', 'video/avi'],
    'm4v': ['video/x-m4v'],
    '3gp': ['video/3gpp'],
    '3g2': ['video/3gpp2'],
    // Image extensions
    'jpg': ['image/jpeg'],
    'jpeg': ['image/jpeg'],
    'png': ['image/png'],
    'gif': ['image/gif'],
    'webp': ['image/webp'],
    'heic': ['image/heic'],
    'heif': ['image/heif'],
    // Audio extensions
    'mp3': ['audio/mpeg', 'audio/mp3'],
    'wav': ['audio/wav'],
    'ogg': ['audio/ogg'],
  }

  const possibleTypes = extensionToMimeMap[extension] || []
  const hasValidExtension = possibleTypes.some(t => types.includes(t))

  if (hasValidExtension) {
    console.log('File validated by extension fallback:', {
      fileName: file.name,
      extension: extension,
      reportedMimeType: file.type || '(empty)',
      folder: folder
    })
    return { valid: true }
  }

  console.log('File validation failed:', {
    fileName: file.name,
    fileType: file.type || '(empty)',
    extension: extension,
    fileSize: file.size,
    folder: folder,
    allowedTypes: types
  })
  return { valid: false, error: `Invalid file type. Supported formats: images, videos, audio` }
}

export async function deleteUserFile(s3Key: string): Promise<void> {
  try {
    const response = await fetch('/api/upload', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ s3Key }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Delete failed')
    }
  } catch (error) {
    console.error('S3 delete error:', error)
    throw error
  }
}

// Upload multiple files (convenience function)
// Uses SEQUENTIAL uploads to avoid overwhelming S3/API and prevent 405 errors
export async function uploadMultipleUserFiles(
  folder: UserFolder,
  files: File[],
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string; error?: string }[]> {
  const results: { url: string; key: string; error?: string }[] = []
  
  console.log(`📤 Starting sequential upload of ${files.length} files...`)
  
  // Upload files ONE AT A TIME to avoid S3 rate limiting and CORS issues
  for (let index = 0; index < files.length; index++) {
    const file = files[index]
    console.log(`📤 Uploading file ${index + 1}/${files.length}: ${file.name}`)
    
    try {
      const result = await uploadUserFile(folder, file, userId, (progress) => {
        if (onProgress) {
          // Calculate total progress: completed files + current file progress
          const completedProgress = (index / files.length) * 100
          const currentProgress = (progress / 100 / files.length) * 100
          const totalProgress = completedProgress + currentProgress
          onProgress(Math.round(totalProgress))
        }
      })
      
      console.log(`✅ File ${index + 1}/${files.length} uploaded successfully`)
      results.push({ ...result, error: undefined })
      
      // Small delay between uploads to prevent rate limiting
      if (index < files.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500)) // 500ms delay
      }
    } catch (error) {
      console.error(`❌ Upload failed for ${file.name}:`, error)
      results.push({ 
        url: '', 
        key: '', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      })
    }
  }
  
  console.log(`📤 Sequential upload complete: ${results.filter(r => !r.error).length}/${files.length} successful`)
  return results
}

export const ASSETS = {
  brand: {
    logo: getFileUrl('site-assets/brand/logo/logo.svg'),
    logoWhite: getFileUrl('site-assets/brand/logo/logo-white.svg'),
    icon: getFileUrl('site-assets/brand/logo/logo-icon.svg'),
    iconWhite: getFileUrl('site-assets/brand/logo/logo-icon-white.svg'),
  },
}
