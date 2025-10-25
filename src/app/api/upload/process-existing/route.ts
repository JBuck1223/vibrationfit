// /src/app/api/upload/process-existing/route.ts
// API endpoint to process existing S3 files

import { NextRequest, NextResponse } from 'next/server'
import { S3Client, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { compressVideo, getCompressionOptions, generateMultipleQualities } from '@/lib/utils/videoOptimization'

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
    let qualityVersions: Record<string, string> = {}

    if (mockFile.type.startsWith('video/')) {
      console.log('🗜️ Generating multiple quality versions...')
      try {
        const qualities = await generateMultipleQualities(buffer, filename)
        
        // Upload each quality version
        for (const [quality, result] of Object.entries(qualities)) {
          const qualityFilename = filename.replace(/\.[^/.]+$/, '') + `-${quality}.mp4`
          const qualityKey = `user-uploads/${userId}/${folder}/processed/${qualityFilename}`
          
          console.log(`📤 Uploading ${quality} version: ${(result.compressedSize / 1024 / 1024).toFixed(2)}MB`)
          
          const putCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: qualityKey,
            Body: result.buffer,
            ContentType: 'video/mp4',
            CacheControl: 'public, max-age=31536000, immutable',
            Metadata: {
              'original-filename': filename,
              'quality': quality,
              'compression-ratio': result.compressionRatio.toString(),
              'original-size': result.originalSize.toString(),
              'compressed-size': result.compressedSize.toString(),
              'file-type': 'video/mp4'
            }
          })
          
          await s3Client.send(putCommand)
          qualityVersions[quality] = `https://media.vibrationfit.com/${qualityKey}`
        }
        
        // Use 720p as the default processed version
        processedBuffer = Buffer.from(qualities['720p'].buffer)
        contentType = 'video/mp4'
        outputFilename = filename.replace(/\.[^/.]+$/, '') + '-720p.mp4'
        compressionRatio = qualities['720p'].compressionRatio
        
        console.log(`✅ Multiple quality versions generated:`)
        console.log(`   1080p: ${(qualities['1080p'].compressedSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`   720p: ${(qualities['720p'].compressedSize / 1024 / 1024).toFixed(2)}MB`)
        console.log(`   480p: ${(qualities['480p'].compressedSize / 1024 / 1024).toFixed(2)}MB`)
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
      filename: outputFilename,
      qualityVersions
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
