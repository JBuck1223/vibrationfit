// /src/app/api/upload/process-existing/route.ts
// API endpoint to process existing S3 files

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { compressVideo, getCompressionOptions } from '@/lib/utils/videoOptimization'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { inputKey, filename, userId, folder } = body
    
    if (!inputKey || !filename || !userId || !folder) {
      return NextResponse.json(
        { error: 'Missing required fields: inputKey, filename, userId, folder' },
        { status: 400 }
      )
    }

    console.log('🎬 Processing existing S3 file:', {
      inputKey,
      filename,
      userId,
      folder
    })

    // Download file from S3
    console.log('⬇️ Downloading file from S3...')
    const getCommand = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: inputKey
    })
    
    const response = await s3Client.send(getCommand)
    const fileBuffer = await response.Body.transformToByteArray()
    const buffer = Buffer.from(fileBuffer)
    
    console.log(`📊 Downloaded file: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)

    // Create mock File object for compression
    const mockFile = {
      name: filename,
      size: buffer.length,
      type: response.ContentType || 'video/quicktime'
    }

    // Compress video if it's a video file
    let processedBuffer = buffer
    let outputFilename = filename
    let contentType = response.ContentType || 'video/quicktime'
    let compressionRatio = 0

    if (mockFile.type.startsWith('video/')) {
      console.log('🗜️ Compressing video...')
      try {
        const compressionOptions = getCompressionOptions(mockFile)
        const compressionResult = await compressVideo(buffer, compressionOptions)
        
        processedBuffer = Buffer.from(compressionResult.buffer)
        contentType = 'video/mp4'
        outputFilename = filename.replace(/\.[^/.]+$/, '') + '-compressed.mp4'
        compressionRatio = compressionResult.compressionRatio
        
        console.log(`✅ Video compression completed:`)
        console.log(`   Original: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`   Compressed: ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`   Ratio: ${compressionResult.compressionRatio.toFixed(1)}%`)
      } catch (compressionError) {
        console.error('⚠️ Video compression failed, using original:', compressionError)
        // Continue with original file
      }
    }

    // Upload processed file to S3
    const outputKey = `user-uploads/${userId}/${folder}/processed/${outputFilename}`
    console.log('⬆️ Uploading processed file to S3...')
    
    const putCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: outputKey,
      Body: processedBuffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        'original-filename': filename,
        'processed': 'true',
        'compression-ratio': compressionRatio.toString(),
        'original-size': buffer.length.toString(),
        'processed-size': processedBuffer.length.toString(),
        'file-type': contentType
      }
    })
    
    await s3Client.send(putCommand)
    
    const outputUrl = `https://media.vibrationfit.com/${outputKey}`
    console.log('🎉 File processing completed!')
    console.log('🔗 Processed file URL:', outputUrl)

    return NextResponse.json({
      success: true,
      outputUrl,
      outputKey,
      originalSize: buffer.length,
      processedSize: processedBuffer.length,
      compressionRatio,
      contentType,
      filename: outputFilename
    })

  } catch (error) {
    console.error('❌ File processing failed:', error)
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'File processing failed',
        details: error
      },
      { status: 500 }
    )
  }
}
