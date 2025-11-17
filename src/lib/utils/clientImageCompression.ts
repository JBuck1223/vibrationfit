/**
 * Client-side image compression before upload
 * Reduces upload time and bandwidth by compressing in the browser
 */

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  maxSizeMB?: number
}

/**
 * Compress image file in the browser before uploading
 * Uses Canvas API for compression - works in all modern browsers
 */
export async function compressImage(
  file: File,
  options: CompressionOptions = {}
): Promise<File> {
  const {
    maxWidth = 1920,
    maxHeight = 1920,
    quality = 0.85,
    maxSizeMB = 2
  } = options

  // Skip compression for files already small enough
  if (file.size < 100 * 1024) {
    console.log('📸 Skipping compression - file already small:', file.size)
    return file
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height)
          width = Math.round(width * ratio)
          height = Math.round(height * ratio)
        }

        // Create canvas and draw resized image
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Could not get canvas context'))
          return
        }

        // Use better image smoothing
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob with compression
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // If compressed file is larger, use original
            if (blob.size > file.size) {
              console.log('📸 Compressed file larger than original, using original')
              resolve(file)
              return
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, '.jpg'), // Convert to JPEG
              { type: 'image/jpeg' }
            )

            const originalMB = (file.size / 1024 / 1024).toFixed(2)
            const compressedMB = (compressedFile.size / 1024 / 1024).toFixed(2)
            const savings = (((file.size - compressedFile.size) / file.size) * 100).toFixed(1)
            
            console.log(`📸 Image compressed: ${originalMB}MB → ${compressedMB}MB (${savings}% savings)`)

            resolve(compressedFile)
          },
          'image/jpeg',
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      img.src = e.target?.result as string
    }

    reader.onerror = () => {
      reject(new Error('Failed to read file'))
    }

    reader.readAsDataURL(file)
  })
}

/**
 * Compress multiple images in parallel
 */
export async function compressImages(
  files: File[],
  options?: CompressionOptions
): Promise<File[]> {
  console.log(`📸 Compressing ${files.length} images...`)
  
  const compressionPromises = files.map(file => {
    // Only compress image files
    if (!file.type.startsWith('image/')) {
      return Promise.resolve(file)
    }
    return compressImage(file, options)
  })

  return Promise.all(compressionPromises)
}

/**
 * Get recommended compression settings based on use case
 */
export function getCompressionSettings(useCase: 'journal' | 'profile' | 'vision-board'): CompressionOptions {
  switch (useCase) {
    case 'journal':
      return {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 2
      }
    case 'profile':
      return {
        maxWidth: 800,
        maxHeight: 800,
        quality: 0.90,
        maxSizeMB: 0.5
      }
    case 'vision-board':
      return {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.90,
        maxSizeMB: 3
      }
    default:
      return {
        maxWidth: 1920,
        maxHeight: 1920,
        quality: 0.85,
        maxSizeMB: 2
      }
  }
}

