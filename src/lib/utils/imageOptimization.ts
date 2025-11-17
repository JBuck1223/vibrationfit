import sharp from 'sharp'

export interface ImageOptimizationOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'webp' | 'jpeg' | 'png'
  progressive?: boolean
}

export interface OptimizedImageResult {
  buffer: Buffer
  contentType: string
  originalSize: number
  optimizedSize: number
  compressionRatio: number
}

/**
 * Optimize image for web delivery
 * Automatically converts to WebP for better compression
 */
export async function optimizeImage(
  inputBuffer: Buffer,
  options: ImageOptimizationOptions = {}
): Promise<OptimizedImageResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    format = 'webp',
    progressive = true
  } = options

  const originalSize = inputBuffer.length

  try {
    let pipeline = sharp(inputBuffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })

    // Apply format-specific optimizations
    switch (format) {
      case 'webp':
        pipeline = pipeline.webp({
          quality,
          effort: 6 // Higher effort for better compression
        })
        break
      case 'jpeg':
        pipeline = pipeline.jpeg({
          quality,
          progressive,
          mozjpeg: true // Use mozjpeg encoder for better compression
        })
        break
      case 'png':
        pipeline = pipeline.png({
          quality,
          progressive,
          compressionLevel: 9
        })
        break
    }

    const optimizedBuffer = await pipeline.toBuffer()
    const optimizedSize = optimizedBuffer.length
    const compressionRatio = ((originalSize - optimizedSize) / originalSize) * 100

    return {
      buffer: optimizedBuffer,
      contentType: `image/${format}`,
      originalSize,
      optimizedSize,
      compressionRatio
    }
  } catch (error) {
    console.error('Image optimization failed:', error)
    // Return original buffer if optimization fails
    return {
      buffer: inputBuffer,
      contentType: 'image/jpeg',
      originalSize,
      optimizedSize: originalSize,
      compressionRatio: 0
    }
  }
}

/**
 * Generate multiple sizes for responsive images
 */
export async function generateResponsiveImages(
  inputBuffer: Buffer,
  sizes: { width: number; height: number; suffix: string }[] = [
    { width: 400, height: 400, suffix: '-sm' },
    { width: 800, height: 800, suffix: '-md' },
    { width: 1200, height: 1200, suffix: '-lg' },
    { width: 1920, height: 1920, suffix: '-xl' }
  ]
): Promise<{ [key: string]: OptimizedImageResult }> {
  const results: { [key: string]: OptimizedImageResult } = {}

  for (const size of sizes) {
    try {
      const result = await optimizeImage(inputBuffer, {
        maxWidth: size.width,
        maxHeight: size.height,
        quality: 85,
        format: 'webp'
      })
      results[size.suffix] = result
    } catch (error) {
      console.error(`Failed to generate ${size.suffix} image:`, error)
    }
  }

  return results
}

/**
 * Create a blur placeholder for lazy loading
 */
export async function generateBlurPlaceholder(inputBuffer: Buffer): Promise<string> {
  try {
    const { data, info } = await sharp(inputBuffer)
      .resize(10, 10, { fit: 'inside' })
      .jpeg({ quality: 20 })
      .toBuffer({ resolveWithObject: true })

    return `data:image/jpeg;base64,${data.toString('base64')}`
  } catch (error) {
    console.error('Failed to generate blur placeholder:', error)
    // Return a generic blur placeholder
    return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwCdABmX/9k='
  }
}

/**
 * Generate a thumbnail version of an image
 */
export async function generateThumbnail(
  inputBuffer: Buffer,
  width: number = 400,
  height: number = 300
): Promise<Buffer> {
  try {
    const thumbnailBuffer = await sharp(inputBuffer)
      .resize(width, height, {
        fit: 'cover',
        position: 'center'
      })
      .webp({ quality: 80 })
      .toBuffer()
    
    return thumbnailBuffer
  } catch (error) {
    console.error('Thumbnail generation failed:', error)
    throw error
  }
}

/**
 * Check if image should be optimized based on size and format
 */
export function shouldOptimizeImage(file: File): boolean {
  // Optimize ALL images to ensure consistent quality and size
  // WebP conversion provides 30-50% size reduction even for small files
  const minSize = 100 * 1024 // 100KB - optimize anything larger than this
  const supportedFormats = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
  
  // Optimize if:
  // 1. File is larger than 100KB (almost all photos)
  // 2. File is not already in an optimized format
  // 3. File type is supported for optimization
  return file.size > minSize && supportedFormats.includes(file.type)
}

/**
 * Get optimal image dimensions for different use cases
 */
export function getOptimalDimensions(useCase: 'thumbnail' | 'card' | 'fullscreen' | 'hero'): ImageOptimizationOptions {
  switch (useCase) {
    case 'thumbnail':
      return { maxWidth: 200, maxHeight: 200, quality: 80 }
    case 'card':
      return { maxWidth: 400, maxHeight: 400, quality: 85 }
    case 'fullscreen':
      return { maxWidth: 1920, maxHeight: 1080, quality: 90 }
    case 'hero':
      return { maxWidth: 2560, maxHeight: 1440, quality: 95 }
    default:
      return { maxWidth: 800, maxHeight: 600, quality: 85 }
  }
}
