'use client'

import React, { useState, useEffect, useMemo } from 'react'
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
  HardDrive,
} from 'lucide-react'
import { userNavigation, adminNavigation, mobileNavigation, isNavItemActive, type NavItem } from '@/lib/navigation'
import { useStorageData } from '@/hooks/useStorageData'

interface SidebarProps {
  className?: string
  isAdmin?: boolean
}

export function Sidebar({ className, isAdmin = false }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expandedItems, setExpandedItems] = useState<string[]>([])
  const [user, setUser] = useState<SupabaseUser | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(false) // Start as false to render immediately
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  
  // Create Supabase client - create fresh instance (similar to Header component)
  const supabase = createClient()
  
  // Use admin or user navigation based on isAdmin prop
  const navigation = isAdmin ? adminNavigation : userNavigation

  // Fetch real-time storage data (hook must be called unconditionally)
  const { data: storageData, loading: storageLoading } = useStorageData()

  // Track if component is mounted (for client-side only rendering)
  useEffect(() => {
    setMounted(true)
  }, [])

  // Helper function to format bytes to GB
  const formatBytesToGB = (bytes: number): string => {
    const gb = bytes / (1024 * 1024 * 1024)
    return gb.toFixed(2)
  }

  useEffect(() => {
    // Function to fetch profile data (defined inside useEffect to capture current supabase client)
    const fetchProfile = async (userId: string) => {
      try {
        console.log('Sidebar: ===== fetchProfile called =====')
        console.log('Sidebar: Fetching profile for user:', userId)
        
        // First, try to get the active profile (non-draft)
        let { data: profileData, error } = await supabase
          .from('user_profiles')
          .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining, storage_quota_gb, is_active, is_draft')
          .eq('user_id', userId)
          .eq('is_active', true)
          .eq('is_draft', false)
          .maybeSingle()
        
        // If no active profile found, fall back to any non-draft profile (most recent)
        if (!profileData && !error) {
          console.log('Sidebar: No active profile found, falling back to latest non-draft profile')
          const fallbackResult = await supabase
            .from('user_profiles')
            .select('first_name, profile_picture_url, vibe_assistant_tokens_remaining, storage_quota_gb, is_active, is_draft')
            .eq('user_id', userId)
            .eq('is_draft', false)
            .order('updated_at', { ascending: false })
            .limit(1)
            .maybeSingle()
          
          profileData = fallbackResult.data
          error = fallbackResult.error
        }
        
        console.log('Sidebar: Profile query result:', { 
          hasData: !!profileData, 
          error: error?.code, 
          is_active: profileData?.is_active,
          is_draft: profileData?.is_draft 
        })
        
        if (error) {
          // Log any unexpected errors
          const errorDetails: any = {}
          if (error.code) errorDetails.code = error.code
          if (error.message) errorDetails.message = error.message
          if (error.details) errorDetails.details = error.details
          if (error.hint) errorDetails.hint = error.hint
          
          if (Object.keys(errorDetails).length > 0) {
            console.error('Sidebar: Error fetching profile:', errorDetails)
          } else {
            console.error('Sidebar: Error fetching profile (empty error object):', error)
          }
          
          setProfile(null)
          setProfileLoaded(true) // Mark as loaded even on error so UI stops pulsing
        } else if (profileData) {
          // Profile found
          console.log('Sidebar: Profile loaded successfully:', {
            hasName: !!profileData.first_name,
            hasPicture: !!profileData.profile_picture_url,
            tokens: profileData.vibe_assistant_tokens_remaining
          })
          setProfile(profileData)
          setProfileLoaded(true)
        } else {
          // No profile found (maybeSingle returns null, not an error)
          console.log('Sidebar: No profile found for user - this is expected for new users')
          setProfile(null)
          setProfileLoaded(true) // Mark as loaded even when no profile found so UI stops pulsing
        }
      } catch (err) {
        console.error('Sidebar: Unexpected error fetching profile:', err)
        setProfile(null)
        setProfileLoaded(true) // Mark as loaded even on exception so UI stops pulsing
      }
    }

    const getUser = async () => {
      try {
        // Don't set loading to true here - we want to render immediately
        // Only set loading for user-specific content areas
        console.log('Sidebar: Initializing auth...')
        
        // Check if supabase client is available
        if (!supabase || !supabase.auth) {
          console.error('Sidebar: Supabase client not available')
          setUser(null)
          setProfile(null)
          setProfileLoaded(true)
          setLoading(false)
          return
        }
        
        // Try getSession() first (reads from localStorage, faster)
        // This is more reliable than getUser() which makes a network request
        console.log('Sidebar: Calling supabase.auth.getSession()...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          console.warn('Sidebar: Session error (non-critical):', {
            code: sessionError.code,
            message: sessionError.message
          })
          setUser(null)
          setProfile(null)
          setProfileLoaded(true)
          setLoading(false)
          return
        }
        
        const user = session?.user ?? null
        console.log('Sidebar: Session check complete:', { 
          hasUser: !!user, 
          userId: user?.id,
          email: user?.email 
        })
        setUser(user)
        
        // Fetch profile if user exists
        if (user) {
          console.log('Sidebar: User found, calling fetchProfile with userId:', user.id)
          // Await to ensure profile loads properly
          await fetchProfile(user.id)
        } else {
          console.log('Sidebar: No user found')
          setProfile(null)
          setProfileLoaded(true) // Mark as loaded so UI stops pulsing
        }
      } catch (err) {
        console.warn('Sidebar: Unexpected error in getUser (non-critical):', err)
        setUser(null)
        setProfile(null)
        setProfileLoaded(true) // Mark as loaded so UI stops pulsing
      } finally {
        setLoading(false)
        console.log('Sidebar: Initialization complete, loading set to false')
      }
    }

    getUser()

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Sidebar: Auth state changed:', event, { 
        hasSession: !!session, 
        userId: session?.user?.id 
      })
      
      if (session?.user) {
        setUser(session.user)
        // Re-fetch profile when user logs in or auth state changes
        await fetchProfile(session.user.id)
      } else {
        // User logged out
        console.log('Sidebar: User logged out')
        setUser(null)
        setProfile(null)
        setProfileLoaded(true) // Mark as loaded so UI stops pulsing
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
          <div className="flex items-center gap-3 min-w-0" suppressHydrationWarning>
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

      {/* Token Balance and Storage Cards - Only render after mount to prevent hydration issues */}
      {!collapsed && mounted && (
        <div className="px-4 py-3 space-y-3 border-t border-neutral-800" suppressHydrationWarning>
          {/* Token Balance Card */}
          <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Token Balance
              </span>
              <Zap className="w-3 h-3 text-[#FFB701]" />
            </div>
            <div className="flex items-baseline gap-2">
              {loading || !profileLoaded ? (
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

          {/* Storage Card */}
          <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                Storage
              </span>
              <HardDrive className="w-3 h-3 text-[#14B8A6]" />
            </div>
            <div className="flex items-baseline gap-2">
              {loading || !profileLoaded || storageLoading ? (
                <div className="w-20 h-6 bg-neutral-700 rounded animate-pulse" />
              ) : (
                <>
                  <span className="text-lg font-bold text-white">
                    {storageData?.totalSize ? formatBytesToGB(storageData.totalSize) : '0.00'}
                  </span>
                  <span className="text-xs text-neutral-500">
                    / {profile?.storage_quota_gb ?? 5} GB
                  </span>
                </>
              )}
            </div>
          </div>
        </div>
      )}

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

