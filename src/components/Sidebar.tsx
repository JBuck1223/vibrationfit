'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import { getActiveProfileClient } from '@/lib/supabase/profile-client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  LogOut,
} from 'lucide-react'
import { userNavigation, adminNavigation, mobileNavigation, isNavItemActive, type NavItem } from '@/lib/navigation'

interface SidebarProps {
  className?: string
  isAdmin?: boolean
}

// Shared Sidebar Base Component
function SidebarBase({ className, navigation, isAdmin = false }: SidebarProps & { navigation: NavItem[] }) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  // Memoize supabase client to prevent dependency array issues
  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    // Parallelize all queries - don't wait for each one
    const loadData = async () => {
      // Set loading to false immediately so UI can render
      // We'll update profile/storage as data comes in
      setLoading(false)
      
      // Parallel fetch: getUser and profile at the same time
      const [userResult] = await Promise.allSettled([
        supabase.auth.getUser()
      ])
      
      if (userResult.status === 'fulfilled' && userResult.value.data?.user) {
        const user = userResult.value.data.user
        setUser(user)
        
        // Fetch profile (non-blocking - UI already rendered)
        getActiveProfileClient(user.id)
          .then(profileData => setProfile(profileData))
          .catch(err => console.error('Sidebar: Error fetching profile:', err))
      } else {
        setUser(null)
        setProfile(null)
      }
    }

    loadData()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null)
      if (session?.user) {
        // Refetch active profile when user changes (non-blocking)
        getActiveProfileClient(session.user.id)
          .then(profileData => setProfile(profileData))
          .catch(err => console.error('Sidebar: Error fetching profile:', err))
      } else {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  return (
    <div className={cn(
      'hidden md:flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300',
      collapsed ? 'w-16' : 'w-64',
      className
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-neutral-800">
        {!collapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {/* Profile Picture */}
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
            ) : profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt={profile.first_name || 'Profile'}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-500 flex-shrink-0"
                loading="eager"
              />
            ) : profile?.first_name ? (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                {profile.first_name[0].toUpperCase()}
              </div>
            ) : (
              <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
            )}
            
            {/* Name */}
            {loading ? (
              <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
            ) : profile?.first_name ? (
              <span className="text-white font-medium truncate">
                {profile.first_name}
              </span>
            ) : (
              <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
            )}
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
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = isNavItemActive(item, pathname)
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
                        const isChildActive = isNavItemActive(child, pathname)
                        
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
        <div className="p-4 border-t border-neutral-800 space-y-3">
          <button
            onClick={async () => {
              const supabase = createClient()
              await supabase.auth.signOut()
              window.location.href = '/auth/login'
            }}
            className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
          <div className="text-xs text-neutral-500 text-center">
            Above the Green Line
          </div>
        </div>
      )}
    </div>
  )
}

// User Sidebar Component
export function UserSidebar({ className }: { className?: string }) {
  return <SidebarBase className={className} navigation={userNavigation} isAdmin={false} />
}

// Admin Sidebar Component
export function AdminSidebar({ className }: { className?: string }) {
  return <SidebarBase className={className} navigation={adminNavigation} isAdmin={true} />
}

// Generic Sidebar Component (for backward compatibility)
export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const navigation = isAdmin ? adminNavigation : userNavigation
  return <SidebarBase className={className} navigation={navigation} isAdmin={isAdmin} />
}

// Mobile Bottom Navigation Component
interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  
  // Use centralized mobile navigation
  const mobileNavItems = mobileNavigation.map(item => ({
    ...item,
    isAction: item.href === '#', // "More" button is an action
  }))

  // Get all sidebar items for the drawer (exclude main nav items)
  // Use userNavigation for mobile drawer (admin uses same mobile nav)
  const allSidebarItems = userNavigation.filter((item: NavItem) => 
    !mobileNavItems.some((mobileItem: NavItem & { isAction?: boolean }) => 
      mobileItem.href === item.href || 
      (mobileItem.href === '/life-vision' && item.href === '/life-vision') ||
      (mobileItem.href === '/vision-board' && item.href === '/vision-board') ||
      (mobileItem.href === '/journal' && item.href === '/journal')
    )
  )

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
      <div className={cn(
        'fixed bottom-0 left-0 right-0 z-50',
        'bg-neutral-900 border-t border-neutral-800',
        'md:hidden', // Only show on mobile
        className
      )}>
        <div className="flex items-center justify-around py-2">
          {mobileNavItems.map((item) => {
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
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">
                {selectedCategory ? `${selectedCategory} Options` : 'More Options'}
              </h3>
              <button
                onClick={closeDrawer}
                className="p-2 rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            {/* Grid of Items */}
            <div className="grid grid-cols-2 gap-3">
              {allSidebarItems.map((item: NavItem) => {
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
                    {item.badge && (
                      <span className="mt-1 px-2 py-0.5 text-xs bg-[#39FF14] text-black rounded-full">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

// Layout wrapper that includes the sidebar
interface SidebarLayoutProps {
  children: React.ReactNode
  className?: string
  isAdmin?: boolean
}

export function SidebarLayout({ children, className, isAdmin = false }: SidebarLayoutProps) {
  return (
    <div className="flex h-screen bg-black">
      {isAdmin ? (
        <AdminSidebar className={className} />
      ) : (
        <UserSidebar className={className} />
      )}
      <main className={cn('flex-1 overflow-auto pb-16 md:pb-0', className)}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}
