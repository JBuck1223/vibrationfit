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

  // Handle admin route protection
  if (isAdminRoute(pathname)) {
    try {
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
      
      // Use getSession() instead of getUser() - faster and more reliable
      // getSession() reads from cookies, getUser() makes a network request
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
}


