import Link from 'next/link'
import Image from 'next/image'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
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
  Rocket
} from 'lucide-react'

interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  // Use static year to avoid hydration mismatch
  const currentYear = 2024

  // Complete sitemap organized by page classification system
  // USER PAGES - Core app functionality (get sidebar + mobile nav)
  const userCoreLinks = [
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/dashboard/activity', label: 'Activity Feed', icon: BarChart3 },
    { href: '/dashboard/tokens', label: 'Token Management', icon: Zap },
    { href: '/dashboard/add-tokens', label: 'Add Tokens', icon: Plus },
    { href: '/dashboard/storage', label: 'Storage Usage', icon: FileText },
    { href: '/dashboard/token-history', label: 'Token History', icon: BarChart3 },
    { href: '/dashboard/vibe-assistant-usage', label: 'VIVA Assistant', icon: MessageCircle },
  ]

  const userVisionLinks = [
    { href: '/life-vision', label: 'Life Visions', icon: Eye },
    { href: '/life-vision/new', label: 'Create Vision', icon: Plus },
    { href: '/life-vision/[id]', label: 'Vision Details', icon: Eye },
    { href: '/life-vision/[id]/audio', label: 'Vision Audio', icon: MessageCircle },
    { href: '/life-vision/[id]/refine', label: 'Refine Vision', icon: Settings },
  ]

  const userVisionBoardLinks = [
    { href: '/vision-board', label: 'Vision Board', icon: Star },
    { href: '/vision-board/new', label: 'New Board Item', icon: Plus },
    { href: '/vision-board/gallery', label: 'Vision Gallery', icon: Star },
    { href: '/vision-board/[id]', label: 'Board Item Details', icon: Eye },
  ]

  const userJournalLinks = [
    { href: '/journal', label: 'Journal Entries', icon: FileText },
    { href: '/journal/new', label: 'New Entry', icon: Plus },
    { href: '/journal/[id]', label: 'Entry Details', icon: Eye },
    { href: '/journal/[id]/edit', label: 'Edit Entry', icon: Settings },
  ]

  const userProfileLinks = [
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/profile/edit', label: 'Edit Profile', icon: Settings },
    { href: '/profile/new', label: 'Create Profile', icon: Plus },
    { href: '/account/settings', label: 'Account Settings', icon: Settings },
  ]

  const userAssessmentLinks = [
    { href: '/assessment', label: 'Vibration Assessment', icon: FileText },
    { href: '/assessment/in-progress', label: 'Assessment Progress', icon: BarChart3 },
    { href: '/assessment/results', label: 'Assessment Results', icon: CheckCircle },
  ]

  const userBlueprintLinks = [
    { href: '/actualization-blueprints', label: 'Actualization Blueprints', icon: Rocket },
    { href: '/actualization-blueprints/[id]', label: 'Blueprint Details', icon: Eye },
  ]

  const userIntensiveLinks = [
    { href: '/intensive', label: 'Intensive Program', icon: Rocket },
    { href: '/intensive/intake', label: 'Intensive Intake', icon: FileText },
    { href: '/intensive/calibration', label: 'Calibration', icon: CheckCircle },
    { href: '/intensive/builder', label: 'Intensive Builder', icon: Rocket },
    { href: '/intensive/schedule-call', label: 'Schedule Call', icon: Calendar },
    { href: '/intensive/call-prep', label: 'Call Prep', icon: FileText },
    { href: '/intensive/refine-vision', label: 'Refine Vision', icon: Eye },
    { href: '/intensive/activation-protocol', label: 'Activation Protocol', icon: Zap },
    { href: '/intensive/activate', label: 'Activation Process', icon: Rocket },
    { href: '/intensive/check-email', label: 'Check Email', icon: MessageCircle },
    { href: '/intensive/dashboard', label: 'Intensive Dashboard', icon: BarChart3 },
  ]

  const userBillingLinks = [
    { href: '/billing', label: 'Billing Dashboard', icon: FileText },
  ]

  // ADMIN PAGES - Admin management (get sidebar + mobile nav)
  const adminLinks = [
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/ai-models', label: 'AI Model Management', icon: Zap },
    { href: '/admin/token-usage', label: 'Token Usage Analytics', icon: BarChart3 },
  ]

  // PUBLIC PAGES - Marketing/auth (get header + footer)
  const publicMarketingLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/pricing', label: 'Pricing', icon: Star },
    { href: '/pricing-hormozi', label: 'Hormozi Pricing', icon: Rocket },
    { href: '/design-system', label: 'Design System', icon: Palette },
  ]

  const publicAuthLinks = [
    { href: '/auth/login', label: 'Login', icon: User },
    { href: '/auth/signup', label: 'Signup', icon: User },
    { href: '/auth/verify', label: 'Verify Email', icon: CheckCircle },
    { href: '/auth/setup-password', label: 'Setup Password', icon: Settings },
    { href: '/auth/logout', label: 'Logout', icon: User },
    { href: '/auth/callback', label: 'Auth Callback', icon: CheckCircle },
    { href: '/auth/auto-login', label: 'Auto Login', icon: User },
  ]

  const publicUtilityLinks = [
    { href: '/checkout', label: 'Checkout', icon: CheckCircle },
    { href: '/billing/success', label: 'Billing Success', icon: CheckCircle },
    { href: '/support', label: 'Support', icon: HelpCircle },
    { href: '/debug/email', label: 'Debug Email', icon: MessageCircle },
    { href: '/test-recording', label: 'Test Recording', icon: HelpCircle },
    { href: '/vision/build', label: 'Vision Builder', icon: Eye },
  ]

  const LinkGroup = ({ title, links, className: groupClassName = '' }: { 
    title: string
    links: Array<{ href: string; label: string; icon: React.ComponentType<{ className?: string }> }>
    className?: string 
  }) => (
    <div className={groupClassName}>
      <h3 className="text-sm font-semibold text-neutral-200 mb-3">{title}</h3>
      <ul className="space-y-2">
        {links.map((link) => {
          const Icon = link.icon
          const isDynamic = link.href.includes('[id]')
          
          const linkContent = (
            <div className={`flex items-center space-x-2 text-sm ${
              isDynamic 
                ? 'text-neutral-500 cursor-default' 
                : 'text-neutral-400 hover:text-primary-500 transition-colors cursor-pointer'
            }`}>
              <Icon className="w-4 h-4" />
              <span>{link.label}</span>
              {isDynamic && <span className="text-xs text-neutral-600">(dynamic)</span>}
            </div>
          )

          if (isDynamic) {
            return (
              <li key={link.href}>
                {linkContent}
              </li>
            )
          }

          return (
            <li key={link.href}>
              <Link href={link.href}>
                {linkContent}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )

  return (
    <footer className={`bg-neutral-900 border-t border-neutral-800 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Brand Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Image
              src={ASSETS.brand.logoWhite}
              alt="VibrationFit"
              width={120}
              height={24}
              style={{ width: 'auto', height: '1.5rem' }}
              className="h-6"
            />
          </div>
          <p className="text-neutral-400 text-sm mb-4">
            The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.
          </p>
        </div>

        {/* Complete Sitemap - Organized by Page Classification */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <h3 className="text-lg font-semibold text-neutral-200 mb-6 text-center">Complete Sitemap</h3>
          
          {/* USER PAGES SECTION */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-primary-500 mb-4 text-center">
              👤 USER PAGES (Sidebar + Mobile Nav)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
              <LinkGroup title="Dashboard & Core" links={userCoreLinks} />
              <LinkGroup title="Life Vision" links={userVisionLinks} />
              <LinkGroup title="Vision Board" links={userVisionBoardLinks} />
              <LinkGroup title="Journal" links={userJournalLinks} />
              <LinkGroup title="Profile & Account" links={userProfileLinks} />
              <LinkGroup title="Assessment" links={userAssessmentLinks} />
              <LinkGroup title="Blueprints" links={userBlueprintLinks} />
              <LinkGroup title="Intensive Program" links={userIntensiveLinks} />
              <LinkGroup title="Billing" links={userBillingLinks} />
            </div>
          </div>

          {/* ADMIN PAGES SECTION */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-accent-500 mb-4 text-center">
              🔧 ADMIN PAGES (Sidebar + Mobile Nav)
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <LinkGroup title="Admin Management" links={adminLinks} />
            </div>
          </div>

          {/* PUBLIC PAGES SECTION */}
          <div className="mb-8">
            <h4 className="text-md font-semibold text-secondary-500 mb-4 text-center">
              🌐 PUBLIC PAGES (Header + Footer)
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              <LinkGroup title="Marketing" links={publicMarketingLinks} />
              <LinkGroup title="Authentication" links={publicAuthLinks} />
              <LinkGroup title="Utilities" links={publicUtilityLinks} />
            </div>
          </div>
        </div>

        {/* Development Helper Section */}
        <div className="border-t border-neutral-800 pt-6 mb-6">
          <h4 className="text-md font-semibold text-neutral-300 mb-4 text-center">
            🛠️ Development Helper
          </h4>
          <div className="bg-neutral-800/50 rounded-lg p-4 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-primary-500 font-semibold mb-1">Page Classification</div>
                <div className="text-neutral-400">USER: 47 pages | ADMIN: 3 pages | PUBLIC: 15 pages</div>
              </div>
              <div>
                <div className="text-secondary-500 font-semibold mb-1">Layout System</div>
                <div className="text-neutral-400">GlobalLayout.tsx manages all page layouts</div>
              </div>
              <div>
                <div className="text-accent-500 font-semibold mb-1">Navigation</div>
                <div className="text-neutral-400">Sidebar + Mobile Nav for USER/ADMIN pages</div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-neutral-800 pt-6">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <div className="text-neutral-500 text-sm">
              &copy; {currentYear} VibrationFit. All rights reserved.
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-neutral-500">Development Status:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                <span className="text-primary-500">Active Development</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
