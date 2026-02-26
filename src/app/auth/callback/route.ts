import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Admin client to bypass RLS for intensive check
function getAdminClient() {
  return createSupabaseAdmin(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

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
    console.log('Auth callback: PKCE code flow')
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    console.log('Auth callback: User:', user?.email)

    // Determine if user needs to set a password (check param OR user metadata)
    const setupPasswordParam = requestUrl.searchParams.get('setup_password') === 'true'
      || requestUrl.searchParams.get('intensive') === 'true'
    const needsPassword = setupPasswordParam
      || (user && user.user_metadata?.has_password !== true)

    if (user && needsPassword) {
      // Check if user has an active intensive to pass the correct param
      const adminClient = getAdminClient()
      const { data: checklist } = await adminClient
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      const isIntensive = !!checklist
      console.log('Auth callback: needs password, intensive=', isIntensive)
      return NextResponse.redirect(
        `${origin}/auth/setup-password${isIntensive ? '?intensive=true' : ''}`
      )
    }

    if (user) {
      const adminClient = getAdminClient()
      const { data: intensiveChecklist, error: checklistError } = await adminClient
        .from('intensive_checklist')
        .select('id, status, started_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      console.log('Auth callback: Intensive checklist:', intensiveChecklist, 'Error:', checklistError)

      if (intensiveChecklist) {
        if (!intensiveChecklist.started_at) {
          console.log('Auth callback: Redirecting to /intensive/start (not started)')
          return NextResponse.redirect(`${origin}/intensive/start`)
        }
        console.log('Auth callback: Redirecting to /intensive/dashboard (already started)')
        return NextResponse.redirect(`${origin}/intensive/dashboard`)
      }
    }

    console.log('Auth callback: No intensive, redirecting to /dashboard')
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

    const setupPwd = intensive === 'true'
      || requestUrl.searchParams.get('setup_password') === 'true'
      || (data.user && data.user.user_metadata?.has_password !== true)

    if (data.user && setupPwd) {
      const adminClient = getAdminClient()
      const { data: checklist } = await adminClient
        .from('intensive_checklist')
        .select('id')
        .eq('user_id', data.user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      const isIntensive = !!checklist
      console.log('Auth callback (magic link): needs password, intensive=', isIntensive)
      return NextResponse.redirect(
        `${origin}/auth/setup-password${isIntensive ? '?intensive=true' : ''}`
      )
    }

    if (data.user) {
      const adminClient = getAdminClient()
      const { data: intensiveChecklist, error: checklistError } = await adminClient
        .from('intensive_checklist')
        .select('id, status, started_at')
        .eq('user_id', data.user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      
      console.log('Auth callback (magic link): Intensive checklist:', intensiveChecklist, 'Error:', checklistError)
      
      if (intensiveChecklist) {
        if (!intensiveChecklist.started_at) {
          console.log('Auth callback (magic link): Redirecting to /intensive/start')
          return NextResponse.redirect(`${origin}/intensive/start`)
        }
        console.log('Auth callback (magic link): Redirecting to /intensive/dashboard')
        return NextResponse.redirect(`${origin}/intensive/dashboard`)
      }
    }

    console.log('Auth callback (magic link): No intensive, redirecting to /dashboard')
    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // No code or token - redirect to login
  return NextResponse.redirect(`${origin}/auth/login`)
}