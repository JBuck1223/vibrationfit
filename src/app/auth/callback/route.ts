import { createClient } from '@/lib/supabase/server'
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { recordActivationEvent } from '@/lib/activation/events'

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
  const returnTo = requestUrl.searchParams.get('returnTo')
  const origin = requestUrl.origin
  const defaultRedirect = returnTo && returnTo.startsWith('/') ? `${origin}${returnTo}` : `${origin}/dashboard`
  const isActivationReturn = !!returnTo && returnTo.startsWith('/activation')

  const supabase = await createClient()

  const setupPasswordUrl = returnTo
    ? `${origin}/auth/setup-password?returnTo=${encodeURIComponent(returnTo)}`
    : `${origin}/auth/setup-password`

  async function honorActivationReturn(userId?: string | null) {
    if (!isActivationReturn || !returnTo) return null
    if (userId) {
      const idMatch = returnTo.match(/[?&]id=([0-9a-f-]{36})/i) || returnTo.match(/\/activation\/([0-9a-f-]{36})/i)
      await recordActivationEvent(getAdminClient(), {
        eventType: 'activation_resumed',
        userId,
        activationId: idMatch?.[1] || null,
        eventData: { return_to: returnTo },
      })
    }
    return NextResponse.redirect(`${origin}${returnTo}`)
  }

  // Handle PKCE code exchange (standard flow)
  if (code) {
    await supabase.auth.exchangeCodeForSession(code)

    const { data: { user } } = await supabase.auth.getUser()
    const activationRedirect = await honorActivationReturn(user?.id)
    if (activationRedirect) return activationRedirect

    if (user) {
      const needsPassword = user.user_metadata?.has_password !== true

      if (needsPassword) {
        return NextResponse.redirect(setupPasswordUrl)
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

    return NextResponse.redirect(defaultRedirect)
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

    const activationRedirect = await honorActivationReturn(data.user?.id)
    if (activationRedirect) return activationRedirect

    if (data.user) {
      const needsPassword = data.user.user_metadata?.has_password !== true

      if (needsPassword) {
        return NextResponse.redirect(setupPasswordUrl)
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

    return NextResponse.redirect(defaultRedirect)
  }

  return NextResponse.redirect(`${origin}/auth/login`)
}
