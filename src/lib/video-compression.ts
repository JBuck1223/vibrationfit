import { promisify } from 'util'
import { writeFile, unlink } from 'fs/promises'
import { join } from 'path'
import { tmpdir } from 'os'

export interface CompressionOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number // 1-31, lower = better quality
  maxSizeMB?: number
}

export async function compressVideo(
  inputBuffer: Buffer,
  filename: string,
  options: CompressionOptions = {}
): Promise<Buffer> {
  // For now, return the original buffer without compression
  // This prevents errors if FFmpeg is not installed
  console.log('Video compression not available - FFmpeg not installed')
  return inputBuffer
}

export function shouldCompressVideo(file: File): boolean {
  // Only compress videos larger than 50MB for now
  return file.type.startsWith('video/') && file.size > 50 * 1024 * 1024
}

export function getCompressionOptions(file: File): CompressionOptions {
  const sizeMB = file.size / (1024 * 1024)
  
  if (sizeMB > 200) {
    return {
      maxWidth: 1280,
      maxHeight: 720,
      quality: 28,
      maxSizeMB: 50
    }
  } else if (sizeMB > 100) {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 25,
      maxSizeMB: 30
    }
  } else {
    return {
      maxWidth: 1920,
      maxHeight: 1080,
      quality: 23,
      maxSizeMB: 20
    }
  }
}
