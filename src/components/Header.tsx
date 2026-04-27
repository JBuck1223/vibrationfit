'use client'

import React, { useState, useEffect, useMemo, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter, usePathname } from 'next/navigation'
import { createPortal } from 'react-dom'
import { Button } from '@/lib/design-system/components'
import { Container } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { clearAllProfileCache } from '@/lib/supabase/profile-client'
import { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut } from 'lucide-react'
import { getPageType, headerAccountMenu } from '@/lib/navigation'
import { ProfilePictureClickable } from '@/components/ProfilePictureClickable'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null)
  const accountMenuRef = useRef<HTMLDivElement>(null)
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

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true

    // getSession() reads from the cookie-backed session — no network call to
    // the Supabase Auth API. We only need user metadata for header UI, so this
    // is strictly faster than getUser() with no correctness downside.
    const loadSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!mounted) return
        setUser(session?.user ?? null)
      } catch (err) {
        console.error('Header: Error getting session:', err)
        if (mounted) setUser(null)
      }
    }

    loadSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return
      setUser(session?.user ?? null)
    })

    return () => {
      mounted = false
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
              alt="Vibration Fit"
              width={363}
              height={32}
              priority
              loading="eager"
            />
          </Link>


          {/* Desktop Auth / Account */}
          <div className="hidden md:flex items-center space-x-4">
            {!mounted ? (
              <div className="w-20 h-8 bg-neutral-800 rounded animate-pulse" />
            ) : user ? (
              <div className="relative">
                <div
                  ref={accountMenuRef}
                  className="flex items-center gap-3 rounded-full px-3 py-2 hover:bg-neutral-800 transition-colors"
                >
                  {user.user_metadata?.profile_picture_url ? (
                    <ProfilePictureClickable
                      src={user.user_metadata.profile_picture_url}
                      alt="Profile"
                      className="flex shrink-0 rounded-full"
                    >
                      <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-neutral-800">
                        <img
                          src={user.user_metadata.profile_picture_url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      </div>
                    </ProfilePictureClickable>
                  ) : (
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#39FF14] text-sm font-semibold text-black">
                      {(() => {
                        const fullName = user.user_metadata?.full_name || ''
                        const firstName = user.user_metadata?.first_name || fullName.split(' ')[0] || ''
                        return (firstName[0] || user.email?.[0] || 'U').toUpperCase()
                      })()}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      const rect = accountMenuRef.current?.getBoundingClientRect()
                      if (rect) setButtonRect(rect)
                      setOpenDropdown(openDropdown === 'account' ? null : 'account')
                    }}
                    className="flex min-w-0 flex-1 items-center gap-3 text-left"
                  >
                    <span className="font-medium text-white">
                      {user.user_metadata?.first_name ||
                        user.user_metadata?.full_name?.split(' ')[0] ||
                        user.email?.split('@')[0] ||
                        'User'}
                    </span>
                    <ChevronDown
                      className={`h-4 w-4 shrink-0 text-neutral-400 transition-transform ${openDropdown === 'account' ? 'rotate-180' : ''}`}
                    />
                  </button>
                </div>

                {/* Account Dropdown */}
                {mounted && openDropdown === 'account' && buttonRect && createPortal(
                  <div
                    className="fixed bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl py-2 w-72"
                    style={{
                      top: buttonRect.bottom + 8,
                      right: window.innerWidth - buttonRect.right,
                      zIndex: 999999
                    }}
                  >
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
            {!mounted ? (
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
