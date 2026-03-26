import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

const VALID_AUDIO_URL_PREFIXES = [
  'https://media.vibrationfit.com/',
  'https://vibration-fit-client-storage.s3.amazonaws.com/',
]

function isValidAudioTrackUrl(url: string): boolean {
  return VALID_AUDIO_URL_PREFIXES.some(prefix => url.startsWith(prefix))
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...trackData } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    if (trackData.file_url && !isValidAudioTrackUrl(trackData.file_url)) {
      return NextResponse.json(
        { error: `Invalid file_url: must start with ${VALID_AUDIO_URL_PREFIXES.join(' or ')}. Received: "${trackData.file_url}"` },
        { status: 400 }
      )
    }

    // Verify user is authenticated (basic security check)
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // TODO: Add admin role check here if you have admin roles in your profiles table
    // For now, any authenticated user can update (you should restrict this)

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient()
    
    const { data, error } = await serviceSupabase
      .from('audio_background_tracks')
      .update(trackData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating track:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in PUT /api/admin/audio-tracks:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const trackData = body

    if (trackData.file_url && !isValidAudioTrackUrl(trackData.file_url)) {
      return NextResponse.json(
        { error: `Invalid file_url: must start with ${VALID_AUDIO_URL_PREFIXES.join(' or ')}. Received: "${trackData.file_url}"` },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient()
    
    const { data, error } = await serviceSupabase
      .from('audio_background_tracks')
      .insert(trackData)
      .select()
      .single()

    if (error) {
      console.error('Error creating track:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ data })
  } catch (error: any) {
    console.error('Error in POST /api/admin/audio-tracks:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Track ID is required' },
        { status: 400 }
      )
    }

    // Verify user is authenticated
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Use service role client to bypass RLS
    const serviceSupabase = createServiceClient()
    
    const { error } = await serviceSupabase
      .from('audio_background_tracks')
      .update({ is_active: false })
      .eq('id', id)

    if (error) {
      console.error('Error deleting track:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/audio-tracks:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

