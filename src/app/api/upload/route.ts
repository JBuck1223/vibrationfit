import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand, DeleteObjectCommand, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand, ListBucketsCommand } from '@aws-sdk/client-s3'
import { compressVideo, shouldCompressVideo, getCompressionOptions } from '@/lib/video-compression'

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

    // Skip video compression for now to avoid build issues
    // if (shouldCompressVideo(file)) {
    //   console.log(`Compressing video: ${file.name}`)
    //   const compressionOptions = getCompressionOptions(file)
    //   buffer = await compressVideo(buffer as Buffer, file.name, compressionOptions) as Buffer
    //   
    //   // Update filename to indicate compression
    //   const nameWithoutExt = file.name.split('.').slice(0, -1).join('.')
    //   finalFilename = `${nameWithoutExt}-compressed.mp4`
    //   contentType = 'video/mp4'
    //   
    //   console.log(`Compression completed. New size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`)
    // }

    // Update S3 key with final filename
    const finalS3Key = `user-uploads/${userId}/${folder}/${timestamp}-${randomStr}-${finalFilename}`

    // Upload to S3
    console.log(`Attempting to upload to S3: ${BUCKET_NAME}/${finalS3Key}`)
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: finalS3Key,
      Body: buffer,
      ContentType: contentType,
      CacheControl: 'max-age=31536000',
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

    return NextResponse.json({ url, key: finalS3Key })
  } catch (error) {
    console.error('S3 upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}

// Multipart upload implementation
async function multipartUpload(
  s3Key: string,
  file: File
): Promise<{ url: string; key: string }> {
  // Initiate multipart upload
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

export async function DELETE(request: NextRequest) {
  try {
    const { s3Key } = await request.json()

    if (!s3Key) {
      return NextResponse.json({ error: 'Missing s3Key' }, { status: 400 })
    }

    const command = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: s3Key,
    })

    await s3Client.send(command)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('S3 delete error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Delete failed' },
      { status: 500 }
    )
  }
}
