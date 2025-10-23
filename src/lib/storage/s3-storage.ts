// Client-side S3 storage utilities using API routes

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'

export const USER_FOLDERS = {
  visionBoard: 'vision-board',
  journal: 'journal',
  lifeVision: 'life-vision',
  alignmentPlan: 'alignment-plan',
  evidence: 'evidence',
  avatar: 'avatar',
  customTracks: 'custom-tracks',
} as const

type UserFolder = keyof typeof USER_FOLDERS

export function getFileUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  return `${CDN_URL}/${cleanPath}`
}

// Threshold for multipart upload (50MB)
const MULTIPART_THRESHOLD = 50 * 1024 * 1024
const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks

// Upload large files with multipart upload
export async function uploadLargeFile(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  try {
    if (!userId) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Not authenticated')
      userId = user.id
    }

    // Upload via API route with multipart support
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', USER_FOLDERS[folder])
    formData.append('userId', userId)
    formData.append('multipart', 'true') // Signal for multipart upload

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()

    if (onProgress) onProgress(100)

    return { url: result.url, key: result.key }
  } catch (error) {
    console.error('S3 upload error:', error)
    throw error
  }
}

// Smart upload function - picks the right method
export async function uploadUserFile(
  folder: UserFolder,
  file: File,
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string }> {
  // Validate file first
  const validation = validateFile(file, folder)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Use multipart for large files
  if (file.size > MULTIPART_THRESHOLD) {
    return uploadLargeFile(folder, file, userId, onProgress)
  }

  // Regular upload for smaller files
  try {
    if (!userId) {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user }, error } = await supabase.auth.getUser()
      if (error || !user) throw new Error('Not authenticated')
      userId = user.id
    }

    // Upload via API route
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', USER_FOLDERS[folder])
    formData.append('userId', userId)

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Upload failed')
    }

    const result = await response.json()

    if (onProgress) onProgress(100)

    return { url: result.url, key: result.key }
  } catch (error) {
    console.error('S3 upload error:', error)
    throw error
  }
}

function validateFile(file: File, folder: UserFolder): { valid: boolean; error?: string } {
  const rules = {
    visionBoard: {
      maxSize: 50 * 1024 * 1024, // 50MB for images
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif'],
    },
    journal: {
      maxSize: 500 * 1024 * 1024, // 500MB for videos/audio
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3'],
    },
    lifeVision: {
      maxSize: 200 * 1024 * 1024, // 200MB for audio/docs
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'application/pdf', 'text/plain'],
    },
    alignmentPlan: {
      maxSize: 200 * 1024 * 1024, // 200MB for media/docs
      types: ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'application/pdf'],
    },
    evidence: {
      maxSize: 500 * 1024 * 1024, // 500MB for evidence videos
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm'],
    },
    avatar: {
      maxSize: 10 * 1024 * 1024, // 10MB for avatars
      types: ['image/jpeg', 'image/png', 'image/webp'],
    },
    customTracks: {
      maxSize: 200 * 1024 * 1024, // 200MB for audio tracks
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3'],
    },
  }

  const { maxSize, types } = rules[folder]

  if (file.size > maxSize) {
    return { valid: false, error: `File too large. Max: ${maxSize / 1024 / 1024}MB` }
  }

  if (!types.includes(file.type)) {
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
export async function uploadMultipleUserFiles(
  folder: UserFolder,
  files: File[],
  userId?: string,
  onProgress?: (progress: number) => void
): Promise<{ url: string; key: string; error?: string }[]> {
  const uploadPromises = files.map(async (file, index) => {
    try {
      const result = await uploadUserFile(folder, file, userId, (progress) => {
        if (onProgress) {
          const totalProgress = ((index + progress / 100) / files.length) * 100
          onProgress(totalProgress)
        }
      })
      return { ...result, error: undefined }
    } catch (error) {
      return { 
        url: '', 
        key: '', 
        error: error instanceof Error ? error.message : 'Upload failed' 
      }
    }
  })
  
  return Promise.all(uploadPromises)
}

export const ASSETS = {
  brand: {
    logo: getFileUrl('site-assets/brand/logo/logo.svg'),
    logoWhite: getFileUrl('site-assets/brand/logo/logo-white.svg'),
    icon: getFileUrl('site-assets/brand/logo/logo-icon.svg'),
    iconWhite: getFileUrl('site-assets/brand/logo/logo-icon-white.svg'),
  },
}