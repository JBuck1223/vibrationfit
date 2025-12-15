import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const tokenHash = requestUrl.searchParams.get('token_hash')
  const type = requestUrl.searchParams.get('type')
  const intensive = requestUrl.searchParams.get('intensive')
  const origin = requestUrl.origin

  const supabase = await createClient()

  // Handle PKCE code exchange (standard flow)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)
    
    // Check if user has active intensive
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      const { data: intensive } = await supabase
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      
      if (intensive) {
        return NextResponse.redirect(`${origin}/intensive/dashboard`)
      }
    }
    
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Handle magic link token verification (intensive flow)
  if (tokenHash && type) {
    console.log('Verifying magic link token...')
    
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })

    if (error) {
      console.error('Error verifying magic link:', error)
      return NextResponse.redirect(`${origin}/auth/login`)
    }

    console.log('Magic link verified successfully for:', data.user?.email)
    console.log('Session created:', !!data.session)

    // The session should be automatically set by the Supabase client
    // But let's verify it exists
    if (!data.session) {
      console.error('No session created after verifyOtp')
      return NextResponse.redirect(`${origin}/auth/login`)
    }

    // Redirect based on intensive flag
    if (intensive === 'true') {
      return NextResponse.redirect(`${origin}/auth/setup-password`)
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // No code or token - redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}