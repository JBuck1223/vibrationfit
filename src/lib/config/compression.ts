/**
 * Compression Configuration for S3 Uploads
 * 
 * This file centralizes all compression settings for different media types
 * used in journal and other uploads. Adjust these values to balance
 * quality vs. file size based on your needs.
 */

export const COMPRESSION_CONFIG = {
  // Image compression settings
  images: {
    /**
     * Threshold for when to optimize images (in bytes)
     * Images smaller than this won't be optimized
     */
    optimizationThreshold: 5 * 1024 * 1024, // 5MB
    
    /**
     * Default optimization settings
     */
    defaultSettings: {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 85,
      format: 'webp' as const,
      progressive: true
    },
    
    /**
     * Settings for different use cases
     */
    presets: {
      thumbnail: {
        maxWidth: 200,
        maxHeight: 200,
        quality: 80
      },
      card: {
        maxWidth: 400,
        maxHeight: 400,
        quality: 85
      },
      fullscreen: {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 90
      },
      hero: {
        maxWidth: 2560,
        maxHeight: 1440,
        quality: 95
      }
    }
  },
  
  // Video compression settings
  videos: {
    /**
     * Threshold for when to compress videos (in bytes)
     * Videos smaller than this won't be compressed
     */
    compressionThreshold: 20 * 1024 * 1024, // 20MB
    
    /**
     * Threshold for MediaConvert processing (for very large videos)
     */
    mediaConvertThreshold: 100 * 1024 * 1024, // 100MB
    
    /**
     * Default compression settings
     */
    defaultSettings: {
      quality: 70,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '4M',
      fps: 30,
      preset: 'medium' as const
    },
    
    /**
     * Compression settings based on file size
     */
    sizeBasedSettings: [
      {
        maxSizeMB: Infinity,
        minSizeMB: 500,
        settings: {
          quality: 50,
          maxWidth: 1920,
          maxHeight: 1080,
          bitrate: '2M',
          fps: 30,
          preset: 'fast' as const
        }
      },
      {
        maxSizeMB: 500,
        minSizeMB: 200,
        settings: {
          quality: 60,
          maxWidth: 1920,
          maxHeight: 1080,
          bitrate: '3M',
          fps: 30,
          preset: 'medium' as const
        }
      },
      {
        maxSizeMB: 200,
        minSizeMB: 100,
        settings: {
          quality: 70,
          maxWidth: 1920,
          maxHeight: 1080,
          bitrate: '4M',
          fps: 30,
          preset: 'medium' as const
        }
      },
      {
        maxSizeMB: 100,
        minSizeMB: 50,
        settings: {
          quality: 75,
          maxWidth: 1920,
          maxHeight: 1080,
          bitrate: '5M',
          fps: 30,
          preset: 'slow' as const
        }
      },
      {
        maxSizeMB: 50,
        minSizeMB: 20,
        settings: {
          quality: 80,
          maxWidth: 1920,
          maxHeight: 1080,
          bitrate: '6M',
          fps: 30,
          preset: 'slow' as const
        }
      }
    ]
  },
  
  // Audio compression settings
  audio: {
    /**
     * Audio files are typically uploaded without compression
     * as they're already compressed formats
     */
    uploadDirect: true,
    maxSize: 200 * 1024 * 1024 // 200MB
  }
} as const

/**
 * Helper functions to get compression settings
 */
export function getVideoCompressionSettings(fileSizeBytes: number) {
  const sizeMB = fileSizeBytes / (1024 * 1024)
  
  // Find appropriate settings based on file size
  for (const config of COMPRESSION_CONFIG.videos.sizeBasedSettings) {
    if (sizeMB >= config.minSizeMB && sizeMB < config.maxSizeMB) {
      return config.settings
    }
  }
  
  // Default settings for small files
  return COMPRESSION_CONFIG.videos.defaultSettings
}

export function shouldOptimizeImage(fileSize: number, fileType: string): boolean {
  const maxSize = COMPRESSION_CONFIG.images.optimizationThreshold
  const supportedFormats = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  
  return fileSize > maxSize || !supportedFormats.includes(fileType)
}

export function shouldCompressVideo(fileSize: number, fileType: string): boolean {
  const threshold = COMPRESSION_CONFIG.videos.compressionThreshold
  const supportedFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv']
  
  return fileSize > threshold && supportedFormats.includes(fileType)
}

export function shouldUseMediaConvert(fileSize: number): boolean {
  return fileSize > COMPRESSION_CONFIG.videos.mediaConvertThreshold
}

