import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

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

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}


