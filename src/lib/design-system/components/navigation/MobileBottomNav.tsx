'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { 
  X, 
  Home, 
  UsersRound, 
  Video, 
  Map,
  Target, 
  User, 
  Brain, 
  TrendingUp, 
  Activity, 
  DollarSign,
  Award,
  Zap, 
  HardDrive, 
  Headset, 
  Settings 
} from 'lucide-react'
import { cn } from '../shared-utils'
import { createClient } from '@/lib/supabase/client'
import { userNavigation, adminNavigation as centralAdminNav, mobileNavigation as centralMobileNav, isNavItemActive, type NavItem as CentralNavItem, type NavItem, type NavGroup } from '@/lib/navigation'

// Mobile Bottom Navigation Component
interface MobileBottomNavProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const MobileBottomNav = React.forwardRef<HTMLDivElement, MobileBottomNavProps>(
  ({ className, navigation, isAdmin = false, ...props }, ref) => {
    const pathname = usePathname()
    const [isDrawerOpen, setIsDrawerOpen] = useState(false)
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
    const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
    
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or centralized userNavigation
    // Filter to only NavItems (exclude NavGroups)
    const navItems = isAdmin ? centralAdminNav : (navigation || (userNavigation.filter((item): item is NavItem => 'href' in item)))
    
    // Fetch active vision ID for dynamic Audio link
    useEffect(() => {
      const fetchActiveVision = async () => {
        try {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          
          if (!user) return
          
          const { data: activeVision } = await supabase
            .from('vision_versions')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          if (activeVision) {
            setActiveVisionId(activeVision.id)
          }
        } catch (error) {
          console.error('Error fetching active vision:', error)
        }
      }
      
      fetchActiveVision()
    }, [])
    
    // Use centralized mobile navigation and resolve dynamic Audio link
    const mobileNavItems = centralMobileNav.map((item: CentralNavItem) => {
      // Dynamically resolve Audio link to active vision's audio sets page
      if (item.name === 'Audio' && activeVisionId) {
        return {
          ...item,
          href: `/life-vision/${activeVisionId}/audio/sets`,
          isAction: false,
        }
      }
      
      return {
        ...item,
        isAction: item.href === '#', // "Align" button is an action
      }
    })

    // Define drawer sections with categorized navigation
    const drawerSections = [
      {
        title: 'Align',
        items: [
          { name: 'Life Vision', href: activeVisionId ? `/life-vision/${activeVisionId}` : '/life-vision', icon: Target },
          { name: 'Vibe Tribe', href: '/vibe-tribe', icon: UsersRound },
          { name: 'Alignment Gym', href: '/alignment-gym', icon: Video },
          { name: 'Dashboard', href: '/dashboard', icon: Home },
        ]
      },
      {
        title: 'You',
        items: [
          { name: 'Profile', href: '/profile', icon: User },
          { name: 'Assessment', href: '/assessment', icon: Brain },
        ]
      },
      {
        title: 'Tracking',
        items: [
          { name: 'Tracking', href: '/tracking', icon: TrendingUp },
          { name: 'Activity', href: '/dashboard/activity', icon: Activity },
          { name: 'Abundance Tracker', href: '/abundance-tracker', icon: DollarSign },
          { name: 'Badges', href: '/snapshot/me', icon: Award },
        ]
      },
      {
        title: 'System',
        items: [
          { name: 'Tokens', href: '/dashboard/tokens', icon: Zap },
          { name: 'Storage', href: '/dashboard/storage', icon: HardDrive },
          { name: 'Support', href: '/support', icon: Headset },
          { name: 'Settings', href: '/account/settings', icon: Settings },
        ]
      }
    ]

    const handleItemClick = (item: any) => {
      if (item.hasDropdown && item.children) {
        setSelectedCategory(item.name)
        setIsDrawerOpen(true)
      }
    }

    const closeDrawer = () => {
      setIsDrawerOpen(false)
      setSelectedCategory(null)
    }

    return (
      <>
        <div 
          ref={ref}
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-neutral-900 border-t border-neutral-800',
            'md:hidden', // Only show on mobile
            className
          )}
          {...props}
        >
          <div className="flex items-center justify-around py-2">
            {mobileNavItems.map((item: NavItem & { isAction?: boolean }) => {
              const Icon = item.icon
              const isActive = isNavItemActive(item, pathname)
              
              if (item.isAction) {
                return (
                  <button
                    key={item.name}
                    onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                    className={cn(
                      'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                      isDrawerOpen 
                        ? 'text-[#39FF14] bg-[#39FF14]/10' 
                        : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium truncate">{item.name}</span>
                  </button>
                )
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all duration-200 min-w-0 flex-1',
                    isActive
                      ? 'text-[#39FF14] bg-[#39FF14]/10'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/50'
                  )}
                >
                  <Icon className="w-5 h-5 mb-1" />
                  <span className="text-xs font-medium truncate">{item.name}</span>
                </Link>
              )
            })}
          </div>
        </div>

        {/* Slideout Drawer */}
        <div className={cn(
          'fixed inset-0 z-40 md:hidden',
          'transition-all duration-300 ease-in-out',
          isDrawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}>
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/30 backdrop-blur-sm"
            onClick={closeDrawer}
          />
          
          {/* Drawer Content - positioned above bottom bar */}
          <div className={cn(
            'absolute left-0 right-0',
            'bg-neutral-900 border-t border-neutral-800 rounded-t-2xl',
            'transform transition-transform duration-300 ease-in-out',
            isDrawerOpen ? 'translate-y-0' : 'translate-y-full',
            'bottom-16' // Position above the bottom bar (assuming bottom bar is ~64px tall)
          )}>
            <div className="p-4 max-h-[70vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-white">
                  More Options
                </h3>
                <button
                  onClick={closeDrawer}
                  className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-400" />
                </button>
              </div>

              {/* Categorized Sections */}
              {drawerSections.map((section, idx) => (
                <div key={section.title}>
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h4>
                  <div className="grid grid-cols-2 gap-3 mb-6">
                    {section.items.map((item) => {
                      const Icon = item.icon
                      const isActive = isNavItemActive(item, pathname)
                      
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          onClick={closeDrawer}
                          className={cn(
                            'flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-200',
                            'border-2 border-neutral-700 hover:border-neutral-600',
                            isActive
                              ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                              : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                          )}
                        >
                          <Icon className="w-6 h-6 mb-2" />
                          <span className="text-sm font-medium text-center">{item.name}</span>
                        </Link>
                      )
                    })}
                  </div>
                  {idx < drawerSections.length - 1 && (
                    <div className="border-t border-neutral-800 mb-6" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    )
  }
)
MobileBottomNav.displayName = 'MobileBottomNav'

