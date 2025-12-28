import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

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

