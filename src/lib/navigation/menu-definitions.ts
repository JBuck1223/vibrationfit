/**
 * Vibration Fit Navigation Menu Definitions
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
  Inbox,
  Mail,
  DollarSign,
  Database,
  Code,
  Archive,
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
  MessageSquare,
  Radio,
  GitBranch,
  Send,
  Bell,
  Fingerprint,
  GraduationCap,
  Share2,
  Library,
  Film,
  Music2,
  Mic,
  FolderKanban,
  Flame,
  Presentation,
  Sparkles,
  Lightbulb,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { SLIDE_DECKS } from '@/lib/slide-decks/catalog'

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
 * USER NAVIGATION - Primary links at the top of the member sidebar
 */
export const userNavigationPrimary: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Run your MAP and stay connected',
  },
  {
    name: 'VIVA',
    href: '/viva',
    icon: Sparkles,
    description: 'Talk with VIVA',
  },
]

/**
 * USER NAVIGATION GROUPS - Journey sections below the primary links
 */
export const userNavigationGroups: NavGroup[] = [
  {
    name: 'Capture',
    isCollapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: 'Daily Paper',
        href: '/daily-paper',
        icon: FileText,
        description: 'Daily activations tracking',
      },
      {
        name: 'Journal',
        href: '/journal',
        icon: BookOpen,
        description: 'My Journal',
      },
      {
        name: 'Abundance',
        href: '/abundance-tracker',
        icon: DollarSign,
        description: 'Dashboard and log for abundance moments',
      },
    ],
  },
  {
    name: 'Choose',
    isCollapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: 'Life Vision',
        href: '/life-vision',
        icon: Target,
        description: 'My Active Vision',
      },
      {
        name: 'Manifestations',
        href: '/manifestations',
        icon: Image,
        description: 'My Manifestations',
      },
      {
        name: 'Assessment',
        href: '/assessment',
        icon: Brain,
        description: 'Vibrational assessment and results',
      },
    ],
  },
  {
    name: 'Activate',
    isCollapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: 'Stories',
        href: '/story',
        icon: Library,
        description: 'Focus Stories',
      },
      {
        name: 'Incantations',
        href: '/story?kind=incantation',
        icon: Mic,
        description: 'Spoken force statements',
      },
      {
        name: 'SparkQueries',
        href: '/story?kind=spark_query',
        icon: Lightbulb,
        description: 'SparkQuery teaching questions',
      },
      {
        name: 'Audio',
        href: '/audio',
        icon: Headphones,
        description: 'Key AM/PM/Sleep audio sets',
      },
      {
        name: 'Songs',
        href: '/audio/songs',
        icon: Music2,
        description: 'My songs',
      },
    ],
  },
  {
    name: 'Plan',
    isCollapsible: true,
    defaultCollapsed: false,
    items: [
      {
        name: 'MAP',
        href: '/map',
        icon: Map,
        description: 'My Alignment Plan - your alignment actions',
      },
      {
        name: 'Tracking',
        href: '/tracking',
        icon: TrendingUp,
        description: 'Streaks, badges, and performance metrics',
      },
      {
        name: 'Reset',
        href: '/reset',
        icon: Flame,
        description: 'Hit the reset button - recommit, phoenix style',
      },
    ],
  },
  {
    name: 'Connect',
    isCollapsible: true,
    defaultCollapsed: false,
    items: [
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
        description: 'Connect with the Vibration Fit community',
      },
    ],
  },
  {
    name: 'Account',
    isCollapsible: true,
    defaultCollapsed: true,
    items: [
      {
        name: 'Profile',
        href: '/profile',
        icon: User,
        description: 'Your active profile',
      },
      {
        name: 'Billing',
        href: '/account/billing',
        icon: CreditCard,
        description: 'Plan, payment methods, and invoices',
      },
      {
        name: 'Settings',
        href: '/account',
        icon: Settings,
        description: 'Account, household, tokens, storage, and support',
      },
    ],
  },
]

