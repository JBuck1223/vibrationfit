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

// Fallback admin emails (used during migration or if DB check fails)
// Once database is migrated, this is just a fallback
const FALLBACK_ADMIN_EMAILS = [
  'buckinghambliss@gmail.com',
  'admin@vibrationfit.com',
]

export function isAdminRoute(pathname: string): boolean {
  // Only check for exact admin routes, not API routes
  return ADMIN_ROUTES.some(route => pathname.startsWith(route) && !pathname.startsWith('/api/'))
}

/**
 * Check if email is in fallback admin list
 * Used when database check isn't available (middleware context)
 */
export function isAdminEmail(email: string): boolean {
  return FALLBACK_ADMIN_EMAILS.includes(email.toLowerCase())
}

/**
 * Check if user is admin via database (user_accounts table)
 * Use this in API routes where you have access to Supabase client
 */
export async function isAdminUser(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data: account, error } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', userId)
      .single()

    if (error || !account) {
      return false
    }

    return account.role === 'admin' || account.role === 'super_admin'
  } catch {
    return false
  }
}

/**
 * Check if user is admin - tries database first, falls back to email list
 * Use this in API routes
 */
export async function checkIsAdmin(supabase: any, user: { id: string; email?: string }): Promise<boolean> {
  // Try database first
  const isDbAdmin = await isAdminUser(supabase, user.id)
  if (isDbAdmin) return true

  // Fallback to email list (for during migration or if no user_accounts record)
  if (user.email && isAdminEmail(user.email)) return true

  return false
}

/**
 * Get user's role from database
 */
export async function getUserRole(supabase: any, userId: string): Promise<string> {
  try {
    const { data: account } = await supabase
      .from('user_accounts')
      .select('role')
      .eq('id', userId)
      .single()

    return account?.role || 'member'
  } catch {
    return 'member'
  }
}

/**
 * Get user account data
 */
export async function getUserAccount(supabase: any, userId: string) {
  try {
    const { data: account } = await supabase
      .from('user_accounts')
      .select('*')
      .eq('id', userId)
      .single()

    return account
  } catch {
    return null
  }
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
