import { NextRequest, NextResponse } from 'next/server'
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { verifyAdminAccess, createAdminClient } from '@/lib/supabase/admin'

const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

const BUCKET_NAME = 'vibration-fit-client-storage'
const CDN_URL = 'https://media.vibrationfit.com'
const USER_UPLOADS_PREFIX = 'user-uploads/'

interface UserStorageSummary {
  userId: string
  name: string
  email: string
  profilePictureUrl: string | null
  fileCount: number
  totalSize: number
}

async function listAllWithPrefix(prefix: string, delimiter?: string) {
  const allContents: any[] = []
  const allPrefixes: any[] = []
  let continuationToken: string | undefined

  do {
    const command = new ListObjectsV2Command({
      Bucket: BUCKET_NAME,
      Prefix: prefix,
      Delimiter: delimiter,
      ContinuationToken: continuationToken,
      MaxKeys: 1000,
    })

    const response = await s3Client.send(command)

    if (response.Contents) {
      allContents.push(...response.Contents)
    }
    if (response.CommonPrefixes) {
      allPrefixes.push(...response.CommonPrefixes)
    }

    continuationToken = response.IsTruncated ? response.NextContinuationToken : undefined
  } while (continuationToken)

  return { contents: allContents, commonPrefixes: allPrefixes }
}

async function lookupUserAccounts(userIds: string[]): Promise<Map<string, any>> {
  const accountMap = new Map<string, any>()
  if (userIds.length === 0) return accountMap

  const admin = createAdminClient()

  // Batch in groups of 30 to avoid PostgREST URL length limits with .in()
  const BATCH_SIZE = 30
  for (let i = 0; i < userIds.length; i += BATCH_SIZE) {
    const batch = userIds.slice(i, i + BATCH_SIZE)
    const { data, error } = await admin
      .from('user_accounts')
      .select('id, email, first_name, last_name, full_name, profile_picture_url')
      .in('id', batch)

    if (error) {
      console.error('Error looking up user_accounts batch:', error.message)
      continue
    }

    if (data) {
      for (const acc of data) {
        accountMap.set(acc.id, acc)
      }
    }
  }

  // For any IDs still missing, try auth.admin as fallback
  const missingIds = userIds.filter(id => !accountMap.has(id))
  if (missingIds.length > 0) {
    try {
      const { data: authList, error: authError } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      })

      if (!authError && authList?.users) {
        for (const authUser of authList.users) {
          if (missingIds.includes(authUser.id)) {
            const meta = authUser.user_metadata || {}
            accountMap.set(authUser.id, {
              id: authUser.id,
              email: authUser.email || null,
              first_name: meta.first_name || null,
              last_name: meta.last_name || null,
              full_name: meta.full_name || [meta.first_name, meta.last_name].filter(Boolean).join(' ') || null,
              profile_picture_url: meta.profile_picture_url || null,
            })
          }
        }
      }
    } catch (e) {
      console.error('Auth admin fallback failed:', e)
    }
  }

  return accountMap
}

async function handleListUsers(): Promise<NextResponse> {
  const { commonPrefixes } = await listAllWithPrefix(USER_UPLOADS_PREFIX, '/')

  const userIds = commonPrefixes
    .map((p: any) => p.Prefix?.replace(USER_UPLOADS_PREFIX, '').replace(/\/$/, ''))
    .filter(Boolean) as string[]

  if (userIds.length === 0) {
    return NextResponse.json({ users: [] })
  }

  const accountMap = await lookupUserAccounts(userIds)

  const userSummaries: UserStorageSummary[] = await Promise.all(
    userIds.map(async (userId) => {
      const { contents } = await listAllWithPrefix(`${USER_UPLOADS_PREFIX}${userId}/`)

      let totalSize = 0
      for (const obj of contents) {
        totalSize += obj.Size || 0
      }

      const acc = accountMap.get(userId)
      const name = acc?.full_name
        || [acc?.first_name, acc?.last_name].filter(Boolean).join(' ')
        || acc?.email?.split('@')[0]
        || `User ${userId.slice(0, 8)}...`

      return {
        userId,
        name,
        email: acc?.email || userId,
        profilePictureUrl: acc?.profile_picture_url || null,
        fileCount: contents.length,
        totalSize,
      }
    })
  )

  userSummaries.sort((a, b) => b.totalSize - a.totalSize)

  return NextResponse.json({ users: userSummaries })
}

