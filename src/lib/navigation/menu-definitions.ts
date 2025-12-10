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
  CheckCircle,
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
  Mail,
  DollarSign,
  Database,
  Code,
  LayoutDashboard,
  UserCog,
  Boxes,
  Wand2,
  Activity,
  Rocket,
  Wrench,
  TrendingUp,
  UserPlus,
  Megaphone,
  Link2,
  Headset,
  Kanban,
  UserCheck,
  UsersRound,
  BookOpen,
  Star,
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
      { name: 'My Active Profile', href: '/profile/active', icon: CheckCircle },
      { name: 'Edit Profile', href: '/profile/edit', icon: Edit },
      { name: 'All Profiles', href: '/profile', icon: Eye },
      { name: 'Voice Profile', href: '/voice-profile', icon: Palette },
    ]
  },
  {
    name: 'Life Vision',
    href: '/life-vision',
    icon: Target,
    hasDropdown: true,
    description: 'Create and manage your life vision',
    children: [
      { name: 'My Active Vision', href: '/life-vision/active', icon: CheckCircle },
      { name: 'All Visions', href: '/life-vision', icon: Eye },
      { name: 'All Vision Audios', href: '/life-vision/audio', icon: Headphones },
    ]
  },
  {
    name: 'Assessment',
    href: '/assessment',
    icon: Brain,
    description: 'Vibration assessment',
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
    icon: BookOpen,
    hasDropdown: true,
    description: 'Conscious creation journal',
    children: [
      { name: 'My Journal', href: '/journal', icon: Zap },
      { name: 'New Entry', href: '/journal/new', icon: Plus },
    ]
  },
  {
    name: 'Tracking',
    href: '/daily-paper',
    icon: TrendingUp,
    hasDropdown: true,
    description: 'Track your daily progress and abundance',
    children: [
      { name: 'Daily Paper', href: '/daily-paper', icon: FileText },
      { name: 'Abundance Tracker', href: '/abundance-tracker', icon: Star },
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
    name: 'Support',
    href: '/support',
    icon: Users,
    description: 'Get help and support',
  },
  {
    name: 'Settings',
    href: '/account/settings',
    icon: Settings,
    hasDropdown: true,
    description: 'Account and preferences',
    children: [
      { name: 'Account Settings', href: '/account/settings', icon: User, description: 'Email, password, notifications' },
      { name: 'Household Settings', href: '/household/settings', icon: Users, description: 'Manage household members' },
      { name: 'Billing & Subscription', href: '/billing', icon: CreditCard, description: 'Payment and subscription' },
    ]
  },
]

/**
 * ADMIN NAVIGATION - Admin panel navigation
 * Used in: Sidebar component when isAdmin=true
 * 
 * Comprehensive admin navigation with all management features organized by category
 */
