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
  HelpCircle
} from 'lucide-react'

interface FooterProps {
  className?: string
}

export function Footer({ className = '' }: FooterProps) {
  // Use static year to avoid hydration mismatch
  const currentYear = 2024

  const mainLinks = [
    { href: '/', label: 'Home', icon: Home },
    { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
    { href: '/life-vision', label: 'Life Visions', icon: Eye },
    { href: '/life-vision/new', label: 'New Life Vision', icon: Plus },
    { href: '/vision-board', label: 'Vision Board', icon: Star },
    { href: '/vision-board/new', label: 'Add Creation', icon: Plus },
    { href: '/journal', label: 'Journal', icon: FileText },
    { href: '/journal/new', label: 'New Entry', icon: Plus },
  ]

  const authLinks = [
    { href: '/auth/login', label: 'Login', icon: User },
    { href: '/auth/signup', label: 'Signup', icon: User },
    { href: '/auth/logout', label: 'Logout', icon: User },
  ]

  const devLinks = [
    { href: '/design-system', label: 'Design System', icon: Palette },
    { href: '/docs', label: 'Documentation', icon: BookOpen },
    { href: '/api', label: 'API Routes', icon: Zap },
    { href: '/test', label: 'Test Pages', icon: HelpCircle },
  ]

  const futureLinks = [
    { href: '/alignment', label: 'Alignment Plan', icon: Star },
    { href: '/ai-assistant', label: 'AI Assistant', icon: MessageCircle },
    { href: '/community', label: 'Community', icon: Users },
    { href: '/settings', label: 'Settings', icon: Settings },
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
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8">
          {/* Brand Section */}
          <div className="lg:col-span-1">
            <div className="flex items-center space-x-2 mb-4">
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
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Heart className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <Star className="w-5 h-5" />
              </a>
              <a href="#" className="text-neutral-400 hover:text-primary-500 transition-colors">
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Main Navigation */}
          <LinkGroup title="Main Pages" links={mainLinks} />

          {/* Authentication */}
          <LinkGroup title="Authentication" links={authLinks} />

          {/* Development */}
          <LinkGroup title="Development" links={devLinks} />
        </div>

        {/* Future Features Section */}
        <div className="border-t border-neutral-800 pt-8 mb-8">
          <h3 className="text-sm font-semibold text-neutral-200 mb-4">🚧 Coming Soon</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {futureLinks.map((link) => {
              const Icon = link.icon
              return (
                <Link 
                  key={link.href}
                  href={link.href}
                  className="flex items-center space-x-2 text-neutral-500 hover:text-secondary-500 transition-colors text-sm opacity-60 hover:opacity-100"
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Development Status */}
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

        {/* Quick Dev Info */}
        <div className="border-t border-neutral-800 pt-4 mt-4">
          <div className="text-xs text-neutral-600 text-center">
            <p>
              <strong>Dev Mode:</strong> This footer includes all current and planned routes for easy navigation during development.
            </p>
            <p className="mt-1">
              Last updated: December 2024 | 
              <Link href="/design-system" className="text-primary-500 hover:text-primary-400 ml-1">
                View Design System
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
