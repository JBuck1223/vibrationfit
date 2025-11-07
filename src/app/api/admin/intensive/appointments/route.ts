import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  try {
    // Check admin authentication
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
          set() {},
          remove() {},
        },
      }
    )
    
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    // Check if user is admin
    const adminEmails = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']
    const isAdmin = adminEmails.includes(user.email?.toLowerCase() || '') || user.user_metadata?.is_admin === true
    
    if (!isAdmin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Get all scheduled calls from intensive_checklist
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

    // Get user info for each appointment
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

