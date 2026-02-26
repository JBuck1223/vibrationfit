/**
 * Admin Delete User API
 *
 * POST /api/admin/users/delete
 * Body: { userId: string }
 *
 * Deletes a user completely:
 * 1. Deletes S3 objects under user-uploads/{userId}/ (non-blocking)
 * 2. Calls prepare_user_for_deletion() to clean storage + bare FK refs
 * 3. Deletes auth user (cascades to DB tables via ON DELETE CASCADE/SET NULL)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkIsAdmin } from '@/middleware/admin'
import {
  S3Client,
  ListObjectsV2Command,
  DeleteObjectsCommand,
} from '@aws-sdk/client-s3'

const BUCKET_NAME = 'vibration-fit-client-storage'
const s3Client = new S3Client({
  region: process.env.AWS_REGION || 'us-east-2',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()
    const user = session?.user

    if (sessionError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await checkIsAdmin(supabase, user))) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      )
    }

    const { userId } = await request.json()
    if (!userId) {
      return NextResponse.json(
        { error: 'userId required' },
        { status: 400 }
      )
    }

    if (userId === user.id) {
      return NextResponse.json(
        { error: 'Cannot delete your own account' },
        { status: 400 }
      )
    }

    const debugLog: string[] = []
    let s3DeletedCount = 0

    // 1. Delete S3 objects (non-blocking)
    try {
      const prefix = `user-uploads/${userId}/`
      let continuationToken: string | undefined
      do {
        const listRes = await s3Client.send(
          new ListObjectsV2Command({
            Bucket: BUCKET_NAME,
            Prefix: prefix,
            ContinuationToken: continuationToken,
          })
        )

        const keys = (listRes.Contents || [])
          .filter(
            (obj): obj is { Key: string } =>
              !!obj.Key && !obj.Key.endsWith('/')
          )
          .map((obj) => ({ Key: obj.Key }))

        if (keys.length > 0) {
          await s3Client.send(
            new DeleteObjectsCommand({
              Bucket: BUCKET_NAME,
              Delete: { Objects: keys, Quiet: true },
            })
          )
          s3DeletedCount += keys.length
        }

        continuationToken = listRes.NextContinuationToken
      } while (continuationToken)
      debugLog.push(`[S3] Deleted ${s3DeletedCount} objects`)
    } catch (s3Error: any) {
      debugLog.push(`[S3] Skipped: ${s3Error?.message || s3Error}`)
    }

    // 2. Prepare: clean storage objects + null out any bare FK references
    const adminAuth = createAdminClient()

    const { data: prepResult, error: prepError } = await adminAuth.rpc(
      'prepare_user_for_deletion',
      { p_user_id: userId }
    )

    if (prepError) {
      debugLog.push(`[Prepare] RPC failed: ${prepError.message}`)
      // Fallback: try storage RPC + manual FK cleanup
      const { error: storageErr } = await adminAuth.rpc(
        'delete_user_storage_objects',
        { p_user_id: userId }
      )
      debugLog.push(`[Prepare] Storage fallback: ${storageErr ? storageErr.message : 'OK'}`)
    } else {
      debugLog.push(`[Prepare] ${JSON.stringify(prepResult)}`)
    }

    // 3. Try debug_delete_auth_user RPC first to get the real Postgres error
    const { data: debugResult, error: debugRpcError } = await adminAuth.rpc(
      'debug_delete_auth_user',
      { p_user_id: userId }
    )

    if (debugRpcError) {
      debugLog.push(`[Debug RPC] Call failed: ${debugRpcError.message}`)
      // Fall back to normal deleteUser
      const { error: deleteError } =
        await adminAuth.auth.admin.deleteUser(userId)

      if (deleteError) {
        debugLog.push(`[Auth Delete] FAILED: ${deleteError.message}`)
        console.error('[DELETE USER]', debugLog.join(' | '))
        return NextResponse.json(
          { error: 'Failed to delete user', details: deleteError.message, debug: debugLog },
          { status: 500 }
        )
      }
      debugLog.push('[Auth Delete] Success (via admin API)')
    } else if (debugResult?.success) {
      debugLog.push(`[Auth Delete] Success (via SQL). FK info: ${JSON.stringify(debugResult.fk_constraints?.length)} constraints checked`)
    } else {
      debugLog.push(`[Auth Delete] SQL error: ${debugResult?.error_message} (${debugResult?.error_detail})`)
      debugLog.push(`[Auth Delete] FK constraints: ${JSON.stringify(debugResult?.fk_constraints)}`)
      console.error('[DELETE USER]', debugLog.join(' | '))
      return NextResponse.json(
        {
          error: 'Failed to delete user',
          details: debugResult?.error_message,
          sqlState: debugResult?.error_detail,
          fkConstraints: debugResult?.fk_constraints,
          debug: debugLog,
        },
        { status: 500 }
      )
    }

    console.log('[DELETE USER]', debugLog.join(' | '))

    return NextResponse.json({
      success: true,
      message: 'User deleted',
      s3FilesDeleted: s3DeletedCount,
      debug: debugLog,
    })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Delete failed',
      },
      { status: 500 }
    )
  }
}
