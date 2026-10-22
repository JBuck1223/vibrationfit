'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
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
  Shield,
  Bell,
  Menu,
  Home,
} from 'lucide-react'
import { userNavigationPrimary, userNavigationGroups, shellNavigationPrimary, shellNavigationGroups, adminNavigation, mobileNavigation, isNavItemActive, type NavItem, type NavGroup } from '@/lib/navigation'
import { useAdminNotificationCount } from '@/hooks/useAdminNotificationCount'
import { DEFAULT_PROFILE_IMAGE_URL } from '@/app/profile/components/ProfilePictureUpload'
import { ProfilePictureClickable } from '@/components/ProfilePictureClickable'
import { LifeActivationSidebarCard } from '@/components/life-activation/LifeActivationSidebarCard'
import { VibeNotificationBell } from '@/components/vibe-tribe/VibeNotificationBell'
import { useLifeActivation } from '@/hooks/useLifeActivation'

interface SidebarProps {
  className?: string
  isAdmin?: boolean
}

// LocalStorage keys for sidebar state
const SIDEBAR_COLLAPSED_KEY = 'vibrationfit-sidebar-collapsed'
const SIDEBAR_GROUPS_KEY = 'vibrationfit-sidebar-groups-v2'

function getDefaultExpandedGroups(groups: NavGroup[]): string[] {
  return groups.filter((group) => !group.defaultCollapsed).map((group) => group.name)
}

