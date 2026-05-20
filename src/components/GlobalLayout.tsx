'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SidebarLayout, UserSidebar } from '@/components/Sidebar'
import { IntensiveSidebar } from '@/components/IntensiveSidebar'
import { IntensiveLockedOverlay } from '@/components/IntensiveLockedOverlay'
import { cn } from '@/lib/utils'
import { getPageType, isStudioRoute } from '@/lib/navigation'
import type { IntensiveData } from '@/lib/intensive/utils-client'
import { createClient } from '@/lib/supabase/client'
import { useGlobalAudioStore } from '@/lib/stores/global-audio-store'
import {
  loadIntensiveSnapshot,
  peekIntensiveSnapshot,
  invalidateIntensiveSnapshot,
  type IntensiveSnapshot,
} from '@/lib/intensive/intensive-snapshot'

function PlayerSpacer() {
  const hasActive = useGlobalAudioStore(s => s.tracks.length > 0)
  if (!hasActive) return null
  return <div className="h-20" />
}


interface GlobalLayoutProps {
  children: React.ReactNode
}

// Check if a path is accessible based on intensive progress
function isPathAccessibleForIntensive(
  pathname: string,
  intensive: IntensiveData | null, 
  settingsComplete: boolean
): boolean {
  const alwaysAllowed = [
    '/intensive/start',
    '/intensive/welcome',
    '/intensive/journey',
    '/intensive/check-email',
    '/viva',
    '/support',
    '/referral',
    // SMS / member poll: must be reachable even during an active intensive
    '/survey',
  ]
  
  if (alwaysAllowed.some(path => pathname.startsWith(path))) {
    return true
  }
  
  if (!intensive) return false

  if (pathname === '/intensive/dashboard' || pathname.startsWith('/intensive/dashboard/')) {
    return !!intensive.started_at
  }

  // Step 1: Account Settings
  if (pathname.startsWith('/intensive/account')) {
    return !!intensive.started_at
  }
  
  // Step 2: Intake (but not /intensive/intake/unlock which is Step 14)
  if (pathname === '/intensive/intake/unlock') {
    return intensive.activation_protocol_completed
  }
  if (pathname === '/intensive/intake' || pathname.startsWith('/intensive/intake/')) {
    return settingsComplete
  }
  
  // Step 3: Profile
  if (pathname.startsWith('/intensive/profile')) {
    return intensive.intake_completed
  }
  
  // Legacy assessment routes — redirect handles these, allow access if profile is done
  if (pathname.startsWith('/intensive/assessment')) {
    return intensive.profile_completed
  }
  
  // Step 4: Life Vision
  if (pathname.startsWith('/intensive/life-vision')) {
    return intensive.profile_completed
  }
  
  // Steps 5-7: Audio
  if (pathname.startsWith('/intensive/audio')) {
    return intensive.vision_built
  }
  
  // Step 8: Vision Board
  if (pathname.startsWith('/intensive/vision-board')) {
    return intensive.audio_generated || intensive.audios_generated
  }
  
  // Step 9: Journal
  if (pathname.startsWith('/intensive/journal')) {
    return intensive.vision_board_completed
  }
  
  // Steps 10-11: Vibe Tribe
  if (pathname.startsWith('/intensive/vibe-tribe')) {
    return intensive.first_journal_entry
  }
  
  // Step 12: Alignment Gym Tour
  if (pathname.startsWith('/intensive/alignment-gym')) {
    return intensive.vibe_engagement
  }
  
  // Legacy calibration routes — redirect handles these, but allow access if journal is done
  if (pathname.startsWith('/intensive/schedule-call') || pathname.startsWith('/intensive/call-prep') || pathname.startsWith('/intensive/calibration')) {
    return intensive.first_journal_entry
  }
  
  // Step 13: MAP — My Alignment Plan
  if (pathname.startsWith('/intensive/map')) {
    return intensive.alignment_gym_toured
  }

  // Step 14: Unlock
  if (pathname.startsWith('/intensive/unlock')) {
    return intensive.activation_protocol_completed
  }

  // Legacy paths outside /intensive/ — still allow for backwards compatibility
  if (pathname.startsWith('/account')) return !!intensive.started_at
  if (pathname.startsWith('/profile')) return intensive.intake_completed
  if (pathname.startsWith('/assessment')) return intensive.profile_completed
  if (pathname.includes('/audio') && pathname.startsWith('/life-vision')) return intensive.vision_built
  if (pathname.startsWith('/life-vision')) return intensive.profile_completed
  if (pathname.startsWith('/vision-board')) return intensive.audio_generated || intensive.audios_generated
  if (pathname.startsWith('/journal')) return intensive.vision_board_completed
  if (pathname.startsWith('/vibe-tribe')) return intensive.first_journal_entry
  if (pathname.startsWith('/alignment-gym')) return intensive.vibe_engagement
  if (pathname.startsWith('/map')) return intensive.alignment_gym_toured
  if (pathname.startsWith('/activation-protocol')) return intensive.alignment_gym_toured
  if (pathname.startsWith('/audio')) return intensive.vision_built
  
  // Main Dashboard - accessible after intensive is fully complete (unlock step done)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return intensive.unlock_completed
  }
  
  // Default: not accessible
  return false
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  // Render tree is driven entirely by the session-level snapshot below.
  // We intentionally start with `null` (matches SSR) and fill in synchronously
  // from sessionStorage during the first mount effect, so subsequent navigations
  // inside the same session never re-query the database.
  const [snapshot, setSnapshot] = useState<IntensiveSnapshot | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()

    const hydrate = async () => {
      // getSession reads from the cookie-backed session — no Auth API call.
      const { data: { session } } = await supabase.auth.getSession()
      if (cancelled) return
      setIsAuthenticated(!!session)
      if (!session?.user) return

      // Peek first: if we already have a fresh snapshot for this user in
      // sessionStorage, paint with it immediately and skip the network round-trip.
      const cached = peekIntensiveSnapshot(session.user.id)
      if (cached) {
        setSnapshot(cached)
        return
      }
      const fetched = await loadIntensiveSnapshot(session.user.id)
      if (!cancelled) setSnapshot(fetched)
    }

    hydrate()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (cancelled) return
      setIsAuthenticated(!!session)
      if (event === 'SIGNED_OUT') {
        invalidateIntensiveSnapshot()
        setSnapshot(null)
      }
      if (event === 'SIGNED_IN' && session?.user) {
        // New session — snapshot tied to a prior user (or none) is stale.
        invalidateIntensiveSnapshot()
        loadIntensiveSnapshot(session.user.id).then((snap) => {
          if (!cancelled) setSnapshot(snap)
        })
      }
    })

    const handleSnapshotInvalidation = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user || cancelled) return
      const fetched = await loadIntensiveSnapshot(session.user.id, { forceRefresh: true })
      if (!cancelled) setSnapshot(fetched)
    }

    window.addEventListener('intensive-snapshot-invalidated', handleSnapshotInvalidation)

    return () => {
      cancelled = true
      subscription.unsubscribe()
      window.removeEventListener('intensive-snapshot-invalidated', handleSnapshotInvalidation)
    }
  }, [])

  const intensiveMode = !!snapshot?.hasActiveIntensive
  const intensiveData: IntensiveData | null = snapshot?.intensive ?? null
  const settingsComplete = snapshot?.settingsComplete ?? false
  const isSuperAdmin = snapshot?.isSuperAdmin ?? false
  
  // Only exclude the /html route from layout (for clean PDF generation)
  if (pathname?.endsWith('/html')) {
    return <>{children}</>
  }
  
  const pageType = getPageType(pathname)

  const studioRoute = isStudioRoute(pathname)
  const audioPageLayoutClass = studioRoute
    ? cn(
        'max-md:!pt-0 max-md:!px-0',
        (pathname?.startsWith('/audio') || pathname?.startsWith('/account')) && 'max-md:!pb-6',
      )
    : undefined
  
  // Authenticated users on public pages (except /auth/*) see the sidebar layout
  const effectivePageType = (pageType === 'PUBLIC' && isAuthenticated && !pathname?.startsWith('/auth'))
    ? 'USER'
    : pageType
  
  // Render based on effective page type
  if (effectivePageType === 'USER' || effectivePageType === 'ADMIN') {
    // Print pages: No sidebar, no padding (full-screen interface)
    // Exception: life-vision print pages use their own studio layout with AreaBar
    if (pathname?.includes('/print') && !pathname?.endsWith('/html') && !pathname?.startsWith('/life-vision')) {
      return <>{children}</>
    }
    
    // Video session pages: Fullscreen interface for video calls
    if (pathname?.startsWith('/session/')) {
      return <>{children}</>
    }
    
    // Vibe Tribe pages: Full-screen layout with own sticky header
    // Uses custom flex layout to allow sidebar + full-height content
    if (pathname?.startsWith('/vibe-tribe')) {
      const isNewPage = pathname?.includes('/vibe-tribe/new')
      return (
        <div className="flex h-screen bg-black">
          <UserSidebar />
          <main className={`flex-1 flex flex-col min-h-0 ${isNewPage ? 'overflow-y-auto' : 'overflow-hidden'}`}>
            <div className="flex-1 flex flex-col min-h-0 w-full">
              {children}
            </div>
          </main>
        </div>
      )
    }
    
    // USER pages: Use IntensiveSidebar if in intensive mode, otherwise regular SidebarLayout.
    // We always render children — no blocking spinner — so client-side navigations
    // don't unmount the page tree. On the very first load of a new session we may
    // optimistically render the non-intensive layout for a moment before the snapshot
    // arrives; thereafter the layout is stable because the snapshot is cached.
    if (effectivePageType === 'USER') {
      if (intensiveMode) {
        const isAccessible = isPathAccessibleForIntensive(pathname, intensiveData, settingsComplete)

        return (
          <div className="min-h-screen bg-black text-white">
            <IntensiveSidebar />
            <div className="min-w-0 md:ml-[280px]">
              <PageLayout className={audioPageLayoutClass}>
                {children}
                <PlayerSpacer />
              </PageLayout>
              {!isAccessible && !isSuperAdmin && <IntensiveLockedOverlay />}
            </div>
          </div>
        )
      }

      return (
        <SidebarLayout isAdmin={false}>
          <PageLayout className={audioPageLayoutClass}>
            {children}
            <PlayerSpacer />
          </PageLayout>
        </SidebarLayout>
      )
    }
    
    // ADMIN pages: Use SidebarLayout with AdminSidebar
    if (effectivePageType === 'ADMIN') {
      return (
        <SidebarLayout isAdmin={true}>
          <PageLayout className={audioPageLayoutClass}>
            {children}
            <PlayerSpacer />
          </PageLayout>
        </SidebarLayout>
      )
    }
  }
  
  // PUBLIC pages: Use Header + Footer with PageLayout (no sidebar)
  // Auth pages: reduced top padding so content sits at top (design system spacing)
  const isAuthPage = pathname?.startsWith('/auth')
  const isCheckoutPage = pathname?.startsWith('/checkout')
  const hideHeaderFooter = isAuthPage || isCheckoutPage
  const pageLayoutClass = isAuthPage
    ? 'pt-4 pb-12 md:pt-6 md:pb-12 lg:pt-6 lg:pb-12'
    : isCheckoutPage
      ? 'pt-6 pb-12 md:pt-8 md:pb-12'
      : undefined

  return (
    <div className="min-h-screen bg-black text-white">
      {!hideHeaderFooter && <Header />}
      <PageLayout className={cn(pageLayoutClass, audioPageLayoutClass)}>
        {children}
        <PlayerSpacer />
      </PageLayout>
      {!hideHeaderFooter && <Footer />}
    </div>
  )
}
