import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, ListObjectsV2Command, type _Object } from '@aws-sdk/client-s3'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'

/** Max S3 list pages (1000 keys each) to avoid unbounded scans */
const MAX_LIST_PAGES = 50

function folderFromUserUploadKey(key: string, userId: string): string {
  const prefix = `user-uploads/${userId}/`
  if (!key.startsWith(prefix)) return 'other'
  const pathParts = key.split('/')
  return pathParts[2] || 'other'
}

async function listAllUnderPrefix(prefix: string): Promise<_Object[]> {
  const objects: _Object[] = []
  let continuationToken: string | undefined

  for (let page = 0; page < MAX_LIST_PAGES; page++) {
    const response = await s3Client.send(
      new ListObjectsV2Command({
        Bucket: BUCKET_NAME,
        Prefix: prefix,
        MaxKeys: 1000,
        ContinuationToken: continuationToken,
      })
    )
    objects.push(...(response.Contents || []))
    if (!response.IsTruncated || !response.NextContinuationToken) break
    continuationToken = response.NextContinuationToken
  }

  return objects
}

/**
 * Storage usage (/api/storage/usage) is driven by S3 listings, not `media_metadata`.
 * History must use the same source so uploads (profile photos, etc.) appear here too.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30', 10)
    const actionType = searchParams.get('action_type')

    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    const userPrefix = `user-uploads/${user.id}/`
    const allObjects = await listAllUnderPrefix(userPrefix)

    let filtered = allObjects.filter(obj => {
      if (!obj.Key) return false
      const t = obj.LastModified?.getTime() ?? 0
      return t >= dateThreshold.getTime()
    })

    if (actionType && actionType !== 'all' && actionType !== 'file_upload') {
      filtered = filtered.filter(obj => {
        if (!obj.Key) return false
        return folderFromUserUploadKey(obj.Key, user.id) === actionType
      })
    }

    filtered.sort((a, b) => {
      const ta = a.LastModified?.getTime() ?? 0
      const tb = b.LastModified?.getTime() ?? 0
      return tb - ta
    })

    const records = filtered.slice(0, 500).map(obj => {
      const key = obj.Key as string
      const createdAt = obj.LastModified?.toISOString() ?? new Date().toISOString()
      return {
        id: key,
        action_type: 'file_upload' as const,
        file_path: key,
        file_size: obj.Size ?? 0,
        folder_type: folderFromUserUploadKey(key, user.id),
        success: true,
        metadata: undefined as undefined,
        created_at: createdAt,
      }
    })

    return NextResponse.json({
      records,
      total: records.length,
    })
  } catch (error) {
    console.error('Error in storage history API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
