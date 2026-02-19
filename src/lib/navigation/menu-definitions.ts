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
  Video,
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
  Music,
  Map,
  Award,
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
 * Navigation group structure for collapsible sidebar sections
 */
export interface NavGroup {
  name: string
  items: NavItem[]
  isCollapsible: boolean
  defaultCollapsed: boolean
  icon?: LucideIcon
}

/**
 * USER NAVIGATION - Main sidebar navigation for logged-in users
 * Used in: Sidebar component, MobileBottomNav
 * 
 * Structure: Top-level items (always visible) + Collapsible groups
 */
export const userNavigation: (NavItem | NavGroup)[] = [
  // =================================================================
  // TOP LEVEL - Always Visible (Spiritual Work & Daily Practice)
  // =================================================================
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Run your MAP and stay connected',
  },
  {
    name: 'MAP',
    href: '/map',
    icon: Map,
    description: 'My Activation Plan - Your 28-day roadmap',
  },
  {
    name: 'Life Vision',
    href: '/life-vision/active',
    icon: Target,
    description: 'My Active Vision',
  },
  {
    name: 'Audio',
    href: '/life-vision/audio',
    icon: Headphones,
    description: 'Key AM/PM/Sleep audio sets',
  },
  {
    name: 'Vision Board',
    href: '/vision-board',
    icon: Image,
    description: 'My Vision Board',
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: BookOpen,
    description: 'My Journal',
  },
  {
    name: 'Daily Paper',
    href: '/daily-paper',
    icon: FileText,
    description: 'Daily activations tracking',
  },
  {
    name: 'Alignment Gym',
    href: '/alignment-gym',
    icon: Video,
    description: 'Weekly live group coaching sessions',
  },
  {
    name: 'Vibe Tribe',
    href: '/vibe-tribe',
    icon: UsersRound,
    description: 'Connect with the VibrationFit community',
  },
]

/**
 * USER NAVIGATION GROUPS - Collapsible groups for power users
 * These appear below the top-level items in a collapsed state by default
 */
