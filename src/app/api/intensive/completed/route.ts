import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { triggerEvent } from '@/lib/messaging/events'
import { createAdminNotification } from '@/lib/admin/notifications'

export async function POST() {
  try {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { data: checklist } = await supabase
      .from('intensive_checklist')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .maybeSingle()

    if (!checklist) {
      return NextResponse.json({ error: 'Intensive not completed' }, { status: 400 })
    }

    const { data: profile } = await supabase
      .from('user_profiles')
      .select('first_name, last_name')
      .eq('user_id', user.id)
      .maybeSingle()

    const completedName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || user.email?.split('@')[0] || ''

    await triggerEvent('intensive.completed', {
      email: user.email || '',
      userId: user.id,
      name: completedName,
      firstName: profile?.first_name || user.email?.split('@')[0] || '',
    })

    createAdminNotification({
      type: 'intensive_completed',
      title: `Intensive Completed: ${completedName}`,
      body: user.email || undefined,
      metadata: { userId: user.id, email: user.email },
      link: '/admin/users',
    }).catch(err => console.error('Admin notification DB error:', err))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error firing intensive.completed event:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
