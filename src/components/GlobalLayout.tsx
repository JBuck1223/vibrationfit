'use client'

import React from 'react'
import { usePathname } from 'next/navigation'
import { SidebarLayout, PageLayout } from '@/lib/design-system'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { getPageType } from '@/lib/navigation'

interface GlobalLayoutProps {
  children: React.ReactNode
}

export function GlobalLayout({ children }: GlobalLayoutProps) {
  const pathname = usePathname()
  const pageType = getPageType(pathname)
  
  // Render based on page type
  if (pageType === 'USER' || pageType === 'ADMIN') {
    // User and Admin pages: Use SidebarLayout with PageLayout
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
