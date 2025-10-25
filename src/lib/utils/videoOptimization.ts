import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'

export interface VideoCompressionOptions {
  quality: number // 0-100
  maxWidth?: number
  maxHeight?: number
  bitrate?: string
  fps?: number
  preset?: 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
}

export interface CompressionResult {
  buffer: Buffer
  originalSize: number
  compressedSize: number
  compressionRatio: number
  duration: number
}

/**
 * Check if video should be compressed based on size and format
 */
export function shouldCompressVideo(file: File): boolean {
  const maxSize = 50 * 1024 * 1024 // 50MB
  const supportedFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/webm']
  
  return file.size > maxSize && supportedFormats.includes(file.type)
}

/**
 * Get compression options based on file size and type
 */
export function getCompressionOptions(file: File): VideoCompressionOptions {
  const sizeMB = file.size / (1024 * 1024)
  
  if (sizeMB > 100) {
    // Large files - aggressive compression
    return {
      quality: 60,
      maxWidth: 1280,
      maxHeight: 720,
      bitrate: '1M',
      fps: 30,
      preset: 'fast'
    }
  } else if (sizeMB > 50) {
    // Medium files - balanced compression
    return {
      quality: 75,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '2M',
      fps: 30,
      preset: 'medium'
    }
  } else {
    // Small files - light compression
    return {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '3M',
      fps: 30,
      preset: 'slow'
    }
  }
}

/**
 * Compress video using FFmpeg
 */
export async function compressVideo(
  inputBuffer: Buffer,
  filename: string,
  options: VideoCompressionOptions
): Promise<CompressionResult> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    const outputStream = new PassThrough()
    const chunks: Buffer[] = []
    
    // Collect output chunks
    outputStream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    outputStream.on('end', () => {
      const compressedBuffer = Buffer.concat(chunks)
      const compressionRatio = ((inputBuffer.length - compressedBuffer.length) / inputBuffer.length) * 100
      
      resolve({
        buffer: compressedBuffer,
        originalSize: inputBuffer.length,
        compressedSize: compressedBuffer.length,
        compressionRatio,
        duration: 0 // Duration would need to be extracted separately
      })
    })
    
    outputStream.on('error', reject)
    
    // Write input buffer to stream
    inputStream.write(inputBuffer)
    inputStream.end()
    
    // Configure FFmpeg
    const command = ffmpeg()
      .input(inputStream)
      .outputOptions([
        '-c:v libx264',
        '-preset', options.preset || 'medium',
        '-crf', options.quality.toString(),
        '-maxrate', options.bitrate || '2M',
        '-bufsize', options.bitrate ? `${parseInt(options.bitrate) * 2}M` : '4M',
        '-vf', `scale=${options.maxWidth || 1920}:${options.maxHeight || 1080}`,
        '-r', (options.fps || 30).toString(),
        '-c:a aac',
        '-b:a 128k',
        '-movflags +faststart', // Enable progressive download
        '-f mp4'
      ])
      .output(outputStream)
      .on('error', (err) => {
        console.error('FFmpeg error:', err)
        reject(err)
      })
      .on('end', () => {
        console.log('Video compression completed')
      })
    
    // Start compression
    command.run()
  })
}

/**
 * Generate video thumbnail
 */
export async function generateVideoThumbnail(
  inputBuffer: Buffer,
  timestamp: number = 1
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    const outputStream = new PassThrough()
    const chunks: Buffer[] = []
    
    outputStream.on('data', (chunk) => {
      chunks.push(chunk)
    })
    
    outputStream.on('end', () => {
      resolve(Buffer.concat(chunks))
    })
    
    outputStream.on('error', reject)
    
    inputStream.write(inputBuffer)
    inputStream.end()
    
    ffmpeg()
      .input(inputStream)
      .seekInput(timestamp)
      .outputOptions([
        '-vframes 1',
        '-q:v 2',
        '-f image2'
      ])
      .output(outputStream)
      .on('error', reject)
      .run()
  })
}

/**
 * Get video metadata
 */
export async function getVideoMetadata(inputBuffer: Buffer): Promise<{
  duration: number
  width: number
  height: number
  bitrate: number
  fps: number
}> {
  return new Promise((resolve, reject) => {
    const inputStream = new PassThrough()
    inputStream.write(inputBuffer)
    inputStream.end()
    
    ffmpeg()
      .input(inputStream)
      .ffprobe((err, metadata) => {
        if (err) {
          reject(err)
          return
        }
        
        const videoStream = metadata.streams.find(s => s.codec_type === 'video')
        if (!videoStream) {
          reject(new Error('No video stream found'))
          return
        }
        
        resolve({
          duration: metadata.format.duration || 0,
          width: videoStream.width || 0,
          height: videoStream.height || 0,
          bitrate: parseInt(metadata.format.bit_rate || '0'),
          fps: eval(videoStream.r_frame_rate || '0')
        })
      })
  })
}
