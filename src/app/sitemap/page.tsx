'use client'

import React from 'react'
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
  HardDrive,
  CreditCard,
  ChevronRight,
  Layers,
  Globe,
  Shield,
  Code
} from 'lucide-react'
import { Card, Badge, Container } from '@/lib/design-system'

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
        { href: '/dashboard/tokens', label: 'Token Management', icon: Zap, description: 'Manage AI tokens' },
        { href: '/dashboard/add-tokens', label: 'Add Tokens', icon: Plus, description: 'Purchase more tokens' },
        { href: '/dashboard/storage', label: 'Storage Usage', icon: HardDrive, description: 'File storage management' },
        { href: '/dashboard/token-history', label: 'Token History', icon: BarChart3, description: 'Token usage history' },
        { href: '/dashboard/vibe-assistant-usage', label: 'VIVA Assistant', icon: MessageCircle, description: 'AI assistant usage' },

        // Life Vision
        { href: '/life-vision', label: 'Life Visions', icon: Eye, description: 'All life visions' },
        { href: '/life-vision/new', label: 'Create Vision', icon: Plus, description: 'Create new life vision' },
        { href: '/life-vision/create-with-viva', label: 'Create with VIVA', icon: Zap, description: 'AI-assisted vision creation' },
        { href: '/life-vision/[id]', label: 'Vision Details', icon: Eye, description: 'Individual vision page', isDynamic: true },
        { href: '/life-vision/[id]/audio', label: 'Vision Audio', icon: MessageCircle, description: 'Audio version of vision', isDynamic: true },
        { href: '/life-vision/[id]/refine', label: 'Refine Vision', icon: Settings, description: 'Edit and refine vision', isDynamic: true },

        // Vision Board
        { href: '/vision-board', label: 'Vision Board', icon: Star, description: 'Visual vision board' },
        { href: '/vision-board/new', label: 'New Board Item', icon: Plus, description: 'Add new board item' },
        { href: '/vision-board/gallery', label: 'Vision Gallery', icon: Star, description: 'Gallery of visions' },
        { href: '/vision-board/[id]', label: 'Board Item Details', icon: Eye, description: 'Individual board item', isDynamic: true },

        // Journal
        { href: '/journal', label: 'Journal Entries', icon: FileText, description: 'All journal entries' },
        { href: '/journal/new', label: 'New Entry', icon: Plus, description: 'Create new journal entry' },
        { href: '/journal/[id]', label: 'Entry Details', icon: Eye, description: 'Individual journal entry', isDynamic: true },
        { href: '/journal/[id]/edit', label: 'Edit Entry', icon: Settings, description: 'Edit journal entry', isDynamic: true },

        // Profile & Account
        { href: '/profile', label: 'My Profile', icon: User, description: 'User profile page' },
        { href: '/profile/edit', label: 'Edit Profile', icon: Settings, description: 'Edit user profile' },
        { href: '/profile/new', label: 'Create Profile', icon: Plus, description: 'Create new profile' },
        { href: '/account/settings', label: 'Account Settings', icon: Settings, description: 'Account configuration' },

        // Assessment
        { href: '/assessment', label: 'Vibration Assessment', icon: Brain, description: 'Start assessment' },
        { href: '/assessment/in-progress', label: 'Assessment Progress', icon: BarChart3, description: 'Assessment in progress' },
        { href: '/assessment/results', label: 'Assessment Results', icon: CheckCircle, description: 'Assessment results' },

        // Blueprints
        { href: '/actualization-blueprints', label: 'Actualization Blueprints', icon: Rocket, description: 'All blueprints' },
        { href: '/actualization-blueprints/[id]', label: 'Blueprint Details', icon: Eye, description: 'Individual blueprint', isDynamic: true },

        // Intensive Program
        { href: '/intensive', label: 'Intensive Program', icon: Rocket, description: 'Main intensive page' },
        { href: '/intensive/intake', label: 'Intensive Intake', icon: FileText, description: 'Program intake' },
        { href: '/intensive/calibration', label: 'Calibration', icon: CheckCircle, description: 'System calibration' },
        { href: '/intensive/builder', label: 'Intensive Builder', icon: Rocket, description: 'Build intensive plan' },
        { href: '/intensive/schedule-call', label: 'Schedule Call', icon: Calendar, description: 'Schedule coaching call' },
        { href: '/intensive/call-prep', label: 'Call Prep', icon: FileText, description: 'Prepare for call' },
        { href: '/intensive/refine-vision', label: 'Refine Vision', icon: Eye, description: 'Refine vision in intensive' },
        { href: '/intensive/activation-protocol', label: 'Activation Protocol', icon: Zap, description: 'Activation process' },
        { href: '/intensive/activate', label: 'Activation Process', icon: Rocket, description: 'Start activation' },
        { href: '/intensive/check-email', label: 'Check Email', icon: MessageCircle, description: 'Email verification' },
        { href: '/intensive/dashboard', label: 'Intensive Dashboard', icon: BarChart3, description: 'Intensive overview' },

        // Billing
        { href: '/billing', label: 'Billing Dashboard', icon: CreditCard, description: 'Billing management' },
      ]
    },
    {
      title: '🔧 ADMIN PAGES',
      description: 'Admin management - Sidebar + Mobile Navigation',
      icon: Shield,
      color: 'text-[#8B5CF6]',
      bgColor: 'bg-[#8B5CF6]/10',
      pages: [
        { href: '/admin/users', label: 'User Management', icon: Users, description: 'Manage all users' },
        { href: '/admin/ai-models', label: 'AI Model Management', icon: Zap, description: 'Configure AI models' },
        { href: '/admin/token-usage', label: 'Token Usage Analytics', icon: BarChart3, description: 'Token usage analytics' },
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
        { href: '/pricing', label: 'Pricing', icon: Star, description: 'Pricing plans' },
        { href: '/pricing-hormozi', label: 'Hormozi Pricing', icon: Rocket, description: 'Special pricing page' },
        { href: '/design-system', label: 'Design System', icon: Palette, description: 'Design system showcase' },

        // Authentication
        { href: '/auth/login', label: 'Login', icon: User, description: 'User login' },
        { href: '/auth/signup', label: 'Signup', icon: User, description: 'User registration' },
        { href: '/auth/verify', label: 'Verify Email', icon: CheckCircle, description: 'Email verification' },
        { href: '/auth/setup-password', label: 'Setup Password', icon: Settings, description: 'Password setup' },
        { href: '/auth/logout', label: 'Logout', icon: User, description: 'User logout' },
        { href: '/auth/callback', label: 'Auth Callback', icon: CheckCircle, description: 'Auth callback', badge: 'API' },
        { href: '/auth/auto-login', label: 'Auto Login', icon: User, description: 'Automatic login', badge: 'API' },

        // Utilities
        { href: '/checkout', label: 'Checkout', icon: CheckCircle, description: 'Payment checkout' },
        { href: '/billing/success', label: 'Billing Success', icon: CheckCircle, description: 'Payment success' },
        { href: '/support', label: 'Support', icon: HelpCircle, description: 'Customer support' },
        { href: '/debug/email', label: 'Debug Email', icon: MessageCircle, description: 'Email debugging', badge: 'DEV' },
        { href: '/test-recording', label: 'Test Recording', icon: HelpCircle, description: 'Audio recording test', badge: 'DEV' },
        { href: '/vision/build', label: 'Vision Builder', icon: Eye, description: 'Public vision builder' },
      ]
    }
  ]

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
            <span>USER: 47 pages</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#8B5CF6] rounded-full"></div>
            <span>ADMIN: 3 pages</span>
          </span>
          <span className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-[#14B8A6] rounded-full"></div>
            <span>PUBLIC: 15 pages</span>
          </span>
          <span className="text-neutral-500">Total: 65 pages</span>
        </div>
      </div>

      {/* Page Sections */}
      <div className="space-y-12">
        {pageSections.map((section) => (
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
        ))}
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
