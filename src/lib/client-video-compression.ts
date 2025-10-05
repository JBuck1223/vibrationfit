// Client-side video compression using browser APIs
export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 0.1 to 1.0
  maxSizeMB?: number
}

export async function compressVideoClientSide(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeMB = 50
  } = options

  // If file is already small enough, return as-is
  if (file.size <= maxSizeMB * 1024 * 1024) {
    return file
  }

  return new Promise((resolve, reject) => {
    const video = document.createElement('video')
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Canvas context not available'))
      return
    }

    video.onloadedmetadata = () => {
      // Calculate new dimensions maintaining aspect ratio
      let { width, height } = video
      const aspectRatio = width / height

      if (width > maxWidth) {
        width = maxWidth
        height = width / aspectRatio
      }
      if (height > maxHeight) {
        height = maxHeight
        width = height * aspectRatio
      }

      canvas.width = width
      canvas.height = height

      // Draw video frame
      ctx.drawImage(video, 0, 0, width, height)

      // Convert to blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to compress video'))
            return
          }

          // Create new file with compressed data
          const compressedFile = new File([blob], file.name, {
            type: 'video/webm',
            lastModified: Date.now()
          })

          console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
          resolve(compressedFile)
        },
        'video/webm',
        quality
      )
    }

    video.onerror = () => reject(new Error('Failed to load video'))
    video.src = URL.createObjectURL(file)
  })
}

export function shouldCompressVideoClientSide(file: File): boolean {
  return file.type.startsWith('video/') && file.size > 20 * 1024 * 1024
}
