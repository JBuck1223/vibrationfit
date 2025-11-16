import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminRoute, createAdminResponse } from './middleware/admin'

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // Handle auth params redirect (existing logic)
  const hasAuthParams = url.searchParams.has('code') || url.searchParams.has('token_hash') || url.searchParams.has('type')
  const isAuthPath = pathname.startsWith('/auth')

  if (hasAuthParams && !isAuthPath) {
    const redirectUrl = new URL('/auth/callback', url.origin)
    // Preserve all query params
    url.searchParams.forEach((value, key) => {
      redirectUrl.searchParams.set(key, value)
    })
    return NextResponse.redirect(redirectUrl)
  }

  // Create Supabase client for all auth checks
  const res = NextResponse.next()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return req.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          res.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          res.cookies.set({ name, value: '', ...options })
        },
      },
    }
  )

  // Get session once (used for both intensive and admin checks)
  const { data: { session }, error: sessionError } = await supabase.auth.getSession()

  // Handle admin route protection
  if (isAdminRoute(pathname)) {
    try {
      if (sessionError || !session?.user) {
        return createAdminResponse(req)
      }

      const user = session.user

      // Check if user is admin (email check + metadata check)
      const adminEmails = ['buckinghambliss@gmail.com', 'admin@vibrationfit.com']
      const isEmailAdmin = adminEmails.includes(user.email?.toLowerCase() || '')
      const isMetadataAdmin = user.user_metadata?.is_admin === true
      
      if (!isEmailAdmin && !isMetadataAdmin) {
        return createAdminResponse(req)
      }

      return res
    } catch (error) {
      console.error('Admin middleware error:', error)
      return createAdminResponse(req)
    }
  }

  // INTENSIVE MODE ACCESS CONTROL
  // If user is logged in, check if they have an active intensive
  if (session?.user && !pathname.startsWith('/api') && !pathname.startsWith('/auth') && !pathname.startsWith('/_next')) {
    try {
      const { data: intensive } = await supabase
        .from('intensive_purchases')
        .select('id, completion_status, started_at')
        .eq('user_id', session.user.id)
        .in('completion_status', ['pending', 'in_progress'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      // User has active intensive - restrict access
      if (intensive) {
        // Allowed paths during intensive
        const allowedPaths = [
          '/intensive',
          '/profile/edit',
          '/profile',
          '/assessment',
          '/vision/build',
          '/vision',
          '/life-vision',
          '/vision-board',
          '/journal',
          '/viva',
          '/design-system', // For testing
        ]

        const isAllowedPath = allowedPaths.some(path => pathname.startsWith(path))

        // If trying to access non-intensive page, redirect to intensive dashboard
        if (!isAllowedPath) {
          const redirectUrl = new URL('/intensive/dashboard', url.origin)
          return NextResponse.redirect(redirectUrl)
        }
      }
    } catch (error) {
      console.error('Intensive check error:', error)
      // Don't block on error, just continue
    }
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}


