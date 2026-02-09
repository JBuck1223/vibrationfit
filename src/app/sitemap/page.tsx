'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  Home, 
  User, 
  Eye, 
  Plus, 
  Settings, 
  Palette, 
  BookOpen, 
  Zap,
  Heart,
  Star,
  MessageCircle,
  BarChart3,
  FileText,
  Users,
  HelpCircle,
  Calendar,
  CheckCircle,
  Rocket,
  Target,
  Image,
  Brain, 
  RefreshCw,
  HardDrive,
  CreditCard,
  ChevronRight,
  Layers,
  Globe,
  Shield,
  Code,
  Upload,
  Headphones,
  TrendingUp,
  UserPlus,
  Megaphone,
  Link2,
  Headset,
  Kanban,
  UserCheck,
  UsersRound,
  LayoutDashboard,
  Search,
  X,
  FlaskConical,
  Mic,
  Clock,
  DollarSign
} from 'lucide-react'
import { Card, Badge, Container, Input } from '@/lib/design-system'

interface PageLink {
  href: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  description?: string
  badge?: string
  isDynamic?: boolean
}

interface PageSection {
  title: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  color: string
  bgColor: string
  pages: PageLink[]
}

export default function SitemapPage() {
  const pathname = usePathname()
  const [searchQuery, setSearchQuery] = useState('')

  // Complete page classification with descriptions
  const pageSections: PageSection[] = [
    {
      title: '👤 USER PAGES',
      description: 'Core app functionality - Sidebar + Mobile Navigation',
      icon: User,
      color: 'text-[#39FF14]',
      bgColor: 'bg-[#39FF14]/10',
      pages: [
        // Dashboard & Core
        { href: '/dashboard', label: 'Dashboard', icon: BarChart3, description: 'Main dashboard overview' },
        { href: '/dashboard/activity', label: 'Activity Feed', icon: BarChart3, description: 'User activity timeline' },
        { href: '/dashboard/tokens', label: 'Tokens', icon: Zap, description: 'Manage tokens' },
        { href: '/dashboard/add-tokens', label: 'Add Tokens', icon: Plus, description: 'Purchase more tokens' },
        { href: '/dashboard/storage', label: 'Storage Usage', icon: HardDrive, description: 'File storage management' },
        { href: '/dashboard/token-history', label: 'Token History', icon: BarChart3, description: 'Token usage history' },
        { href: '/viva', label: 'VIVA Assistant', icon: MessageCircle, description: 'AI assistant usage' },

        // Life Vision
        { href: '/life-vision', label: 'All Life Visions', icon: Eye, description: 'All life visions list' },
        { href: '/life-vision/active', label: 'Active Vision', icon: CheckCircle, description: 'Current active vision' },
        { href: '/life-vision/audio', label: 'All Vision Audios', icon: Headphones, description: 'All vision audio files' },
        { href: '/life-vision/new', label: 'Create Vision', icon: Plus, description: 'Create new life vision' },
        { href: '/life-vision/new/assembly', label: 'Vision Assembly', icon: Layers, description: 'Assemble vision sections' },
        { href: '/life-vision/new/category/[key]', label: 'Category Builder', icon: Target, description: 'Build individual category', isDynamic: true },
        { href: '/life-vision/new/category/[key]/imagination', label: 'Imagination Step', icon: Brain, description: 'Imagination phase', isDynamic: true },
        { href: '/life-vision/[id]', label: 'Vision Details', icon: Eye, description: 'Individual vision page', isDynamic: true },
        { href: '/life-vision/[id]/audio', label: 'Vision Audio', icon: Headphones, description: 'Audio version of vision', isDynamic: true },
        { href: '/life-vision/[id]/audio/generate', label: 'Generate Audio', icon: Mic, description: 'Generate vision audio', isDynamic: true },
        { href: '/life-vision/[id]/audio/queue', label: 'Generation Queue', icon: Clock, description: 'View generation history & queue', isDynamic: true },
        { href: '/life-vision/[id]/audio/sets', label: 'Audio Sets', icon: Headphones, description: 'Manage & play audio sets', isDynamic: true },
        { href: '/life-vision/[id]/print', label: 'Print Vision', icon: FileText, description: 'Print-friendly view', isDynamic: true },

        // Vision Board
        { href: '/vision-board', label: 'Vision Board', icon: Star, description: 'Visual vision board' },
        { href: '/vision-board/new', label: 'New Board Item', icon: Plus, description: 'Add new board item' },
        { href: '/vision-board/gallery', label: 'Vision Gallery', icon: Star, description: 'Gallery of visions' },
        { href: '/vision-board/[id]', label: 'Board Item Details', icon: Eye, description: 'Individual board item', isDynamic: true },

        // Journal
        { href: '/journal', label: 'All Journal Entries', icon: FileText, description: 'All journal entries list' },
        { href: '/journal/new', label: 'New Journal Entry', icon: Plus, description: 'Create new journal entry' },
        { href: '/journal/[id]', label: 'Journal Entry Detail', icon: Eye, description: 'Individual journal entry', isDynamic: true },
        { href: '/journal/[id]/edit', label: 'Edit Journal Entry', icon: Settings, description: 'Edit journal entry', isDynamic: true },
        
        // Tracking
        { href: '/daily-paper', label: 'Daily Paper', icon: BookOpen, description: 'Daily paper view and tracking' },
        { href: '/daily-paper/new', label: 'New Daily Paper Entry', icon: Plus, description: 'Create new daily paper entry' },
        { href: '/daily-paper/resources', label: 'Daily Paper Resources', icon: FileText, description: 'Daily paper PDFs and resources' },
        { href: '/abundance-tracker', label: 'Abundance Tracker', icon: DollarSign, description: 'Track abundance and gratitude' },

        // Profile & Account
        { href: '/profile', label: 'All Profiles', icon: Eye, description: 'All user profiles' },
        { href: '/profile/active', label: 'Active Profile', icon: CheckCircle, description: 'Current active profile' },
        { href: '/profile/active/edit', label: 'Edit Profile', icon: Settings, description: 'Edit active profile' },
        { href: '/profile/new', label: 'Create Profile', icon: Plus, description: 'Create new profile version' },
        { href: '/profile/compare', label: 'Compare Profiles', icon: BarChart3, description: 'Compare profile versions' },
        { href: '/profile/[id]', label: 'Profile Detail', icon: Eye, description: 'Individual profile view', isDynamic: true },
        { href: '/profile/[id]/edit', label: 'Edit Specific Profile', icon: Settings, description: 'Edit specific profile version', isDynamic: true },
        
        // Voice Profile - hidden for now, feature preserved for future use
        // { href: '/voice-profile', label: 'Voice Profile', icon: Mic, description: 'Manage voice profile' },
        // { href: '/voice-profile/quiz', label: 'Voice Quiz', icon: Brain, description: 'Voice profile quiz' },
        // { href: '/voice-profile/analyze', label: 'Voice Analysis', icon: BarChart3, description: 'Analyze voice profile' },
        
        // Household
        { href: '/household/settings', label: 'Household Settings', icon: Users, description: 'Manage household' },
        { href: '/household/invite/[token]', label: 'Household Invite', icon: UserPlus, description: 'Accept household invitation', isDynamic: true },
        
        // Account & Settings
        { href: '/account/settings', label: 'Account Settings', icon: Settings, description: 'Email, password, notifications' },

        // Assessment
        { href: '/assessment', label: 'Start Assessment', icon: Brain, description: 'Begin vibration assessment' },
        { href: '/assessment/in-progress', label: 'Current Assessment', icon: BarChart3, description: 'Assessment in progress' },
        { href: '/assessment/history', label: 'Assessment History', icon: RefreshCw, description: 'All past assessments' },
        { href: '/assessment/[id]', label: 'Assessment Detail', icon: Eye, description: 'Specific assessment view', isDynamic: true },
        { href: '/assessment/[id]/in-progress', label: 'Assessment Progress', icon: BarChart3, description: 'Assessment in progress', isDynamic: true },
        { href: '/assessment/[id]/results', label: 'Assessment Results', icon: CheckCircle, description: 'Assessment results', isDynamic: true },

        // Intensive Program
        { href: '/intensive', label: 'Intensive Program', icon: Rocket, description: 'Main intensive page' },
        { href: '/intensive/dashboard', label: 'Intensive Dashboard', icon: BarChart3, description: 'Intensive overview' },
        { href: '/intensive/intake', label: 'Intensive Intake', icon: FileText, description: 'Program intake form' },
        { href: '/intensive/calibration', label: 'Calibration', icon: CheckCircle, description: 'System calibration' },
        { href: '/intensive/builder', label: 'Intensive Builder', icon: Rocket, description: 'Build intensive plan' },
        { href: '/intensive/schedule-call', label: 'Schedule Call', icon: Calendar, description: 'Schedule coaching call' },
        { href: '/intensive/call-prep', label: 'Call Preparation', icon: FileText, description: 'Prepare for call' },
        { href: '/intensive/refine-vision', label: 'Refine Vision', icon: Target, description: 'Refine vision in intensive' },
        { href: '/map', label: 'My Activation Plan', icon: Zap, description: 'Your 28-Day MAP' },
        { href: '/intensive/activate', label: 'Start Activation', icon: Rocket, description: 'Begin activation' },
        { href: '/intensive/check-email', label: 'Check Email', icon: MessageCircle, description: 'Email verification step' },

        // Vibrational System
        { href: '/scenes/builder', label: 'Scene Builder', icon: Layers, description: 'Build vibrational scenes' },

        // Billing & Support
        { href: '/billing', label: 'Billing Dashboard', icon: CreditCard, description: 'Subscription and billing' },
        { href: '/billing/success', label: 'Billing Success', icon: CheckCircle, description: 'Payment successful' },
        { href: '/support', label: 'Support', icon: HelpCircle, description: 'Get help and support' },
      ]
    },
    {
      title: '🔧 ADMIN PAGES',
      description: 'Admin management - Sidebar + Mobile Navigation',
      icon: Shield,
      color: 'text-[#8B5CF6]',
      bgColor: 'bg-[#8B5CF6]/10',
      pages: [
        // User Management
        { href: '/admin/users', label: 'User Management', icon: Users, description: 'Manage all users, roles, and permissions' },
        { href: '/admin/token-usage', label: 'Token Analytics', icon: BarChart3, description: 'User token usage analytics' },
        
        // CRM & Marketing
        { href: '/admin/crm/dashboard', label: 'CRM Dashboard', icon: LayoutDashboard, description: 'CRM overview and metrics' },
        { href: '/admin/crm/campaigns', label: 'Campaigns', icon: Megaphone, description: 'Marketing campaigns and tracking' },
        { href: '/admin/crm/campaigns/new', label: 'New Campaign', icon: Plus, description: 'Create new campaign' },
        { href: '/admin/crm/campaigns/[id]', label: 'Campaign Detail', icon: Eye, description: 'Campaign details', isDynamic: true },
        { href: '/admin/crm/campaigns/[id]/edit', label: 'Edit Campaign', icon: Settings, description: 'Edit campaign', isDynamic: true },
        { href: '/admin/crm/leads', label: 'Leads', icon: UserPlus, description: 'Lead management' },
        { href: '/admin/crm/leads/board', label: 'Leads Board', icon: Kanban, description: 'Kanban board for leads' },
        { href: '/admin/crm/leads/[id]', label: 'Lead Detail', icon: Eye, description: 'Lead details', isDynamic: true },
        { href: '/admin/crm/members', label: 'Members', icon: UserCheck, description: 'Platform members management' },
        { href: '/admin/crm/members/board', label: 'Members Board', icon: Kanban, description: 'Kanban board for members' },
        { href: '/admin/crm/members/[id]', label: 'Member Detail', icon: Eye, description: 'Member details', isDynamic: true },
        { href: '/admin/crm/support/board', label: 'Support Board', icon: Headset, description: 'Support tickets board' },
        { href: '/admin/crm/utm-builder', label: 'UTM Builder', icon: Link2, description: 'Build UTM tracking URLs' },
        
        // Content Management
        { href: '/admin/assets', label: 'Site Assets', icon: Upload, description: 'Upload and manage media assets' },
        { href: '/admin/emails', label: 'Email Templates', icon: FileText, description: 'Manage email templates' },
        { href: '/admin/emails/list', label: 'Email List', icon: FileText, description: 'View all emails' },
        { href: '/admin/emails/[id]', label: 'Email Detail', icon: Eye, description: 'Email template detail', isDynamic: true },
        { href: '/admin/emails/[id]/edit', label: 'Edit Email', icon: Settings, description: 'Edit email template', isDynamic: true },
        { href: '/admin/vibrational-event/sources', label: 'Vibrational Sources', icon: Layers, description: 'Manage vibrational data sources' },
        
        // AI & Models
        { href: '/admin/ai-models', label: 'AI Model Config', icon: Brain, description: 'Configure AI model settings' },
        { href: '/admin/audio-mixer', label: 'Audio Mixer', icon: Headphones, description: 'Audio mixing and generation' },
        
        // Intensive Program
        { href: '/admin/intensive/schedule-call', label: 'Intensive Schedule', icon: Calendar, description: 'Schedule intensive coaching calls' },
        
        // Developer Tools
        { href: '/design-system', label: 'Design System', icon: Palette, description: 'Component library showcase' },
        { href: '/sitemap', label: 'Sitemap', icon: Layers, description: 'Complete site navigation map' },
      ]
    },
    {
      title: '🌐 PUBLIC PAGES',
      description: 'Marketing & Auth - Header + Footer',
      icon: Globe,
      color: 'text-[#14B8A6]',
      bgColor: 'bg-[#14B8A6]/10',
      pages: [
        // Marketing
        { href: '/', label: 'Home', icon: Home, description: 'Landing page' },

        // Authentication
        { href: '/auth/login', label: 'Login', icon: User, description: 'User login' },
        { href: '/auth/signup', label: 'Signup', icon: User, description: 'User registration' },
        { href: '/auth/verify', label: 'Verify Email', icon: CheckCircle, description: 'Email verification' },
        { href: '/auth/setup-password', label: 'Setup Password', icon: Settings, description: 'Password setup' },
        { href: '/auth/logout', label: 'Logout', icon: User, description: 'User logout' },
        { href: '/auth/callback', label: 'Auth Callback', icon: CheckCircle, description: 'Auth callback', badge: 'API' },
        { href: '/auth/auto-login', label: 'Auto Login', icon: User, description: 'Automatic login', badge: 'API' },

        // Utilities
        { href: '/support', label: 'Support', icon: HelpCircle, description: 'Customer support' },
      ]
    },
    {
      title: '🧪 EXPERIMENTAL / UNUSED',
      description: 'Development pages, experiments, and deprecated routes',
      icon: FlaskConical,
      color: 'text-[#FFB701]',
      bgColor: 'bg-[#FFB701]/10',
      pages: [
        // Experimental Features
        { href: '/life-vision/[id]/experiment', label: 'Vision Experiment', icon: Layers, description: 'Experimental card-based vision view', isDynamic: true, badge: 'EXPERIMENT' },
        { href: '/experiment', label: 'Experiment Page', icon: FlaskConical, description: 'General experiments', badge: 'DEV' },
        { href: '/experiment/design-system', label: 'DS Experiments', icon: Palette, description: 'Design system experiments', badge: 'DEV' },
        { href: '/experiment/old-home', label: 'Old Home Page', icon: Home, description: 'Previous home page version', badge: 'DEPRECATED' },
        
        // Development Tools
        { href: '/debug/email', label: 'Email Debugger', icon: MessageCircle, description: 'Test email templates', badge: 'DEV' },
        { href: '/test-recording', label: 'Recording Test', icon: Mic, description: 'Audio recording test page', badge: 'DEV' },
        { href: '/test-audio-editor', label: 'Audio Editor Test', icon: Headphones, description: 'Test audio editor', badge: 'DEV' },
        { href: '/test-audio-only', label: 'Audio Only Test', icon: Headphones, description: 'Audio-only test page', badge: 'DEV' },
        
        // Legacy/Unused
        { href: '/vision/build', label: 'Public Vision Builder', icon: Target, description: 'Public-facing vision builder', badge: 'UNUSED' },
        { href: '/dashboard/north-star', label: 'North Star Goals', icon: Star, description: 'North star goal setting', badge: 'UNUSED' },
      ]
    }
  ]

  // Filter pages based on search query
  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return pageSections

    const query = searchQuery.toLowerCase()
    
    return pageSections.map(section => ({
      ...section,
      pages: section.pages.filter(page => 
        page.label.toLowerCase().includes(query) ||
        page.description?.toLowerCase().includes(query) ||
        page.href.toLowerCase().includes(query)
      )
    })).filter(section => section.pages.length > 0)
  }, [searchQuery, pageSections])

  // Calculate totals
  const totalPages = pageSections.reduce((acc, section) => acc + section.pages.length, 0)
  const filteredTotal = filteredSections.reduce((acc, section) => acc + section.pages.length, 0)

  const PageCard = ({ page, sectionColor }: { page: PageLink; sectionColor: string }) => {
    const Icon = page.icon
    const isActive = pathname === page.href || (page.isDynamic && pathname.includes(page.href.replace('/[id]', '')))
    
    const CardContent = (
      <Card 
        variant="outlined" 
        className={`group transition-all duration-200 ${
          page.isDynamic 
            ? 'opacity-75 cursor-default' 
            : 'hover:border-[#39FF14]/50 cursor-pointer'
        } ${
          isActive ? 'border-[#39FF14]/50 bg-[#39FF14]/5' : ''
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${sectionColor.replace('text-', 'bg-').replace('[#39FF14]', '[#39FF14]/20').replace('[#8B5CF6]', '[#8B5CF6]/20').replace('[#14B8A6]', '[#14B8A6]/20')}`}>
              <Icon className={`w-4 h-4 ${sectionColor}`} />
            </div>
            <div>
              <h3 className={`font-semibold text-white transition-colors ${
                page.isDynamic ? '' : 'group-hover:text-[#39FF14]'
              }`}>
                {page.label}
              </h3>
              <p className="text-sm text-neutral-400 mt-1">
                {page.description}
              </p>
              <code className="text-xs text-neutral-500 font-mono mt-1 block">
                {page.href}
              </code>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            {page.badge && (
              <Badge variant="secondary" className="text-xs">
                {page.badge}
              </Badge>
            )}
            {page.isDynamic && (
              <Badge variant="secondary" className="text-xs">
                Dynamic
              </Badge>
            )}
            {!page.isDynamic && (
              <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-[#39FF14] transition-colors" />
            )}
          </div>
        </div>
      </Card>
    )

    // Only wrap in Link if it's not a dynamic route
    if (page.isDynamic) {
      return CardContent
    }

    return (
      <Link href={page.href}>
        {CardContent}
      </Link>
    )
  }

  const SectionHeader = ({ section }: { section: PageSection }) => {
    const Icon = section.icon
    
    return (
      <div className={`${section.bgColor} rounded-xl p-6 border-2 border-transparent hover:border-current/20 transition-colors`}>
        <div className="flex items-center space-x-3 mb-2">
          <Icon className={`w-6 h-6 ${section.color}`} />
          <h2 className={`text-2xl font-bold ${section.color}`}>
            {section.title}
          </h2>
        </div>
        <p className="text-neutral-300 text-lg mb-4">
          {section.description}
        </p>
        <div className="flex items-center space-x-4 text-sm text-neutral-400">
          <span className="flex items-center space-x-1">
            <Layers className="w-4 h-4" />
            <span>{section.pages.length} pages</span>
          </span>
          <span className="flex items-center space-x-1">
            <Code className="w-4 h-4" />
            <span>{section.pages.filter(p => p.isDynamic).length} dynamic routes</span>
          </span>
        </div>
      </div>
    )
  }

  return (
    <Container size="xl" className="py-12">
      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-white mb-4">
          VibrationFit Sitemap
        </h1>
        <p className="text-xl text-neutral-300 mb-6">
          Complete page classification and navigation reference
        </p>
        <div className="flex items-center justify-center space-x-6 text-sm text-neutral-400">
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#39FF14] rounded-full"></div>
            <span>USER: {pageSections[0]?.pages.length || 0} pages</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
            <span>ADMIN: {pageSections[1]?.pages.length || 0} pages</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#14B8A6] rounded-full"></div>
            <span>PUBLIC: {pageSections[2]?.pages.length || 0} pages</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#FFB701] rounded-full"></div>
            <span>EXPERIMENTAL: {pageSections[3]?.pages.length || 0} pages</span>
          </span>
          <span className="text-neutral-500">Total: {totalPages} pages</span>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-8 max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <Input
            type="text"
            placeholder="Search pages by name, description, or URL..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 py-3 text-lg"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-center text-sm text-neutral-400">
            Found {filteredTotal} of {totalPages} pages
          </div>
        )}
      </div>

      {/* Page Sections */}
      <div className="space-y-12">
        {filteredSections.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
            <p className="text-neutral-400 text-lg">No pages found matching "{searchQuery}"</p>
            <button
              onClick={() => setSearchQuery('')}
              className="mt-4 text-primary-500 hover:text-primary-400 transition-colors"
            >
              Clear search
            </button>
          </div>
        ) : (
          filteredSections.map((section) => (
          <div key={section.title}>
            <SectionHeader section={section} />
            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {section.pages.map((page) => (
                <PageCard 
                  key={page.href} 
                  page={page} 
                  sectionColor={section.color}
                />
              ))}
            </div>
          </div>
          ))
        )}
      </div>

      {/* Footer Info */}
      <div className="mt-16 text-center">
        <Card variant="outlined" className="bg-neutral-800/50">
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">
              🛠️ Development Reference
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-[#39FF14] font-semibold mb-1">Layout System</div>
                <div className="text-neutral-400">GlobalLayout.tsx manages all page layouts</div>
              </div>
              <div>
                <div className="text-[#8B5CF6] font-semibold mb-1">Navigation</div>
                <div className="text-neutral-400">Sidebar + Mobile Nav for USER/ADMIN</div>
              </div>
              <div>
                <div className="text-[#14B8A6] font-semibold mb-1">Classification</div>
                <div className="text-neutral-400">Automatic based on URL patterns</div>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Container>
  )
}
