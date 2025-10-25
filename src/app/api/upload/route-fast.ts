import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListBucketsCommand } from '@aws-sdk/client-s3'
import { compressVideo, shouldCompressVideo, getCompressionOptions } from '@/lib/video-compression'
import { CompressionResult } from '@/lib/utils/videoOptimization'
import { optimizeImage, shouldOptimizeImage, getOptimalDimensions } from '@/lib/utils/imageOptimization'

// Configure runtime for large file uploads
export const runtime = 'nodejs'
export const maxDuration = 300 // 5 minutes for large uploads

// Check for required AWS credentials
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
  console.error('AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local')
}

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  maxAttempts: 3,
  requestHandler: {
    requestTimeout: 30000, // 30 seconds
    connectionTimeout: 10000, // 10 seconds
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const MULTIPART_THRESHOLD = 50 * 1024 * 1024 // 50MB
const CHUNK_SIZE = 10 * 1024 * 1024 // 10MB chunks

export async function POST(request: NextRequest) {
  try {
    // Check AWS credentials first
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured')
      return NextResponse.json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local' 
      }, { status: 500 })
    }

    console.log('AWS credentials found, proceeding with upload...')

    // Test S3 connectivity first
    try {
      const testCommand = new ListBucketsCommand({})
      await s3Client.send(testCommand)
      console.log('S3 connectivity test passed')
    } catch (connectivityError) {
      console.error('S3 connectivity test failed:', connectivityError)
      return NextResponse.json({ 
        error: `S3 connectivity issue: ${connectivityError instanceof Error ? connectivityError.message : 'Unknown error'}` 
      }, { status: 503 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const folder = formData.get('folder') as string
    const userId = formData.get('userId') as string

    const useMultipart = formData.get('multipart') === 'true'

    if (!file || !folder || !userId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 15)
    const extension = file.name.split('.').pop()
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase()
    
    const s3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${sanitizedName}`

    console.log(`Starting upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Use multipart upload for large files
    if (file.size > MULTIPART_THRESHOLD || useMultipart) {
      console.log(`Using multipart upload for ${file.name}`)
      const result = await multipartUpload(s3Key, file)
      return NextResponse.json(result)
    }

    // Regular upload for smaller files
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let contentType = file.type
    let finalFilename = sanitizedName

    // Check if file needs compression/optimization
    const needsImageOptimization = file.type.startsWith('image/') && shouldOptimizeImage(file)
    const needsVideoCompression = file.type.startsWith('video/') && shouldCompressVideo(file)

    if (needsImageOptimization) {
      console.log(`Optimizing image: ${file.name}`)
      const optimizationOptions = getOptimalDimensions('card')
      const optimizedResult = await optimizeImage(buffer, optimizationOptions)
      
      buffer = Buffer.from(optimizedResult.buffer)
      contentType = optimizedResult.contentType
      
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
      finalFilename = `${nameWithoutExt}-optimized.webp`
      
      console.log(`Image optimization completed. Original: ${(optimizedResult.originalSize / 1024 / 1024).toFixed(2)}MB, Optimized: ${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB, Compression: ${optimizedResult.compressionRatio.toFixed(1)}%`)
    }

    // For videos, upload original immediately and compress in background
    if (needsVideoCompression) {
      console.log(`Large video detected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Upload original video immediately
      const originalS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${sanitizedName}`
      const originalCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: originalS3Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=3600', // Short cache for original
        Metadata: {
          'original-filename': file.name,
          'upload-timestamp': timestamp.toString(),
          'compressed': 'false',
          'original-size': file.size.toString(),
          'file-type': file.type,
          'status': 'pending-compression'
        }
      })

      await s3Client.send(originalCommand)
      console.log(`Original video uploaded: ${originalS3Key}`)

      // Return immediate success with original URL
      const originalUrl = `https://media.vibrationfit.com/${originalS3Key}`
      
      // Start background compression (don't await)
      compressVideoInBackground(buffer, file.name, originalS3Key, userId, folder, timestamp, randomStr)
        .catch(error => {
          console.error('Background compression failed:', error)
        })

      return NextResponse.json({ 
        url: originalUrl, 
        key: originalS3Key,
        status: 'uploaded',
        compression: 'pending',
        message: 'Video uploaded successfully! Compression in progress...'
      })
    }

    // Update S3 key with final filename
    const finalS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${finalFilename}`

    // Upload to S3
    console.log(`Attempting to upload to S3: ${BUCKET_NAME}/${finalS3Key}`)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: finalS3Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
      ContentEncoding: contentType.includes('image') ? 'gzip' : undefined, // Enable gzip for images
      Metadata: {
        'original-filename': file.name,
        'upload-timestamp': timestamp.toString(),
        'optimized': needsImageOptimization ? 'true' : 'false',
        'compressed': 'false',
        'original-size': file.size.toString(),
        'file-type': file.type
      }
    })

    try {
      await s3Client.send(command)
      console.log(`Upload completed for ${file.name}`)
    } catch (s3Error) {
      console.error('S3 upload command failed:', s3Error)
      throw new Error(`S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`)
    }

    // Return CDN URL
    const url = `https://media.vibrationfit.com/${finalS3Key}`

    return NextResponse.json({ 
      url, 
      key: finalS3Key,
      status: 'completed',
      compression: 'none'
    })
  } catch (error) {
    console.error('S3 upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// Background video compression function
async function compressVideoInBackground(
  inputBuffer: Buffer,
  filename: string,
  originalS3Key: string,
  userId: string,
  folder: string,
  timestamp: number,
  randomStr: string
) {
  try {
    console.log(`Starting background compression for: ${filename}`)
    
    const compressionOptions = getCompressionOptions({ 
      name: filename, 
      size: inputBuffer.length, 
      type: 'video/mp4' 
    } as File)
    
    const compressionResult = await compressVideo(inputBuffer, filename, compressionOptions)
    
    // Since compressVideo currently just returns the original buffer, we need to handle this
    const compressedBuffer = compressionResult
    const originalSize = inputBuffer.length
    const compressedSize = compressedBuffer.length
    const compressionRatio = originalSize > 0 ? (compressedSize / originalSize) * 100 : 100
    
    // Upload compressed version
    const compressedS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${filename.split('.').slice(0, -1).join('.')}-compressed.mp4`
    
    const compressedCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: compressedS3Key,
      Body: Buffer.from(compressedBuffer),
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=31536000, immutable', // Long cache for compressed
      Metadata: {
        'original-filename': filename,
        'upload-timestamp': timestamp.toString(),
        'compressed': 'true',
        'original-size': originalSize.toString(),
        'compressed-size': compressedSize.toString(),
        'compression-ratio': compressionRatio.toString(),
        'file-type': 'video/mp4',
        'status': 'compressed'
      }
    })

    await s3Client.send(compressedCommand)
    console.log(`Compressed video uploaded: ${compressedS3Key}`)

    // Update original file metadata to point to compressed version
    const updateCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalS3Key,
      Body: inputBuffer, // Keep original body
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=3600', // Short cache for original
      Metadata: {
        'original-filename': filename,
        'upload-timestamp': timestamp.toString(),
        'compressed': 'true',
        'compressed-key': compressedS3Key,
        'compressed-url': `https://media.vibrationfit.com/${compressedS3Key}`,
        'original-size': originalSize.toString(),
        'compressed-size': compressedSize.toString(),
        'compression-ratio': compressionRatio.toString(),
        'file-type': 'video/mp4',
        'status': 'compressed'
      }
    })

    await s3Client.send(updateCommand)
    console.log(`Background compression completed for: ${filename}. Compression ratio: ${compressionRatio.toFixed(1)}%`)

  } catch (error) {
    console.error(`Background compression failed for ${filename}:`, error)
    
    // Update metadata to indicate compression failed
    const errorCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: originalS3Key,
      Body: inputBuffer,
      ContentType: 'video/mp4',
      CacheControl: 'public, max-age=3600',
      Metadata: {
        'original-filename': filename,
        'upload-timestamp': timestamp.toString(),
        'compressed': 'false',
        'original-size': inputBuffer.length.toString(),
        'file-type': 'video/mp4',
        'status': 'compression-failed',
        'error': error instanceof Error ? error.message : 'Unknown error'
      }
    })

    await s3Client.send(errorCommand)
  }
}

