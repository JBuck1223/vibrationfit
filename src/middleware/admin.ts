// ============================================================================
// Admin Route Protection Middleware
// ============================================================================

import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// List of admin-only routes
const ADMIN_ROUTES = [
  '/admin',
  '/admin/ai-models',
  '/admin/users',
  '/admin/token-usage',
  '/admin/analytics',
  '/admin/settings'
]

// Admin user emails (add your email here)
const ADMIN_EMAILS = [
  'buckinghambliss@gmail.com', // Your email
  'admin@vibrationfit.com',    // Future admin email
]

export function isAdminRoute(pathname: string): boolean {
  // Only check for exact admin routes, not API routes
  return ADMIN_ROUTES.some(route => pathname.startsWith(route) && !pathname.startsWith('/api/'))
}

export function isAdminEmail(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}

export function createAdminResponse(request: NextRequest, message: string = 'Admin access required') {
  const loginUrl = new URL('/auth/login', request.url)
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname)
  loginUrl.searchParams.set('admin', 'true')
  
  return NextResponse.redirect(loginUrl)
}

export function createAdminErrorResponse(message: string = 'Admin access required') {
  return NextResponse.json(
    { error: message, code: 'ADMIN_ACCESS_REQUIRED' },
    { status: 403 }
  )
}
