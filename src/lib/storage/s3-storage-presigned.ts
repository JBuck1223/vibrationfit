// Enhanced S3 storage with presigned URLs for large files
import { createClient } from '@/lib/supabase/client'

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

// Threshold for presigned URL upload (25MB)
const PRESIGNED_THRESHOLD = 25 * 1024 * 1024

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

    // Upload directly to S3
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': file.type,
      }
    })

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`)
    }

    if (onProgress) onProgress(100)

    return { url: finalUrl, key }
  } catch (error) {
    console.error('Presigned upload error:', error)
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
  // Validate file first
  const validation = validateFile(file, folder)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  // Use presigned URL for large files
  if (file.size > PRESIGNED_THRESHOLD) {
    console.log(`Using presigned URL upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
    return uploadFileWithPresignedUrl(folder, file, userId, onProgress)
  }

  // Use API route for smaller files (with compression)
  console.log(`Using API route upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
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
    console.error('API route upload error:', error)
    throw error
  }
}

function validateFile(file: File, folder: UserFolder): { valid: boolean; error?: string } {
  const rules = {
    visionBoard: {
      maxSize: 100 * 1024 * 1024, // 100MB for images
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    },
    journal: {
      maxSize: 1024 * 1024 * 1024, // 1GB for videos/audio
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3'],
    },
    lifeVision: {
      maxSize: 500 * 1024 * 1024, // 500MB for audio/docs
      types: ['audio/mpeg', 'audio/wav', 'audio/mp3', 'application/pdf', 'text/plain'],
    },
    alignmentPlan: {
      maxSize: 500 * 1024 * 1024, // 500MB for media/docs
      types: ['image/jpeg', 'image/png', 'audio/mpeg', 'audio/wav', 'application/pdf'],
    },
    evidence: {
      maxSize: 1024 * 1024 * 1024, // 1GB for evidence videos/audio
      types: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'video/mp4', 'video/quicktime', 'video/webm', 'audio/webm', 'audio/mpeg', 'audio/wav', 'audio/mp3', 'audio/ogg'],
    },
    avatar: {
      maxSize: 20 * 1024 * 1024, // 20MB for avatars
      types: ['image/jpeg', 'image/png', 'image/webp'],
    },
    customTracks: {
      maxSize: 500 * 1024 * 1024, // 500MB for audio tracks
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
