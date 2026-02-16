/**
 * VibrationFit Page Classifications
 * 
 * Master definition of all pages and their classification for layout routing.
 * This is the single source of truth for page types (USER, ADMIN, PUBLIC).
 * 
 * USAGE:
 * - Import in GlobalLayout, Header, and any component that needs to determine page type
 * - Use getPageType(pathname) to determine which layout to show
 */

export type PageType = 'USER' | 'ADMIN' | 'PUBLIC'

/**
 * Base paths that define page classifications.
 * Dynamic routes use pattern matching (e.g., /life-vision/[id] matches /life-vision/123)
 */
export const PAGE_CLASSIFICATIONS = {
  /**
   * USER PAGES - Core app functionality for logged-in users
   * Layout: SidebarLayout + MobileBottomNav + PageLayout
   */
  USER: [
    // Dashboard & Analytics
      '/dashboard',
      '/dashboard/activity',
      '/dashboard/add-tokens',
      '/dashboard/storage',
      '/dashboard/token-history',
      '/dashboard/tokens',
      '/tracking',
      '/viva',
    
    // Life Vision System
    '/life-vision',
    '/life-vision/new',
    '/life-vision/[id]',              // Dynamic: /life-vision/:id
    '/life-vision/[id]/audio',
    '/life-vision/[id]/audio/generate',
    '/life-vision/[id]/audio/sets',
    '/life-vision/[id]/audio/queue',
    '/life-vision/[id]/audio/queue/[batchId]',
    '/life-vision/[id]/experiment',
    // '/settings/voice-clone', // REMOVED: Voice cloning archived to experiments/elevenlabs (Dec 6, 2025)
    // '/life-vision/[id]/refine', // REMOVED: Deprecated vibe-assistant refine page (Nov 11, 2025)
    '/life-vision/[id]/print',        // PDF preview page (with sidebar)
    '/life-vision/new/assembly',
    '/life-vision/new/category/[key]',
    
    // Vision Board & Gallery
    '/vision-board',
    '/vision-board/new',
    '/vision-board/gallery',
    '/vision-board/[id]',
    
    // Journal System
    '/journal',
    '/journal/new',
    '/journal/[id]',
    '/journal/[id]/edit',
    
    // Vibe Tribe Community
    '/vibe-tribe',
    '/vibe-tribe/wins',
    '/vibe-tribe/wobbles',
    '/vibe-tribe/visions',
    '/vibe-tribe/collaboration',
    '/snapshot/[id]',  // Member profile snapshots
    
    // Tracking System
    '/daily-paper',
    '/daily-paper/new',
    '/daily-paper/resources',
    '/abundance-tracker',
    
    // Profile & Account
    '/profile',
    '/profile/active/edit',
    '/profile/new',
    '/profile/[id]',
    '/profile/[id]/edit',
    '/account',
    '/account/settings',
    '/account/settings/password',
    '/account/settings/delete',
    '/account/billing',
    '/account/privacy',
    
    // Household Management
    '/household/settings',
    '/household/invite/[token]',
    '/life-vision/household',
    
    // Vibration Assessment
    '/assessment',
    '/assessment/[id]/in-progress',
    '/assessment/[id]/results',
    '/assessment/history',
    '/assessment/[id]',

    // Vibrational System
    '/scenes/builder',

    // Voice Profile System - hidden for now, feature preserved for future use
    // '/voice-profile',
    // '/voice-profile/quiz',
    // '/voice-profile/analyze',
    
    // Activation Intensive Program
    '/intensive',
    '/intensive/activate',
    '/map',
    '/intensive/builder',
    '/intensive/calibration',
    '/intensive/call-prep',
    '/intensive/check-email',
    '/intensive/dashboard',
    '/intensive/intake',
    '/intensive/refine-vision',
    '/intensive/schedule-call',
    
    // Billing & Payments
    '/billing',
    
    // Framework & Resources
    '/framework/emotional-guidance-scale',
    
    // Support
    '/support',
    
    // Video Sessions (member list)
    '/sessions',
    
    // Alignment Gym (Graduate Unlock)
    '/alignment-gym',
  ],
  
  /**
   * ADMIN PAGES - Admin panel and management tools
   * Layout: SidebarLayout (admin nav) + MobileBottomNav + PageLayout
   * 
   * NOTE: All routes starting with /admin are automatically classified as ADMIN
   * by the getPageType() function. This list is kept for reference and explicit routes.
   */
  ADMIN: [
    // User Management
    '/admin/users',
    '/admin/token-usage',
    
    // CRM & Marketing
    '/admin/crm/dashboard',
    '/admin/crm/campaigns',
    '/admin/crm/campaigns/new',
    '/admin/crm/campaigns/[id]',
    '/admin/crm/campaigns/[id]/edit',
    '/admin/crm/leads',
    '/admin/crm/leads/board',
    '/admin/crm/leads/[id]',
    '/admin/crm/members',
    '/admin/crm/members/board',
    '/admin/crm/members/[id]',
    '/admin/crm/support/board',
    '/admin/crm/support/[id]',
    '/admin/crm/utm-builder',
    
    // Email Management
    '/admin/emails',
    '/admin/emails/list',
    '/admin/emails/sent',
    '/admin/emails/test',
    '/admin/emails/templates/[id]',
    '/admin/emails/[id]',
    '/admin/emails/[id]/edit',
    
    // Content Management
    '/admin/assets',
    '/admin/vibrational-event/sources',
    
    // AI & Models
    '/admin/ai-models',
    '/admin/audio-mixer',
    
    // Scheduling (Universal)
    '/admin/scheduling',
    
    // Intensive Program
    '/admin/intensive/schedule-call',
    '/admin/intensive/tester',
    
    // Developer Tools
    '/sitemap',
    '/design-system',
    '/design-system/component/[componentName]',
    '/design-system/template/[templateName]',
    '/design-system/experiment',
  ],
  
  /**
   * PUBLIC PAGES - Marketing, auth, and public utilities
   * Layout: Header + Footer + PageLayout (no sidebar)
   */
  PUBLIC: [
    // Marketing Pages
    '/',
    '/privacy-policy',
    '/terms-of-service',
    
    // Authentication
    '/auth/login',
    '/auth/signup',
    '/auth/verify',
    '/auth/setup-password',
    '/auth/logout',
    '/auth/callback',
    '/auth/auto-login',
    
    // Checkout & Success Pages
    '/checkout',
    '/billing/success',
    
    // Public Utilities
    '/vision/build',
    
    // Development/Testing (public for development)
    '/debug/email',
    '/test-recording',
    
    // Experiment Pages (development)
    '/experiment',
    '/experiment/design-system',
    '/experiment/design-system/component/[componentName]',
    '/experiment/old-home',
    
    // Video Session Join (accessible without auth, prompts login)
    '/session/[id]',
  ],
} as const

