import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'

export async function POST(request: NextRequest) {
  try {
    // Check AWS credentials first
    if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
      console.error('AWS credentials not configured')
      return NextResponse.json({ 
        error: 'AWS credentials not configured. Please set AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY in .env.local' 
      }, { status: 500 })
    }

    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Please upload JPG, PNG, or WebP images only.' 
      }, { status: 400 })
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB in bytes
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File too large. Please upload images smaller than 5MB.' 
      }, { status: 400 })
    }

    // Upload to S3
    console.log('Starting upload for user:', user.id, 'file size:', file.size, 'file type:', file.type)
    const uploadResult = await uploadUserFile('profilePicture' as const, file, user.id)
    console.log('Upload result:', uploadResult)
    
    if (!uploadResult) {
      console.error('Upload result is null/undefined')
      return NextResponse.json({ error: 'Upload failed - no result returned' }, { status: 500 })
    }

    // Update user profile with new picture URL
    const { error: updateError } = await supabase
      .from('user_profiles')
      .upsert({ 
        user_id: user.id,
        profile_picture_url: uploadResult.url 
      }, { 
        onConflict: 'user_id' 
      })

    if (updateError) {
      console.error('Error updating profile with new picture:', updateError)
      return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      url: uploadResult.url,
      message: 'Profile picture uploaded successfully' 
    })
  } catch (error) {
    console.error('Error uploading profile picture:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
