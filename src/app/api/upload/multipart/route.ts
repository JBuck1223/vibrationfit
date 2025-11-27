import { NextRequest, NextResponse } from 'next/server'
import { S3Client, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createClient } from '@/lib/supabase/server'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || 'vibrationfit-media'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action, key, uploadId, parts, fileType, partNumber, totalParts } = body

    switch (action) {
      case 'create': {
        // Start multipart upload
        const command = new CreateMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          ContentType: fileType,
          Metadata: {
            userId: user.id,
            originalName: body.fileName || 'unknown',
          },
        })

        const response = await s3Client.send(command)
        
        return NextResponse.json({
          uploadId: response.UploadId,
          key: key,
        })
      }

      case 'getPartUrl': {
        // Get presigned URL for a specific part
        const command = new UploadPartCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          PartNumber: partNumber,
        })

        const presignedUrl = await getSignedUrl(s3Client, command, {
          expiresIn: 3600, // 1 hour
        })

        return NextResponse.json({ 
          presignedUrl,
          partNumber,
        })
      }

      case 'complete': {
        // Complete multipart upload
        const command = new CompleteMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
          MultipartUpload: {
            Parts: parts.map((part: any) => ({
              ETag: part.ETag,
              PartNumber: part.PartNumber,
            })),
          },
        })

        await s3Client.send(command)
        
        const finalUrl = `https://media.vibrationfit.com/${key}`
        
        return NextResponse.json({
          success: true,
          url: finalUrl,
          key: key,
        })
      }

      case 'abort': {
        // Abort multipart upload
        const command = new AbortMultipartUploadCommand({
          Bucket: BUCKET_NAME,
          Key: key,
          UploadId: uploadId,
        })

        await s3Client.send(command)
        
        return NextResponse.json({ success: true })
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Multipart upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    )
  }
}