export const adminNavigation: NavItem[] = [
  // ============================================================================
  // OVERVIEW & DASHBOARD
  // ============================================================================
  {
    name: 'Admin Dashboard',
    href: '/admin/users',
    icon: LayoutDashboard,
    requiresAdmin: true,
    description: 'Admin overview and quick access',
  },
  
  // ============================================================================
  // USER MANAGEMENT
  // ============================================================================
  {
    name: 'User Management',
    href: '/admin/users',
    icon: UserCog,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Manage users, roles, and permissions',
    children: [
      { name: 'All Users', href: '/admin/users', icon: Users, description: 'View and manage all users' },
      { name: 'Token Analytics', href: '/admin/token-usage', icon: BarChart3, description: 'User token usage analytics' },
    ]
  },
  
  // ============================================================================
  // CRM & MARKETING
  // ============================================================================
  {
    name: 'CRM & Marketing',
    href: '/admin/crm/dashboard',
    icon: TrendingUp,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Campaigns, leads, and customer success',
    children: [
      { name: 'CRM Dashboard', href: '/admin/crm/dashboard', icon: LayoutDashboard, description: 'CRM overview and metrics' },
      { name: 'Campaigns', href: '/admin/crm/campaigns', icon: Megaphone, description: 'Marketing campaigns and tracking' },
      { name: 'New Campaign', href: '/admin/crm/campaigns/new', icon: Plus, description: 'Create new campaign' },
      { name: 'Leads', href: '/admin/crm/leads', icon: UserPlus, description: 'Lead management' },
      { name: 'Leads Board', href: '/admin/crm/leads/board', icon: Kanban, description: 'Kanban board for leads' },
      { name: 'Members', href: '/admin/crm/members', icon: UserCheck, description: 'Platform members management' },
      { name: 'Members Board', href: '/admin/crm/members/board', icon: Kanban, description: 'Kanban board for members' },
      { name: 'Support Board', href: '/admin/crm/support/board', icon: Headset, description: 'Support tickets board' },
      { name: 'UTM Builder', href: '/admin/crm/utm-builder', icon: Link2, description: 'Build UTM tracking URLs' },
    ]
  },
  
  // ============================================================================
  // CONTENT MANAGEMENT
  // ============================================================================
  {
    name: 'Content',
    href: '/admin/assets',
    icon: Boxes,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Manage site content and assets',
    children: [
      { name: 'Site Assets', href: '/admin/assets', icon: Upload, description: 'Upload and manage media assets' },
      { name: 'Email Templates', href: '/admin/emails', icon: Mail, description: 'Manage email templates' },
      { name: 'Email List', href: '/admin/emails/list', icon: FileText, description: 'View all emails' },
      { name: 'Vibrational Sources', href: '/admin/vibrational-event/sources', icon: Activity, description: 'Manage vibrational data sources' },
    ]
  },
  
  // ============================================================================
  // AI & INTELLIGENCE
  // ============================================================================
  {
    name: 'AI & Models',
    href: '/admin/ai-models',
    icon: Brain,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Configure AI models and pricing',
    children: [
      { name: 'AI Model Config', href: '/admin/ai-models', icon: Wand2, description: 'Configure AI model settings' },
      { name: 'Audio Mixer', href: '/admin/audio-mixer', icon: Headphones, description: 'Audio mixing and generation' },
    ]
  },
  
  // ============================================================================
  // INTENSIVE PROGRAM
  // ============================================================================
  {
    name: 'Intensive Program',
    href: '/admin/intensive/schedule-call',
    icon: Rocket,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Manage Activation Intensive program',
    children: [
      { name: 'Schedule Calls', href: '/admin/intensive/schedule-call', icon: Calendar, description: 'Schedule intensive coaching calls' },
    ]
  },
  
  // ============================================================================
  // DEVELOPER TOOLS
  // ============================================================================
  {
    name: 'Developer',
    href: '/design-system',
    icon: Code,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Developer tools and documentation',
    children: [
      { name: 'Design System', href: '/design-system', icon: Palette, description: 'Component library showcase' },
      { name: 'Sitemap', href: '/sitemap', icon: Layers, description: 'Complete site navigation map' },
    ]
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
    icon: BookOpen,
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
  if (pathname.match(/^\/life-vision\/[^\/]+$/) && !pathname.includes('/active') && !pathname.includes('/audio') && !pathname.includes('/new')) {
    // If this is the "My Active Vision" menu item, mark it as active for vision detail pages
    if (item.href === '/life-vision/active') {
      return true
    }
    // Don't mark "All Visions" as active for individual vision pages
    if (item.href === '/life-vision') {
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
    // Don't mark "All Profiles" list page as active when viewing individual profile
    if (item.href === '/profile') {
      return false
    }
  }
  
  // Special handling for other detail pages - don't match parent list pages
  // Match pattern: /parent/[uuid-like-id] but NOT /parent/specific-route-name
  const isDetailPage = pathname.match(/^\/([^\/]+)\/[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/)
  if (isDetailPage) {
    const parentPath = '/' + isDetailPage[1]
    // Don't mark parent list page as active when on detail page
    if (item.href === parentPath) {
      return false
    }
  }
  
  // Check if pathname starts with item href (for nested routes)
  // But exclude parent items that have children (dropdowns) - let children match instead
  if (pathname.startsWith(item.href + '/')) {
    // Special case: Don't match "/life-vision" for "/life-vision/audio" paths
    if (item.href === '/life-vision' && pathname.startsWith('/life-vision/audio')) {
      return false
    }
    
    // Don't match parent dropdown items, let their children match
    if (item.hasDropdown && item.children) {
      return false
    }
    return true
  }
  
  // Check children
  if (item.children) {
    return item.children.some(child => isNavItemActive(child, pathname, activeProfileId))
  }
  
  return false
}

