// Process the video using FFmpeg compression
import { compressVideo, getCompressionOptions } from './src/lib/utils/videoOptimization.js'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import fs from 'fs'
import path from 'path'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const inputKey = 'user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/1761408357222-h5zd1mep6le-oliver-test.mov'
const outputKey = 'user-uploads/720adebb-e6c0-4f6c-a5fc-164d128e083a/journal/uploads/processed/oliver-test-compressed.mp4'

async function processVideoWithFFmpeg() {
  try {
    console.log('🎬 Processing video with FFmpeg...')
    console.log('📁 Input:', `s3://${BUCKET_NAME}/${inputKey}`)
    console.log('📁 Output:', `s3://${BUCKET_NAME}/${outputKey}`)
    
    // Download video from S3
    console.log('⬇️ Downloading video from S3...')
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: inputKey
    })
    
    const response = await s3Client.send(getCommand)
    const videoBuffer = await response.Body.transformToByteArray()
    const buffer = Buffer.from(videoBuffer)
    
    console.log(`📊 Downloaded video: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)
    
    // Create a mock File object for compression
    const mockFile = {
      name: 'oliver-test.mov',
      size: buffer.length,
      type: 'video/quicktime'
    }
    
    // Compress video
    console.log('🗜️ Compressing video...')
    const compressionOptions = getCompressionOptions(mockFile)
    const compressionResult = await compressVideo(buffer, compressionOptions)
    
    console.log(`✅ Compression completed:`)
    console.log(`   Original: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Compressed: ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB`)
    console.log(`   Ratio: ${compressionResult.compressionRatio.toFixed(1)}%`)
    
    // Upload compressed video to S3
    console.log('⬆️ Uploading compressed video to S3...')
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: outputKey,
      Body: compressionResult.buffer,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'original-filename': 'oliver-test.mov',
        'processed': 'true',
        'compression-ratio': compressionResult.compressionRatio.toString(),
        'original-size': compressionResult.originalSize.toString(),
        'compressed-size': compressionResult.compressedSize.toString()
      }
    })
    
    await s3Client.send(putCommand)
    
    const outputUrl = `https://media.vibrationfit.com/${outputKey}`
    console.log('🎉 Video processing completed!')
    console.log('🔗 Compressed video URL:', outputUrl)
    
    return {
      success: true,
      outputUrl,
      originalSize: compressionResult.originalSize,
      compressedSize: compressionResult.compressedSize,
      compressionRatio: compressionResult.compressionRatio
    }
    
  } catch (error) {
    console.error('❌ Video processing failed:', error)
    throw error
  }
}

// Run the processing
processVideoWithFFmpeg()
  .then(result => {
    console.log('🎉 Success! Video processed and uploaded.')
    console.log('📊 Results:', result)
  })
  .catch(error => {
    console.error('💥 Failed to process video:', error.message)
    process.exit(1)
  })
