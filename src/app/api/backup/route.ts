import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command, CopyObjectCommand, HeadBucketCommand } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const PRIMARY_BUCKET = "vibration-fit-client-storage"
    const BACKUP_BUCKET = "vibration-fit-client-storage-backup"
    
    console.log('🚀 Starting Vercel S3 backup process...')
    console.log(`📅 Backup started at: ${new Date().toISOString()}`)
    console.log(`📦 Primary bucket: ${PRIMARY_BUCKET}`)
    console.log(`💾 Backup bucket: ${BACKUP_BUCKET}`)
    
    // Check bucket accessibility
    console.log('🔍 Checking bucket accessibility...')
    
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: PRIMARY_BUCKET }))
      console.log(`✅ Primary bucket (${PRIMARY_BUCKET}): Accessible`)
    } catch (error) {
      console.error(`❌ Primary bucket (${PRIMARY_BUCKET}): Not accessible`, error)
      throw error
    }
    
    try {
      await s3Client.send(new HeadBucketCommand({ Bucket: BACKUP_BUCKET }))
      console.log(`✅ Backup bucket (${BACKUP_BUCKET}): Accessible`)
    } catch (error) {
      console.error(`❌ Backup bucket (${BACKUP_BUCKET}): Not accessible`, error)
      throw error
    }
    
    // Perform backup
    console.log('🔄 Starting sync to backup bucket...')
    
    let copiedCount = 0
    let errorCount = 0
    let continuationToken: string | undefined
    
    do {
      // List objects in primary bucket
      const listCommand = new ListObjectsV2Command({
        Bucket: PRIMARY_BUCKET,
        ContinuationToken: continuationToken,
        MaxKeys: 1000
      })
      
      const listResponse = await s3Client.send(listCommand)
      
      if (listResponse.Contents) {
        // Copy each object to backup bucket
        for (const obj of listResponse.Contents) {
          try {
            const copyCommand = new CopyObjectCommand({
              CopySource: `${PRIMARY_BUCKET}/${obj.Key}`,
              Bucket: BACKUP_BUCKET,
              Key: obj.Key!,
              StorageClass: 'STANDARD_IA' // Use cheaper storage for backup
            })
            
            await s3Client.send(copyCommand)
            copiedCount++
            
            if (copiedCount % 100 === 0) {
              console.log(`📁 Copied ${copiedCount} objects...`)
            }
            
          } catch (error) {
            console.error(`❌ Failed to copy ${obj.Key}:`, error)
            errorCount++
          }
        }
      }
      
      continuationToken = listResponse.NextContinuationToken
      
    } while (continuationToken)
    
    // Get final statistics
    console.log('📊 Getting backup statistics...')
    
    let primaryCount = 0
    let backupCount = 0
    
    // Count primary bucket objects
    let primaryToken: string | undefined
    do {
      const primaryListCommand = new ListObjectsV2Command({
        Bucket: PRIMARY_BUCKET,
        ContinuationToken: primaryToken,
        MaxKeys: 1000
      })
      
      const primaryResponse = await s3Client.send(primaryListCommand)
      if (primaryResponse.Contents) {
        primaryCount += primaryResponse.Contents.length
      }
      primaryToken = primaryResponse.NextContinuationToken
    } while (primaryToken)
    
    // Count backup bucket objects
    let backupToken: string | undefined
    do {
      const backupListCommand = new ListObjectsV2Command({
        Bucket: BACKUP_BUCKET,
        ContinuationToken: backupToken,
        MaxKeys: 1000
      })
      
      const backupResponse = await s3Client.send(backupListCommand)
      if (backupResponse.Contents) {
        backupCount += backupResponse.Contents.length
      }
      backupToken = backupResponse.NextContinuationToken
    } while (backupToken)
    
    console.log(`📁 Primary bucket objects: ${primaryCount}`)
    console.log(`💾 Backup bucket objects: ${backupCount}`)
    console.log(`📋 Objects copied this run: ${copiedCount}`)
    
    if (errorCount > 0) {
      console.warn(`⚠️  ${errorCount} objects failed to copy`)
    }
    
    // Determine success status
    const success = errorCount === 0 && Math.abs(primaryCount - backupCount) <= 10
    const status = success 
      ? "✅ Backup completed successfully!" 
      : `⚠️  Backup completed with warnings (${errorCount} errors)`
    
    console.log(status)
    console.log(`📅 Backup completed at: ${new Date().toISOString()}`)
    
    return NextResponse.json({
      success,
      message: status,
      primaryCount,
      backupCount,
      copiedCount,
      errorCount,
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Backup failed:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Backup failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

// Allow GET requests for testing
export async function GET() {
  return NextResponse.json({
    message: "VibrationFit S3 Backup API",
    status: "ready",
    timestamp: new Date().toISOString()
  })
}
