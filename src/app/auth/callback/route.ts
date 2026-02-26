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
    
    const intensiveParam = requestUrl.searchParams.get('intensive') === 'true'

    if (intensiveParam) {
      console.log('Auth callback: intensive=true, redirecting to setup-password')
      return NextResponse.redirect(`${origin}/auth/setup-password?intensive=true`)
    }

    // Check if user has active intensive
    const { data: { user } } = await supabase.auth.getUser()
    console.log('Auth callback: User:', user?.email)

    if (user) {
      // Use admin client to bypass RLS
      const adminClient = getAdminClient()
      const { data: intensiveChecklist, error: checklistError } = await adminClient
        .from('intensive_checklist')
        .select('id, status, started_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      console.log('Auth callback: Intensive checklist:', intensiveChecklist, 'Error:', checklistError)

      if (intensiveChecklist) {
        // If intensive hasn't been started yet, go to start page
        if (!intensiveChecklist.started_at) {
          console.log('Auth callback: Redirecting to /intensive/start (not started)')
          return NextResponse.redirect(`${origin}/intensive/start`)
        }
        // Otherwise go to intensive dashboard
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

    // Redirect based on intensive flag
    if (intensive === 'true') {
      return NextResponse.redirect(`${origin}/auth/setup-password`)
    }

    // Check if user has active intensive (even if not from intensive flow)
    if (data.user) {
      // Use admin client to bypass RLS
      const adminClient = getAdminClient()
      const { data: intensiveChecklist, error: checklistError } = await adminClient
        .from('intensive_checklist')
        .select('id, status, started_at')
        .eq('user_id', data.user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()
      
      console.log('Auth callback (magic link): Intensive checklist:', intensiveChecklist, 'Error:', checklistError)
      
      if (intensiveChecklist) {
        // If intensive hasn't been started yet, go to start page
        if (!intensiveChecklist.started_at) {
          console.log('Auth callback (magic link): Redirecting to /intensive/start')
          return NextResponse.redirect(`${origin}/intensive/start`)
        }
        // Otherwise go to intensive dashboard
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