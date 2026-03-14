import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { refreshAllMapNotifications } from '@/lib/map/notifications'

export const maxDuration = 60

const CRON_SECRET = process.env.CRON_SECRET

/**
 * GET /api/map/refresh-notifications
 * 
 * Cron endpoint (daily at midnight UTC) that refreshes SMS notifications
 * for all users with active MAPs. Generates the next 2 weeks of messages.
 */
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    const cronSecret = request.headers.get('x-cron-secret')
    const isVercelCron = request.headers.get('x-vercel-cron') === '1'
      || request.headers.get('user-agent')?.includes('vercel-cron')
    
    let isAuthorized = false
    
    if (isVercelCron) isAuthorized = true
    if (CRON_SECRET && authHeader === `Bearer ${CRON_SECRET}`) isAuthorized = true
    if (CRON_SECRET && cronSecret === CRON_SECRET) isAuthorized = true
    if (process.env.NODE_ENV === 'development') isAuthorized = true
    
    if (!isAuthorized) {
      const supabaseAuth = await createClient()
      const { data: { user } } = await supabaseAuth.auth.getUser()
      if (user) {
        const { data: account } = await supabaseAuth
          .from('user_accounts')
          .select('role')
          .eq('id', user.id)
          .single()
        
        if (account?.role === 'admin' || account?.role === 'super_admin') {
          isAuthorized = true
        }
      }
    }
    
    if (!isAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const result = await refreshAllMapNotifications()

    return NextResponse.json({
      message: 'MAP notification refresh complete',
      ...result,
    })
  } catch (error) {
    console.error('Error refreshing MAP notifications:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
