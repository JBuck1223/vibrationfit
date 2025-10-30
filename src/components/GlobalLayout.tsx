'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { SidebarLayout } from '@/components/Sidebar'
import { getPageType } from '@/lib/navigation'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  
  // Only exclude the /html route from layout (for clean PDF generation)
  // Preview pages should have normal layout with sidebar
  if (pathname?.endsWith('/html')) {
    return <>{children}</>
  }
  
  const pageType = getPageType(pathname)
  
  // Render based on page type
  if (pageType === 'USER' || pageType === 'ADMIN') {
    // User and Admin pages: Use SidebarLayout
    // Print pages: SidebarLayout without PageLayout padding (full-screen interface)
    if (pathname?.includes('/print') && !pathname?.endsWith('/html')) {
      return (
        <SidebarLayout isAdmin={pageType === 'ADMIN'}>
          {children}
        </SidebarLayout>
      )
    }
    
    // Regular user/admin pages: Use SidebarLayout with PageLayout
    return (
      <SidebarLayout isAdmin={pageType === 'ADMIN'}>
        <PageLayout containerSize="xl">
          {children}
        </PageLayout>
      </SidebarLayout>
    )
  }
  
  // Public pages: Use Header + Footer with PageLayout
  return (
    <div className="min-h-screen bg-black text-white">
      <Header />
      <PageLayout containerSize="xl">
        {children}
      </PageLayout>
      <Footer />
    </div>
  )
}
