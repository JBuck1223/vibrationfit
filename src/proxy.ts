import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminRoute, checkIsAdmin, createAdminResponse } from './middleware/admin'
import { getSeoPage, resolveKeywordVariantPath } from './content/seo/registry'

export async function proxy(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  // SEO pages: Markdown twins (/<page>.md) and keyword-matched PPC variants.
  // `kw` is Google Ads' ValueTrack {keyword}; only allowlisted ad group
  // keywords map to a pre-rendered variant, so the raw param is never shown.
  if (pathname.endsWith('.md') && getSeoPage(pathname.slice(0, -3))) {
    return NextResponse.rewrite(new URL(`/seo-md${pathname.slice(0, -3)}`, url.origin))
  }
  const keyword = url.searchParams.get('kw')
  if (keyword) {
    const variantPath = resolveKeywordVariantPath(pathname, keyword)
    if (variantPath) {
      const target = url.clone()
      target.pathname = variantPath
      return NextResponse.rewrite(target)
    }
  }

  // Handle auth params redirect (existing logic)
  // `type` alone is used by app filters (e.g. /projects?type=project); only treat as auth when paired with token_hash or when `code` is present (PKCE).
  const hasAuthParams =
    url.searchParams.has('code') || url.searchParams.has('token_hash')
  const isAuthPath = pathname.startsWith('/auth')
  const isApiRoute = pathname.startsWith('/api')

  if (hasAuthParams && !isAuthPath && !isApiRoute) {
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

  // Admin routes need server-verified auth via getUser() (network call)
  if (isAdminRoute(pathname)) {
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        return createAdminResponse(req)
      }

      const hasAdminAccess = await checkIsAdmin(supabase, { id: user.id, email: user.email })
      
      if (!hasAdminAccess) {
        return createAdminResponse(req)
      }

      return res
    } catch (error) {
      console.error('Admin middleware error:', error)
      return createAdminResponse(req)
    }
  }

  // Non-admin routes: refresh session cookie without a network call
  await supabase.auth.getSession()
  
  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|cdn-media/).*)'],
}

