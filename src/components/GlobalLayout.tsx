'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SidebarLayout } from '@/components/Sidebar'
import { IntensiveBar } from '@/components/IntensiveBar'
import { getPageType } from '@/lib/navigation'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  
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
    
    // USER pages: Use SidebarLayout with UserSidebar + IntensiveBar
    if (pageType === 'USER') {
      return (
        <SidebarLayout isAdmin={false}>
          <IntensiveBar />
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
