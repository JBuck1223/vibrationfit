'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Button } from '@/lib/design-system/components'
import { Container } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ChevronDown, User as UserIcon, Settings, CreditCard, Zap, LogOut, HardDrive, Activity } from 'lucide-react'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const router = useRouter()
  const pathname = usePathname()
  const supabase = createClient()

  // Page classification logic (same as GlobalLayout)
  const pageClassifications = {
    USER: [
      '/dashboard', '/dashboard/activity', '/dashboard/add-tokens', '/dashboard/storage', '/dashboard/token-history', '/dashboard/tokens', '/dashboard/vibe-assistant-usage',
      '/life-vision', '/life-vision/new', '/life-vision/create-with-viva', '/life-vision/[id]', '/life-vision/[id]/audio', '/life-vision/[id]/refine',
      '/vision-board', '/vision-board/new', '/vision-board/gallery', '/vision-board/[id]',
      '/journal', '/journal/new', '/journal/[id]', '/journal/[id]/edit',
      '/profile', '/profile/edit', '/profile/new',
      '/assessment', '/assessment/in-progress', '/assessment/results',
      '/actualization-blueprints', '/actualization-blueprints/[id]',
      '/intensive', '/intensive/activate', '/intensive/activation-protocol', '/intensive/builder', '/intensive/calibration', '/intensive/call-prep', '/intensive/check-email', '/intensive/dashboard', '/intensive/intake', '/intensive/refine-vision', '/intensive/schedule-call',
      '/billing', '/account/settings',
    ],
    ADMIN: [
      '/admin/ai-models', '/admin/token-usage', '/admin/users', '/sitemap', '/design-system',
    ],
    PUBLIC: [
      '/', '/pricing', '/pricing-hormozi',
      '/auth/login', '/auth/signup', '/auth/verify', '/auth/setup-password', '/auth/logout', '/auth/callback', '/auth/auto-login',
      '/checkout', '/billing/success', '/debug/email', '/test-recording', '/vision/build',
      '/support',
    ]
  }

  const getPageType = (pathname: string): 'USER' | 'ADMIN' | 'PUBLIC' => {
    if (pageClassifications.USER.some(page => 
      pathname === page || pathname.startsWith(page + '/')
    )) {
      return 'USER'
    }
    if (pageClassifications.ADMIN.some(page => 
      pathname === page || pathname.startsWith(page + '/')
    )) {
      return 'ADMIN'
    }
    return 'PUBLIC'
  }

  const pageType = getPageType(pathname)

  // Only show header on PUBLIC pages
  if (pageType !== 'PUBLIC') {
    return null
  }

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      
      // Fetch profile data if user is logged in
      if (user) {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('first_name, last_name, profile_picture_url, vibe_assistant_tokens_remaining')
          .eq('user_id', user.id)
          .single()
        
        setProfile(profileData)
      }
      
      setLoading(false)
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      if (!session?.user) {
        setProfile(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [supabase.auth])

  const handleLogout = async () => {
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
              className="h-8 w-auto"
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
                    {profile?.first_name || user.email?.split('@')[0]}
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
                      <Link
                        href="/profile"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <UserIcon className="w-4 h-4" />
                        <span className="font-medium">My Profile</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/activity"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Activity className="w-4 h-4" />
                        <span className="font-medium">Activity Feed</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/tokens"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Zap className="w-4 h-4" />
                        <span className="font-medium">Token Usage</span>
                      </Link>
                      
                      <Link
                        href="/dashboard/storage"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <HardDrive className="w-4 h-4" />
                        <span className="font-medium">Storage</span>
                      </Link>
                      
                      <Link
                        href="/billing"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span className="font-medium">Billing</span>
                      </Link>
                      
                      <Link
                        href="/account/settings"
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-800 transition-colors text-neutral-300 hover:text-white"
                        onClick={() => setOpenDropdown(null)}
                      >
                        <Settings className="w-4 h-4" />
                        <span className="font-medium">Settings</span>
                      </Link>
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