async function handleBrowse(userId: string, folder: string): Promise<NextResponse> {
  const safeUserId = userId.replace(/[^a-f0-9-]/gi, '')
  if (!safeUserId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const prefix = folder
    ? `${USER_UPLOADS_PREFIX}${safeUserId}/${folder}/`
    : `${USER_UPLOADS_PREFIX}${safeUserId}/`

  const { contents, commonPrefixes } = await listAllWithPrefix(prefix, '/')

  const subfolders: string[] = []
  for (const cp of commonPrefixes) {
    if (cp.Prefix) {
      const folderName = cp.Prefix.replace(prefix, '').replace(/\/$/, '')
      if (folderName) {
        subfolders.push(folderName)
      }
    }
  }

  const files = contents
    .filter((obj: any) => obj.Key && !obj.Key.endsWith('/') && !obj.Key.endsWith('/.keep'))
    .map((obj: any) => {
      const pathParts = obj.Key.split('/')
      const fileName = pathParts[pathParts.length - 1]
      return {
        key: obj.Key,
        url: `${CDN_URL}/${obj.Key}`,
        name: fileName,
        size: obj.Size || 0,
        lastModified: obj.LastModified,
      }
    })
    .sort((a: any, b: any) => {
      const dateA = a.lastModified ? new Date(a.lastModified).getTime() : 0
      const dateB = b.lastModified ? new Date(b.lastModified).getTime() : 0
      return dateB - dateA
    })

  return NextResponse.json({
    userId: safeUserId,
    folder: folder || '',
    subfolders: subfolders.sort(),
    files,
  })
}

async function handleUserSummary(userId: string): Promise<NextResponse> {
  const safeUserId = userId.replace(/[^a-f0-9-]/gi, '')
  if (!safeUserId) {
    return NextResponse.json({ error: 'Invalid userId' }, { status: 400 })
  }

  const prefix = `${USER_UPLOADS_PREFIX}${safeUserId}/`
  const { commonPrefixes, contents } = await listAllWithPrefix(prefix, '/')

  const folders: Array<{ name: string; fileCount: number; totalSize: number }> = []

  for (const cp of commonPrefixes) {
    if (!cp.Prefix) continue
    const folderName = cp.Prefix.replace(prefix, '').replace(/\/$/, '')
    if (!folderName) continue

    const { contents: folderContents } = await listAllWithPrefix(cp.Prefix)
    let totalSize = 0
    for (const obj of folderContents) {
      totalSize += obj.Size || 0
    }

    folders.push({
      name: folderName,
      fileCount: folderContents.length,
      totalSize,
    })
  }

  const rootFiles = contents.filter(
    (obj: any) => obj.Key && !obj.Key.endsWith('/') && !obj.Key.endsWith('/.keep')
  )

  folders.sort((a, b) => b.totalSize - a.totalSize)

  return NextResponse.json({
    userId: safeUserId,
    folders,
    rootFileCount: rootFiles.length,
  })
}

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }

    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || 'list-users'

    switch (action) {
      case 'list-users':
        return handleListUsers()

      case 'user-summary': {
        const userId = searchParams.get('userId')
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        return handleUserSummary(userId)
      }

      case 'browse': {
        const userId = searchParams.get('userId')
        if (!userId) {
          return NextResponse.json({ error: 'userId required' }, { status: 400 })
        }
        const folder = searchParams.get('folder') || ''
        return handleBrowse(userId, folder)
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Error in member-storage API:', error)
    return NextResponse.json(
      { error: 'Failed to list member storage', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
