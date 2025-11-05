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
import { clearAllProfileCache } from '@/lib/supabase/profile-client'
import { User } from '@supabase/supabase-js'
import { ChevronDown, LogOut } from 'lucide-react'
import { getPageType, headerAccountMenu } from '@/lib/navigation'

export function Header() {
  const [user, setUser] = useState<User | null>(null)
  const [mounted, setMounted] = useState(false)
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

  // Prevent hydration mismatch by only rendering after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    let mounted = true
    
    // Lightweight auth check only - no profile fetching
    const getUser = async () => {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        
        if (!mounted) return
        
        if (userError) {
          setUser(null)
          return
        }
        
        setUser(user)
      } catch (err) {
        console.error('Header: Error getting user:', err)
        if (mounted) {
          setUser(null)
        }
      }
    }

    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
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
            {!mounted ? (
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
                  {/* Simple Avatar - initials from name or email */}
                  <div className="w-8 h-8 rounded-full bg-[#39FF14] flex items-center justify-center text-black font-semibold text-sm">
                    {(user.user_metadata?.first_name?.[0] || 
                      user.user_metadata?.full_name?.[0] || 
                      user.email?.[0])?.toUpperCase() || 'U'}
                  </div>
                  
                  {/* Name - from metadata or email */}
                  <span className="text-white font-medium">
                    {user.user_metadata?.first_name || 
                     user.user_metadata?.full_name || 
                     user.email?.split('@')[0] || 
                     'User'}
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
