'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Button } from '@/lib/design-system/components'
import { Container } from '@/lib/design-system/components'
import { cn } from '@/lib/utils'
import { ASSETS } from '@/lib/storage/s3-storage-presigned'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import { ChevronDown, Target, Sparkles, BarChart3, BookOpen, Layout, User as UserIcon, Home as HomeIcon, Settings, CreditCard, Zap, LogOut, HardDrive, Activity } from 'lucide-react'

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

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

  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [closeTimeout, setCloseTimeout] = useState<NodeJS.Timeout | null>(null)

  const handleMouseEnter = (key: string) => {
    if (closeTimeout) {
      clearTimeout(closeTimeout)
      setCloseTimeout(null)
    }
    setOpenDropdown(key)
  }

  const handleMouseLeave = () => {
    const timeout = setTimeout(() => {
      setOpenDropdown(null)
    }, 200) // 200ms delay before closing
    setCloseTimeout(timeout)
  }

  const directLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: Layout },
    { name: 'Pricing', href: '/#pricing', icon: Target },
  ]

  const navigationGroups = {
    vision: {
      label: 'Life Vision',
      icon: Target,
      items: [
        { name: 'My Life Visions', href: '/life-vision' },
        { name: 'Create New Vision', href: '/life-vision/new' },
        { name: 'Build with VIVA', href: '/vision/build' },
        { name: 'Take Assessment', href: '/assessment' },
        { name: 'Vision Board', href: '/vision-board' },
      ]
    },
    tools: {
      label: 'Tools',
      icon: Sparkles,
      items: [
        { name: 'Journal', href: '/journal' },
        { name: 'Blueprints', href: '/actualization-blueprints' },
        { name: 'Intensive', href: '/intensive/dashboard' },
      ]
    },
    profile: {
      label: 'Profile',
      icon: UserIcon,
      items: [
        { name: 'My Profile', href: '/profile' },
        { name: 'Edit Profile', href: '/profile/edit' },
        { name: 'Account Settings', href: '/account/settings' },
      ]
    }
  }

  return (
    <header className={cn(
      "sticky top-0 z-50 bg-black/95 backdrop-blur-sm border-b border-neutral-800",
      // Hide header on mobile for logged-in users
      user ? "hidden md:block" : "block"
    )}>
      <Container size="full" className="px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16">
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

          {/* Desktop Navigation - Absolutely Centered */}
          <nav className="hidden md:flex items-center space-x-6 absolute left-1/2 transform -translate-x-1/2">
            {/* Direct Links First */}
            {directLinks.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-neutral-300 hover:text-white transition-colors duration-200 font-medium"
              >
                {item.name}
              </Link>
            ))}

            {/* Dropdown Groups */}
            {Object.entries(navigationGroups).map(([key, group]) => (
              <div
                key={key}
                className="relative"
                onMouseEnter={() => handleMouseEnter(key)}
                onMouseLeave={handleMouseLeave}
              >
                <button 
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setOpenDropdown(openDropdown === key ? null : key)
                  }}
                  className="flex items-center gap-1 text-neutral-300 hover:text-white transition-colors duration-200 font-medium"
                >
                  {group.label}
                  <ChevronDown className={`w-4 h-4 transition-transform ${openDropdown === key ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu */}
                {openDropdown === key && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-neutral-900 border border-neutral-800 rounded-xl shadow-xl py-2 animate-in fade-in slide-in-from-top-2 duration-200">
                    {group.items.map((item) => (
                      <Link
                        key={item.href}
                        href={item.href}
                        className="block px-4 py-2.5 text-sm text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors"
                        onClick={() => setOpenDropdown(null)}
                      >
                        {item.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

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
                    setOpenDropdown(openDropdown === 'account' ? null : 'account')
                  }}
                  onMouseEnter={() => handleMouseEnter('account')}
                  onMouseLeave={handleMouseLeave}
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
                {openDropdown === 'account' && (
                  <div
                    onMouseEnter={() => handleMouseEnter('account')}
                    onMouseLeave={handleMouseLeave}
                    className="absolute right-0 top-full mt-2 w-72 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl py-2 z-50"
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
                  </div>
                )}
              </div>
            ) : (
              <>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/auth/login">Sign In</Link>
                </Button>
                <Button asChild variant="primary" size="sm">
                  <Link href="/auth/signup">Get Started</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-neutral-300 hover:text-white transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle mobile menu"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              {isMobileMenuOpen ? (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              ) : (
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-neutral-800 py-4">
            <nav className="flex flex-col space-y-2">
              {/* Life Vision Section */}
              <div className="border-b border-neutral-800 pb-3 mb-3">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 mb-2">
                  Life Vision
                </div>
                {navigationGroups.vision.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Tools Section */}
              <div className="border-b border-neutral-800 pb-3 mb-3">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 mb-2">
                  Tools
                </div>
                {navigationGroups.tools.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Profile Section */}
              <div className="border-b border-neutral-800 pb-3 mb-3">
                <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider px-4 mb-2">
                  Profile
                </div>
                {navigationGroups.profile.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="block px-4 py-2.5 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors font-medium"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
              </div>

              {/* Direct Links */}
              {directLinks.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="block px-4 py-2.5 text-neutral-300 hover:text-white hover:bg-neutral-900 transition-colors font-medium"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              <div className="flex flex-col space-y-3 pt-4 border-t border-neutral-800">
                {loading ? (
                  <div className="w-full h-8 bg-neutral-800 rounded animate-pulse" />
                ) : user ? (
                  <>
                    <div className="text-neutral-300 text-sm text-center py-2">
                      {user.email}
                    </div>
                    <Button onClick={handleLogout} variant="ghost" size="sm" className="w-full">
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button asChild variant="ghost" size="sm" className="w-full">
                      <Link href="/auth/login" onClick={() => setIsMobileMenuOpen(false)}>
                        Sign In
                      </Link>
                    </Button>
                    <Button asChild variant="primary" size="sm" className="w-full">
                      <Link href="/auth/signup" onClick={() => setIsMobileMenuOpen(false)}>
                        Get Started
                      </Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </Container>
    </header>
  )
}
