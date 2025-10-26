/**
 * Video Compression Wrapper
 * 
 * This file provides backward compatibility by re-exporting functions from
 * the proper video optimization implementation that uses ffmpeg.
 * 
 * For journal uploads, this ensures all videos are properly compressed
 * before being uploaded to S3, saving storage and bandwidth costs.
 */

export {
  compressVideo,
  shouldCompressVideo,
  getCompressionOptions,
  generateVideoThumbnail,
  getVideoMetadata,
  generateMultipleQualities
} from '@/lib/utils/videoOptimization'

export type {
  VideoCompressionOptions as CompressionOptions,
  CompressionResult
} from '@/lib/utils/videoOptimization'
