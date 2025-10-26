import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListBucketsCommand } from '@aws-sdk/client-s3'
import { MediaConvertClient, CreateJobCommand } from '@aws-sdk/client-mediaconvert'
import { optimizeImage, shouldOptimizeImage, getOptimalDimensions } from '@/lib/utils/imageOptimization'
import { compressVideo, shouldCompressVideo, getCompressionOptions } from '@/lib/utils/videoOptimization'

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

const mediaConvertClient = new MediaConvertClient({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
  endpoint: process.env.MEDIACONVERT_ENDPOINT, // Required for MediaConvert
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

    // Check if file needs optimization
    const needsImageOptimization = file.type.startsWith('image/') && shouldOptimizeImage(file)
    // Check if it's a large video that needs MediaConvert processing
    const needsVideoProcessing = file.type.startsWith('video/') && file.size > 20 * 1024 * 1024 // 20MB
    console.log('📹 Video processing check:', {
      isVideo: file.type.startsWith('video/'),
      fileSize: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
      needsProcessing: needsVideoProcessing,
      filename: file.name
    })
    const isAudioFile = file.type.startsWith('audio/')

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

    // Compress videos (smaller than MediaConvert threshold)
    if (shouldCompressVideo(file) && !needsVideoProcessing) {
      console.log(`Compressing video: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      try {
        const compressionOptions = getCompressionOptions(file)
        const compressionResult = await compressVideo(buffer, file.name, compressionOptions)
        
        buffer = Buffer.from(compressionResult.buffer)
        contentType = 'video/mp4' // Always output MP4 for better compatibility
        
        const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
        finalFilename = `${nameWithoutExt}-compressed.mp4`
        
        console.log(`Video compression completed. Original: ${(compressionResult.originalSize / 1024 / 1024).toFixed(2)}MB, Compressed: ${(compressionResult.compressedSize / 1024 / 1024).toFixed(2)}MB, Compression: ${compressionResult.compressionRatio.toFixed(1)}%`)
      } catch (compressionError) {
        console.error('Video compression failed:', compressionError)
        // Continue with original file if compression fails
      }
    }

    // For large videos, upload original and trigger MediaConvert job
    if (needsVideoProcessing) {
      console.log(`Large video detected: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB)`)
      
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

      // Trigger MediaConvert job
      try {
        console.log('🚀 Attempting to trigger MediaConvert job...')
        console.log('   Input S3 key:', s3Key)
        console.log('   User ID:', userId)
        console.log('   Folder:', folder)
        console.log('   MediaConvert Role ARN:', process.env.MEDIACONVERT_ROLE_ARN ? 'Set' : '⚠️ NOT SET')
        console.log('   MediaConvert Endpoint:', process.env.MEDIACONVERT_ENDPOINT ? 'Set' : '⚠️ NOT SET')
        
        const jobId = await triggerMediaConvertJob(s3Key, file.name, userId, folder)
        console.log(`✅ MediaConvert job triggered successfully! Job ID: ${jobId}`)
      } catch (mediaConvertError) {
        console.error('❌ MediaConvert job failed:', mediaConvertError)
        console.error('   Error details:', mediaConvertError instanceof Error ? mediaConvertError.message : String(mediaConvertError))
        // Continue with original file if MediaConvert fails
      }

      // Return immediate success with original URL
      const originalUrl = `https://media.vibrationfit.com/${s3Key}`
      
       return NextResponse.json({ 
         url: originalUrl, 
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
           'compressed': (shouldCompressVideo(file) && !needsVideoProcessing) ? 'true' : 'false',
           'processed': 'false',
           'original-size': file.size.toString(),
           'final-size': buffer.length.toString(),
           'file-type': contentType,
           'is-audio': isAudioFile ? 'true' : 'false',
           'is-video': file.type.startsWith('video/') ? 'true' : 'false'
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

// Trigger MediaConvert job for video processing
async function triggerMediaConvertJob(
  inputKey: string,
  filename: string,
  userId: string,
  folder: string
) {
  console.log('🎬 Creating MediaConvert job settings...')
  const jobSettings = {
    Role: process.env.MEDIACONVERT_ROLE_ARN!, // You'll need to set this
    Settings: {
      Inputs: [{
        FileInput: `s3://${BUCKET_NAME}/${inputKey}`,
        VideoSelector: {},
        AudioSelectors: {
          'Audio Selector 1': {
            DefaultSelection: 'DEFAULT'
          }
        }
      }],
      OutputGroups: [{
        Name: 'File Group',
        OutputGroupSettings: {
          Type: 'FILE_GROUP_SETTINGS',
          FileGroupSettings: {
            Destination: `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`
          }
        },
        Outputs: [{
          NameModifier: '-compressed',
          VideoDescription: {
            Width: 1920,
            Height: 1080,
            CodecSettings: {
              Codec: 'H_264',
              H264Settings: {
                Bitrate: 2000000, // 2Mbps
                RateControlMode: 'CBR',
                CodecProfile: 'MAIN',
                CodecLevel: 'LEVEL_4_1',
                MaxBitrate: 2500000,
                BufSize: 3000000
              }
            }
          },
          AudioDescriptions: [{
            CodecSettings: {
              Codec: 'AAC',
              AacSettings: {
                Bitrate: 128000,
                SampleRate: 48000,
                CodingMode: 'CODING_MODE_2_0'
              }
            }
          }],
          ContainerSettings: {
            Container: 'MP4',
            Mp4Settings: {
              CslgAtom: 'INCLUDE',
              FreeSpaceBox: 'EXCLUDE',
              MoovPlacement: 'PROGRESSIVE_DOWNLOAD'
            }
          }
        }]
      }]
    },
    Tags: {
      'user-id': userId,
      'folder': folder,
      'original-filename': filename
    }
  }

  console.log('🎬 Job settings created, sending to MediaConvert...')
  console.log('   Destination folder:', `s3://${BUCKET_NAME}/user-uploads/${userId}/${folder}/processed/`)
  
  try {
    const command = new CreateJobCommand(jobSettings as any)
    console.log('🎬 Sending CreateJobCommand to MediaConvert...')
    const response = await mediaConvertClient.send(command)
    
    console.log(`✅ MediaConvert job created successfully! Job ID: ${response.Job?.Id}`)
    console.log('   Status:', response.Job?.Status)
    console.log('   Created at:', response.Job?.CreatedAt)
    return response.Job?.Id
  } catch (error) {
    console.error('❌ MediaConvert job creation failed:', error)
    throw error
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
