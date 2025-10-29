'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { 
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  Zap,
} from 'lucide-react'
import { userNavigation, adminNavigation, mobileNavigation, isNavItemActive, type NavItem } from '@/lib/navigation'

interface SidebarProps {
  className?: string
  isAdmin?: boolean
}

export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  
  // Use admin or user navigation based on isAdmin prop
  const navigation = isAdmin ? adminNavigation : userNavigation

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch profile data if user is logged in
      if (user) {
        const { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining')
          .eq('user_id', user.id)
          .single()
        
        if (error) {
          console.error('Error fetching profile:', error)
          // If profile doesn't exist, create one with default values
          if (error.code === 'PGRST116') {
            const { data: newProfile, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                vibe_assistant_tokens_remaining: 100
              })
              .select()
              .single()
            
            if (createError) {
              console.error('Error creating profile:', createError)
              setProfileLoaded(false)
            } else if (newProfile) {
              setProfile(newProfile)
              setProfileLoaded(true)
            } else {
              setProfileLoaded(false)
            }
          } else {
            setProfileLoaded(false)
          }
        } else if (profileData) {
          setProfile(profileData)
          setProfileLoaded(true)
        } else {
          setProfileLoaded(false)
        }
      } else {
        setProfileLoaded(false)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
        setProfileLoaded(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

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
            {loading || !profileLoaded ? (
              <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
            ) : profile?.profile_picture_url ? (
              <img
                src={profile.profile_picture_url}
                alt=""
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
            {loading || !profileLoaded || !profile || !profile?.first_name ? (
              <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
            ) : (
              <span className="text-white font-medium truncate">
                {profile.first_name}
              </span>
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

      {/* Token Balance - Top */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-neutral-800">
          <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Token Balance
              </span>
              <Zap className="w-3 h-3 text-[#FFB701]" />
            </div>
            <div className="flex items-baseline gap-2">
              {!profileLoaded ? (
                <div className="w-16 h-6 bg-neutral-700 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-lg font-bold text-white">
                    {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                  </span>
                  <span className="text-xs text-neutral-500">tokens</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
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
                      {/* Special Token Balance Display for Token Tracking */}
                      {item.name === 'Token Tracking' && (
                        <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700 mb-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                              Current Balance
                            </span>
                            <Zap className="w-3 h-3 text-[#FFB701]" />
                          </div>
                          <div className="flex items-baseline gap-2">
                            {!profileLoaded ? (
                              <div className="w-16 h-6 bg-neutral-700 rounded animate-pulse" />
                            ) : (
                              <>
                                <span className="text-lg font-bold text-white">
                                  {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                                </span>
                                <span className="text-xs text-neutral-500">tokens</span>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                      
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
        <div className="p-4 border-t border-neutral-800">
          <div className="text-xs text-neutral-500 text-center">
            Above the Green Line
          </div>
        </div>
      )}
    </div>
  )
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
      <Sidebar isAdmin={isAdmin} />
      <main className={cn('flex-1 overflow-auto pb-16 md:pb-0', className)}>
        {children}
      </main>
      <MobileBottomNav />
    </div>
  )
}

