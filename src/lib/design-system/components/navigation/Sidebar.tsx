'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, ChevronDown, Zap, HardDrive } from 'lucide-react'
import { cn } from '../shared-utils'
import { createClient } from '@/lib/supabase/client'
import { getActiveProfileClient } from '@/lib/supabase/profile-client'
import { useStorageData } from '@/hooks/useStorageData'
import { userNavigation, adminNavigation as centralAdminNav, isNavItemActive, type NavItem } from '@/lib/navigation'

// Sidebar Component
interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string
  navigation?: NavItem[]
  isAdmin?: boolean
}

export const Sidebar = React.forwardRef<HTMLDivElement, SidebarProps>(
  ({ className, navigation, isAdmin = false, ...props }, ref) => {
    // Use admin navigation if isAdmin is true, otherwise use provided navigation or centralized userNavigation
    const navItems = isAdmin ? centralAdminNav : (navigation || userNavigation)
    const [collapsed, setCollapsed] = useState(true)
    const [expandedItems, setExpandedItems] = useState<string[]>([])
    const [user, setUser] = useState<any>(null)
    const [profile, setProfile] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const pathname = usePathname()
    const supabase = createClient()
    
    // Fetch real-time storage data
    const { data: storageData, loading: storageLoading } = useStorageData()

    useEffect(() => {
      const getUser = async () => {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
        
        // Fetch active profile using single source of truth
        if (user) {
          const profileData = await getActiveProfileClient(user.id)
          setProfile(profileData)
        } else {
          setProfile(null)
        }
        
        setLoading(false)
      }

      getUser()

      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          // Refetch active profile when user changes
          const profileData = await getActiveProfileClient(session.user.id)
          setProfile(profileData)
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
      <div 
        ref={ref}
        className={cn(
          'hidden md:flex flex-col bg-neutral-900 border-r border-neutral-800 transition-all duration-300 sticky top-0 h-screen overflow-hidden',
          collapsed ? 'w-16' : 'w-64',
          className
        )}
        {...props}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-neutral-800">
          {!collapsed && (
            <div className="flex items-center gap-3">
              {/* Profile Picture */}
              {loading ? (
                <div className="w-8 h-8 rounded-full bg-neutral-700 animate-pulse flex-shrink-0" />
              ) : profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt={profile.first_name || 'Profile'}
                  className="w-8 h-8 rounded-full object-cover border-2 border-primary-500"
                />
              ) : profile?.first_name ? (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
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
          {navItems.map((item: NavItem) => {
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
                              <span className="text-lg font-bold text-white">
                                {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                              </span>
                              <span className="text-xs text-neutral-500">tokens</span>
                            </div>
                          </div>
                        )}
                        
                        {item.children.map((child: NavItem) => {
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

        {/* Token Balance and Storage Cards */}
        {!collapsed && (
          <div className="p-4 border-t border-neutral-800 space-y-3">
            {/* Token Balance Card */}
            <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Token Balance
                </span>
                <Zap className="w-3 h-3 text-[#FFB701]" />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-lg font-bold text-white">
                  {(profile?.vibe_assistant_tokens_remaining ?? 0).toLocaleString()}
                </span>
                <span className="text-xs text-neutral-500">tokens</span>
              </div>
            </div>

            {/* Storage Usage Card */}
            <div className="px-3 py-2 bg-neutral-800/50 rounded-lg border border-neutral-700">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                  Storage Usage
                </span>
                <HardDrive className="w-3 h-3 text-[#14B8A6]" />
              </div>
              
              {/* Storage Stats */}
              <div className="space-y-2">
                {storageLoading ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="animate-spin w-4 h-4 border-2 border-[#14B8A6] border-t-transparent rounded-full" />
                  </div>
                ) : (
                  <>
                    <div className="flex items-baseline justify-between">
                      <span className="text-lg font-bold text-white">
                        {storageData ? `${(storageData.totalSize / (1024 * 1024 * 1024)).toFixed(1)}` : '0.0'}
                      </span>
                      <span className="text-xs text-neutral-500">GB used</span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-neutral-700 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-[#14B8A6] to-[#39FF14] h-1.5 rounded-full transition-all duration-300"
                        style={{ 
                          width: `${Math.min((storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) * 100, 100)}%` 
                        }}
                      />
                    </div>
                    
                    {/* Storage Limit */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-neutral-500">of 10 GB limit</span>
                      <span className={`font-medium ${
                        (storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) > 0.8 
                          ? 'text-[#FFB701]' 
                          : 'text-[#14B8A6]'
                      }`}>
                        {((storageData?.totalSize || 0) / (10 * 1024 * 1024 * 1024) * 100).toFixed(1)}%
                      </span>
                    </div>
                    
                    {/* File Count */}
                    {storageData?.totalFiles && (
                      <div className="text-xs text-neutral-500">
                        {storageData.totalFiles} {storageData.totalFiles === 1 ? 'file' : 'files'}
                      </div>
                    )}
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
)
Sidebar.displayName = 'Sidebar'