// Shared Sidebar Base Component
function SidebarBase({ className, navigation, primaryNavigation = [], groups = [], isAdmin = false, surface = 'solid' }: SidebarProps & { navigation: NavItem[], primaryNavigation?: NavItem[], groups?: NavGroup[], surface?: 'solid' | 'glass' }) {
  // Initialize with default value for SSR consistency, then sync with localStorage
  const [collapsed, setCollapsed] = useState(false) // Default: expanded
  const [hasMounted, setHasMounted] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [expandedGroups, setExpandedGroups] = useState<string[]>(() => getDefaultExpandedGroups(groups))
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [activeVisionId, setActiveVisionId] = useState<string | null>(null)
  const [isSuperAdmin, setIsSuperAdmin] = useState(false)
  const [loading, setLoading] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const search = searchParams.toString()
  const { count: unreadNotifications } = useAdminNotificationCount(isAdmin)
  const { progress, isFetched } = useLifeActivation()
  // Until Getting Started is finished, the member sidebar is only that path.
  const gettingStartedOnly =
    !isAdmin && isFetched && progress != null && !progress.onboarding_completed_at

  const itemIsActive = (item: NavItem, isChild = false) =>
    isNavItemActive(item, pathname, profile?.id, isChild, search)
  
  // Sync with localStorage after mount to avoid hydration mismatch
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_COLLAPSED_KEY)
    if (saved !== null) {
      setCollapsed(saved === 'true')
    }
    
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
      
      // Use getSession (reads from storage, no Auth API call) to avoid rate limits
      const { data: { session } } = await supabase.auth.getSession()
      const user = session?.user
      
      if (user) {
        setUser(user)
        
        // Check super admin role (non-blocking)
        Promise.resolve(supabase
          .from('user_accounts')
          .select('role')
          .eq('id', user.id)
          .single())
          .then(({ data }) => setIsSuperAdmin(data?.role === 'super_admin'))
          .catch(() => setIsSuperAdmin(false))
        
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
          itemIsActive(child, true)
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
  }, [pathname, search, navigation, profile?.id])

  // Auto-expand nav groups when one of their items is active
  useEffect(() => {
    const groupsToExpand = groups
      .filter(group => group.items.some(item => itemIsActive(item)))
      .map(group => group.name)

    if (groupsToExpand.length === 0) return

    setExpandedGroups(prev => {
      const next = [...prev]
      for (const name of groupsToExpand) {
        if (!next.includes(name)) next.push(name)
      }
      return next
    })
  }, [pathname, search, groups, profile?.id])

  // Close mobile sidebar on navigation
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  const toggleExpanded = (itemName: string) => {
    setExpandedItems(prev => 
      prev.includes(itemName) 
        ? prev.filter(name => name !== itemName)
        : [...prev, itemName]
    )
  }

  // Inside the app shell: one app-like row for everything, a green pill for
  // where you are (like the studio toggles), no outlines.
  const glass = surface === 'glass'
  const shellRow = (active: boolean, dim = false) =>
    cn(
      'flex items-center gap-3 h-10 px-3 rounded-full text-sm transition-colors duration-150',
      active
        ? 'bg-[rgba(57,255,20,0.14)] text-[#39FF14] font-semibold'
        : dim
          ? 'text-white/60 hover:text-white hover:bg-white/[0.05]'
          : 'text-white/80 hover:text-white hover:bg-white/[0.05]'
    )

  const toggleGroup = (groupName: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupName)
        ? prev.filter(name => name !== groupName)
        : [...prev, groupName]
    )
  }

  const renderSidebarContent = (isCollapsed: boolean) => (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className={cn('flex items-center justify-between', glass ? 'px-4 pt-4 pb-3' : 'px-4 py-3 border-b border-neutral-800')}>
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            {loading ? (
              <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
            ) : (
              <ProfilePictureClickable
                src={profile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                alt={profile?.first_name || 'Profile'}
                className="h-8 w-8 shrink-0 rounded-full"
              >
                <img
                  src={profile?.profile_picture_url || DEFAULT_PROFILE_IMAGE_URL}
                  alt=""
                  className={cn('h-8 w-8 rounded-full object-cover', glass ? 'ring-1 ring-white/20' : 'border-2 border-primary-500')}
                  loading="eager"
                />
              </ProfilePictureClickable>
            )}
            {loading ? (
              <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
            ) : profile?.first_name ? (
              <span className={cn('text-white truncate', glass ? 'text-sm font-semibold' : 'font-medium')}>
                {profile.first_name}
              </span>
            ) : (
              <div className="w-24 h-4 bg-neutral-700 rounded animate-pulse" />
            )}
          </div>
        )}
        <div className="flex items-center gap-1">
          {/* Mobile: close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
            aria-label="Close menu"
          >
            <X className="w-4 h-4 text-neutral-400" />
          </button>
          {!isAdmin && <VibeNotificationBell className="hidden md:flex" />}
          {/* Desktop: admin notifications */}
          {isAdmin && (
            <Link
              href="/admin/notifications"
              className="hidden md:flex relative p-1.5 rounded-lg hover:bg-neutral-800 transition-colors"
              title="Notifications"
            >
              <Bell className="w-4 h-4 text-neutral-400" />
              {unreadNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-[#FF0040] text-[10px] font-bold text-white px-1 leading-none">
                  {unreadNotifications > 99 ? '99+' : unreadNotifications}
                </span>
              )}
            </Link>
          )}
          {/* Desktop: collapse toggle (in the app shell it's a tab on the panel's edge instead) */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn('p-1.5 rounded-lg transition-colors', glass ? 'hidden' : 'hidden md:block hover:bg-neutral-800')}
          >
            {collapsed ? (
              <ChevronRight className={cn('w-4 h-4', !glass && 'text-neutral-400')} />
            ) : (
              <ChevronLeft className={cn('w-4 h-4', !glass && 'text-neutral-400')} />
            )}
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className={cn('flex-1 min-h-0 overflow-y-auto', glass ? 'px-3 pt-1 pb-4 space-y-0.5' : 'px-4 pt-1 pb-4 space-y-1')}>
        {!isAdmin && <LifeActivationSidebarCard collapsed={isCollapsed} />}
        {!gettingStartedOnly && primaryNavigation.length > 0 && (
          <div className={glass ? 'space-y-0.5' : 'mb-3 space-y-1'}>
            {primaryNavigation.map((item) => {
              const Icon = item.icon
              const isActive = itemIsActive(item)

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  title={item.description || item.name}
                  className={glass
                    ? cn(shellRow(isActive), isCollapsed && 'justify-center px-0')
                    : cn(
                      'flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-200',
                      isCollapsed ? 'justify-center p-2' : 'px-3 py-2.5',
                      isActive
                        ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
                        : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                    )}
                >
                  <Icon className={cn('flex-shrink-0', glass ? 'w-[18px] h-[18px]' : 'w-5 h-5')} />
                  {!isCollapsed && <span className="flex-1">{item.name}</span>}
                </Link>
              )
            })}
          </div>
        )}

        {!gettingStartedOnly && navigation.map((item) => {
          const itemHref = item.href
          
          const isActive = itemIsActive(item)
          const isExpanded = expandedItems.includes(item.name)
          const Icon = item.icon
          
          const hasActiveChild = item.children?.some(child => itemIsActive(child, true))
          const shouldHighlightParent = isActive && !hasActiveChild

          return (
            <div key={item.name}>
              {item.hasDropdown && !isCollapsed ? (
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
                        const isChildActive = itemIsActive(child, true)
                        
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
                    isCollapsed && 'justify-center'
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {!isCollapsed && (
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
        
        {!gettingStartedOnly && groups.map((group) => {
          const isGroupExpanded = expandedGroups.includes(group.name)
          
          if (isCollapsed) {
            return (
              <div key={group.name} className={glass ? 'pt-3 space-y-0.5' : 'pt-2 mt-2 border-t border-neutral-800 space-y-1'}>
                {group.href && group.icon && (() => {
                  const GroupIcon = group.icon
                  const here = pathname === group.href
                  return (
                    <Link
                      href={group.href}
                      title={group.name}
                      className={glass
                        ? cn(shellRow(here), 'justify-center px-0')
                        : cn(
                          'flex justify-center p-2 rounded-lg transition-all duration-200',
                          here
                            ? 'bg-[#39FF14]/20 text-[#39FF14] border border-[#39FF14]/30'
                            : 'text-white hover:bg-neutral-800'
                        )}
                    >
                      <GroupIcon className={cn('flex-shrink-0', glass ? 'w-[18px] h-[18px]' : 'w-5 h-5')} />
                    </Link>
                  )
                })()}
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = itemIsActive(item)
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      title={item.name}
                      className={glass
                        ? cn(shellRow(isActive, true), 'justify-center px-0')
                        : cn(
                          'flex justify-center p-2 rounded-lg transition-all duration-200',
                          isActive
                            ? 'bg-[#00CC44]/20 text-[#00CC44] border border-[#00CC44]/30'
                            : 'text-neutral-300 hover:text-white hover:bg-neutral-800'
                        )}
                    >
                      <Icon className={cn('flex-shrink-0', glass ? 'w-4 h-4' : 'w-5 h-5')} />
                    </Link>
                  )
                })}
              </div>
            )
          }

          return (
            <div key={group.name} className={glass ? 'pt-3' : 'pt-3'}>
              {group.href ? (
                (() => {
                  const GroupIcon = group.icon
                  const here = pathname === group.href
                  return (
                    <div className="group/section relative">
                      <Link href={group.href} className={cn(shellRow(here), 'pr-10')}>
                        {GroupIcon && <GroupIcon className="w-[18px] h-[18px] flex-shrink-0" />}
                        <span className="flex-1 truncate">{group.name}</span>
                      </Link>
                      <button
                        onClick={() => toggleGroup(group.name)}
                        aria-label={isGroupExpanded ? `Hide ${group.name} areas` : `Show ${group.name} areas`}
                        aria-expanded={isGroupExpanded}
                        className="absolute right-1 top-1/2 -translate-y-1/2 flex h-8 w-8 items-center justify-center rounded-lg text-white/40 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white focus-visible:opacity-100 group-hover/section:opacity-100"
                      >
                        <ChevronDown className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isGroupExpanded ? 'rotate-180' : ''
                        )} />
                      </button>
                    </div>
                  )
                })()
              ) : (
              <button
                onClick={() => toggleGroup(group.name)}
                className="flex items-center gap-2 px-3 py-1.5 w-full text-left rounded-lg hover:bg-neutral-800/50 transition-colors"
              >
                <span className="text-xs font-semibold tracking-wider text-neutral-500 uppercase flex-1">
                  {group.name}
                </span>
                <ChevronDown className={cn(
                  'w-4 h-4 text-neutral-500 transition-transform duration-200',
                  isGroupExpanded ? 'rotate-180' : ''
                )} />
              </button>
              )}
              
              {isGroupExpanded && (
                <div className={cn(group.href ? 'mt-0.5 space-y-0.5 pl-[30px]' : 'mt-1 space-y-1')}>
                  {group.items.map((item) => {
                    const isActive = itemIsActive(item)
                    const isExpanded = expandedItems.includes(item.name)
                    const Icon = item.icon
                    
                    const hasActiveChild = item.children?.some(child => itemIsActive(child, true))
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
                                  const isChildActive = itemIsActive(child, true)
                                  
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
                            className={glass
                              ? cn(shellRow(isActive, true), 'h-9')
                              : cn(
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
      {!isCollapsed && (
        <div className={cn('space-y-3', glass ? 'px-3 pb-4 pt-2' : 'p-4 border-t border-neutral-800')}>
          <div className="flex items-center gap-2">
            <button
              onClick={async () => {
                const supabase = createClient()
                await supabase.auth.signOut()
                window.location.href = '/auth/login'
              }}
              className={cn(
                glass
                  ? 'flex items-center gap-3 h-10 px-3 rounded-[10px] text-sm text-white/60 hover:text-white hover:bg-white/[0.05] transition-colors'
                  : 'flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-neutral-300 hover:text-white hover:bg-neutral-800 transition-all duration-200',
                isSuperAdmin ? 'flex-1' : 'w-full'
              )}
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out</span>
            </button>
            {isSuperAdmin && (
              <Link
                href={isAdmin ? '/dashboard' : '/admin'}
                className={cn(
                  'flex items-center justify-center p-2.5 rounded-lg transition-all duration-200',
                  isAdmin
                    ? 'text-neutral-400 hover:text-[#39FF14] hover:bg-[#39FF14]/10'
                    : 'text-neutral-400 hover:text-[#BF00FF] hover:bg-[#BF00FF]/10'
                )}
                title={isAdmin ? 'Back to User Dashboard' : 'Admin'}
              >
                {isAdmin ? <Home className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              </Link>
            )}
          </div>
          <div className="text-xs text-neutral-500 text-center">
            Above the Green Line
          </div>
        </div>
      )}
    </div>
  )

  return (
    <>
      {!isAdmin && <VibeNotificationBell variant="mobile" />}
      {/* Mobile Menu Button */}
      <button
        onClick={() => setMobileOpen(true)}
        className="md:hidden fixed top-[max(0.75rem,env(safe-area-inset-top))] left-4 z-40 w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-lg border-2 border-neutral-700 hover:border-neutral-600"
        aria-label="Open menu"
      >
        <Menu className="w-5 h-5 text-white" />
      </button>

      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside
        className={cn(
          'md:hidden fixed top-0 left-0 bottom-0 w-[280px] bg-neutral-800 border-r border-neutral-800 z-50 pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]',
          'transform transition-transform duration-300',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {renderSidebarContent(false)}
      </aside>

      {/* Desktop Sidebar */}
      <div
        className={cn(
          'hidden md:flex flex-col transition-all duration-300',
          // Inside the app shell: a floating panel in the same violet frosted
          // glass as the cards and bottom bar.
          surface === 'glass'
            ? 'vf-glass relative rounded-[26px] border border-white/[0.14] bg-[linear-gradient(180deg,rgba(44,36,60,0.55)_0%,rgba(22,18,32,0.68)_100%)] shadow-[0_14px_40px_rgba(0,0,0,0.35)] backdrop-blur-2xl backdrop-saturate-150'
            : 'bg-neutral-800 border-r border-neutral-800',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
      >
        {renderSidebarContent(collapsed)}
        {surface === 'glass' && (
          // A round tab half outside the panel's right edge, easy to find when collapsed.
          <button
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="absolute -right-3 top-7 z-10 flex h-7 w-7 items-center justify-center rounded-full border border-white/20 bg-[rgba(44,36,60,0.95)] text-white shadow-[0_4px_14px_rgba(0,0,0,0.45)] transition-colors hover:border-[#39FF14]/60 hover:text-[#39FF14]"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>
    </>
  )
}

// User Sidebar Component
export function UserSidebar({ className }: { className?: string }) {
  return (
    <SidebarBase
      className={className}
      navigation={[]}
      primaryNavigation={userNavigationPrimary}
      groups={userNavigationGroups}
      isAdmin={false}
    />
  )
}

/**
 * The same member sidebar inside the new app shell: regrouped to the seven
 * sections and painted as glass over the theme backdrop. Desktop only; phones
 * use the shell's pill nav, so its hamburger and drawer never show here.
 */
export function ShellUserSidebar() {
  return (
    <SidebarBase
      className="h-full"
      navigation={[]}
      primaryNavigation={shellNavigationPrimary}
      groups={shellNavigationGroups}
      isAdmin={false}
      surface="glass"
    />
  )
}

// Admin Sidebar Component
export function AdminSidebar({ className }: { className?: string }) {
  return <SidebarBase className={className} navigation={adminNavigation} isAdmin={true} />
}

// Generic Sidebar Component (for backward compatibility)
export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const navigation = isAdmin ? adminNavigation : []
  const groups = isAdmin ? [] : userNavigationGroups
  const primaryNavigation = isAdmin ? [] : userNavigationPrimary
  return (
    <SidebarBase
      className={className}
      navigation={navigation}
      primaryNavigation={primaryNavigation}
      groups={groups}
      isAdmin={isAdmin}
    />
  )
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
        const { data: { session } } = await supabase.auth.getSession()
        const user = session?.user
        
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
  
  const mobileNavItems = mobileNavigation.map(item => {
    return {
      ...item,
      isAction: item.href === '#', // "More" button is an action
    }
  })

  const drawerSections = userNavigationGroups.map((group) => ({
    title: group.name,
    showTitle: true,
    items: group.items.map((item) => ({
      name: item.name,
      href: item.name === 'Life Vision' && activeVisionId ? `/life-vision/${activeVisionId}` : item.href,
      icon: item.icon,
    })),
  }))

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

            {/* Primary quick links */}
            <div className="grid grid-cols-3 gap-2 mb-6">
              {userNavigationPrimary.map((item) => {
                const Icon = item.icon
                const isActive = isNavItemActive(item, pathname)

                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={closeDrawer}
                    className={cn(
                      'flex flex-col items-center justify-center p-3 rounded-xl transition-all duration-200',
                      'border-2 border-neutral-700 hover:border-neutral-600',
                      isActive
                        ? 'bg-[#39FF14]/20 border-[#39FF14]/50 text-[#39FF14]'
                        : 'bg-neutral-800/50 text-neutral-300 hover:bg-neutral-800 hover:text-white'
                    )}
                  >
                    <Icon className="w-5 h-5 mb-1" />
                    <span className="text-xs font-medium text-center">{item.name}</span>
                  </Link>
                )
              })}
            </div>
            <div className="border-t border-neutral-800 mb-6" />

            {/* Categorized Sections */}
            {drawerSections.map((section) => (
              <div key={section.title}>
                {section.showTitle && (
                  <h4 className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-3">
                    {section.title}
                  </h4>
                )}
                <div className="grid grid-cols-2 gap-3">
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
