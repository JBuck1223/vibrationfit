/**
 * VibrationFit Navigation Menu Definitions
 * 
 * Master definition of all navigation menus and menu items.
 * This is the single source of truth for sidebar, mobile, and header navigation.
 * 
 * USAGE:
 * - Import navigation arrays in Sidebar, MobileBottomNav, Header
 * - Keep menu items synchronized with page classifications
 */

import {
  Home,
  User,
  Target,
  FileText,
  Image,
  Calendar,
  Settings,
  BarChart3,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Brain,
  Zap,
  ChevronDown,
  Plus,
  Eye,
  Edit,
  ShoppingCart,
  HardDrive,
  X,
  Palette,
  Shield,
  Layers,
  Upload,
  Headphones,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

/**
 * Navigation menu item structure
 */
export interface NavItem {
  name: string
  href: string
  icon: LucideIcon
  badge?: string
  children?: NavItem[]
  hasDropdown?: boolean
  requiresAuth?: boolean
  requiresAdmin?: boolean
  description?: string
}

/**
 * USER NAVIGATION - Main sidebar navigation for logged-in users
 * Used in: Sidebar component, MobileBottomNav
 */
export const userNavigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Main dashboard overview',
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    hasDropdown: true,
    description: 'Manage your profile',
    children: [
      { name: 'My Active Profile', href: '/profile/active', icon: Zap },
      { name: 'Edit Profile', href: '/profile/edit', icon: Edit },
      { name: 'All Profiles', href: '/profile', icon: Eye },
      { name: 'Voice Profile', href: '/voice-profile', icon: Palette },
      { name: 'Voice Quiz', href: '/voice-profile/quiz', icon: Sparkles },
    ]
  },
  {
    name: 'Life Vision',
    href: '/life-vision',
    icon: Target,
    hasDropdown: true,
    description: 'Create and manage your life vision',
    children: [
      { name: 'My Active Vision', href: '/life-vision/active', icon: Zap },
      { name: 'Refine Vision', href: '/life-vision/refine', icon: Edit },
      { name: 'All Visions', href: '/life-vision', icon: Eye },
      { name: 'All Vision Audios', href: '/life-vision/audio', icon: Headphones },
    ]
  },
  {
    name: 'Assessment',
    href: '/assessment',
    icon: Brain,
    hasDropdown: true,
    description: 'Vibration assessment',
    children: [
      { name: 'See Assessments', href: '/assessment', icon: Eye },
      { name: 'View Results', href: '/assessment/results', icon: BarChart3 },
    ]
  },
  {
    name: 'Vision Board',
    href: '/vision-board',
    icon: Image,
    hasDropdown: true,
    description: 'Visual vision board',
    children: [
      { name: 'My Vision Board', href: '/vision-board', icon: Zap },
      { name: 'New Item', href: '/vision-board/new', icon: Plus },
    ]
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: FileText,
    hasDropdown: true,
    description: 'Conscious creation journal',
    children: [
      { name: 'My Journal', href: '/journal', icon: Zap },
      { name: 'New Entry', href: '/journal/new', icon: Plus },
    ]
  },
  {
    name: 'VIVA',
    href: '/viva',
    icon: Sparkles,
    hasDropdown: true,
    description: 'Vibrational Intelligence Virtual Assistant',
    children: [
      { name: 'Chat with VIVA', href: '/viva', icon: Sparkles },
      { name: 'Create Life Vision', href: '/life-vision/new', icon: Target },
    ]
  },
  {
    name: 'Activity',
    href: '/dashboard/activity',
    icon: BarChart3,
    description: 'Activity feed and timeline',
  },
  {
    name: 'Token Tracking',
    href: '/dashboard/tokens',
    icon: Zap,
    hasDropdown: true,
    description: 'Manage Creation Credits',
    children: [
      { name: 'Creation Credits', href: '/dashboard/tokens', icon: Zap },
      { name: 'Token History', href: '/dashboard/token-history', icon: BarChart3 },
      { name: 'Buy Tokens', href: '/dashboard/add-tokens', icon: ShoppingCart },
    ]
  },
  {
    name: 'Storage',
    href: '/dashboard/storage',
    icon: HardDrive,
    hasDropdown: true,
    description: 'File storage management',
    children: [
      { name: 'Storage Usage', href: '/dashboard/storage', icon: Eye },
    ]
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    description: 'Subscription and billing',
  },
  {
    name: 'Support',
    href: '/support',
    icon: Users,
    description: 'Get help and support',
  },
]

/**
 * ADMIN NAVIGATION - Admin panel navigation
 * Used in: Sidebar component when isAdmin=true
 */
export const adminNavigation: NavItem[] = [
  {
    name: 'Admin Dashboard',
    href: '/admin/users',
    icon: Shield,
    requiresAdmin: true,
    description: 'Admin dashboard',
  },
  {
    name: 'User Management',
    href: '/admin/users',
    icon: Users,
    requiresAdmin: true,
    description: 'Manage all users',
  },
  {
    name: 'AI Models',
    href: '/admin/ai-models',
    icon: Brain,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Configure AI models',
    children: [
      { name: 'AI Models', href: '/admin/ai-models', icon: Brain },
    ]
  },
  {
    name: 'Vibrational Sources',
    href: '/admin/vibrational-event/sources',
    icon: Layers,
    requiresAdmin: true,
    description: 'Manage vibrational ingesters',
  },
  {
    name: 'Token Analytics',
    href: '/admin/token-usage',
    icon: Zap,
    requiresAdmin: true,
    description: 'Token usage analytics',
  },
  {
    name: 'Site Assets',
    href: '/admin/assets',
    icon: Upload,
    requiresAdmin: true,
    description: 'Manage site assets and media',
  },
  {
    name: 'Audio Mixer',
    href: '/admin/audio-mixer',
    icon: Zap,
    requiresAdmin: true,
    description: 'Audio mixing tracks',
  },
  {
    name: 'Design System',
    href: '/design-system',
    icon: Palette,
    requiresAdmin: true,
    description: 'Design system showcase',
  },
  {
    name: 'Sitemap',
    href: '/sitemap',
    icon: Layers,
    requiresAdmin: true,
    description: 'Complete site map',
  },
]

