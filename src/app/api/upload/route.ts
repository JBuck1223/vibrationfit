import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListBucketsCommand } from '@aws-sdk/client-s3'
import { optimizeImage, shouldOptimizeImage, getOptimalDimensions, generateThumbnail } from '@/lib/utils/imageOptimization'
import { generateVideoThumbnail } from '@/lib/utils/videoOptimization'

// Note: MediaConvert is triggered automatically via AWS Lambda when files land in S3
// No client-side MediaConvert triggers needed

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

    // Log credential info (masked for security)
    const keyId = process.env.AWS_ACCESS_KEY_ID!
    console.log('AWS Config:', {
      keyIdPrefix: keyId.substring(0, 8) + '...',
      keyIdLength: keyId.length,
      secretLength: process.env.AWS_SECRET_ACCESS_KEY!.length,
      region: process.env.AWS_REGION || 'us-east-2',
      hasWhitespace: keyId !== keyId.trim() || process.env.AWS_SECRET_ACCESS_KEY !== process.env.AWS_SECRET_ACCESS_KEY!.trim()
    })

    // Test S3 connectivity first
    try {
      const testCommand = new ListBucketsCommand({})
      const result = await s3Client.send(testCommand)
      console.log('✅ S3 connectivity test passed')
      console.log('Available buckets:', result.Buckets?.map(b => b.Name).join(', '))
      
      // Check if our specific bucket exists
      const hasBucket = result.Buckets?.some(b => b.Name === BUCKET_NAME)
      if (!hasBucket) {
        console.warn(`⚠️ Bucket "${BUCKET_NAME}" not found in account. Available:`, result.Buckets?.map(b => b.Name))
      }
    } catch (connectivityError: any) {
      console.error('❌ S3 connectivity test failed:', {
        message: connectivityError.message,
        code: connectivityError.Code || connectivityError.code,
        statusCode: connectivityError.$metadata?.httpStatusCode,
        requestId: connectivityError.$metadata?.requestId
      })
      
      // Provide more helpful error messages
      let helpfulMessage = connectivityError.message
      if (connectivityError.code === 'SignatureDoesNotMatch') {
        helpfulMessage += '\n\nPossible causes:\n' +
          '1. AWS credentials are incorrect or expired\n' +
          '2. Check your AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local\n' +
          '3. Make sure there are no extra spaces or quotes\n' +
          '4. Verify the credentials are for the correct AWS account'
      }
      
      return NextResponse.json({ 
        error: `S3 connectivity issue: ${helpfulMessage}` 
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
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9.]/g, '-').toLowerCase()
    
    const s3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${sanitizedName}`

    console.log(`Starting upload for ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)

    // Check if this is a video file (by MIME type or extension for mobile compatibility)
    const extension = file.name.split('.').pop()?.toLowerCase() || ''
    const videoExtensions = ['mp4', 'mov', 'webm', 'avi', 'm4v', '3gp', '3g2']
    const isVideoFile = file.type.startsWith('video/') || videoExtensions.includes(extension)
    
    console.log('🔍 Upload decision:', {
      fileType: file.type || '(empty)',
      extension: extension,
      isVideo: isVideoFile,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      useMultipart: file.size > MULTIPART_THRESHOLD || useMultipart
    })
    
    // Use multipart upload for large files (including videos!)
    // Use multipart upload for large files
    // MediaConvert is triggered automatically via AWS Lambda when file lands in S3
    if (file.size > MULTIPART_THRESHOLD || useMultipart) {
      console.log(`🚀 Using multipart upload for ${file.name}`)
      const result = await multipartUpload(s3Key, file)
      
      if (isVideoFile) {
        return NextResponse.json({
          ...result,
          processing: 'pending',
          message: 'Video uploaded successfully! Processing will start automatically.'
        })
      }
      
      return NextResponse.json(result)
    }

    // Regular upload for smaller files
    const arrayBuffer = await file.arrayBuffer()
    let buffer = Buffer.from(arrayBuffer)
    let contentType = file.type
    let finalFilename = sanitizedName
    let thumbnailUrl: string | null = null

    // Check if file needs optimization
    const needsImageOptimization = file.type.startsWith('image/') && shouldOptimizeImage(file)
    // Videos are uploaded as-is, MediaConvert processes them via AWS Lambda
    const needsVideoProcessing = isVideoFile
    console.log('📹 Video upload:', {
      isVideo: isVideoFile,
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      processingStrategy: 'AWS Lambda triggers MediaConvert automatically',
      filename: file.name
    })
    const audioExtensions = ['mp3', 'wav', 'ogg', 'webm', 'm4a', 'aac']
    const isAudioFile = file.type.startsWith('audio/') || audioExtensions.includes(extension)

    if (needsImageOptimization) {
      console.log(`Optimizing image: ${file.name} for folder: ${folder}`)
      
      // Choose optimization level based on use case
      const optimizationLevel = (() => {
        if (folder.includes('journal')) return 'fullscreen' // High quality for journal images
        if (folder.includes('vision')) return 'fullscreen' // High quality for vision boards
        if (folder.includes('profile')) return 'card' // Smaller for profile pics
        return 'fullscreen' // Default to high quality
      })()
      
      console.log(`Using optimization level: ${optimizationLevel}`)
      const optimizationOptions = getOptimalDimensions(optimizationLevel as 'thumbnail' | 'card' | 'fullscreen' | 'hero')
      const optimizedResult = await optimizeImage(buffer, optimizationOptions)
      
      buffer = Buffer.from(optimizedResult.buffer)
      contentType = optimizedResult.contentType
      
      const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
      finalFilename = `${nameWithoutExt}-optimized.webp`
      
      console.log(`Image optimization completed. Original: ${(optimizedResult.originalSize / 1024 / 1024).toFixed(2)}MB, Optimized: ${(optimizedResult.optimizedSize / 1024 / 1024).toFixed(2)}MB, Compression: ${optimizedResult.compressionRatio.toFixed(1)}%`)
    }

    // For all videos, upload original and trigger MediaConvert job
    if (needsVideoProcessing) {
      console.log(`Video detected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
      // Upload original video immediately
      const originalCommand = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: s3Key,
        Body: buffer,
        ContentType: contentType,
        CacheControl: 'public, max-age=3600', // Short cache for original
        Metadata: {
          'original-filename': file.name,
          'upload-timestamp': timestamp.toString(),
          'processed': 'false',
          'original-size': file.size.toString(),
          'file-type': file.type,
          'status': 'pending-processing'
        }
      })

      await s3Client.send(originalCommand)
      console.log(`Original video uploaded: ${s3Key}`)

      // Generate video thumbnail
      try {
        console.log('🎬 Generating video thumbnail for large video...')
        const thumbnailBuffer = await generateVideoThumbnail(buffer, file.name)
        
        if (thumbnailBuffer) {
          const thumbKey = s3Key.replace(/\.(mp4|mov|webm|avi)$/i, '-thumb.jpg')
          const thumbCommand = new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: thumbKey,
            Body: thumbnailBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000, immutable',
            Metadata: {
              'original-filename': file.name,
              'upload-timestamp': timestamp.toString(),
              'is-thumbnail': 'true',
              'original-s3-key': s3Key
            }
          })
          
          await s3Client.send(thumbCommand)
          thumbnailUrl = `https://media.vibrationfit.com/${thumbKey}`
          console.log(`✅ Video thumbnail uploaded: ${thumbKey}`)
        } else {
          console.log('⚠️ Thumbnail generation returned null, skipping upload')
        }
      } catch (thumbError) {
        console.error('⚠️ Video thumbnail generation failed:', thumbError)
      }

      // MediaConvert is triggered automatically via AWS Lambda when file lands in S3
      // Return immediate success with original URL
      const originalUrl = `https://media.vibrationfit.com/${s3Key}`
      
       return NextResponse.json({ 
         url: originalUrl,
         thumbnailUrl,
         key: s3Key,
         status: 'uploaded',
         processing: 'pending',
         message: 'Video uploaded successfully! Processing in progress...'
       })
     }

     // Handle audio files - upload directly without processing
     if (isAudioFile) {
       console.log(`Uploading audio file: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
       
       // Update S3 key with final filename for audio
       const finalS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${finalFilename}`
       
       const audioCommand = new PutObjectCommand({
         Bucket: BUCKET_NAME,
         Key: finalS3Key,
         Body: buffer,
         ContentType: contentType,
         CacheControl: 'public, max-age=31536000', // 1 year cache for audio
         Metadata: {
           'original-filename': file.name,
           'upload-timestamp': timestamp.toString(),
           'processed': 'false',
           'original-size': file.size.toString(),
           'final-size': buffer.length.toString(),
           'file-type': contentType
         }
       })

       await s3Client.send(audioCommand)
       console.log(`Audio file uploaded successfully: ${finalS3Key}`)

       const audioUrl = `https://media.vibrationfit.com/${finalS3Key}`
       
       return NextResponse.json({ 
         url: audioUrl, 
         key: finalS3Key,
         status: 'completed',
         processing: 'none',
         originalSize: file.size,
         finalSize: buffer.length
       })
     }

    // Update S3 key with final filename
    const finalS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${finalFilename}`

    // Upload optimized file to S3
    console.log(`Uploading optimized file to S3: ${BUCKET_NAME}/${finalS3Key}`)
    console.log(`AWS Region: ${process.env.AWS_REGION}`)
    console.log(`AWS Credentials present: ${!!process.env.AWS_ACCESS_KEY_ID}`)
    
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: finalS3Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable', // 1 year cache
      ContentEncoding: undefined, // Don't add gzip compression - images are already compressed
         Metadata: {
           'original-filename': file.name,
           'upload-timestamp': timestamp.toString(),
           'optimized': needsImageOptimization ? 'true' : 'false',
           'compressed': 'false',
           'processed': 'false',
           'original-size': file.size.toString(),
           'final-size': buffer.length.toString(),
           'file-type': contentType,
           'is-audio': isAudioFile ? 'true' : 'false',
           'is-video': file.type.startsWith('video/') ? 'true' : 'false'
         }
    })

    try {
      console.log(`Sending PutObjectCommand to S3...`)
      const result = await s3Client.send(command)
      console.log(`Upload completed for ${file.name}`, result)
    } catch (s3Error) {
      console.error('S3 upload command failed:', s3Error)
      console.error('Error details:', JSON.stringify(s3Error, null, 2))
      throw new Error(`S3 upload failed: ${s3Error instanceof Error ? s3Error.message : 'Unknown error'}`)
    }

    // Skip thumbnail generation - Next.js Image component handles resizing on-demand
    // This saves storage space and upload time. CloudFront/CDN handles caching.
    console.log('✅ Image uploaded, will be resized on-demand by Next.js Image component')

    // Return CDN URL
    const url = `https://media.vibrationfit.com/${finalS3Key}`

    return NextResponse.json({ 
      url, 
      thumbnailUrl,
      key: finalS3Key,
      status: 'completed',
      processing: 'none',
      originalSize: file.size,
      finalSize: buffer.length
    })
  } catch (error) {
    console.error('S3 upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// DELETE handler to delete files from S3
export async function DELETE(request: NextRequest) {
  try {
    const { s3Key } = await request.json()

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing s3Key' }, { status: 400 })
    }

    console.log(`🗑️  Deleting file: ${s3Key}`)

    // Delete the file from S3
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    await s3Client.send(deleteCommand)
    console.log(`✅ File deleted successfully: ${s3Key}`)

    return NextResponse.json({ 
      success: true,
      message: 'File deleted successfully',
      deletedKey: s3Key
    })
  } catch (error) {
    console.error('S3 delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}

// Note: MediaConvert is triggered automatically via AWS Lambda when files land in S3
// The triggerMediaConvertJob function has been removed - AWS handles this

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