export const userNavigationGroups: NavGroup[] = [
  // =================================================================
  // GROUP 1: Tracking & Activity (Rearview Mirror)
  // =================================================================
  {
    name: 'Tracking & Activity',
    isCollapsible: true,
    defaultCollapsed: true,
    items: [
      {
        name: 'Tracking',
        href: '/tracking',
        icon: TrendingUp,
        description: 'Streaks, badges, and performance metrics',
      },
      {
        name: 'Activity',
        href: '/dashboard/activity',
        icon: BarChart3,
        description: 'Activity feed and timeline',
      },
      {
        name: 'Abundance Tracker',
        href: '/abundance-tracker',
        icon: DollarSign,
        description: 'Track abundance and prosperity',
      },
      {
        name: 'Badges',
        href: '/snapshot/me',
        icon: Award,
        description: 'Your activation badges',
      },
    ],
  },
  // =================================================================
  // GROUP 2: Creations & Updates (Power User Tools)
  // =================================================================
  {
    name: 'Creations & Updates',
    isCollapsible: true,
    defaultCollapsed: true,
    items: [
      {
        name: 'Profile & Assessment',
        href: '/profile',
        icon: User,
        hasDropdown: true,
        children: [
          { name: 'My Active Profile', href: '/profile/active', icon: CheckCircle },
          { name: 'Assessment', href: '/assessment', icon: Brain },
        ],
      },
      {
        name: 'Life Vision Studio',
        href: '/life-vision',
        icon: Target,
        hasDropdown: true,
        children: [
          { name: 'All Visions', href: '/life-vision', icon: Eye },
          { name: 'Household Visions', href: '/life-vision/household', icon: Users },
          { name: 'New Vision', href: '/life-vision/new', icon: Plus },
        ],
      },
      {
        name: 'Audio Studio',
        href: '/life-vision/audio',
        icon: Headphones,
        hasDropdown: true,
        children: [
          { name: 'All Vision Audios', href: '/life-vision/audio', icon: Music },
        ],
      },
      {
        name: 'Vision Board Builder',
        href: '/vision-board',
        icon: Image,
        hasDropdown: true,
        children: [
          { name: 'New Item', href: '/vision-board/new', icon: Plus },
        ],
      },
    ],
  },
  // =================================================================
  // GROUP 3: System & Billing (Administrative)
  // =================================================================
  {
    name: 'System & Billing',
    isCollapsible: true,
    defaultCollapsed: true,
    items: [
      {
        name: 'Billing & Subscription',
        href: '/billing',
        icon: CreditCard,
        description: 'Payment and subscription',
      },
      {
        name: 'Tokens',
        href: '/dashboard/tokens',
        icon: Zap,
        hasDropdown: true,
        description: 'Manage Creation Credits',
        children: [
          { name: 'Token Dashboard', href: '/dashboard/tokens', icon: Zap },
          { name: 'Token History', href: '/dashboard/token-history', icon: BarChart3 },
          { name: 'Buy Tokens', href: '/dashboard/add-tokens', icon: ShoppingCart },
        ],
      },
      {
        name: 'Storage',
        href: '/dashboard/storage',
        icon: HardDrive,
        hasDropdown: true,
        description: 'File storage management',
        children: [
          { name: 'Storage Dashboard', href: '/dashboard/storage', icon: HardDrive },
          { name: 'Storage History', href: '/dashboard/storage-history', icon: BarChart3 },
          { name: 'Buy Storage', href: '/dashboard/add-storage', icon: ShoppingCart },
        ],
      },
      {
        name: 'Support',
        href: '/support/tickets',
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
          { name: 'Account Settings', href: '/account/settings', icon: User },
          { name: 'Household Settings', href: '/household/settings', icon: Users },
        ],
      },
    ],
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
  // EMAIL MANAGEMENT
  // ============================================================================
  {
    name: 'Email System',
    href: '/admin/emails',
    icon: Mail,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Email templates and delivery',
    children: [
      { name: 'Email Dashboard', href: '/admin/emails', icon: Mail, description: 'Email management overview' },
      { name: 'All Emails', href: '/admin/emails/list', icon: FileText, description: 'View all sent emails' },
      { name: 'Sent Emails', href: '/admin/emails/sent', icon: FileText, description: 'Email delivery history' },
      { name: 'Test Email', href: '/admin/emails/test', icon: Wand2, description: 'Send test emails' },
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
      { name: 'Vibrational Sources', href: '/admin/vibrational-event/sources', icon: Activity, description: 'Manage vibrational data sources' },
    ]
  },
  
  // ============================================================================
  // AUDIO MANAGEMENT
  // ============================================================================
  {
    name: 'Audio',
    href: '/admin/audio-mixer',
    icon: Music,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Audio mixing and generation tools',
    children: [
      { name: 'Audio Mixer', href: '/admin/audio-mixer', icon: Headphones, description: 'Manage audio tracks and mixing' },
      { name: 'Audio Generator', href: '/admin/audio-generator', icon: Wand2, description: 'Generate Solfeggio & Binaural tracks' },
      { name: 'Ambient Designer', href: '/admin/audio-designer', icon: Music, description: 'Create custom rain, ocean, waterfall sounds' },
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
    ]
  },
  
  // ============================================================================
  // SCHEDULING (Universal)
  // ============================================================================
  {
    name: 'Scheduling',
    href: '/admin/scheduling',
    icon: Calendar,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Manage availability for all event types',
    children: [
      { name: 'All Schedules', href: '/admin/scheduling', icon: Calendar, description: 'Manage all scheduling' },
      { name: 'Sessions', href: '/admin/sessions', icon: Video, description: 'View booked sessions' },
    ]
  },

  // ============================================================================
  // INTENSIVE PROGRAM
  // ============================================================================
  {
    name: 'Intensive Program',
    href: '/admin/intensive/tester',
    icon: Rocket,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Manage Activation Intensive program',
    children: [
      { name: 'Intensive Tester', href: '/admin/intensive/tester', icon: Rocket, description: 'Test intensive flows' },
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
 * 
 * MAP-aligned navigation: Prioritizes daily and weekly MAP reps
 */
export const mobileNavigation: NavItem[] = [
  {
    name: 'MAP',
    href: '/map',
    icon: Map,
    description: 'My Activation Plan',
  },
  {
    name: 'Audio',
    href: '/life-vision/active/audio/sets',
    icon: Headphones,
    description: 'Vision Audio Sets',
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
    name: 'More',
    href: '#',
    icon: Settings,
    description: 'More options',
    // This is the "More" button that opens drawer with Align tools at top
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
 * Check if a pathname matches a specific navigation item.
 * 
 * PRINCIPLE: Only ONE item should be highlighted at a time.
 * - Exact matches win
 * - Parent dropdowns are NEVER highlighted (only their children)
 * - Child items use EXACT matching only (no startsWith)
 * - Only top-level non-dropdown items can match via startsWith
 */
export function isNavItemActive(
  item: NavItem,
  pathname: string,
  activeProfileId?: string | null,
  isChildOfDropdown: boolean = false
): boolean {
  // RULE 1: Parent dropdown items are NEVER highlighted
  // The sidebar will show them as "expanded" but not "active"
  if (item.hasDropdown && item.children) {
    return false
  }
  
  // RULE 2: Exact match - highest priority (always works)
  if (item.href === pathname) {
    return true
  }
  
  // RULE 3: For children of dropdowns, ONLY exact matches count
  // This prevents "/life-vision" from matching when on "/life-vision/household"
  if (isChildOfDropdown) {
    // Special case: /life-vision/active should match /life-vision/[uuid]
    if (item.href === '/life-vision/active') {
      if (pathname.match(/^\/life-vision\/[a-f0-9-]{36}(\/|$)/)) {
        return true
      }
    }
    
    // Special case: /profile/active should match /profile/[uuid] if it's the active profile
    if (item.href === '/profile/active') {
      const uuidMatch = pathname.match(/^\/profile\/([a-f0-9-]{36})(\/|$)/)
      if (uuidMatch) {
        return uuidMatch[1] === activeProfileId
      }
    }
    
    // For all other dropdown children, ONLY exact match
    return false
  }
  
  // RULE 4: Top-level items without dropdowns can match nested routes
  // e.g., Dashboard matching /dashboard/anything
  if (!item.hasDropdown && !item.children) {
    // Special handling for specific items
    if (item.href === '/journal') {
      if (pathname.match(/^\/journal\/[a-f0-9-]{36}(\/|$)/) || pathname === '/journal/new' || pathname.startsWith('/journal/daily-paper')) {
        return true
      }
    }
    
    if (item.href === '/vision-board') {
      if (pathname.match(/^\/vision-board\/[a-f0-9-]{36}(\/|$)/) || pathname === '/vision-board/new') {
        return true
      }
    }
    
    if (item.href === '/assessment') {
      if (pathname.startsWith('/assessment/')) {
        return true
      }
    }
    
    if (item.href === '/vibe-tribe') {
      if (pathname.startsWith('/vibe-tribe/')) {
        return true
      }
    }
    
    if (item.href === '/dashboard') {
      // Dashboard is exact match only, don't match /dashboard/tokens etc.
      return false
    }
    
    // Special handling for dynamic Audio link (mobile nav)
    // Match /life-vision/[uuid]/audio/sets or /life-vision/[uuid]/audio/*
    if (item.href.match(/^\/life-vision\/[a-f0-9-]{36}\/audio\/sets$/)) {
      if (pathname.match(/^\/life-vision\/[a-f0-9-]{36}\/audio/)) {
        return true
      }
    }
    
    // Special handling for /map
    if (item.href === '/map') {
      // Exact match only
      return false
    }
  }
  
  return false
}

