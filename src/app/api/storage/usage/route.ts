// /src/app/api/storage/usage/route.ts
// API route for fetching user's storage usage across all folders

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // List all files in user's folder using AWS SDK
    // Files are organized: user-uploads/userId/folder/filename
    const prefix = `user-uploads/${user.id}/`
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
    })

    const response = await s3Client.send(command)
    const allFiles = response.Contents || []

    console.log(`📁 S3 Storage: Found ${allFiles.length} files for user ${user.id}`)

    // Calculate storage by folder type
    const storageByType = allFiles.reduce((acc: any, file: any) => {
      if (!file.Key) return acc
      
      // Extract folder from path (user-uploads/userId/folder/file.ext)
      const pathParts = file.Key.split('/')
      const folder = pathParts[2] || 'other' // Index 2 for folder after user-uploads/userId
      
      if (!acc[folder]) {
        acc[folder] = {
          count: 0,
          totalSize: 0,
          files: [],
        }
      }
      
      const fileSize = file.Size || 0
      acc[folder].count++
      acc[folder].totalSize += fileSize
      acc[folder].files.push({
        name: file.Key.split('/').pop() || file.Key,
        size: fileSize,
        created_at: file.LastModified?.toISOString() || new Date().toISOString(),
        path: file.Key,
      })
      
      return acc
    }, {})

    // Calculate totals
    const totalFiles = allFiles.length
    const totalSize = allFiles.reduce((sum: number, file: any) => 
      sum + (file.Size || 0), 0
    )

    console.log(`💾 Total storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB across ${totalFiles} files`)

    // Get recent uploads (last 10)
    const recentFiles = [...allFiles]
      .sort((a, b) => {
        const dateA = a.LastModified?.getTime() || 0
        const dateB = b.LastModified?.getTime() || 0
        return dateB - dateA
      })
      .slice(0, 10)
      .map(f => ({
        name: f.Key?.split('/').pop() || f.Key || 'unknown',
        path: f.Key || '',
        size: f.Size || 0,
        created_at: f.LastModified?.toISOString() || new Date().toISOString(),
      }))

    return NextResponse.json({
      totalFiles,
      totalSize,
      storageByType,
      recentFiles,
    })

  } catch (error: any) {
    console.error('Storage API error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

