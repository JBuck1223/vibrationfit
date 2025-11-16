'use client'

import React, { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SidebarLayout } from '@/components/Sidebar'
import { IntensiveSidebar } from '@/components/IntensiveSidebar'
import { IntensiveMobileNav } from '@/components/IntensiveMobileNav'
import { IntensiveLockedOverlay } from '@/components/IntensiveLockedOverlay'
import { getPageType } from '@/lib/navigation'
import { getActiveIntensiveClient } from '@/lib/intensive/utils-client'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  const [intensiveMode, setIntensiveMode] = useState(false)
  const [loadingIntensive, setLoadingIntensive] = useState(true)
  
  // Check for active intensive on mount and route changes
  useEffect(() => {
    const checkIntensive = async () => {
      try {
        const intensive = await getActiveIntensiveClient()
        setIntensiveMode(!!intensive)
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
    
    // USER pages: Use IntensiveSidebar if in intensive mode, otherwise regular SidebarLayout
    if (pageType === 'USER') {
      // Show loading state briefly
      if (loadingIntensive) {
        return (
          <div className="min-h-screen bg-black flex items-center justify-center">
            <div className="text-neutral-500">Loading...</div>
          </div>
        )
      }
      
      // Intensive mode: Simplified sidebar + mobile nav + locked overlay on non-intensive pages
      if (intensiveMode) {
        // Intensive-allowed pages (no overlay)
        const intensiveAllowedPaths = [
          '/intensive',
          '/profile',
          '/assessment',
          '/vision/build',
          '/vision',
          '/life-vision',
          '/vision-board',
          '/journal',
          '/viva',
          '/dashboard', // Allow dashboard
        ]
        
        const isIntensiveAllowed = intensiveAllowedPaths.some(path => pathname.startsWith(path))
        
        return (
          <div className="min-h-screen bg-black text-white pb-16 md:pb-0">
            <IntensiveSidebar />
            <div className="md:ml-[280px]">
              <PageLayout>
                {children}
              </PageLayout>
              {/* Show overlay on USER pages that aren't intensive-related */}
              {!isIntensiveAllowed && <IntensiveLockedOverlay />}
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