/**
 * MOBILE NAVIGATION - Key navigation items for mobile bottom bar
 * Used in: MobileBottomNav component
 */
export const mobileNavigation: NavItem[] = [
  {
    name: 'Vision',
    href: '/life-vision/active',
    icon: Target,
    description: 'Life Vision',
  },
  {
    name: 'Board',
    href: '/vision-board',
    icon: Image,
    description: 'Vision Board',
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: FileText,
    description: 'Journal',
  },
  {
    name: 'VIVA',
    href: '/viva',
    icon: Sparkles,
    description: 'VIVA Assistant',
  },
  {
    name: 'More',
    href: '#',
    icon: Settings,
    description: 'More options',
    // This is the "More" button that opens drawer
  },
]

/**
 * HEADER DROPDOWN MENU - Account dropdown in public header
 * Used in: Header component account dropdown
 */
export const headerAccountMenu: NavItem[] = [
  {
    name: 'My Profile',
    href: '/profile',
    icon: User,
    description: 'View your profile',
  },
  {
    name: 'Activity Feed',
    href: '/dashboard/activity',
    icon: BarChart3,
    description: 'View activity timeline',
  },
  {
    name: 'Token Usage',
    href: '/dashboard/tokens',
    icon: Zap,
    description: 'View token usage',
  },
  {
    name: 'Storage',
    href: '/dashboard/storage',
    icon: HardDrive,
    description: 'Manage storage',
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
    description: 'Manage billing',
  },
  {
    name: 'Settings',
    href: '/account/settings',
    icon: Settings,
    description: 'Account settings',
  },
]

/**
 * Get navigation items filtered by requirements
 */
export function getFilteredNavigation(
  items: NavItem[],
  options: {
    user?: { isAuthenticated: boolean; isAdmin?: boolean }
  } = {}
): NavItem[] {
  const { user } = options
  
  return items.filter(item => {
    // Filter by auth requirement
    if (item.requiresAuth && !user?.isAuthenticated) {
      return false
    }
    
    // Filter by admin requirement
    if (item.requiresAdmin && !user?.isAdmin) {
      return false
    }
    
    // Filter children recursively
    if (item.children) {
      item.children = getFilteredNavigation(item.children, options)
    }
    
    return true
  })
}

/**
 * Find a navigation item by href
 */
export function findNavItemByHref(
  items: NavItem[],
  href: string
): NavItem | null {
  for (const item of items) {
    if (item.href === href) {
      return item
    }
    
    if (item.children) {
      const found = findNavItemByHref(item.children, href)
      if (found) {
        return found
      }
    }
  }
  
  return null
}

/**
 * Check if a pathname matches any navigation item (including children)
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  activeProfileId?: string | null
): boolean {
  // Exact match
  if (item.href === pathname) {
    return true
  }
  
  // Special handling for /life-vision/{id} paths - should match "My Active Vision"
  // Check if we're on a specific vision detail page
  if (pathname.match(/^\/life-vision\/[^\/]+$/) && !pathname.includes('/refine') && !pathname.includes('/active') && !pathname.includes('/audio')) {
    // If this is the "My Active Vision" menu item, mark it as active for vision detail pages
    if (item.href === '/life-vision/active') {
      return true
    }
    // Don't mark "All Visions" as active for individual vision pages
    if (item.href === '/life-vision' && !item.children) {
      return false
    }
  }
  
  // Special handling for /profile/{id} paths - check if it's the active profile
  // Check if we're on a specific profile detail page
  if (pathname.match(/^\/profile\/[^\/]+$/) && !pathname.includes('/edit') && !pathname.includes('/active') && !pathname.includes('/compare') && !pathname.includes('/new')) {
    // Extract profile ID from pathname
    const profileIdMatch = pathname.match(/^\/profile\/([^\/]+)$/)
    const currentProfileId = profileIdMatch ? profileIdMatch[1] : null
    
    // If this is the "My Active Profile" menu item, only mark it as active if viewing the active profile
    if (item.href === '/profile/active') {
      return currentProfileId === activeProfileId
    }
    // If this is the "All Profiles" menu item, mark it as active if viewing a non-active profile
    if (item.href === '/profile' && !item.children) {
      return currentProfileId !== activeProfileId
    }
  }
  
  // Check if pathname starts with item href (for nested routes)
  // But exclude the case where we're on /life-vision (exact) and checking /life-vision/active
  // Also exclude /profile (exact) when checking /profile/active
  if (pathname.startsWith(item.href + '/') && item.href !== '/life-vision' && item.href !== '/profile') {
    return true
  }
  
  // Check children
  if (item.children) {
    return item.children.some(child => isNavItemActive(child, pathname, activeProfileId))
  }
  
  return false
}

