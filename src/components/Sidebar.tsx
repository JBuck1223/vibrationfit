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
  Award,
} from 'lucide-react'
import { userNavigation, userNavigationGroups, adminNavigation, mobileNavigation, isNavItemActive, type NavItem, type NavGroup } from '@/lib/navigation'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'

interface SidebarProps {
  className?: string
  isAdmin?: boolean
}

// LocalStorage keys for sidebar state
const SIDEBAR_COLLAPSED_KEY = 'vibrationfit-sidebar-collapsed'
const SIDEBAR_GROUPS_KEY = 'vibrationfit-sidebar-groups'

// Shared Sidebar Base Component
function SidebarBase({ className, navigation, groups = [], isAdmin = false }: SidebarProps & { navigation: NavItem[], groups?: NavGroup[] }) {
  // Initialize with default value for SSR consistency, then sync with localStorage
  const [collapsed, setCollapsed] = useState(false) // Default: expanded
  const [hasMounted, setHasMounted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]) // For collapsible groups
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const pathname = usePathname()
  
  // Sync with localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
    
    // Load expanded groups state
    const savedGroups = localStorage.getItem(SIDEBAR_GROUPS_KEY)
    if (savedGroups) {
      try {
        setExpandedGroups(JSON.parse(savedGroups))
      } catch (e) {
        console.error('Error parsing saved groups:', e)
      }
    }
    
    setHasMounted(true)
  }, [])
  
  // Persist collapsed state to localStorage (only after initial mount)
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(collapsed))
    }
  }, [collapsed, hasMounted])
  
  // Persist expanded groups to localStorage
  useEffect(() => {
    if (hasMounted) {
      localStorage.setItem(SIDEBAR_GROUPS_KEY, JSON.stringify(expandedGroups))
    }
  }, [expandedGroups, hasMounted])
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
        
        // Fetch active vision ID (non-blocking)
        Promise.resolve(
          supabase
            .from('vision_versions')
            .select('id')
            .eq('user_id', user.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .maybeSingle()
        )
          .then(({ data }) => {
            if (data?.id) {
              setActiveVisionId(data.id)
            }
          })
          .catch(err => console.error('Sidebar: Error fetching active vision:', err))
      } else {
        setUser(null)
        setProfile(null)
        setActiveVisionId(null)
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
        
        // Refetch active vision ID
        Promise.resolve(
          supabase
            .from('vision_versions')
            .select('id')
            .eq('user_id', session.user.id)
            .eq('is_active', true)
            .eq('is_draft', false)
            .maybeSingle()
        )
          .then(({ data }) => {
            if (data?.id) {
              setActiveVisionId(data.id)
            }
          })
          .catch(err => console.error('Sidebar: Error fetching active vision:', err))
      } else {
        setProfile(null)
        setActiveVisionId(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase])

  // Auto-expand parent items when their children are active
  useEffect(() => {
    const itemsToExpand: string[] = []
    
    navigation.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some(child => 
          isNavItemActive(child, pathname, profile?.id, true) // true = isChildOfDropdown
        )
        if (hasActiveChild) {
          itemsToExpand.push(item.name)
        }
      }
    })
    
    if (itemsToExpand.length > 0) {
      setExpandedItems(prev => {
        const newExpanded = [...prev]
        itemsToExpand.forEach(name => {
          if (!newExpanded.includes(name)) {
            newExpanded.push(name)
          }
        })
        return newExpanded
      })
    }
  }, [pathname, navigation, profile?.id])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
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
            ) : (
              <img
                src={profile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt={profile?.first_name || 'Profile'}
                className="w-8 h-8 rounded-full object-cover border-2 border-primary-500 flex-shrink-0"
                loading="eager"
              />
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
        {/* Top-level navigation items */}
        {navigation.map((item) => {
          // Dynamically update Audio link if we have active vision
          const itemHref = item.name === 'Audio' && activeVisionId 
            ? `/life-vision/${activeVisionId}/audio/sets`
            : item.href
          
          const isActive = isNavItemActive(item, pathname, profile?.id)
          const isExpanded = expandedItems.includes(item.name)
          const Icon = item.icon
          
          // Check if any child is active (don't highlight parent if child is active)
          const hasActiveChild = item.children?.some(child => 
            isNavItemActive(child, pathname, profile?.id, true) // true = isChildOfDropdown
          )
          const shouldHighlightParent = isActive && !hasActiveChild

          return (
            <div key={item.name}>
              {item.hasDropdown && !collapsed ? (
                <div>
                  <button
                    onClick={() => toggleExpanded(item.name)}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 w-full text-left',
                      shouldHighlightParent
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
                        const isChildActive = isNavItemActive(child, pathname, profile?.id, true) // true = isChildOfDropdown
                        
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
                  href={itemHref}
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
        
        {/* Collapsible Groups */}
        {!collapsed && groups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.name)
          
          return (
            <div key={group.name} className="mt-4">
              {/* Group Header */}
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex items-center gap-2 px-3 py-2 w-full text-left rounded-lg hover:bg-neutral-800/50 transition-colors"
              >
                <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase flex-1">
                  {group.name}
                </span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-neutral-500 transition-transform duration-200',
                  isGroupExpanded ? 'rotate-180' : ''
                )} />
              </button>
              
              {/* Group Items */}
              {isGroupExpanded && (
                <div className="mt-2 space-y-1">
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(item, pathname, profile?.id)
                    const isExpanded = expandedItems.includes(item.name)
                    const Icon = item.icon
                    
                    const hasActiveChild = item.children?.some(child => 
                      isNavItemActive(child, pathname, profile?.id, true)
                    )
                    const shouldHighlightParent = isActive && !hasActiveChild

                    return (
                      <div key={item.name}>
                        {item.hasDropdown ? (
                          <div>
                            <button
                              onClick={() => toggleExpanded(item.name)}
                              className={cn(
                                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 w-full text-left',
                                shouldHighlightParent
                                  ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                                  : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                              )}
                            >
                              <Icon className="w-4 h-4 flex-shrink-0" />
                              <span className="flex-1">{item.name}</span>
                              <ChevronDown className={cn(
                                'w-3 h-3 transition-transform duration-200',
                                isExpanded ? 'rotate-180' : ''
                              )} />
                            </button>
                            
                            {isExpanded && item.children && (
                              <div className="ml-6 mt-1 space-y-1">
                                {item.children.map((child) => {
                                  const ChildIcon = child.icon
                                  const isChildActive = isNavItemActive(child, pathname, profile?.id, true)
                                  
                                  return (
                                    <Link
                                      key={child.name}
                                      href={child.href}
                                      className={cn(
                                        'flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-all duration-200',
                                        isChildActive
                                          ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                                      )}
                                    >
                                      <ChildIcon className="w-3 h-3 flex-shrink-0" />
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
                              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200',
                              isActive
                                ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
                                : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                            )}
                          >
                            <Icon className="w-4 h-4 flex-shrink-0" />
                            <span className="flex-1">{item.name}</span>
                          </Link>
                        )}
                      </div>
                    )
                  })}
                </div>
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
  return <SidebarBase className={className} navigation={userNavigation as NavItem[]} groups={userNavigationGroups} isAdmin={false} />
}

// Admin Sidebar Component
export function AdminSidebar({ className }: { className?: string }) {
  return <SidebarBase className={className} navigation={adminNavigation} isAdmin={true} />
}

// Generic Sidebar Component (for backward compatibility)
export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const navigation = isAdmin ? adminNavigation : (userNavigation as NavItem[])
  const groups = isAdmin ? [] : userNavigationGroups
  return <SidebarBase className={className} navigation={navigation} groups={groups} isAdmin={isAdmin} />
}

// Mobile Bottom Navigation Component
interface MobileBottomNavProps {
  className?: string
}

export function MobileBottomNav({ className }: MobileBottomNavProps) {
  const pathname = usePathname()
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  
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
  const mobileNavItems = mobileNavigation.map(item => {
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
      isAction: item.href === '#', // "More" button is an action
    }
  })

  // Define drawer sections with categorized navigation
  const drawerSections = [
    {
      title: 'Align',
      items: [
        { name: 'Vibe Tribe', href: '/vibe-tribe', icon: userNavigation.find(i => i.name === 'Vibe Tribe')?.icon },
        { name: 'Alignment Gym', href: '/alignment-gym', icon: userNavigation.find(i => i.name === 'Alignment Gym')?.icon },
        { name: 'Dashboard', href: '/dashboard', icon: userNavigation.find(i => i.name === 'Dashboard')?.icon },
      ]
    },
    {
      title: 'You',
      items: [
        { name: 'Profile', href: '/profile', icon: userNavigationGroups.find(g => g.name === 'Creations & Updates')?.items.find(i => i.name === 'Profile & Assessment')?.icon },
        { name: 'Assessment', href: '/assessment', icon: userNavigationGroups.find(g => g.name === 'Creations & Updates')?.items.find(i => i.name === 'Profile & Assessment')?.children?.[1].icon },
      ]
    },
    {
      title: 'Tracking',
      items: [
        { name: 'Tracking', href: '/tracking', icon: userNavigationGroups.find(g => g.name === 'Tracking & Activity')?.items.find(i => i.name === 'Tracking')?.icon },
        { name: 'Activity', href: '/dashboard/activity', icon: userNavigationGroups.find(g => g.name === 'Tracking & Activity')?.items.find(i => i.name === 'Activity')?.icon },
        { name: 'Abundance Tracker', href: '/abundance-tracker', icon: userNavigationGroups.find(g => g.name === 'Tracking & Activity')?.items.find(i => i.name === 'Abundance Tracker')?.icon },
        { name: 'Badges', href: '/snapshot/me', icon: Award },
      ]
    },
    {
      title: 'System',
      items: [
        { name: 'Tokens', href: '/dashboard/tokens', icon: userNavigationGroups.find(g => g.name === 'System & Billing')?.items.find(i => i.name === 'Tokens')?.icon },
        { name: 'Storage', href: '/dashboard/storage', icon: userNavigationGroups.find(g => g.name === 'System & Billing')?.items.find(i => i.name === 'Storage')?.icon },
        { name: 'Support', href: '/support/tickets', icon: userNavigationGroups.find(g => g.name === 'System & Billing')?.items.find(i => i.name === 'Support')?.icon },
        { name: 'Settings', href: '/account/settings', icon: userNavigationGroups.find(g => g.name === 'System & Billing')?.items.find(i => i.name === 'Settings')?.icon },
      ]
    }
  ]

  const closeDrawer = () => {
    setIsDrawerOpen(false)
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
          'bottom-16' // Position above the bottom bar
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
                    const isActive = isNavItemActive(item as NavItem, pathname)
                    
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
                        {Icon && <Icon className="w-6 h-6 mb-2" />}
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

            {/* Sign Out */}
            <div className="border-t border-neutral-800 pt-4">
              <button
                onClick={async () => {
                  closeDrawer()
                  const supabase = createClient()
                  await supabase.auth.signOut()
                  window.location.href = '/auth/login'
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-medium text-red-400 hover:text-red-300 hover:bg-neutral-800 transition-all duration-200 border-2 border-neutral-700"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
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
