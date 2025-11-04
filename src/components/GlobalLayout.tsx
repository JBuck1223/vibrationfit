'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
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
    // User and Admin pages: Use PageLayout without sidebar
    // Print pages: No PageLayout padding (full-screen interface)
    if (pathname?.includes('/print') && !pathname?.endsWith('/html')) {
      return <>{children}</>
    }
    
    // Regular user/admin pages: Use PageLayout
    return (
      <div className="min-h-screen bg-black text-white">
        <PageLayout containerSize="xl">
          {children}
        </PageLayout>
      </div>
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
