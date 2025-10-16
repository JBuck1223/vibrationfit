// /src/app/api/gallery/uploaded/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to load uploaded images from vision_board_items table
    const { data, error } = await supabase
      .from('vision_board_items')
      .select('id, image_url, created_at')
      .eq('user_id', user.id)
      .not('image_url', 'is', null)
      .order('created_at', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Optionally filter for uploaded folder path if present in URLs
    const items = (data || []).filter((i: any) => typeof i.image_url === 'string')

    return NextResponse.json({ images: items })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Failed to load uploaded images' }, { status: 500 })
  }
}


