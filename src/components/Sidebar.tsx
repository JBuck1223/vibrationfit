'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
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
  HardDrive
} from 'lucide-react'

interface SidebarProps {
  className?: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  children?: NavItem[]
  hasDropdown?: boolean
}

const navigation: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: Home,
  },
  {
    name: 'Profile',
    href: '/profile',
    icon: User,
    hasDropdown: true,
    children: [
      { name: 'See Profile', href: '/profile', icon: Eye },
      { name: 'Edit Profile', href: '/profile/edit', icon: Edit },
      { name: 'New Profile', href: '/profile/new', icon: Plus },
    ]
  },
  {
    name: 'Life Vision',
    href: '/life-vision',
    icon: Target,
    hasDropdown: true,
    children: [
      { name: 'See Vision', href: '/life-vision', icon: Eye },
      { name: 'Edit Vision', href: '/life-vision/edit', icon: Edit },
      { name: 'Refine Vision', href: '/life-vision/refine', icon: Target },
    ]
  },
  {
    name: 'Assessment',
    href: '/assessment',
    icon: Brain,
    hasDropdown: true,
    children: [
      { name: 'Take Assessment', href: '/assessment', icon: Eye },
      { name: 'View Results', href: '/assessment/results', icon: BarChart3 },
      { name: 'New Assessment', href: '/assessment/new', icon: Plus },
    ]
  },
  {
    name: 'Vision Board',
    href: '/vision-board',
    icon: Image,
    hasDropdown: true,
    children: [
      { name: 'See Vision Board', href: '/vision-board', icon: Eye },
      { name: 'New Item', href: '/vision-board/new', icon: Plus },
    ]
  },
  {
    name: 'Journal',
    href: '/journal',
    icon: FileText,
    hasDropdown: true,
    children: [
      { name: 'See Journal', href: '/journal', icon: Eye },
      { name: 'New Entry', href: '/journal/new', icon: Plus },
    ]
  },
  {
    name: 'VIVA Assistant',
    href: '/dashboard/vibe-assistant-usage',
    icon: Sparkles,
    hasDropdown: true,
    children: [
      { name: 'Chat with VIVA', href: '/dashboard/vibe-assistant-usage', icon: Sparkles },
      { name: 'VIVA Actions Here', href: '/dashboard/vibe-assistant-actions', icon: Zap },
    ]
  },
  {
    name: 'Activity',
    href: '/dashboard/activity',
    icon: BarChart3,
  },
  {
    name: 'Token Tracking',
    href: '/dashboard/tokens',
    icon: Zap,
    hasDropdown: true,
    children: [
      { name: '# Tokens Available', href: '/dashboard/tokens', icon: Zap },
      { name: 'Token Tracking', href: '/dashboard/token-history', icon: BarChart3 },
      { name: 'Buy Tokens', href: '/dashboard/add-tokens', icon: ShoppingCart },
    ]
  },
  {
    name: 'Storage',
    href: '/dashboard/storage',
    icon: HardDrive,
    hasDropdown: true,
    children: [
      { name: 'See Usage', href: '/dashboard/storage', icon: Eye },
      { name: 'Add Storage', href: '/dashboard/storage', icon: Plus },
    ]
  },
  {
    name: 'Billing',
    href: '/billing',
    icon: CreditCard,
  },
  {
    name: 'Support',
    href: '/support',
    icon: Users,
  },
]

export function Sidebar({ className }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const pathname = usePathname()

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className={cn(
      'flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-[#39FF14] to-[#00FFFF] rounded-lg flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="text-white font-bold text-lg">VibrationFit</span>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4 text-neutral-400" />
          ) : (
            <ChevronLeft className="w-4 h-4 text-neutral-400" />
          )}
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.children && item.children.some(child => pathname === child.href))
          const isExpanded = expandedItems.includes(item.name)
          const Icon = item.icon

          return (
            <div key={item.name}>
              {item.hasDropdown && !collapsed ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left',
                      isActive
                        ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    )}
                  >
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    <span className="flex-1">{item.name}</span>
                    <ChevronDown className={cn(
                      'w-4 h-4 transition-transform duration-200',
                      isExpanded ? 'rotate-180' : ''
                    )} />
                  </button>
                  
                  {isExpanded && item.children && (
                    <div className="ml-6 mt-2 space-y-1">
                      {item.children.map((child) => {
                        const ChildIcon = child.icon
                        const isChildActive = pathname === child.href
                        
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            className={cn(
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              isChildActive
                                ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                                : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                            )}
                          >
                            <ChildIcon className="w-4 h-4 flex-shrink-0" />
                            <span>{child.name}</span>
                          </Link>
                        )
                      })}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
                      : 'text-neutral-300 hover:text-white hover:bg-neutral-800',
                    collapsed && 'justify-center'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1">{item.name}</span>
                      {item.badge && (
                        <span className="px-2 py-0.5 text-xs bg-[#39FF14] text-black rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              )}
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div className="p-4 border-t border-neutral-800">
          <div className="text-xs text-neutral-500 text-center">
            Above the Green Line
          </div>
        </div>
      )}
    </div>
  )
}

// Layout wrapper that includes the sidebar
interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
}

export function SidebarLayout({ children, className }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen bg-black">
      <Sidebar />
      <main className={cn('flex-1 overflow-auto', className)}>
        {children}
      </main>
    </div>
  )
}

