/**
 * Self-service Account Deletion API
 *
 * DELETE /api/account/delete
 *
 * Deletes the currently authenticated user's own account:
 * 1. Deletes S3 objects under user-uploads/{userId}/ (non-blocking)
 * 2. Calls prepare_user_for_deletion() to clean storage + bare FK refs
 * 3. Deletes the auth user (cascades to DB tables via ON DELETE CASCADE/SET NULL)
 *
 * Mirrors the proven admin deletion flow in /api/admin/users/delete, but scoped
 * to the requesting user so no admin role is required.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
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

export async function DELETE() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = user.id
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
            (obj): obj is { Key: string } => !!obj.Key && !obj.Key.endsWith('/')
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
    } catch (s3Error) {
      console.error('[ACCOUNT DELETE] S3 cleanup skipped:', s3Error)
    }

    const adminAuth = createAdminClient()

    // 2. Prepare: clean storage objects + null out any bare FK references
    const { error: prepError } = await adminAuth.rpc('prepare_user_for_deletion', {
      p_user_id: userId,
    })

    if (prepError) {
      console.error('[ACCOUNT DELETE] prepare_user_for_deletion failed:', prepError.message)
      // Fallback: at least clean storage objects so deletion can proceed
      await adminAuth.rpc('delete_user_storage_objects', { p_user_id: userId })
    }

    // 3. Delete the auth user (cascades to DB via FK rules)
    const { error: deleteError } = await adminAuth.auth.admin.deleteUser(userId)

    if (deleteError) {
      console.error('[ACCOUNT DELETE] Auth deletion failed:', deleteError.message)
      return NextResponse.json(
        { error: 'We could not delete your account. Please contact support.' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, s3FilesDeleted: s3DeletedCount })
  } catch (error) {
    console.error('[ACCOUNT DELETE] Unexpected error:', error)
    return NextResponse.json(
      { error: 'We could not delete your account. Please contact support.' },
      { status: 500 }
    )
  }
}
