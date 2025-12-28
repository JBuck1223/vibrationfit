import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'
import { createClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id, ...comboData } = await request.json()
    
    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceClient()
    
    const { data, error } = await supabaseAdmin
      .from('audio_recommended_combos')
      .update(comboData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      console.error('Error updating combo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in PUT /api/admin/audio-combos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const comboData = await request.json()
    
    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceClient()
    
    const { data, error } = await supabaseAdmin
      .from('audio_recommended_combos')
      .insert(comboData)
      .select()
      .single()
    
    if (error) {
      console.error('Error creating combo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error in POST /api/admin/audio-combos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Verify authentication
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { id } = await request.json()
    
    // Use service role client to bypass RLS
    const supabaseAdmin = createServiceClient()
    
    const { error } = await supabaseAdmin
      .from('audio_recommended_combos')
      .delete()
      .eq('id', id)
    
    if (error) {
      console.error('Error deleting combo:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error in DELETE /api/admin/audio-combos:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

