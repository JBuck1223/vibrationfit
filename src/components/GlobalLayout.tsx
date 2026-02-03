'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Spinner } from '@/lib/design-system/components'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SidebarLayout } from '@/components/Sidebar'
import { IntensiveSidebar } from '@/components/IntensiveSidebar'
import { IntensiveMobileNav } from '@/components/IntensiveMobileNav'
import { IntensiveLockedOverlay } from '@/components/IntensiveLockedOverlay'
import { getPageType } from '@/lib/navigation'
import { getActiveIntensiveClient, IntensiveData } from '@/lib/intensive/utils-client'
import { createClient } from '@/lib/supabase/client'

interface GlobalLayoutProps {
  children: React.ReactNode
}

// Check if a path is accessible based on intensive progress
function isPathAccessibleForIntensive(
  pathname: string,
  intensive: IntensiveData | null, 
  settingsComplete: boolean
): boolean {
  // Always accessible during intensive (no progress check needed)
  const alwaysAllowed = [
    '/intensive/start',
    '/viva',
  ]
  
  if (alwaysAllowed.some(path => pathname.startsWith(path))) {
    return true
  }
  
  if (!intensive) return false

  // Dashboard - accessible after intensive is started
  if (pathname === '/intensive/dashboard' || pathname.startsWith('/intensive/dashboard/')) {
    return !!intensive.started_at
  }

  // Step 1: Settings - accessible only after intensive is started
  if (pathname.startsWith('/account')) {
    return !!intensive.started_at
  }
  
  // Step 2: Intake - accessible after settings
  if (pathname === '/intensive/intake' || pathname.startsWith('/intensive/intake/')) {
    // But NOT /intensive/intake/unlock until step 14
    if (pathname.startsWith('/intensive/intake/unlock')) {
      return intensive.activation_protocol_completed
    }
    return settingsComplete
  }
  
  // Step 3: Profile - accessible after intake
  if (pathname.startsWith('/profile')) {
    return intensive.intake_completed
  }
  
  // Step 4: Assessment - accessible after profile
  if (pathname.startsWith('/assessment')) {
    return intensive.profile_completed
  }
  
  // Steps 7-9: Audio - must check BEFORE general life-vision
  // Audio requires vision to be refined (step 6 complete)
  if (pathname.includes('/audio') && pathname.startsWith('/life-vision')) {
    return intensive.vision_refined
  }
  
  // Steps 5-6: Vision building & refining - accessible after assessment
  if (pathname.startsWith('/life-vision')) {
    return intensive.assessment_completed
  }
  
  // Step 10: Vision Board - accessible after audio generated
  if (pathname.startsWith('/vision-board')) {
    return intensive.audio_generated || intensive.audios_generated
  }
  
  // Step 11: Journal - accessible after vision board
  if (pathname.startsWith('/journal')) {
    return intensive.vision_board_completed
  }
  
  // Step 12: Schedule Call & Call Prep - accessible after journal
  if (pathname.startsWith('/intensive/schedule-call') || pathname.startsWith('/intensive/call-prep')) {
    return intensive.first_journal_entry
  }
  
  // Step 13: Activation Protocol & Calibration - accessible after call scheduled
  if (pathname.startsWith('/intensive/activation-protocol') || pathname.startsWith('/intensive/calibration')) {
    return intensive.call_scheduled
  }
  
  // Main Dashboard - accessible after intensive is fully complete (unlock step done)
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) {
    return intensive.unlock_completed
  }
  
  // Default: not accessible
  return false
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  const [intensiveMode, setIntensiveMode] = useState(false)
  const [intensiveData, setIntensiveData] = useState<IntensiveData | null>(null)
  const [settingsComplete, setSettingsComplete] = useState(false)
  const [loadingIntensive, setLoadingIntensive] = useState(true)
  
  // Check for active intensive on mount and route changes
  useEffect(() => {
    const checkIntensive = async () => {
      try {
        const intensive = await getActiveIntensiveClient()
        setIntensiveMode(!!intensive)
        setIntensiveData(intensive)
        
        // Check settings completion if in intensive mode
        if (intensive) {
          const supabase = createClient()
          const { data: { user } } = await supabase.auth.getUser()
          if (user) {
            const { data: accountData } = await supabase
              .from('user_accounts')
              .select('first_name, last_name, email, phone')
              .eq('id', user.id)
              .single()
            
            const hasSettings = !!(accountData && 
              accountData.first_name?.trim() && 
              accountData.last_name?.trim() && 
              accountData.email?.trim() && 
              accountData.phone?.trim())
            setSettingsComplete(hasSettings)
          }
        }
      } catch (error) {
        console.error('Error checking intensive mode:', error)
        setIntensiveMode(false)
      } finally {
        setLoadingIntensive(false)
      }
    }
    
    checkIntensive()
  }, [pathname])
  
  // Only exclude the /html route from layout (for clean PDF generation)
  if (pathname?.endsWith('/html')) {
    return <>{children}</>
  }
  
  const pageType = getPageType(pathname)
  
  // Render based on page type
  if (pageType === 'USER' || pageType === 'ADMIN') {
    // Print pages: No sidebar, no padding (full-screen interface)
    if (pathname?.includes('/print') && !pathname?.endsWith('/html')) {
      return <>{children}</>
    }
    
    // Video session pages: Fullscreen interface for video calls
    if (pathname?.startsWith('/session/')) {
      return <>{children}</>
    }
    
    // USER pages: Use IntensiveSidebar if in intensive mode, otherwise regular SidebarLayout
    if (pageType === 'USER') {
      // Show loading state briefly
      if (loadingIntensive) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <Spinner size="lg" />
          </div>
        )
      }
      
      // Intensive mode: Simplified sidebar + mobile nav + locked overlay on non-accessible pages
      if (intensiveMode) {
        // Check if current path is accessible based on user's progress
        const isAccessible = isPathAccessibleForIntensive(pathname, intensiveData, settingsComplete)
        
        return (
          <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <IntensiveSidebar />
            <div className="md:ml-[280px]">
              <PageLayout>
                {children}
              </PageLayout>
              {/* Show overlay on pages that aren't accessible based on progress */}
              {!isAccessible && <IntensiveLockedOverlay />}
            </div>
            <IntensiveMobileNav />
          </div>
        )
      }
      
      // Regular mode: Full sidebar
      return (
        <SidebarLayout isAdmin={false}>
          <PageLayout>
            {children}
          </PageLayout>
        </SidebarLayout>
      )
    }
    
    // ADMIN pages: Use SidebarLayout with AdminSidebar
    if (pageType === 'ADMIN') {
      return (
        <SidebarLayout isAdmin={true}>
          <PageLayout>
            {children}
          </PageLayout>
        </SidebarLayout>
      )
    }
  }
  
  // PUBLIC pages: Use Header + Footer with PageLayout (no sidebar)
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <PageLayout>
        {children}
      </PageLayout>
      <Footer />
    </div>
  )
}
