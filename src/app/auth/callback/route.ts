import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

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
  const origin = requestUrl.origin

  const supabase = await createClient()

  // Handle PKCE code exchange (standard flow)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()

    if (user) {
      const needsPassword = user.user_metadata?.has_password !== true

      if (needsPassword) {
        // setup-password checks DB for intensive enrollment itself
        return NextResponse.redirect(`${origin}/auth/setup-password`)
      }

      // Already has password -- check DB for intensive
      const adminClient = getAdminClient()
      const { data: checklist } = await adminClient
        .from('intensive_checklist')
        .select('id, started_at')
        .eq('user_id', user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        return NextResponse.redirect(
          checklist.started_at ? `${origin}/intensive/dashboard` : `${origin}/intensive/start`
        )
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  // Handle magic link token verification
  if (tokenHash && type) {
    const { data, error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as any,
    })

    if (error || !data.session) {
      console.error('Magic link verification failed:', error)
      return NextResponse.redirect(`${origin}/auth/login`)
    }

    if (data.user) {
      const needsPassword = data.user.user_metadata?.has_password !== true

      if (needsPassword) {
        return NextResponse.redirect(`${origin}/auth/setup-password`)
      }

      const adminClient = getAdminClient()
      const { data: checklist } = await adminClient
        .from('intensive_checklist')
        .select('id, started_at')
        .eq('user_id', data.user.id)
        .in('status', ['pending', 'in_progress'])
        .maybeSingle()

      if (checklist) {
        return NextResponse.redirect(
          checklist.started_at ? `${origin}/intensive/dashboard` : `${origin}/intensive/start`
        )
      }
    }

    return NextResponse.redirect(`${origin}/dashboard`)
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
