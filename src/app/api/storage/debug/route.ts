// /src/app/api/storage/debug/route.ts
// Debug endpoint to test storage calculation for a specific user

import { NextRequest, NextResponse } from 'next/server'
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
    // Get user ID from query parameter
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json({ error: 'userId query parameter required' }, { status: 400 })
    }

    console.log('🔍 STORAGE DEBUG: Fetching files for user:', userId)

    // List all files in user's folder using AWS SDK
    const prefix = `uploads/${userId}/`
    
    console.log(`📂 S3 Bucket: ${BUCKET_NAME}`)
    console.log(`📂 Prefix: ${prefix}`)
    
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      MaxKeys: 1000,
    })

    const response = await s3Client.send(command)
    const allFiles = response.Contents || []

    console.log(`📁 Found ${allFiles.length} files in S3`)
    
    // Log first few files
    allFiles.slice(0, 5).forEach((file: any) => {
      console.log(`  📄 ${file.Key} - ${(file.Size / 1024 / 1024).toFixed(2)} MB`)
    })

    console.log(`\n✅ Total files found: ${allFiles.length}`)

    // Calculate storage by folder type
    const storageByType = allFiles.reduce((acc: any, file: any) => {
      if (!file.Key) return acc
      
      // Extract folder from path (uploads/userId/folder/file.ext)
      const pathParts = file.Key.split('/')
      const folder = pathParts[2] || 'root' // Index 2 for folder after uploads/userId
      
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
      })
      
      return acc
    }, {})

    // Calculate totals
    const totalFiles = allFiles.length
    const totalSize = allFiles.reduce((sum: number, file: any) => 
      sum + (file.Size || 0), 0
    )

    console.log(`💾 Total storage: ${(totalSize / 1024 / 1024).toFixed(2)} MB`)
    console.log(`📊 Breakdown:`)
    Object.entries(storageByType).forEach(([folder, stats]: [string, any]) => {
      console.log(`  - ${folder}: ${stats.count} files, ${(stats.totalSize / 1024 / 1024).toFixed(2)} MB`)
    })

    return NextResponse.json({
      userId,
      totalFiles,
      totalSize,
      totalSizeMB: (totalSize / 1024 / 1024).toFixed(2),
      totalSizeGB: (totalSize / 1024 / 1024 / 1024).toFixed(3),
      storageByType,
      allFilePaths: allFiles.map((f: any) => f.Key),
    })

  } catch (error: any) {
    console.error('❌ Storage debug error:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal server error',
      details: error
    }, { status: 500 })
  }
}

