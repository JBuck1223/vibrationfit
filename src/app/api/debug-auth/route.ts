import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    return NextResponse.json({
      authenticated: !!user,
      user_email: user?.email || null,
      auth_error: authError?.message || null,
      is_admin: user ? ['buckinghambliss@gmail.com'].includes(user.email || '') : false,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return NextResponse.json({ 
      error: 'Debug auth error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