/**
 * Determines the page type (USER, ADMIN, PUBLIC) for a given pathname.
 * 
 * @param pathname - The current pathname (e.g., '/dashboard' or '/life-vision/123')
 * @returns The page type classification
 * 
 * @example
 * ```ts
 * const pageType = getPageType('/dashboard') // 'USER'
 * const pageType = getPageType('/auth/login') // 'PUBLIC'
 * const pageType = getPageType('/life-vision/abc-123') // 'USER' (matches /life-vision/[id])
 * const pageType = getPageType('/admin/users') // 'ADMIN' (automatic /admin classification)
 * ```
 */
export function getPageType(pathname: string): PageType {
  // Normalize pathname
  const normalized = pathname.split('?')[0] // Remove query params
  
  // AUTOMATIC ADMIN CLASSIFICATION: All routes starting with /admin are ADMIN
  if (normalized.startsWith('/admin')) {
    return 'ADMIN'
  }
  
  // Check USER pages (most common)
  for (const page of PAGE_CLASSIFICATIONS.USER) {
    if (matchesRoute(normalized, page)) {
      return 'USER'
    }
  }
  
  // Check ADMIN pages (for explicit routes, though /admin prefix already covers most)
  for (const page of PAGE_CLASSIFICATIONS.ADMIN) {
    if (matchesRoute(normalized, page)) {
      return 'ADMIN'
    }
  }
  
  // Default to PUBLIC
  return 'PUBLIC'
}

/**
 * Checks if a pathname matches a route pattern.
 * Handles dynamic routes like /life-vision/[id] matching /life-vision/123
 * 
 * @param pathname - Actual pathname (e.g., '/life-vision/123')
 * @param route - Route pattern (e.g., '/life-vision/[id]' or '/dashboard')
 * @returns True if pathname matches route pattern
 */
function matchesRoute(pathname: string, route: string): boolean {
  // Exact match
  if (pathname === route) {
    return true
  }
  
  // Check if pathname starts with route (for non-dynamic routes)
  if (!route.includes('[') && pathname.startsWith(route + '/')) {
    return true
  }
  
  // Handle dynamic routes: /life-vision/[id] matches /life-vision/123
  if (route.includes('[')) {
    // Convert route pattern to regex
    // /life-vision/[id] -> /^\/life-vision\/[^/]+$/
    // /life-vision/[id]/refine -> /^\/life-vision\/[^/]+\/refine$/
    const pattern = route
      .replace(/\[([^\]]+)\]/g, '[^/]+') // Replace [id] with [^/]+
      .replace(/\//g, '\\/')              // Escape slashes
    
    const regex = new RegExp(`^${pattern}(/.*)?$`)
    return regex.test(pathname)
  }
  
  return false
}

/**
 * Check if a page requires authentication
 */
export function requiresAuth(pathname: string): boolean {
  const pageType = getPageType(pathname)
  return pageType === 'USER' || pageType === 'ADMIN'
}

/**
 * Check if a page is only accessible to admins
 */
export function requiresAdmin(pathname: string): boolean {
  return getPageType(pathname) === 'ADMIN'
}

/**
 * Get all pages of a specific type
 */
export function getPagesByType(type: PageType): readonly string[] {
  return PAGE_CLASSIFICATIONS[type]
}

/**
 * Get total page count
 */
export function getTotalPageCount(): number {
  return (
    PAGE_CLASSIFICATIONS.USER.length +
    PAGE_CLASSIFICATIONS.ADMIN.length +
    PAGE_CLASSIFICATIONS.PUBLIC.length
  )
}

