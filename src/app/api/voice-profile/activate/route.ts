import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { id } = body as { id?: string }

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 })
    }

    const { data: targetProfile, error: fetchError } = await supabase
      .from('voice_profiles')
      .select('id, user_id')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (fetchError) {
      console.error('voice_profiles target fetch error', fetchError)
      return NextResponse.json({ error: 'Failed to load voice profile' }, { status: 500 })
    }

    if (!targetProfile) {
      return NextResponse.json({ error: 'Voice profile not found' }, { status: 404 })
    }

    await supabase
      .from('voice_profiles')
      .update({ is_active: false })
      .eq('user_id', user.id)
      .eq('is_active', true)

    const { error: activateError } = await supabase
      .from('voice_profiles')
      .update({ is_active: true })
      .eq('id', id)
      .eq('user_id', user.id)

    if (activateError) {
      console.error('voice_profiles activate error', activateError)
      return NextResponse.json({ error: 'Failed to activate profile' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('voice_profiles activate handler error', error)
    return NextResponse.json({ error: 'Failed to activate profile' }, { status: 500 })
  }
}
