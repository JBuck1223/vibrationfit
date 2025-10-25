import ffmpeg from 'fluent-ffmpeg'
import { PassThrough } from 'stream'
import fs from 'fs'
import path from 'path'
import os from 'os'

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
  const maxSize = 20 * 1024 * 1024 // 20MB - Lower threshold for compression
  const supportedFormats = ['video/mp4', 'video/mov', 'video/avi', 'video/webm', 'video/mkv']
  
  return file.size > maxSize && supportedFormats.includes(file.type)
}

/**
 * Get compression options based on file size and type
 */
export function getCompressionOptions(file: File): VideoCompressionOptions {
  const sizeMB = file.size / (1024 * 1024)
  
  if (sizeMB > 500) {
    // 4K+ videos - aggressive compression for web delivery
    return {
      quality: 50,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '2M',
      fps: 30,
      preset: 'fast'
    }
  } else if (sizeMB > 200) {
    // Large 4K videos - balanced compression
    return {
      quality: 60,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '3M',
      fps: 30,
      preset: 'medium'
    }
  } else if (sizeMB > 100) {
    // Medium 4K videos - moderate compression
    return {
      quality: 70,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '4M',
      fps: 30,
      preset: 'medium'
    }
  } else if (sizeMB > 50) {
    // Large HD videos - light compression
    return {
      quality: 75,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '5M',
      fps: 30,
      preset: 'slow'
    }
  } else if (sizeMB > 20) {
    // Medium HD videos - minimal compression
    return {
      quality: 80,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '6M',
      fps: 30,
      preset: 'slow'
    }
  } else {
    // Small videos - no compression needed
    return {
      quality: 85,
      maxWidth: 1920,
      maxHeight: 1080,
      bitrate: '8M',
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
    
    // Determine input format from filename
    const inputFormat = filename.toLowerCase().endsWith('.mov') ? 'mov' : 
                       filename.toLowerCase().endsWith('.mp4') ? 'mp4' : 
                       filename.toLowerCase().endsWith('.avi') ? 'avi' : 'mov'
    
    // Configure FFmpeg
    const command = ffmpeg()
      .input(inputStream)
      .inputFormat(inputFormat)
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
          bitrate: parseInt(String(metadata.format.bit_rate || '0')),
          fps: eval(videoStream.r_frame_rate || '0')
        })
      })
  })
}

/**
 * Generate multiple quality versions of a video
 */
export async function generateMultipleQualities(
  inputBuffer: Buffer,
  filename: string
): Promise<{
  '1080p': CompressionResult
  '720p': CompressionResult
  '480p': CompressionResult
}> {
  const qualities = {
    '1080p': { maxWidth: 1920, maxHeight: 1080, bitrate: '3M', quality: 60 },
    '720p': { maxWidth: 1280, maxHeight: 720, bitrate: '2M', quality: 50 },
    '480p': { maxWidth: 854, maxHeight: 480, bitrate: '1M', quality: 40 }
  }

  const results = await Promise.all(
    Object.entries(qualities).map(async ([quality, options]) => {
      const result = await compressVideo(inputBuffer, filename, {
        ...options,
        preset: 'fast',
        fps: 30
      })
      return [quality, result] as [string, CompressionResult]
    })
  )

  return {
    '1080p': results[0][1],
    '720p': results[1][1],
    '480p': results[2][1]
  }
}
