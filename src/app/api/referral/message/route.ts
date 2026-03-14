import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function PATCH(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const { customMessage } = body

    if (typeof customMessage !== 'string') {
      return NextResponse.json({ error: 'customMessage must be a string' }, { status: 400 })
    }

    if (customMessage.length > 2000) {
      return NextResponse.json({ error: 'Message must be 2000 characters or less' }, { status: 400 })
    }

    const adminDb = createAdminClient()

    const { data: participant, error } = await adminDb
      .from('referral_participants')
      .update({ custom_message: customMessage.trim() || null })
      .eq('user_id', user.id)
      .select('id, custom_message')
      .single()

    if (error || !participant) {
      return NextResponse.json({ error: 'Referral participant not found' }, { status: 404 })
    }

    return NextResponse.json({ customMessage: participant.custom_message })
  } catch (error) {
    console.error('[referral/message] Error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
