'use client'

import React, { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Button } from '@/lib/design-system/components'
import { Container } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { getActiveProfileClient } from '@/lib/supabase/profile-client'
import { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut, Zap } from 'lucide-react'
import { getPageType, headerAccountMenu } from '@/lib/navigation'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  // Memoize supabase client to prevent dependency array issues
  const supabase = useMemo(() => createClient(), [])

  // Page classification using centralized system
  const pageType = getPageType(pathname)

  // Only show header on PUBLIC pages
  if (pageType !== 'PUBLIC') {
    return null
  }

  useEffect(() => {
    let mounted = true
    let timeoutId: NodeJS.Timeout | null = null
    
    const getUser = async () => {
      try {
        // Set a timeout to prevent infinite loading
        timeoutId = setTimeout(() => {
          if (mounted) {
            console.warn('Header: Auth check timeout, setting loading to false')
            setLoading(false)
          }
        }, 5000) // 5 second timeout

        // Use getSession() instead of getUser() - faster (reads from cookies vs network request)
        // This is the KEY OPTIMIZATION: getSession() reads from localStorage/cookies
        // getUser() makes a network request to Supabase every time
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        if (!mounted) return
        
        if (timeoutId) clearTimeout(timeoutId)
        
        if (sessionError) {
          console.error('Header: Error getting session:', sessionError)
          setUser(null)
          setProfile(null)
          setLoading(false)
          return
        }
        
        const user = session?.user ?? null
        setUser(user)
        
        // Fetch profile data if user is logged in (run in parallel if possible)
        if (user?.id) {
          try {
            const profileData = await getActiveProfileClient(user.id)
            
            if (mounted) {
              setProfile(profileData)
              setLoading(false)
            }
          } catch (profileError) {
            console.error('Header: Error fetching profile:', profileError)
            if (mounted) {
              setProfile(null)
              setLoading(false)
            }
          }
        } else {
          setProfile(null)
          setLoading(false)
        }
      } catch (err) {
        console.error('Header: Unexpected error in getUser:', err)
        if (mounted) {
          setUser(null)
          setProfile(null)
          setLoading(false)
        }
        if (timeoutId) clearTimeout(timeoutId)
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return
      
      try {
        setUser(session?.user ?? null)
        if (session?.user?.id) {
          // Refetch profile when user changes
          try {
            const profileData = await getActiveProfileClient(session.user.id)
            if (mounted) {
              setProfile(profileData)
            }
          } catch (profileError) {
            console.error('Header: Error fetching profile on auth change:', profileError)
            if (mounted) {
              setProfile(null)
            }
          }
        } else {
          setProfile(null)
        }
      } catch (err) {
        console.error('Header: Error in auth state change:', err)
        if (mounted) {
          setUser(null)
          setProfile(null)
        }
      }
    })

    return () => {
      mounted = false
      if (timeoutId) clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [supabase])

  const handleLogout = async () => {
    clearAllProfileCache() // Clear profile cache on logout
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  return (
    <header className={cn(
      "z-[99999] bg-black/95 backdrop-blur-sm border-b border-neutral-800"
    )}>
      <Container size="full" className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <Image
              src={ASSETS.brand.logoWhite}
              alt="VibrationFit"
              width={200}
              height={40}
              style={{ width: 'auto', height: '2rem' }}
              className="h-8"
              priority
            />
          </Link>


          {/* Desktop Auth / Account */}
          <div className="hidden md:flex items-center space-x-4">
            {loading ? (
              <div className="w-20 h-8 bg-neutral-800 rounded animate-pulse" />
            ) : user ? (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    const rect = e.currentTarget.getBoundingClientRect()
                    setButtonRect(rect)
                    setOpenDropdown(openDropdown === 'account' ? null : 'account')
                  }}
                  className="flex items-center gap-3 px-3 py-2 rounded-full hover:bg-neutral-800 transition-colors"
                >
                  {/* Profile Picture */}
                  {profile?.profile_picture_url ? (
                    <img
                      src={profile.profile_picture_url}
                      alt={profile.first_name || 'Profile'}
                      className="w-8 h-8 rounded-full object-cover border-2 border-primary-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm">
                      {profile?.first_name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                    </div>
                  )}
                  
                  {/* Name */}
                  <span className="text-white font-medium">
                    {profile?.first_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email?.split('@')[0]}
                  </span>
                  
                  <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${openDropdown === 'account' ? 'rotate-180' : ''}`} />
                </button>

                {/* Account Dropdown */}
                {openDropdown === 'account' && buttonRect && typeof window !== 'undefined' && createPortal(
                  <div
                    className="fixed bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl py-2 w-72"
                    style={{
                      top: buttonRect.bottom + 8,
                      right: window.innerWidth - buttonRect.right,
                      zIndex: 999999
                    }}
                  >
                    {/* Token Balance */}
                    <div className="px-4 py-3 border-b border-neutral-800">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">
                          Token Balance
                        </span>
                        <Zap className="w-4 h-4 text-energy-500" />
                      </div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-2xl font-bold text-white">
                          {profile?.vibe_assistant_tokens_remaining?.toLocaleString() || '0'}
                        </span>
                        <span className="text-sm text-neutral-500">tokens</span>
                      </div>
                      <Link
                        href="/dashboard/tokens"
                        className="text-xs text-primary-500 hover:text-primary-400 transition-colors inline-flex items-center gap-1 mt-1"
                      >
                        View usage →
                      </Link>
                    </div>

                    {/* Menu Items */}
                    <div className="py-1">
                      {headerAccountMenu.map((item) => {
                        const Icon = item.icon
                        return (
                          <Link
                            key={item.href}
                            href={item.href}
                            className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                            onClick={() => setOpenDropdown(null)}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="font-medium">{item.name}</span>
                          </Link>
                        )
                      })}
                    </div>

                    {/* Logout */}
                    <div className="border-t border-neutral-800 py-1 mt-1">
                      <button
                        onClick={() => {
                          setOpenDropdown(null)
                          handleLogout()
                        }}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-red-400 hover:text-red-300 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        <span className="font-medium">Logout</span>
                      </button>
                    </div>
                  </div>,
                  document.body
                )}
              </div>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Auth */}
          <div className="md:hidden flex items-center space-x-2">
            {loading ? (
              <div className="w-16 h-6 bg-neutral-800 rounded animate-pulse" />
            ) : user ? (
              <Button onClick={handleLogout} variant="ghost" size="sm">
                Logout
              </Button>
            ) : (
              <Button asChild variant="ghost" size="sm">
                <Link href="/auth/login">Sign In</Link>
              </Button>
            )}
          </div>
        </div>
      </Container>
    </header>
  )
}