// Multipart upload implementation
async function multipartUpload(
  s3Key: string,
  file: File
): Promise<{ url: string; key: string }> {
  
  const createCommand = new CreateMultipartUploadCommand({
    Bucket: BUCKET_NAME,
    Key: s3Key,
    ContentType: file.type,
    CacheControl: 'max-age=31536000',
  })

  const { UploadId } = await s3Client.send(createCommand)
  if (!UploadId) throw new Error('Failed to initiate multipart upload')

  try {
    const parts: { ETag: string; PartNumber: number }[] = []
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE)
    let uploadedBytes = 0

    console.log(`Uploading ${totalChunks} chunks for ${file.name}`)

    // Upload each chunk
    for (let i = 0; i < totalChunks; i++) {
      const start = i * CHUNK_SIZE
      const end = Math.min(start + CHUNK_SIZE, file.size)
      const chunk = file.slice(start, end)
      
      const arrayBuffer = await chunk.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)

      const uploadCommand = new UploadPartCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        UploadId: UploadId,
        PartNumber: i + 1,
        Body: buffer,
      })

      const { ETag } = await s3Client.send(uploadCommand)
      if (!ETag) throw new Error(`Failed to upload part ${i + 1}`)

      parts.push({ ETag, PartNumber: i + 1 })
      
      uploadedBytes += (end - start)
      console.log(`Uploaded chunk ${i + 1}/${totalChunks} (${Math.round((uploadedBytes / file.size) * 100)}%)`)
    }

    // Complete multipart upload
    const completeCommand = new CompleteMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      UploadId: UploadId,
      MultipartUpload: { Parts: parts },
    })

    await s3Client.send(completeCommand)
    console.log(`Multipart upload completed for ${file.name}`)

    const url = `https://media.vibrationfit.com/${s3Key}`
    return { url, key: s3Key }

  } catch (error) {
    // Abort multipart upload on error
    const abortCommand = new AbortMultipartUploadCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
      UploadId: UploadId,
    })

    await s3Client.send(abortCommand)
    throw error
  }
}
