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

  // Complete sitemap organized by functionality
  const coreLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/pricing', label: 'Pricing', icon: Star },
    { href: '/pricing-hormozi', label: 'Hormozi Pricing', icon: Rocket },
  ]

  const visionLinks = [
    { href: '/life-vision', label: 'Life Visions', icon: Eye },
    { href: '/life-vision/new', label: 'Create New Vision', icon: Plus },
    { href: '/life-vision/create-with-viva', label: 'Create with VIVA', icon: Zap },
    { href: '/vision/build', label: 'Vision Builder', icon: Eye },
    { href: '/assessment', label: 'Vibration Assessment', icon: FileText },
    { href: '/vision-board', label: 'Vision Board', icon: Star },
    { href: '/vision-board/new', label: 'New Vision Board', icon: Plus },
    { href: '/vision-board/gallery', label: 'Vision Gallery', icon: Star },
  ]

  const toolsLinks = [
    { href: '/journal', label: 'Journal', icon: FileText },
    { href: '/journal/new', label: 'New Journal Entry', icon: Plus },
    { href: '/actualization-blueprints', label: 'Blueprints', icon: Rocket },
    { href: '/intensive/dashboard', label: 'Activation Intensive', icon: Rocket },
  ]

  const profileLinks = [
    { href: '/profile', label: 'My Profile', icon: User },
    { href: '/profile/edit', label: 'Edit Profile', icon: Settings },
    { href: '/profile/new', label: 'Create Profile', icon: Plus },
    { href: '/account/settings', label: 'Account Settings', icon: Settings },
  ]

  const dashboardLinks = [
    { href: '/dashboard/tokens', label: 'My Tokens', icon: Zap },
    { href: '/dashboard/add-tokens', label: 'Add Tokens', icon: Plus },
    { href: '/dashboard/storage', label: 'Storage', icon: FileText },
    { href: '/dashboard/activity', label: 'Activity Feed', icon: BarChart3 },
    { href: '/dashboard/vibe-assistant-usage', label: 'Vibe Assistant', icon: MessageCircle },
  ]

  const intensiveLinks = [
    { href: '/intensive/intake', label: 'Intensive Intake', icon: FileText },
    { href: '/intensive/calibration', label: 'Calibration', icon: CheckCircle },
    { href: '/intensive/builder', label: 'Intensive Builder', icon: Rocket },
    { href: '/intensive/schedule-call', label: 'Schedule Call', icon: Calendar },
    { href: '/intensive/call-prep', label: 'Call Prep', icon: FileText },
    { href: '/intensive/refine-vision', label: 'Refine Vision', icon: Eye },
    { href: '/intensive/activation-protocol', label: 'Activation Protocol', icon: Zap },
    { href: '/intensive/activate', label: 'Activation Process', icon: Rocket },
  ]

  const billingLinks = [
    { href: '/billing', label: 'Billing Dashboard', icon: FileText },
    { href: '/billing/success', label: 'Billing Success', icon: CheckCircle },
  ]

  const authLinks = [
    { href: '/auth/login', label: 'Login', icon: User },
    { href: '/auth/signup', label: 'Signup', icon: User },
    { href: '/auth/verify', label: 'Verify Email', icon: CheckCircle },
    { href: '/auth/setup-password', label: 'Setup Password', icon: Settings },
  ]

  const adminLinks = [
    { href: '/admin/users', label: 'User Management', icon: Users },
    { href: '/admin/ai-models', label: 'AI Model Management', icon: Zap },
    { href: '/admin/token-usage', label: 'Token Usage Analytics', icon: BarChart3 },
  ]

  const devLinks = [
    { href: '/design-system', label: 'Design System', icon: Palette },
    { href: '/design-system-experiment', label: 'Design Experiment', icon: Palette },
    { href: '/test-recording', label: 'Test Recording', icon: HelpCircle },
    { href: '/debug/email', label: 'Debug Email', icon: MessageCircle },
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
          return (
            <li key={link.href}>
              <Link 
                href={link.href}
                className="flex items-center space-x-2 text-neutral-400 hover:text-primary-500 transition-colors text-sm"
              >
                <Icon className="w-4 h-4" />
                <span>{link.label}</span>
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
              className="h-6 w-auto"
            />
          </div>
          <p className="text-neutral-400 text-sm mb-4">
            The SaaS platform for conscious creation. Build your vision, align daily, and actualize your dreams.
          </p>
        </div>

        {/* Complete Sitemap */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <h3 className="text-lg font-semibold text-neutral-200 mb-6 text-center">Complete Sitemap</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
            <LinkGroup title="Core" links={coreLinks} />
            <LinkGroup title="Life Vision" links={visionLinks} />
            <LinkGroup title="Tools & Creation" links={toolsLinks} />
            <LinkGroup title="Profile Management" links={profileLinks} />
            <LinkGroup title="Dashboard Tools" links={dashboardLinks} />
            <LinkGroup title="Activation Intensive" links={intensiveLinks} />
            <LinkGroup title="Billing & Pricing" links={billingLinks} />
            <LinkGroup title="Authentication" links={authLinks} />
            <LinkGroup title="Admin Panel" links={adminLinks} />
            <LinkGroup title="Development" links={devLinks} />
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
