import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadUserFile } from '@/lib/storage/s3-storage-presigned'
import { syncProfilePictureToMetadata } from '@/lib/supabase/sync-metadata'

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

    // Update the active profile with new picture URL
    // First, find the active profile
    const { data: activeProfile, error: findError } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('is_draft', false)
      .maybeSingle()

    if (findError) {
      console.error('Error finding active profile:', findError)
      return NextResponse.json({ error: 'Failed to find active profile' }, { status: 500 })
    }

    if (activeProfile?.id) {
      // Update existing active profile
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ 
          profile_picture_url: uploadResult.url,
          updated_at: new Date().toISOString()
        })
        .eq('id', activeProfile.id)

      if (updateError) {
        console.error('Error updating profile with new picture:', updateError)
        return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
      }
    } else {
      // No active profile found - create one
      const { error: createError } = await supabase
        .from('user_profiles')
        .insert({
          user_id: user.id,
          profile_picture_url: uploadResult.url,
          is_active: true,
          is_draft: false,
          version_number: 1
        })

      if (createError) {
        console.error('Error creating profile with picture:', createError)
        return NextResponse.json({ error: 'Failed to create profile' }, { status: 500 })
      }
    }

    // Sync profile picture URL to user_metadata for instant access in Header
    syncProfilePictureToMetadata(user.id, uploadResult.url).catch(err => {
      console.error('Failed to sync profile picture to metadata (non-blocking):', err)
    })

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
