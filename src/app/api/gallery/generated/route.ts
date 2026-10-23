// /src/app/api/gallery/generated/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { S3Client, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { canAccessStorageKey } from '@/lib/security/storage-policy'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data, error } = await supabase
      .from('generated_images')
      .select('*')
      .eq('user_id', user.id)
      .order('generated_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ images: data || [] })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load gallery' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

    // Fetch row to get s3 key
    const { data, error: fetchErr } = await supabase
      .from('generated_images')
      .select('id, user_id, s3_key')
      .eq('id', id)
      .single()

    if (fetchErr || !data) {
      return NextResponse.json({ error: fetchErr?.message || 'Not found' }, { status: 404 })
    }

    if (data.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from S3
    if (!canAccessStorageKey(data.s3_key, user.id)) {
      return NextResponse.json({ error: 'Forbidden storage key' }, { status: 403 })
    }
    const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-east-2' })
    await s3.send(new DeleteObjectCommand({ Bucket: 'vibration-fit-client-storage', Key: data.s3_key }))

    // Delete DB row
    const { error: delErr } = await supabase
      .from('generated_images')
      .delete()
      .eq('id', id)

    if (delErr) {
      return NextResponse.json({ error: delErr.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to delete image' }, { status: 500 })
  }
}


