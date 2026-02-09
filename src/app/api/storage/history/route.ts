import { NextRequest, NextResponse } from 'next/server'
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    const supabase = createRouteHandlerClient({ cookies })
    
    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get query parameters
    const searchParams = request.nextUrl.searchParams
    const days = parseInt(searchParams.get('days') || '30')
    const actionType = searchParams.get('action_type')

    // Calculate the date threshold
    const dateThreshold = new Date()
    dateThreshold.setDate(dateThreshold.getDate() - days)

    // Query media_metadata table for file history
    let query = supabase
      .from('media_metadata')
      .select('*')
      .eq('user_id', user.id)
      .gte('created_at', dateThreshold.toISOString())
      .order('created_at', { ascending: false })
      .limit(100)

    // If folder filter is specified
    if (actionType && actionType !== 'all') {
      query = query.eq('folder', actionType)
    }

    const { data: files, error: filesError } = await query

    if (filesError) {
      console.error('Error fetching storage history:', filesError)
      return NextResponse.json({ error: 'Failed to fetch storage history' }, { status: 500 })
    }

    // Transform the data to match our StorageRecord interface
    const records = (files || []).map(file => ({
      id: file.id,
      action_type: 'file_upload',
      file_path: file.storage_path || file.file_name,
      file_size: file.file_size || 0,
      folder_type: file.folder,
      success: true,
      metadata: {
        file_name: file.file_name,
        file_type: file.file_type,
        mime_type: file.mime_type,
        public_url: file.public_url,
      },
      created_at: file.created_at,
    }))

    return NextResponse.json({
      records,
      total: records.length,
    })

  } catch (error) {
    console.error('Error in storage history API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
