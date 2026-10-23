import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// Legacy checkout return URL. A payment email/session is not proof of identity.
export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const destination = new URL(user ? '/begin' : '/auth/login', request.url)
  if (!user) {
    destination.searchParams.set('checkout', 'complete')
    destination.searchParams.set('returnTo', '/begin')
  }
  return NextResponse.redirect(destination)
}
