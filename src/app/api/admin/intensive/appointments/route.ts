import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminAccess } from '@/lib/supabase/admin'

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAdminAccess()
    if ('error' in auth) {
      return NextResponse.json({ error: auth.error }, { status: auth.status })
    }
    const { supabase } = auth

    const { data: checklistData, error } = await supabase
      .from('intensive_checklist')
      .select(`
        id,
        intensive_id,
        user_id,
        call_scheduled_time,
        call_scheduled_at
      `)
      .eq('call_scheduled', true)
      .not('call_scheduled_time', 'is', null)
      .order('call_scheduled_time', { ascending: true })

    if (error) {
      console.error('Error loading appointments:', error)
      return NextResponse.json({ error: 'Failed to load appointments' }, { status: 500 })
    }

    if (!checklistData || checklistData.length === 0) {
      return NextResponse.json({ appointments: [] })
    }

    const appointments = await Promise.all(
      checklistData.map(async (item) => {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('email, first_name, last_name')
          .eq('user_id', item.user_id)
          .single()

        const scheduledDateTime = new Date(item.call_scheduled_time)
        const dateStr = scheduledDateTime.toISOString().split('T')[0]
        const timeStr = scheduledDateTime.toTimeString().split(' ')[0].slice(0, 5)

        return {
          id: item.id,
          user_id: item.user_id,
          intensive_id: item.intensive_id,
          scheduled_date: dateStr,
          scheduled_time: timeStr,
          scheduled_datetime: item.call_scheduled_time,
          user_email: profileData?.email || 'Unknown',
          user_name: profileData 
            ? `${profileData.first_name || ''} ${profileData.last_name || ''}`.trim() || 'Unknown'
            : 'Unknown',
          status: 'scheduled' as const,
          created_at: item.call_scheduled_at || ''
        }
      })
    )

    return NextResponse.json({ appointments })
  } catch (error) {
    console.error('Error in appointments API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
