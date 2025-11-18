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
} as const

type UserFolder = keyof typeof USER_FOLDERS

export function getFileUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${CDN_URL}/${cleanPath}`
}

// Threshold for presigned URL upload
// Use API route for files up to 50MB (reliable, no CORS issues, handles multipart)
// Only use presigned URLs for very large files (>50MB)
const PRESIGNED_THRESHOLD = 50 * 1024 * 1024 // 50MB

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

    // Use XMLHttpRequest for better progress tracking and mobile compatibility
    const response = await new Promise<Response>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      
      // Set timeout
      xhr.timeout = 120000 // 2 minutes
      
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable && onProgress) {
          const percentComplete = Math.round((event.loaded / event.total) * 100)
          onProgress(percentComplete)
          console.log(`📊 Upload progress: ${percentComplete}%`)
        }
      }
      
      xhr.onload = () => {
        console.log(`📊 Upload complete: ${xhr.status} ${xhr.statusText}`)
        // Create a Response-like object
        const response = new Response(xhr.response, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers(xhr.getAllResponseHeaders().split('\r\n').reduce((acc, line) => {
            const [key, value] = line.split(': ')
            if (key && value) acc[key] = value
            return acc
          }, {} as Record<string, string>))
        })
        resolve(response)
      }
      
      xhr.onerror = () => {
        console.error('❌ XHR network error (likely CORS)')
        reject(new Error('CORS: Network error during upload'))
      }
      
      xhr.ontimeout = () => {
        console.error('❌ XHR timeout after 2 minutes')
        reject(new Error('Upload timed out. Please try with a smaller file or check your connection.'))
      }
      
      xhr.open('PUT', uploadUrl)
      xhr.setRequestHeader('Content-Type', file.type)
      xhr.send(file)
    })

    // Check for 405 or other CORS-related errors
    if (response.status === 405 || response.status === 403) {
      console.error('❌ S3 CORS/Permission error:', response.status)
      console.error('   1. S3 bucket CORS configuration is missing or incorrect')
      console.error('   2. The presigned URL may be malformed')
      console.error('   3. The bucket policy may be blocking PUT requests')
      throw new Error(`CORS: Upload failed with status ${response.status}`)
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'No error details')
      console.error('❌ S3 upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      throw new Error(`CORS: Upload failed with status ${response.status}`)
    }

    console.log('✅ Presigned upload successful')

    if (onProgress) onProgress(100)

    // For videos, MediaConvert will automatically create thumbnails
    if (file.type.startsWith('video/')) {
      if (file.size > 20 * 1024 * 1024) {
        // Large videos: trigger MediaConvert
        console.log('🎬 Triggering MediaConvert for presigned upload:', key)
        try {
          await fetch('/api/mediaconvert/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputKey: key,
              filename: file.name,
              userId: userId || '',
              folder: USER_FOLDERS[folder]
            })
          })
          console.log('✅ MediaConvert job triggered')
        } catch (error) {
          console.error('⚠️ Failed to trigger MediaConvert:', error)
          // Continue - file is uploaded, processing can happen later
        }
      } else {
        // Small videos: Trigger compression to convert .mov to .mp4
        console.log('🎬 Triggering compression for .mov file:', file.name)
        try {
          await fetch('/api/upload/process-existing', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              inputKey: key,
              userId: userId || '',
              folder: USER_FOLDERS[folder]
            })
          })
          console.log('✅ Compression job triggered')
        } catch (error) {
          console.error('⚠️ Failed to trigger compression:', error)
        }
      }
    }

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

  // Use presigned URL for large files (>50MB to avoid issues)
  console.log(`📊 Upload decision: file size ${(file.size / 1024 / 1024).toFixed(2)}MB, threshold ${(PRESIGNED_THRESHOLD / 1024 / 1024).toFixed(2)}MB`)
  
  if (file.size > PRESIGNED_THRESHOLD) {
    console.log(`🔗 Using presigned URL upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    return uploadFileWithPresignedUrl(folder, file, userId, onProgress)
  }

  // Use API route for smaller files (more reliable, no CORS issues)
  console.log(`🚀 Using API route upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
  return uploadViaApiRoute(folder, file, userId, onProgress)
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
      maxSize: 1024 * 1024 * 1024, // 1GB for videos/audio/images
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    journalAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    journalVideoRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for video recordings
      types: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'],
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
      maxSize: 1024 * 1024 * 1024, // 1GB for video recordings
      types: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'],
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
      maxSize: 1024 * 1024 * 1024, // 1GB for video recordings
      types: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'],
    },
    profile: {
      maxSize: 1024 * 1024 * 1024, // 1GB for profile files
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi', 'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
    },
    profileAudioRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for audio recordings
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/webm', 'audio/ogg'],
    },
    profileVideoRecordings: {
      maxSize: 1024 * 1024 * 1024, // 1GB for video recordings
      types: ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-msvideo', 'video/avi'],
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
  }

  const { maxSize, types } = rules[folder]

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max: ${maxSize / 1024 / 1024}MB` }
  }

  if (!types.includes(file.type)) {
    console.log('File validation failed:', {
      fileName: file.name,
      fileType: file.type,
      fileSize: file.size,
      folder: folder,
      allowedTypes: types
    })
    return { valid: false, error: `Invalid type. Allowed: ${types.join(', ')}` }
  }

  return { valid: true }
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