/**
 * Flat member nav list for icon lookup and legacy consumers.
 */
export const userNavigation: NavItem[] = [
  ...userNavigationPrimary,
  ...userNavigationGroups.flatMap(group => group.items),
]

/**
 * ADMIN NAVIGATION - Admin panel navigation
 * Used in: Sidebar component when isAdmin=true
 * 
 * Organized by workflow priority:
 *   1. Member Support (support tickets, inbox)
 *   2. Member Communication (blasts, campaigns, templates)
 *   3. Working Leads & Analytics (pipeline, attribution, growth)
 *   4. Operations & Tools (scheduling, content, audio, dev)
 */
export const adminNavigation: NavItem[] = [
  // ============================================================================
  // DASHBOARD
  // ============================================================================
  {
    name: 'Admin Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
    requiresAdmin: true,
    description: 'Admin overview and quick access',
  },

  // ============================================================================
  // PRIORITY 1: MEMBER SUPPORT
  // ============================================================================
  {
    name: 'Support & Inbox',
    href: '/admin/crm/support/board',
    icon: Headset,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Tickets, inbox, and notifications',
    children: [
      { name: 'Support Board', href: '/admin/crm/support/board', icon: Headset, description: 'Support tickets board' },
      { name: 'Announcements', href: '/admin/support/announcements', icon: Megaphone, description: 'Member-facing announcements and how-tos' },
      { name: 'Inbox', href: '/admin/inbox', icon: Inbox, description: 'Unified email and SMS inbox' },
      { name: 'Inbox – All', href: '/admin/inbox/all', icon: Inbox, description: 'All channels in one stream' },
      { name: 'Inbox – Email', href: '/admin/inbox/email', icon: Mail, description: 'Email threads only' },
      { name: 'Inbox – SMS', href: '/admin/inbox/sms', icon: MessageSquare, description: 'SMS threads only' },
      { name: 'Notifications', href: '/admin/notifications', icon: Bell, description: 'Purchase alerts, lead notifications' },
      { name: 'Notification Settings', href: '/admin/notification-settings', icon: Settings, description: 'Configure notification templates & channels' },
    ]
  },

  // ============================================================================
  // PRIORITY 2A: MEMBERS
  // ============================================================================
  {
    name: 'Members',
    href: '/admin/crm/members',
    icon: UserCheck,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'User directory, subscriptions, orders, and programs',
    children: [
      { name: 'Members List', href: '/admin/crm/members', icon: UserCheck, description: 'All users with engagement, revenue, and actions' },
      { name: 'Members Board', href: '/admin/crm/members/board', icon: Kanban, description: 'Kanban board for members' },
      { name: 'Orders', href: '/admin/orders', icon: ShoppingCart, description: 'Order status & email delivery pipeline' },
      { name: 'Products & Pricing', href: '/admin/products', icon: ShoppingCart, description: 'All products, prices, and checkout links — database-driven' },
      { name: 'Membership Tiers', href: '/admin/membership-tiers', icon: Layers, description: 'Token grants & storage quotas' },
      { name: 'Token Analytics', href: '/admin/token-usage', icon: BarChart3, description: 'User token usage analytics' },
      { name: 'Member Storage', href: '/admin/member-storage', icon: HardDrive, description: 'Browse member uploaded files and storage' },
      { name: 'Badges', href: '/admin/badges', icon: Award, description: 'Award and manage badges' },
      { name: 'Intensive Dashboard', href: '/admin/intensive/dashboard', icon: Rocket, description: 'Enrollment status and step progress' },
      { name: 'Intensive Tester', href: '/admin/intensive/tester', icon: Wrench, description: 'Test intensive flows' },
      { name: 'All Users (Legacy)', href: '/admin/users', icon: Users, description: 'Technical user list with admin tools' },
    ]
  },

  // ============================================================================
  // PRIORITY 2B: COMMUNICATION
  // ============================================================================
  {
    name: 'Communication',
    href: '/admin/crm/blast',
    icon: Send,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Blasts, campaigns, templates, and automations',
    children: [
      { name: 'Blasts', href: '/admin/crm/blast', icon: Send, description: 'One-time broadcast messages' },
      { name: 'Messaging Campaigns', href: '/admin/messaging-campaigns', icon: Megaphone, description: 'Bulk audience sends' },
      { name: 'Email Templates', href: '/admin/emails/list', icon: FileText, description: 'Browse and edit email templates' },
      { name: 'SMS Templates', href: '/admin/sms', icon: MessageSquare, description: 'Browse and edit SMS templates' },
      { name: 'Sequences', href: '/admin/sequences', icon: GitBranch, description: 'Multi-step drip campaigns' },
      { name: 'Automation Rules', href: '/admin/automations', icon: Radio, description: 'Event-driven single-fire triggers' },
      { name: 'Messaging Hub', href: '/admin/emails', icon: Mail, description: 'Messaging overview and stats' },
      { name: 'Sent Email Log', href: '/admin/emails/sent', icon: FileText, description: 'Email delivery history' },
      { name: 'SMS Dashboard', href: '/admin/texts', icon: MessageSquare, description: 'SMS hub and template shortcuts' },
      { name: 'Sent SMS Log', href: '/admin/texts/sent', icon: MessageSquare, description: 'SMS delivery history' },
    ]
  },

  // ============================================================================
  // PRIORITY 3: LEADS & GROWTH
  // ============================================================================
  {
    name: 'Leads & Growth',
    href: '/admin/crm/dashboard',
    icon: TrendingUp,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Pipeline, campaigns, attribution, and analytics',
    children: [
      { name: 'CRM Dashboard', href: '/admin/crm/dashboard', icon: LayoutDashboard, description: 'CRM overview and metrics' },
      { name: 'Ad Performance', href: '/admin/crm/marketing', icon: BarChart3, description: 'Campaign funnel: visitors, engagement, video, leads, revenue' },
      { name: 'Leads', href: '/admin/crm/leads', icon: UserPlus, description: 'Lead management' },
      { name: 'Leads Board', href: '/admin/crm/leads/board', icon: Kanban, description: 'Kanban board for leads' },
      { name: 'Campaigns', href: '/admin/crm/campaigns', icon: Megaphone, description: 'Marketing campaigns and tracking' },
      { name: 'Segments', href: '/admin/crm/segments', icon: UsersRound, description: 'Audience segments and targeting' },
      { name: 'Attribution', href: '/admin/crm/attribution', icon: Fingerprint, description: 'Visitor acquisition and session tracking' },
      { name: 'UTM Builder', href: '/admin/crm/utm-builder', icon: Link2, description: 'Build UTM tracking URLs' },
      { name: 'Short Links', href: '/admin/crm/links', icon: Link2, description: 'Branded /go/ links you can re-point anytime' },
      { name: 'Coupons', href: '/admin/coupons', icon: Star, description: 'Manage coupon codes & discounts' },
      { name: 'Referrals', href: '/admin/referrals', icon: Share2, description: 'Referral program participants and stats' },
    ]
  },

  // ============================================================================
  // SESSIONS (availability, bookings, calendar)
  // ============================================================================
  {
    name: 'Sessions',
    href: '/admin/scheduling',
    icon: Calendar,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Availability, sessions, and bookings',
    children: [
      { name: 'Team Availability', href: '/admin/scheduling', icon: Calendar, description: 'Manage team availability for all event types' },
      { name: 'Sessions', href: '/admin/sessions', icon: Video, description: 'View booked sessions' },
      { name: 'Calendar', href: '/admin/calendar', icon: Calendar, description: 'View and manage calendar' },
      { name: 'Calibration Calls', href: '/admin/intensive/schedule-call', icon: Headset, description: 'Schedule intensive calibration calls' },
    ]
  },

  // ============================================================================
  // CONTENT & AUDIO
  // ============================================================================
  {
    name: 'Content & Audio',
    href: '/admin/assets',
    icon: Boxes,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Assets, media, and audio tools',
    children: [
      { name: 'Site Assets', href: '/admin/assets', icon: Upload, description: 'Upload and manage media assets' },
      { name: 'Vibrational Sources', href: '/admin/vibrational-event/sources', icon: Activity, description: 'Manage vibrational data sources' },
      { name: 'Audio Mixer', href: '/admin/audio-mixer', icon: Headphones, description: 'Manage audio tracks and mixing' },
      { name: 'Audio Generator', href: '/admin/audio-generator', icon: Wand2, description: 'Generate Solfeggio & Binaural tracks' },
      { name: 'Ambient Designer', href: '/admin/audio-designer', icon: Music, description: 'Create custom rain, ocean, waterfall sounds' },
      { name: 'Music Catalog', href: '/admin/music', icon: Music2, description: 'Tracks, lyrics, life tags, streaming links' },
      { name: 'Song Submissions', href: '/admin/song-submissions', icon: Send, description: 'Review and approve music submissions for publishing' },
      { name: 'Voice Audition Studio', href: '/admin/audio', icon: Mic, description: 'Compare TTS voices for production' },
    ]
  },

  // ============================================================================
  // SLIDE DECKS
  // ============================================================================
  {
    name: 'Slide Decks',
    href: '/admin/slide-decks',
    icon: Presentation,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Teaching decks and live presentation links',
    children: [
      { name: 'All Decks', href: '/admin/slide-decks', icon: Presentation, description: 'Browse, preview, and present HTML slide decks' },
      ...SLIDE_DECKS.map(deck => ({
        name: deck.shortTitle,
        href: `/admin/slide-decks/${deck.slug}`,
        icon: Presentation,
        description: deck.description,
      })),
    ],
  },

  // ============================================================================
  // CINEMATIC PRODUCTION
  // ============================================================================
  {
    name: 'Cinematic',
    href: '/admin/cinematic',
    icon: Film,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Series, studio, schedule, and characters',
    children: [
      { name: 'Series', href: '/admin/cinematic', icon: Film, description: 'Manage cinematic series' },
      { name: 'Studio', href: '/admin/cinematic/studio', icon: Video, description: 'Production studio' },
      { name: 'Schedule', href: '/admin/cinematic/schedule', icon: Calendar, description: 'Release and shoot schedule' },
      { name: 'Characters', href: '/admin/cinematic/characters', icon: Users, description: 'Character catalog' },
    ]
  },

  // ============================================================================
  // VIVA & INTELLIGENCE
  // ============================================================================
  {
    name: 'VIVA & Models',
    href: '/admin/ai-models',
    icon: Brain,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Configure VIVA models and pricing',
    children: [
      { name: 'VIVA Model Config', href: '/admin/ai-models', icon: Wand2, description: 'Configure VIVA model settings' },
      { name: 'Vision Tester', href: '/admin/vision-tester', icon: Target, description: 'Compare vision output across models' },
    ]
  },

  // ============================================================================
  // PROJECT HUB
  // ============================================================================
  {
    name: 'Projects',
    href: '/admin/projects',
    icon: FolderKanban,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Projects, planning, and tracking',
    children: [
      { name: 'All', href: '/admin/projects', icon: FolderKanban, description: 'Browse all projects' },
      { name: 'Board View', href: '/admin/projects/board', icon: Kanban, description: 'Kanban board by status' },
      { name: 'Settings', href: '/admin/projects/settings', icon: Settings, description: 'Categories, fields, and tags' },
    ]
  },

  // ============================================================================
  // HOMESCHOOL / LIFE EXPLORER
  // ============================================================================
  {
    name: 'Homeschool',
    href: '/homeschool/life-explorer',
    icon: GraduationCap,
    requiresAdmin: true,
    hasDropdown: true,
    description: 'Vibration Fit Homeschool — Life Explorer',
    children: [
      {
        name: 'Today',
        href: '/homeschool/life-explorer',
        icon: GraduationCap,
        description: 'Expedition home — next step, Wonder Wall, steer',
      },
      {
        name: 'Calendar',
        href: '/homeschool/life-explorer/calendar',
        icon: Calendar,
        description: 'Daily learning log — what you did, when, and for how long',
      },
      {
        name: 'Learning Map',
        href: '/homeschool/life-explorer/map',
        icon: Map,
        description: 'Categories, coverage radar, and reports',
      },
      {
        name: 'Profile',
        href: '/homeschool/life-explorer/profile',
        icon: User,
        description: 'Learner portrait, skills, and the Journey Feed',
      },
    ],
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
      { name: 'Legacy Pages', href: '/admin/legacy', icon: Archive, description: 'Old routes pending studio migration decisions' },
      { name: 'Sitemap', href: '/sitemap', icon: Layers, description: 'Complete site navigation map' },
      { name: 'Email Test', href: '/admin/emails/test', icon: Mail, description: 'Send test emails from admin' },
      { name: 'Recording Recovery', href: '/admin/recording-recovery', icon: HardDrive, description: 'Recover local IndexedDB recordings' },
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
    description: 'My Alignment Plan - your alignment actions',
  },
  {
    name: 'Audio',
    href: '/audio',
    icon: Headphones,
    description: 'Audio Studio',
  },
  {
    name: 'Board',
    href: '/manifestations',
    icon: Image,
    description: 'Manifestations',
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
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
    description: 'Go to your member dashboard',
  },
  {
    name: 'My Profile',
    href: '/profile',
    icon: User,
    description: 'View your profile',
  },
  {
    name: 'Activity Feed',
    href: '/activity',
    icon: BarChart3,
    description: 'View activity timeline',
  },
  {
    name: 'Token Usage',
    href: '/tokens',
    icon: Zap,
    description: 'View token usage',
  },
  {
    name: 'Storage',
    href: '/storage',
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
    name: 'Account',
    href: '/account',
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
 * - `search` is the query string without a leading `?` (e.g. "kind=incantation")
 */
function splitNavHref(href: string): { path: string; query: URLSearchParams } {
  const qIndex = href.indexOf('?')
  if (qIndex === -1) {
    return { path: href, query: new URLSearchParams() }
  }
  return {
    path: href.slice(0, qIndex),
    query: new URLSearchParams(href.slice(qIndex + 1)),
  }
}

function queryMatches(itemQuery: URLSearchParams, search: string): boolean {
  const current = new URLSearchParams(search)
  for (const [key, value] of itemQuery.entries()) {
    if (current.get(key) !== value) return false
  }
  return true
}

export function isNavItemActive(
  item: NavItem,
  pathname: string,
  activeProfileId?: string | null,
  isChildOfDropdown: boolean = false,
  search: string = '',
): boolean {
  // RULE 1: Parent dropdown items are NEVER highlighted
  // The sidebar will show them as "expanded" but not "active"
  if (item.hasDropdown && item.children) {
    return false
  }

  const { path: itemPath, query: itemQuery } = splitNavHref(item.href)
  const hasItemQuery = [...itemQuery.keys()].length > 0

  if (hasItemQuery) {
    return pathname === itemPath && queryMatches(itemQuery, search)
  }
  
  // RULE 2: Exact match - highest priority (always works)
  if (itemPath === pathname) {
    if (itemPath === '/story') {
      const kind = new URLSearchParams(search).get('kind')
      if (kind === 'incantation' || kind === 'spark_query') return false
    }
    if (itemPath === '/audio') {
      return true
    }
    if (itemPath === '/account') {
      return pathname === '/account'
    }
    return true
  }
  
  // RULE 3: For children of dropdowns, ONLY exact matches count
  // This prevents "/life-vision" from matching when on "/life-vision/household"
  if (isChildOfDropdown) {
    // /life-vision links should highlight when on any /life-vision/[uuid] page
    if (itemPath === '/life-vision') {
      if (pathname.match(/^\/life-vision\/[a-f0-9-]{36}(\/|$)/)) {
        return true
      }
    }
    
    // /profile links should highlight when on the active profile page
    if (itemPath === '/profile') {
      const uuidMatch = pathname.match(/^\/profile\/([a-f0-9-]{36})(\/|$)/)
      if (uuidMatch) {
        return uuidMatch[1] === activeProfileId
      }
    }

    if (itemPath === '/account') {
      return pathname === '/account'
    }

    // For all other dropdown children, ONLY exact match
    return false
  }
  
  // RULE 4: Top-level items without dropdowns can match nested routes
  // e.g., Dashboard matching /dashboard/anything
  if (!item.hasDropdown && !item.children) {
    // Special handling for specific items
    if (itemPath === '/journal') {
      if (pathname.match(/^\/journal\/[a-f0-9-]{36}(\/|$)/) || pathname === '/journal/new' || pathname.startsWith('/journal/daily-paper')) {
        return true
      }
    }
    
    if (itemPath === '/manifestations') {
      if (pathname.startsWith('/manifestations/')) {
        return true
      }
    }
    
    if (itemPath === '/assessment') {
      if (pathname.startsWith('/assessment/')) {
        return true
      }
    }
    
    if (itemPath === '/vibe-tribe') {
      if (pathname.startsWith('/vibe-tribe/')) {
        return true
      }
    }
    
    if (itemPath === '/story') {
      const kind = new URLSearchParams(search).get('kind')
      if (kind === 'incantation' || kind === 'spark_query') return false
      if (pathname.startsWith('/story/')) {
        return true
      }
    }
    
    if (itemPath === '/dashboard') {
      return false
    }

    if (itemPath === '/viva') {
      return pathname.startsWith('/viva/')
    }
    
    if (itemPath === '/admin/inbox') {
      if (pathname.startsWith('/admin/inbox')) {
        return true
      }
    }
    
    // Songs owns songwriter routes; Audio owns the rest of the hub
    if (itemPath === '/audio/songs') {
      return pathname === '/audio/songs' || pathname.startsWith('/audio/songwriter')
    }

    if (itemPath === '/audio') {
      if (pathname.startsWith('/audio/songs') || pathname.startsWith('/audio/songwriter')) {
        return false
      }
      if (pathname.startsWith('/audio/')) {
        return true
      }
    }
    
    // /profile top-level matches any profile route
    if (itemPath === '/profile') {
      if (pathname.startsWith('/profile/')) {
        return true
      }
    }
    
    // /life-vision top-level matches any life-vision route
    if (itemPath === '/life-vision') {
      if (pathname.startsWith('/life-vision/')) {
        return true
      }
    }

    if (itemPath === '/account/billing') {
      return pathname.startsWith('/account/billing')
    }

    if (itemPath === '/account') {
      if (pathname.startsWith('/account/billing')) return false
      return pathname === '/account' || pathname.startsWith('/account/')
    }
    
    // Special handling for /map - match sub-routes like /map/new, /map/[id]
    if (itemPath === '/map') {
      if (pathname.startsWith('/map/')) {
        return true
      }
      return false
    }

    // Reset studio: /reset matches /reset/update etc.
    if (itemPath === '/reset') {
      if (pathname.startsWith('/reset/')) {
        return true
      }
    }

    if (itemPath === '/tracking') {
      return pathname.startsWith('/tracking/')
    }

    if (itemPath === '/daily-paper') {
      return pathname.startsWith('/daily-paper/')
    }

    if (itemPath === '/abundance-tracker') {
      return pathname.startsWith('/abundance-tracker/')
    }

    if (itemPath === '/alignment-gym') {
      return pathname.startsWith('/alignment-gym/')
    }

  }
  
  return false
}

