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
const CDN_URL = 'https://media.vibrationfit.com'
const SITE_ASSETS_PREFIX = 'site-assets/'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category') || ''

    // Build prefix for category filter
    const prefix = category 
      ? `${SITE_ASSETS_PREFIX}${category}/`
      : SITE_ASSETS_PREFIX

    // List all objects with the prefix
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      Delimiter: '/', // This helps us get folders
    })

    const response = await s3Client.send(command)

    // Organize results into subfolders and files
    const subfolders: string[] = []
    const files: Array<{
      key: string
      url: string
      name: string
      size: number
      lastModified?: Date
      category: string
      path: string
    }> = []

    // Process common prefixes (folders/subfolders)
    if (response.CommonPrefixes) {
      for (const commonPrefix of response.CommonPrefixes) {
        if (commonPrefix.Prefix) {
          // Extract subfolder name from prefix relative to current view
          // If viewing root: "site-assets/video/" -> "video"
          // If viewing video: "site-assets/video/marketing/" -> "marketing"
          const fullPath = commonPrefix.Prefix.replace(SITE_ASSETS_PREFIX, '').replace(/\/$/, '')
          
          if (category) {
            // When in a category, extract just the next level
            // e.g., if category="video" and prefix="site-assets/video/marketing/", get "marketing"
            const categoryPath = `${category}/`
            if (fullPath.startsWith(categoryPath)) {
              const remainingPath = fullPath.replace(categoryPath, '')
              // Only show immediate subfolder (not nested ones)
              const parts = remainingPath.split('/')
              if (parts.length === 1 && parts[0]) {
                subfolders.push(parts[0])
              }
            }
          } else {
            // At root level, show top-level categories only
            const parts = fullPath.split('/')
            if (parts.length === 1 && parts[0]) {
              subfolders.push(parts[0])
            }
          }
        }
      }
    }

    // Process files
    if (response.Contents) {
      for (const obj of response.Contents) {
        if (obj.Key && !obj.Key.endsWith('/')) {
          // Skip .keep placeholder files used for folder creation
          if (obj.Key.endsWith('/.keep')) {
            continue
          }

          // Extract full path and filename
          const pathAfterPrefix = obj.Key.replace(SITE_ASSETS_PREFIX, '')
          const pathParts = pathAfterPrefix.split('/')
          const fileName = pathParts[pathParts.length - 1]
          const filePath = pathParts.slice(0, -1).join('/')
          const topLevelCategory = pathParts[0]

          // Convert S3 URL to CloudFront URL
          const cloudfrontUrl = `${CDN_URL}/${obj.Key}`
          
          files.push({
            key: obj.Key,
            url: cloudfrontUrl,
            name: fileName,
            size: obj.Size || 0,
            lastModified: obj.LastModified,
            category: topLevelCategory,
            path: filePath, // Full path within site-assets
          })
        }
      }
    }

    // If we're listing a specific category/path
    if (category) {
      return NextResponse.json({
        category,
        subfolders: subfolders.sort(),
        files: files.sort((a, b) => a.name.localeCompare(b.name)),
      })
    }

    // Root level - return top-level categories only
    const topLevelCategories = subfolders.filter(f => !f.includes('/'))
    const filesByCategory: Record<string, typeof files> = {}
    
    files.forEach(file => {
      if (!filesByCategory[file.category]) {
        filesByCategory[file.category] = []
      }
      filesByCategory[file.category].push(file)
    })

    return NextResponse.json({
      categories: topLevelCategories.sort(),
      subfolders: subfolders.sort(),
      filesByCategory,
    })
  } catch (error) {
    console.error('Error listing S3 assets:', error)
    return NextResponse.json(
      { error: 'Failed to list assets', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}

